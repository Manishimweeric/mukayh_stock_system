import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ShoppingBag, Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
    X, Eye, MoreVertical, Plus, Calendar, DollarSign,
    TrendingUp, Users, Package, FileText, Download,
    Printer, CreditCard, Clock, CheckCircle, XCircle,
    TrendingDown, Percent
} from 'lucide-react';
import { toast } from 'react-toastify';
import { saleService, customerService } from '../../api';

const SalesList = () => {
    const [sales, setSales] = useState([]);
    const [filteredSales, setFilteredSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sessionFilter, setSessionFilter] = useState('All');
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
    const [currentPage, setCurrentPage] = useState(1);
    const [salesPerPage] = useState(10);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [years, setYears] = useState([]);
    const [profitSummary, setProfitSummary] = useState({
        totalRevenue: 0,
        totalProfit: 0,
        averageMargin: 0
    });

    useEffect(() => {
        fetchData();
        generateYears();
    }, []);

    useEffect(() => {
        filterSales();
    }, [sales, searchTerm, sessionFilter, yearFilter]);

    const generateYears = () => {
        const currentYear = new Date().getFullYear();
        const yearList = [];
        for (let i = currentYear - 2; i <= currentYear + 1; i++) {
            yearList.push(i);
        }
        setYears(yearList);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const salesResult = await saleService.getAllSales();

            if (salesResult.success) {
                setSales(salesResult.data);

                // Fetch profit summary
                const summaryResult = await saleService.getSalesSummary();
                if (summaryResult.success) {
                    setProfitSummary({
                        totalRevenue: summaryResult.data.total_revenue || 0,
                        totalProfit: summaryResult.data.total_profit || 0,
                        averageMargin: summaryResult.data.average_profit_margin || 0
                    });
                }
            } else {
                toast.error('Failed to load sales');
                setSales([]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
            setSales([]);
        } finally {
            setLoading(false);
        }
    };

    const filterSales = () => {
        if (!Array.isArray(sales)) {
            setFilteredSales([]);
            return;
        }

        let filtered = [...sales];

        if (searchTerm) {
            filtered = filtered.filter(sale =>
                (sale.receipt_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (sale.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (sale.customer_phone?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            );
        }

        if (sessionFilter !== 'All') {
            filtered = filtered.filter(sale => sale.session == sessionFilter);
        }

        if (yearFilter !== 'All') {
            filtered = filtered.filter(sale => sale.year == yearFilter);
        }

        setFilteredSales(filtered);
        setCurrentPage(1);
    };

    const getCurrentPageSales = () => {
        if (!Array.isArray(filteredSales)) return [];
        const indexOfLast = currentPage * salesPerPage;
        const indexOfFirst = indexOfLast - salesPerPage;
        return filteredSales.slice(indexOfFirst, indexOfLast);
    };

    const totalPages = Math.ceil(filteredSales.length / salesPerPage) || 1;
    const startIndex = (currentPage - 1) * salesPerPage + 1;
    const endIndex = Math.min(currentPage * salesPerPage, filteredSales.length);

    const handleDropdownToggle = (saleId, e) => {
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === saleId ? null : saleId);
    };

    const handleViewDetails = async (sale) => {
        const result = await saleService.getSaleById(sale.id);
        if (result.success) {
            setSelectedSale(result.data);
            setShowDetailModal(true);
        } else {
            toast.error('Failed to load sale details');
        }
        setOpenDropdownId(null);
    };

    const handleDeleteSale = async (saleId) => {
        if (window.confirm('Are you sure you want to delete this sale?')) {
            const result = await saleService.deleteSale(saleId);
            if (result.success) {
                toast.success('Sale deleted successfully');
                fetchData();
            } else {
                toast.error(result.message || 'Failed to delete sale');
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
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    const getSessionName = (session) => {
        const sessions = {
            1: 'Session 1 (Jan-Apr)',
            2: 'Session 2 (May-Aug)',
            3: 'Session 3 (Sep-Dec)'
        };
        return sessions[session] || `Session ${session}`;
    };

    const calculateSummary = () => {
        const totalRevenue = filteredSales.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);
        const totalProfit = filteredSales.reduce((sum, sale) => sum + (parseFloat(sale.total_profit) || 0), 0);
        const totalItems = filteredSales.reduce((sum, sale) => sum + (parseFloat(sale.total_quantity) || 0), 0);
        const totalCost = filteredSales.reduce((sum, sale) => sum + (parseFloat(sale.total_cost) || 0), 0);

        return {
            total: filteredSales.length,
            revenue: totalRevenue,
            profit: totalProfit,
            cost: totalCost,
            items: totalItems,
            margin: totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0
        };
    };

    const getProfitColor = (profit) => {
        if (profit > 0) return 'text-green-600';
        if (profit < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    const getMarginColor = (margin) => {
        if (margin >= 20) return 'text-green-600';
        if (margin >= 10) return 'text-yellow-600';
        if (margin > 0) return 'text-orange-600';
        return 'text-red-600';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading sales...</p>
                </div>
            </div>
        );
    }

    const currentPageSales = getCurrentPageSales();
    const hasSales = Array.isArray(filteredSales) && filteredSales.length > 0;
    const summary = calculateSummary();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <ShoppingBag className="w-6 h-6 mr-3 text-blue-600" />
                        Sales Management
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Track and manage all customer sales with profit analysis
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
                        to="/inventory/sales/add-new"
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Sale
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
                            <p className="text-sm text-gray-500">Total Sales</p>
                            <p className="text-xl font-semibold text-gray-900">{summary.total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Revenue</p>
                            <p className="text-xl font-semibold text-gray-900">{formatCurrency(summary.revenue)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Profit</p>
                            <p className="text-xl font-semibold text-purple-600">{formatCurrency(summary.profit)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Percent className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Margin</p>
                            <p className={`text-xl font-semibold ${getMarginColor(summary.margin)}`}>
                                {summary.margin.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Package className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Items Sold</p>
                            <p className="text-xl font-semibold text-gray-900">{summary.items}</p>
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
                            placeholder="Search by receipt, customer, or phone..."
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Session
                                </label>
                                <select
                                    value={sessionFilter}
                                    onChange={(e) => setSessionFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="All">All Sessions</option>
                                    <option value="1">Session 1 (Jan - Apr)</option>
                                    <option value="2">Session 2 (May - Aug)</option>
                                    <option value="3">Session 3 (Sep - Dec)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Year
                                </label>
                                <select
                                    value={yearFilter}
                                    onChange={(e) => setYearFilter(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="All">All Years</option>
                                    {years.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-gray-600">
                                Showing {filteredSales.length} of {sales.length} sales
                            </div>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSessionFilter('All');
                                    setYearFilter(new Date().getFullYear());
                                    setShowFilters(false);
                                }}
                                className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                            >
                                <X className="w-4 h-4 mr-1" />
                                Clear filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Sales Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {!hasSales ? (
                    <div className="text-center py-12">
                        <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {sales.length === 0 ? 'No sales found' : 'No matching sales'}
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm || sessionFilter !== 'All' || yearFilter !== 'All'
                                ? 'No sales match your current filters.'
                                : 'No sales available. Create your first sale to get started.'}
                        </p>
                        <Link
                            to="/inventory/sales/add-new"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {sales.length === 0 ? 'Add First Sale' : 'Add New Sale'}
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
                                            Session/Year
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Items
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Revenue
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Cost
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Profit
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Margin
                                        </th>

                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentPageSales.map((sale, index) => {
                                        const profit = parseFloat(sale.total_profit) || 0;
                                        const revenue = parseFloat(sale.total_amount) || 0;
                                        const cost = parseFloat(sale.total_cost) || 0;
                                        const margin = revenue > 0 ? (profit / revenue * 100) : 0;

                                        return (
                                            <tr key={sale.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-2 whitespace-nowrap">
                                                    <span className="text-gray-500">#{startIndex + index}</span>
                                                </td>

                                                <td className="px-6 py-2">
                                                    <div className="flex items-center">
                                                        <div className="ml-3">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {sale.customer_name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-2 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                        {getSessionName(sale.session)} {sale.year}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-2 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {sale.total_quantity} units
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {sale.items_count} items
                                                    </div>
                                                </td>
                                                <td className="px-6 py-2 whitespace-nowrap">
                                                    <span className="text-sm font-semibold text-green-600">
                                                        {formatCurrency(revenue)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-2 whitespace-nowrap">
                                                    <span className="text-sm text-gray-600">
                                                        {formatCurrency(cost)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-2 whitespace-nowrap">
                                                    <span className={`text-sm font-semibold ${getProfitColor(profit)}`}>
                                                        {formatCurrency(profit)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-2 whitespace-nowrap">
                                                    <span className={`text-sm font-medium ${getMarginColor(margin)}`}>
                                                        {margin.toFixed(1)}%
                                                    </span>
                                                </td>

                                                <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => handleDropdownToggle(sale.id, e)}
                                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>

                                                        {openDropdownId === sale.id && (
                                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                                                <button
                                                                    onClick={() => handleViewDetails(sale)}
                                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                                >
                                                                    <Eye className="w-4 h-4 mr-3 text-gray-400" />
                                                                    View Details
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing {startIndex} to {endIndex} of {filteredSales.length} sales
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

            {/* Sale Detail Modal */}
            {showDetailModal && selectedSale && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Sale Details</h2>
                                <p className="text-gray-600 text-sm">Receipt: {selectedSale.receipt_number}</p>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Sale Header */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <ShoppingBag className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900">
                                                Sale #{selectedSale.receipt_number}
                                            </h3>
                                            <div className="flex items-center space-x-4 mt-2">
                                                <div className="flex items-center space-x-1">
                                                    <Calendar className="w-4 h-4 text-gray-500" />
                                                    <span className="text-sm text-gray-600">
                                                        {formatDate(selectedSale.sale_date)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <Users className="w-4 h-4 text-gray-500" />
                                                    <span className="text-sm text-gray-600">
                                                        {selectedSale.customer_details?.name}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                        {getSessionName(selectedSale.session)} {selectedSale.year}
                                    </span>
                                </div>
                            </div>

                            {/* Sale Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500">Subtotal</p>
                                    <p className="text-xl font-bold text-gray-900">
                                        {formatCurrency(selectedSale.subtotal)}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500">VAT</p>
                                    <p className="text-xl font-bold text-gray-900">
                                        {formatCurrency(selectedSale.total_vat)}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500">Revenue</p>
                                    <p className="text-xl font-bold text-green-600">
                                        {formatCurrency(selectedSale.total_amount)}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500">Cost</p>
                                    <p className="text-xl font-bold text-gray-600">
                                        {formatCurrency(selectedSale.total_cost)}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500">Profit</p>
                                    <p className="text-xl font-bold text-blue-600">
                                        {formatCurrency(selectedSale.total_profit)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Margin: {selectedSale.profit_margin?.toFixed(1)}%
                                    </p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
                                <div className="bg-gray-50 rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Material</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Selling Price</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Buying Price</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">VAT</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Profit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {selectedSale.items?.map((item, idx) => {
                                                const itemProfit = (item.total_amount || 0) - (item.cost_total || 0);
                                                return (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-2">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {item.material_name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                SKU: {item.material_sku}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 text-right">
                                                            {item.quantity} {item.material_unit}
                                                        </td>
                                                        <td className="px-4 py-2 text-right">
                                                            {formatCurrency(item.selling_price)}
                                                        </td>
                                                        <td className="px-4 py-2 text-right">
                                                            {formatCurrency(item.buying_price)}
                                                        </td>
                                                        <td className="px-4 py-2 text-right">
                                                            {formatCurrency(item.vat_amount)}
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-medium">
                                                            {formatCurrency(item.total_amount)}
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-medium text-green-600">
                                                            {formatCurrency(itemProfit)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-gray-100">
                                            <tr>
                                                <td colSpan="5" className="px-4 py-2 text-right font-medium">Totals:</td>
                                                <td className="px-4 py-2 text-right font-bold text-green-600">
                                                    {formatCurrency(selectedSale.total_amount)}
                                                </td>
                                                <td className="px-4 py-2 text-right font-bold text-blue-600">
                                                    {formatCurrency(selectedSale.total_profit)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {selectedSale.notes && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                                    <p className="text-sm text-gray-600">{selectedSale.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">

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

export default SalesList;