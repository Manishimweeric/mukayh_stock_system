import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ShoppingBag, Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
    X, Eye, Package, Truck, Clock, CheckCircle,
    AlertCircle, FileText, Calendar, DollarSign,
    Loader, CheckSquare, XCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { supplierOrderService, supplierService, getCurrentUser } from '../../api';

const SupplierOrdersPage = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage] = useState(10);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [processingAction, setProcessingAction] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [supplier, setSupplier] = useState(null);
    const [orderStats, setOrderStats] = useState({
        pending: 0,
        received: 0,
        accepted: 0,
        delivered: 0,
        cancelled: 0,
        totalValue: 0
    });

    const currentUser = getCurrentUser();
    console.log('Current user:', currentUser);

    useEffect(() => {
        if (!currentUser?.email) {
            toast.error('Supplier email not found');
            navigate('/dashboard');
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const supplierResult = await supplierService.getSupplierByEmail(currentUser.email);
                if (supplierResult.success && supplierResult.data && supplierResult.data.length > 0) {
                    const supplierData = supplierResult.data[0];
                    setSupplier(supplierData);
                    const ordersResult = await supplierOrderService.getOrdersBySupplier(supplierData.id);
                    if (ordersResult.success) {
                        setOrders(ordersResult.data);
                        calculateStats(ordersResult.data);
                    } else {
                        toast.error('Failed to load orders');
                        setOrders([]);
                    }
                } else {
                    toast.error('Supplier not found. Please contact administrator.');
                    setSupplier(null);
                    setOrders([]);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load data');
                setSupplier(null);
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser?.email]);

    useEffect(() => {
        filterOrders();
    }, [orders, searchTerm, statusFilter]);

    const calculateStats = (orderData) => {
        const pending = orderData.filter(o => o.status === 'PENDING').length;
        const received = orderData.filter(o => o.status === 'RECEIVED').length;
        const accepted = orderData.filter(o => o.status === 'ACCEPTED').length;
        const delivered = orderData.filter(o => o.status === 'DELIVERED').length;
        const cancelled = orderData.filter(o => o.status === 'CANCELLED').length;
        const totalValue = orderData.reduce((sum, o) => sum + (parseFloat(o.total_cost) || 0), 0);

        setOrderStats({
            pending,
            received,
            accepted,
            delivered,
            cancelled,
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
                (order.order_number?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(order => order.status === statusFilter);
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
    };

    const handleConfirmReceipt = async () => {
        if (!selectedOrder) return;

        setProcessingAction(true);
        try {
            const result = await supplierOrderService.updateSupplierOrderStatus(selectedOrder.id, {
                status: 'RECEIVED',
                confirmation_message: confirmationMessage
            });

            if (result.success) {
                toast.success('Order receipt confirmed successfully!');
                setShowConfirmModal(false);
                setConfirmationMessage('');
                // Refresh orders
                const ordersResult = await supplierOrderService.getOrdersBySupplier(supplier.id);
                if (ordersResult.success) {
                    setOrders(ordersResult.data);
                    calculateStats(ordersResult.data);
                }
            } else {
                toast.error(result.message || 'Failed to confirm order receipt');
            }
        } catch (error) {
            console.error('Error confirming receipt:', error);
            toast.error('An error occurred while confirming receipt');
        } finally {
            setProcessingAction(false);
        }
    };

    const handleAcceptOrder = async () => {
        if (!selectedOrder) return;

        setProcessingAction(true);
        try {
            const result = await supplierOrderService.updateSupplierOrderStatus(selectedOrder.id, {
                status: 'ACCEPTED'
            });

            if (result.success) {
                toast.success('Order accepted successfully!');
                setShowConfirmModal(false);
                // Refresh orders
                const ordersResult = await supplierOrderService.getOrdersBySupplier(supplier.id);
                if (ordersResult.success) {
                    setOrders(ordersResult.data);
                    calculateStats(ordersResult.data);
                }
            } else {
                toast.error(result.message || 'Failed to accept order');
            }
        } catch (error) {
            console.error('Error accepting order:', error);
            toast.error('An error occurred while accepting order');
        } finally {
            setProcessingAction(false);
        }
    };

    const handleRejectOrder = async () => {
        if (!selectedOrder) return;

        if (!rejectionReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        setProcessingAction(true);
        try {
            const result = await supplierOrderService.updateSupplierOrderStatus(selectedOrder.id, {
                status: 'CANCELLED',
                rejection_reason: rejectionReason
            });

            if (result.success) {
                toast.warning('Order rejected successfully');
                setShowRejectModal(false);
                setRejectionReason('');
                // Refresh orders
                const ordersResult = await supplierOrderService.getOrdersBySupplier(supplier.id);
                if (ordersResult.success) {
                    setOrders(ordersResult.data);
                    calculateStats(ordersResult.data);
                }
            } else {
                toast.error(result.message || 'Failed to reject order');
            }
        } catch (error) {
            console.error('Error rejecting order:', error);
            toast.error('An error occurred while rejecting order');
        } finally {
            setProcessingAction(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'PENDING': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
            'RECEIVED': { color: 'bg-blue-100 text-blue-800', icon: FileText, text: 'Received by Supplier' },
            'ACCEPTED': { color: 'bg-purple-100 text-purple-800', icon: CheckCircle, text: 'Accepted' },
            'DELIVERED': { color: 'bg-green-100 text-green-800', icon: Truck, text: 'Delivered' },
            'CANCELLED': { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'Cancelled' }
        };

        const config = statusConfig[status] || statusConfig.PENDING;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {config.text}
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
        setShowFilters(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading your orders...</p>
                </div>
            </div>
        );
    }

    const currentPageOrders = getCurrentPageOrders();
    const hasOrders = Array.isArray(filteredOrders) && filteredOrders.length > 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <ShoppingBag className="w-6 h-6 mr-3 text-blue-600" />
                        My Supplier Orders
                    </h1>
                    <p className="text-gray-600 mt-1">
                        View and manage orders placed with your company
                    </p>
                    {supplier && (
                        <p className="text-sm text-gray-500 mt-1">
                            Welcome, {supplier.contact_person || supplier.name}
                        </p>
                    )}
                </div>
                <button
                    onClick={async () => {
                        if (supplier) {
                            const ordersResult = await supplierOrderService.getOrdersBySupplier(supplier.id);
                            if (ordersResult.success) {
                                setOrders(ordersResult.data);
                                calculateStats(ordersResult.data);
                                toast.info('Orders refreshed');
                            }
                        }
                    }}
                    className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Pending</p>
                            <p className="text-xl font-semibold text-gray-900">{orderStats.pending}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Received</p>
                            <p className="text-xl font-semibold text-gray-900">{orderStats.received}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Accepted</p>
                            <p className="text-xl font-semibold text-gray-900">{orderStats.accepted}</p>
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
                            placeholder="Search by order name or number..."
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
                        {statusFilter !== 'all' && (
                            <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                    </button>
                </div>

                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    <option value="ACCEPTED">Accepted</option>
                                    <option value="DELIVERED">Delivered</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
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
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {orders.length === 0 ? 'No orders found' : 'No matching orders'}
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm || statusFilter !== 'all'
                                ? 'No orders match your filters.'
                                : 'You have no orders yet. Orders will appear here once placed.'}
                        </p>
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
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleViewDetails(order)}
                                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>

                                                    {order.status === 'PENDING' && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedOrder(order);
                                                                    setShowConfirmModal(true);
                                                                }}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="Confirm Receipt"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedOrder(order);
                                                                    setShowRejectModal(true);
                                                                }}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Reject Order"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}

                                                    {order.status === 'RECEIVED' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedOrder(order);
                                                                setShowConfirmModal(true);
                                                            }}
                                                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                            title="Accept Order"
                                                        >
                                                            <CheckSquare className="w-4 h-4" />
                                                        </button>
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

            {/* Order Detail Modal - Same as before */}
            {showDetailModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                                <p className="text-gray-600 text-sm">View order information and items</p>
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
                                        <div className="mt-4 flex flex-wrap gap-4">
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

                        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
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

            {/* Confirm Receipt/Accept Modal */}
            {showConfirmModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {selectedOrder.status === 'PENDING' ? 'Confirm Order Receipt' : 'Accept Order'}
                            </h3>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-gray-600">
                                {selectedOrder.status === 'PENDING'
                                    ? 'Confirm that you have received this order and will process it.'
                                    : 'Confirm that you accept this order and will prepare it for delivery.'}
                            </p>

                            {selectedOrder.status === 'PENDING' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Message (Optional)
                                    </label>
                                    <textarea
                                        value={confirmationMessage}
                                        onChange={(e) => setConfirmationMessage(e.target.value)}
                                        rows="3"
                                        placeholder="Add a message to the buyer..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            )}

                            <div className="bg-yellow-50 rounded-lg p-3">
                                <div className="flex items-start">
                                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                                    <p className="text-sm text-yellow-800">
                                        {selectedOrder.status === 'PENDING'
                                            ? 'By confirming receipt, you acknowledge that you have received this order and will begin processing it.'
                                            : 'By accepting this order, you confirm that you can fulfill it and will prepare for delivery.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={selectedOrder.status === 'PENDING' ? handleConfirmReceipt : handleAcceptOrder}
                                disabled={processingAction}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {processingAction && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                                {selectedOrder.status === 'PENDING' ? 'Confirm Receipt' : 'Accept Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Order Modal */}
            {showRejectModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Reject Order</h3>
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-gray-600">
                                Please provide a reason for rejecting this order:
                            </p>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rejection Reason <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows="4"
                                    placeholder="Explain why you cannot fulfill this order..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>

                            <div className="bg-red-50 rounded-lg p-3">
                                <div className="flex items-start">
                                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                                    <p className="text-sm text-red-800">
                                        This action cannot be undone. The order will be cancelled and the buyer will be notified.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectOrder}
                                disabled={processingAction}
                                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {processingAction && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                                Reject Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplierOrdersPage;