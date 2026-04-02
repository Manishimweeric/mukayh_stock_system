import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ShoppingBag, Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
    X, Eye, MoreVertical, Plus, Phone, Calendar, Edit, Trash2,
    DollarSign, TrendingUp, Package, Truck, Clock, CheckCircle,
    AlertCircle, FileText, Download, Printer, Users
} from 'lucide-react';
import { toast } from 'react-toastify';
import { supplierOrderService, supplierService, materialService } from '../../api';

const SupplierOrdersList = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage] = useState(10);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [orderStats, setOrderStats] = useState({
        total: 0,
        pending: 0,
        delivered: 0,
        overdue: 0,
        totalValue: 0
    });
    const [statusFilter, setStatusFilter] = useState('all');
    const [supplierFilter, setSupplierFilter] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [suppliers, setSuppliers] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        filterOrders();
    }, [orders, searchTerm, statusFilter, supplierFilter, dateRange]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch orders
            const ordersResult = await supplierOrderService.getAllSupplierOrders();

            // Fetch suppliers for filter
            const suppliersResult = await supplierService.getAllSuppliers();

            if (ordersResult.success) {
                setOrders(ordersResult.data);
                calculateStats(ordersResult.data);
            } else {
                toast.error('Failed to load orders');
                setOrders([]);
            }

            if (suppliersResult.success) {
                setSuppliers(suppliersResult.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (orderData) => {
        const total = orderData.length;
        const pending = orderData.filter(o => o.status === 'PENDING' || o.status === 'RECEIVED' || o.status === 'ACCEPTED').length;
        const delivered = orderData.filter(o => o.status === 'DELIVERED').length;
        const overdue = orderData.filter(o => o.is_overdue).length;
        const totalValue = orderData.reduce((sum, o) => sum + (parseFloat(o.total_cost) || 0), 0);

        setOrderStats({
            total,
            pending,
            delivered,
            overdue,
            totalValue
        });
    };

    const filterOrders = () => {
        if (!Array.isArray(orders)) {
            setFilteredOrders([]);
            return;
        }

        let filtered = [...orders];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(order =>
                (order.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (order.order_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (order.supplier_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(order => order.status === statusFilter);
        }

        // Supplier filter
        if (supplierFilter !== 'all') {
            filtered = filtered.filter(order => order.supplier === parseInt(supplierFilter));
        }

        // Date range filter
        if (dateRange.start) {
            filtered = filtered.filter(order =>
                new Date(order.order_date) >= new Date(dateRange.start)
            );
        }
        if (dateRange.end) {
            filtered = filtered.filter(order =>
                new Date(order.order_date) <= new Date(dateRange.end)
            );
        }

        setFilteredOrders(filtered);
        setCurrentPage(1);
    };

    const getCurrentPageOrders = () => {
        if (!Array.isArray(filteredOrders)) return [];
        const indexOfLast = currentPage * ordersPerPage;
        const indexOfFirst = indexOfLast - ordersPerPage;
        return filteredOrders.slice(indexOfFirst, indexOfLast);
    };

    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage) || 1;
    const startIndex = (currentPage - 1) * ordersPerPage + 1;
    const endIndex = Math.min(currentPage * ordersPerPage, filteredOrders.length);

    const handleDropdownToggle = (orderId, e) => {
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === orderId ? null : orderId);
    };

    const handleViewDetails = async (order) => {
        setSelectedOrder(order);

        // Fetch order items
        const itemsResult = await supplierOrderService.getItemsByOrder(order.id);
        if (itemsResult.success) {
            setSelectedOrder(prev => ({
                ...prev,
                items: itemsResult.data
            }));
        }

        setShowDetailModal(true);
        setOpenDropdownId(null);
    };

    const handleMarkAsReceived = async (orderId) => {
        if (window.confirm('Mark this order as received? This will update inventory.')) {
            const result = await supplierOrderService.markOrderAsReceived(orderId);
            if (result.success) {
                toast.success('Order marked as received successfully');
                fetchData();
            } else {
                toast.error(result.message || 'Failed to mark order as received');
            }
        }
        setOpenDropdownId(null);
    };

    const handleDeleteOrder = async (orderId) => {
        if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
            const result = await supplierOrderService.deleteSupplierOrder(orderId);
            if (result.success) {
                toast.success('Order deleted successfully');
                fetchData();
            } else {
                toast.error(result.message || 'Failed to delete order');
            }
        }
        setOpenDropdownId(null);
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'PENDING': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
            'RECEIVED': { color: 'bg-blue-100 text-blue-800', icon: FileText },
            'ACCEPTED': { color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
            'DELIVERED': { color: 'bg-green-100 text-green-800', icon: Truck },
            'CANCELLED': { color: 'bg-red-100 text-red-800', icon: AlertCircle }
        };

        const config = statusConfig[status] || statusConfig.PENDING;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {status}
            </span>
        );
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('rw-RW', {
            style: 'currency',
            currency: 'RWF',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Math.round(amount || 0));
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setSupplierFilter('all');
        setDateRange({ start: '', end: '' });
        setShowFilters(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading supplier orders...</p>
                </div>
            </div>
        );
    }

    const currentPageOrders = getCurrentPageOrders();
    const hasOrders = Array.isArray(filteredOrders) && filteredOrders.length > 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <ShoppingBag className="w-6 h-6 mr-3 text-blue-600" />
                        Supplier Orders
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage orders placed with suppliers, track deliveries, and update inventory
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={fetchData}
                        className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                    <Link
                        to="/inventory/supplier-orders/add-new"
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Order
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <ShoppingBag className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Total Orders</p>
                            <p className="text-xl font-semibold text-gray-900">{orderStats.total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Pending Orders</p>
                            <p className="text-xl font-semibold text-gray-900">{orderStats.pending}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Truck className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Delivered</p>
                            <p className="text-xl font-semibold text-gray-900">{orderStats.delivered}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Overdue</p>
                            <p className="text-xl font-semibold text-gray-900">{orderStats.overdue}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Total Value</p>
                            <p className="text-xl font-semibold text-gray-900">{formatCurrency(orderStats.totalValue)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by order name, number, or supplier..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center px-4 py-2 text-gray-600 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                        {(statusFilter !== 'all' || supplierFilter !== 'all' || dateRange.start || dateRange.end) && (
                            <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                    </button>
                </div>

                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="RECEIVED">Received by Supplier</option>
                                    <option value="ACCEPTED">Accepted by Supplier</option>
                                    <option value="DELIVERED">Delivered</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Supplier
                                </label>
                                <select
                                    value={supplierFilter}
                                    onChange={(e) => setSupplierFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Suppliers</option>
                                    {suppliers.map(supplier => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date Range
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Start Date"
                                    />
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="End Date"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-gray-600">
                                Showing {filteredOrders.length} of {orders.length} orders
                            </div>
                            <button
                                onClick={clearFilters}
                                className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                            >
                                <X className="w-4 h-4 mr-1" />
                                Clear all filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {!hasOrders ? (
                    <div className="text-center py-12">
                        <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {orders.length === 0 ? 'No supplier orders found' : 'No matching orders'}
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm || statusFilter !== 'all' || supplierFilter !== 'all'
                                ? 'No orders match your filters.'
                                : 'No orders available. Create your first supplier order to get started.'}
                        </p>
                        <Link
                            to="/inventory/supplier-orders/add-new"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {orders.length === 0 ? 'Create First Order' : 'Create New Order'}
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            #
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Order Info
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Supplier
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Order Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Expected Delivery
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Cost
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentPageOrders.map((order, index) => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-gray-500">#{startIndex + index}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {order.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {order.order_number}
                                                    </div>
                                                    {order.items_count > 0 && (
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            {order.items_count} items
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Users className="w-4 h-4 text-gray-400 mr-2" />
                                                    <span className="text-sm text-gray-900">{order.supplier_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {formatDate(order.order_date)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={`text-sm ${order.is_overdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                                                    {formatDate(order.expected_delivery_date)}
                                                    {order.is_overdue && (
                                                        <span className="ml-2 text-xs text-red-600">(Overdue)</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(order.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(order.total_cost)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => handleDropdownToggle(order.id, e)}
                                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>

                                                    {openDropdownId === order.id && (
                                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                                            <button
                                                                onClick={() => handleViewDetails(order)}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                            >
                                                                <Eye className="w-4 h-4 mr-3 text-gray-400" />
                                                                View Details
                                                            </button>

                                                            {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                                                                <button
                                                                    onClick={() => handleMarkAsReceived(order.id)}
                                                                    className="flex items-center w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors"
                                                                >
                                                                    <Truck className="w-4 h-4 mr-3 text-green-400" />
                                                                    Mark as Received
                                                                </button>
                                                            )}

                                                            <Link
                                                                to={`/inventory/supplier-orders/edit/${order.id}`}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                            >
                                                                <Edit className="w-4 h-4 mr-3 text-gray-400" />
                                                                Edit
                                                            </Link>

                                                            <button
                                                                onClick={() => handleDeleteOrder(order.id)}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-3 text-red-400" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing {startIndex} to {endIndex} of {filteredOrders.length} orders
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <div className="flex items-center space-x-1">
                                        {[...Array(Math.min(5, totalPages))].map((_, index) => {
                                            const pageNumber = index + 1;
                                            return (
                                                <button
                                                    key={pageNumber}
                                                    onClick={() => setCurrentPage(pageNumber)}
                                                    className={`px-3 py-1 text-sm rounded-md ${currentPage === pageNumber
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-gray-700 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {pageNumber}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Order Detail Modal */}
            {showDetailModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                                <p className="text-gray-600 text-sm">View and manage supplier order information</p>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Order Header */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center space-x-3">
                                            <Package className="w-8 h-8 text-blue-600" />
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-900">
                                                    {selectedOrder.name}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    Order Number: {selectedOrder.order_number}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center space-x-6">
                                            <div className="flex items-center space-x-2">
                                                <Users className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm text-gray-700">{selectedOrder.supplier_name}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm text-gray-700">Ordered: {formatDate(selectedOrder.order_date)}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Truck className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm text-gray-700">Expected: {formatDate(selectedOrder.expected_delivery_date)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        {getStatusBadge(selectedOrder.status)}
                                    </div>
                                </div>
                            </div>

                            {/* Order Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500">Total Items</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {selectedOrder.items?.length || 0}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500">Total Quantity</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {selectedOrder.total_quantity || 0}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500">Total Cost</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {formatCurrency(selectedOrder.total_cost)}
                                    </p>
                                </div>
                            </div>

                            {/* Order Items */}
                            {selectedOrder.items && selectedOrder.items.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <Package className="w-5 h-5 mr-2 text-blue-600" />
                                        Order Items
                                    </h3>
                                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Material
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                        Quantity
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                        Unit Price
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                        Total
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {selectedOrder.items.map((item, index) => (
                                                    <tr key={index} className="hover:bg-gray-100">
                                                        <td className="px-4 py-3">
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {item.material_name}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    SKU: {item.material_sku}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                                                            {item.quantity}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                                                            {formatCurrency(item.unit_price)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                                                            {formatCurrency(item.total_cost)}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {item.is_received ? (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                                    Received
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                    <Clock className="w-3 h-3 mr-1" />
                                                                    Pending
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-100">
                                                <tr>
                                                    <td colSpan="3" className="px-4 py-3 text-right font-medium text-gray-900">
                                                        Total:
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                        {formatCurrency(selectedOrder.total_cost)}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {selectedOrder.notes && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-gray-700">{selectedOrder.notes}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                            {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                                <button
                                    onClick={() => {
                                        handleMarkAsReceived(selectedOrder.id);
                                        setShowDetailModal(false);
                                    }}
                                    className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <Truck className="w-4 h-4 mr-2" />
                                    Mark as Received
                                </button>
                            )}
                            <Link
                                to={`/inventory/supplier-orders/edit/${selectedOrder.id}`}
                                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Order
                            </Link>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplierOrdersList;