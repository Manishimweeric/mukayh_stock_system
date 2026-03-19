import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Users, Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
    X, Eye, MoreVertical, UserPlus, Phone, CreditCard,
    Calendar, Edit, Trash2, ShoppingBag, DollarSign,
    TrendingUp, User, Mail, MapPin, Clock, Download
} from 'lucide-react';
import { toast } from 'react-toastify';
import { customerService, saleService } from '../../api';

const CustomersList = () => {
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [customersPerPage] = useState(10);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [customerStats, setCustomerStats] = useState({
        total: 0,
        totalSpent: 0,
        totalTransactions: 0,
        averageOrderValue: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        filterCustomers();
    }, [customers, searchTerm]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const customersResult = await customerService.getAllCustomers();

            if (customersResult.success) {
                setCustomers(customersResult.data);
                calculateStats(customersResult.data);
            } else {
                toast.error('Failed to load customers');
                setCustomers([]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (customerData) => {
        const total = customerData.length;
        let totalSpent = 0;
        let totalTransactions = 0;

        customerData.forEach(customer => {
            totalSpent += parseFloat(customer.total_spent) || 0;
            totalTransactions += parseInt(customer.total_sales) || 0;
        });

        setCustomerStats({
            total,
            totalSpent,
            totalTransactions,
            averageOrderValue: totalTransactions > 0 ? totalSpent / totalTransactions : 0
        });
    };

    const filterCustomers = () => {
        if (!Array.isArray(customers)) {
            setFilteredCustomers([]);
            return;
        }

        let filtered = [...customers];

        if (searchTerm) {
            filtered = filtered.filter(customer =>
                (customer.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (customer.phone_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (customer.tin?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            );
        }

        setFilteredCustomers(filtered);
        setCurrentPage(1);
    };

    const getCurrentPageCustomers = () => {
        if (!Array.isArray(filteredCustomers)) return [];
        const indexOfLast = currentPage * customersPerPage;
        const indexOfFirst = indexOfLast - customersPerPage;
        return filteredCustomers.slice(indexOfFirst, indexOfLast);
    };

    const totalPages = Math.ceil(filteredCustomers.length / customersPerPage) || 1;
    const startIndex = (currentPage - 1) * customersPerPage + 1;
    const endIndex = Math.min(currentPage * customersPerPage, filteredCustomers.length);

    const handleDropdownToggle = (customerId, e) => {
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === customerId ? null : customerId);
    };

    const handleViewDetails = async (customer) => {
        setSelectedCustomer(customer);

        // Fetch customer summary
        const summaryResult = await customerService.getCustomerSummary(customer.id);
        if (summaryResult.success) {
            setSelectedCustomer(prev => ({
                ...prev,
                summary: summaryResult.data
            }));
        }

        setShowDetailModal(true);
        setOpenDropdownId(null);
    };

    const handleDeleteCustomer = async (customerId) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            const result = await customerService.deleteCustomer(customerId);
            if (result.success) {
                toast.success('Customer deleted successfully');
                fetchData();
            } else {
                toast.error(result.message || 'Failed to delete customer');
            }
        }
        setOpenDropdownId(null);
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
        if (!dateString) return 'Never';
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading customers...</p>
                </div>
            </div>
        );
    }

    const currentPageCustomers = getCurrentPageCustomers();
    const hasCustomers = Array.isArray(filteredCustomers) && filteredCustomers.length > 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Users className="w-6 h-6 mr-3 text-blue-600" />
                        Customer Management
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage all customers and their purchase history
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
                        to="/inventory/customers/add-new"
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Customer
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Total Customers</p>
                            <p className="text-xl font-semibold text-gray-900">{customerStats.total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Total Spent</p>
                            <p className="text-xl font-semibold text-gray-900">{formatCurrency(customerStats.totalSpent)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <ShoppingBag className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Transactions</p>
                            <p className="text-xl font-semibold text-gray-900">{customerStats.totalTransactions}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Avg Order Value</p>
                            <p className="text-xl font-semibold text-gray-900">{formatCurrency(customerStats.averageOrderValue)}</p>
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
                            placeholder="Search by name, phone, or TIN..."
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
                    </button>
                </div>

                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Showing {filteredCustomers.length} of {customers.length} customers
                            </div>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setShowFilters(false);
                                }}
                                className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                            >
                                <X className="w-4 h-4 mr-1" />
                                Clear search
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {!hasCustomers ? (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {customers.length === 0 ? 'No customers found' : 'No matching customers'}
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm
                                ? 'No customers match your search.'
                                : 'No customers available. Add your first customer to get started.'}
                        </p>
                        <Link
                            to="/customers/add-new"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            {customers.length === 0 ? 'Add First Customer' : 'Add New Customer'}
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            NO
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Contact
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            TIN
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Transactions
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Spent
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Joined
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentPageCustomers.map((customer, index) => (
                                        <tr key={customer.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-gray-500">#{startIndex + index}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <User className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {customer.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <Phone className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900">{customer.phone_number}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900">{customer.tin || 'N/A'}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {customer.total_sales || 0} sales
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(customer.total_spent || 0)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900">
                                                        {formatDate(customer.created_at)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => handleDropdownToggle(customer.id, e)}
                                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>

                                                    {openDropdownId === customer.id && (
                                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                                            <button
                                                                onClick={() => handleViewDetails(customer)}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                            >
                                                                <Eye className="w-4 h-4 mr-3 text-gray-400" />
                                                                View Details
                                                            </button>

                                                            <button
                                                                onClick={() => handleDeleteCustomer(customer.id)}
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
                                    Showing {startIndex} to {endIndex} of {filteredCustomers.length} customers
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

            {/* Customer Detail Modal */}
            {showDetailModal && selectedCustomer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Customer Details</h2>
                                <p className="text-gray-600 text-sm">Customer information and purchase history</p>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Customer Header */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <User className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900">
                                                {selectedCustomer.name}
                                            </h3>
                                            <div className="flex items-center space-x-4 mt-2">
                                                <div className="flex items-center space-x-1">
                                                    <Phone className="w-4 h-4 text-gray-500" />
                                                    <span className="text-sm text-gray-600">{selectedCustomer.phone_number}</span>
                                                </div>
                                                {selectedCustomer.tin && (
                                                    <div className="flex items-center space-x-1">
                                                        <CreditCard className="w-4 h-4 text-gray-500" />
                                                        <span className="text-sm text-gray-600">TIN: {selectedCustomer.tin}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Link
                                        to={`/sales/add-new?customer=${selectedCustomer.id}`}
                                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <ShoppingBag className="w-4 h-4 mr-2" />
                                        New Sale
                                    </Link>
                                </div>
                            </div>

                            {/* Customer Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500">Total Purchases</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {selectedCustomer.summary?.total_sales || 0}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500">Total Spent</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {formatCurrency(selectedCustomer.summary?.total_spent || 0)}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500">Average Order Value</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {formatCurrency(selectedCustomer.summary?.average_order_value || 0)}
                                    </p>
                                </div>
                            </div>

                            {/* Purchase History */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <ShoppingBag className="w-5 h-5 mr-2 text-blue-600" />
                                    Purchase History
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <CustomerPurchaseHistory customerId={selectedCustomer.id} />
                                </div>
                            </div>

                            {/* Session Breakdown */}
                            {selectedCustomer.summary?.session_breakdown && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Breakdown</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {selectedCustomer.summary.session_breakdown.map((session) => (
                                            <div key={session.session} className="bg-gray-50 rounded-lg p-4">
                                                <p className="text-sm font-medium text-gray-700">
                                                    Session {session.session}
                                                </p>
                                                <p className="text-lg font-semibold text-gray-900 mt-1">
                                                    {session.count} purchases
                                                </p>
                                                <p className="text-sm text-green-600">
                                                    {formatCurrency(session.total)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                            <Link
                                to={`/customers/edit/${selectedCustomer.id}`}
                                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Customer
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

// Customer Purchase History Component
const CustomerPurchaseHistory = ({ customerId }) => {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPurchaseHistory();
    }, [customerId]);

    const fetchPurchaseHistory = async () => {
        setLoading(true);
        const result = await customerService.getCustomerPurchaseHistory(customerId);
        if (result.success) {
            setPurchases(result.data);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (purchases.length === 0) {
        return (
            <div className="text-center py-8">
                <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No purchase history found</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {purchases.slice(0, 5).map((purchase) => (
                <div key={purchase.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-900">Receipt: {purchase.receipt_number}</p>
                        <p className="text-sm text-gray-500">
                            {new Date(purchase.sale_date).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold text-green-600">
                            {new Intl.NumberFormat('rw-RW', { style: 'currency', currency: 'RWF' }).format(purchase.total_amount)}
                        </p>
                        <p className="text-xs text-gray-500">{purchase.items_count} items</p>
                    </div>
                </div>
            ))}
            {purchases.length > 5 && (
                <Link
                    to={`/customers/${customerId}/purchases`}
                    className="block text-center text-sm text-blue-600 hover:text-blue-800 mt-2"
                >
                    View all {purchases.length} purchases
                </Link>
            )}
        </div>
    );
};

export default CustomersList;