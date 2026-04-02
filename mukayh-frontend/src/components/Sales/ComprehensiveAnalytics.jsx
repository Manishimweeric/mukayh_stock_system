import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Package,
    Calendar,
    BarChart3,
    ArrowLeft,
    RefreshCw,
    Loader2,
    Award,
    Clock,
    ChevronDown,
    ChevronUp,
    Eye,
    Star,
    Zap,
    Users,
    ShoppingBag,
    PieChart,
    Percent,
    UserCheck,
    Medal,
    Crown,
    Activity,
    Filter,
    Download,
    AlertCircle
} from 'lucide-react';
import { saleService } from '../../api';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('rw-RW', {
        style: 'currency',
        currency: 'RWF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Math.round(amount || 0));
};

const formatNumber = (number) => {
    return new Intl.NumberFormat('rw-RW').format(number || 0);
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

const getCurrentYear = () => {
    return new Date().getFullYear();
};

const getCurrentSession = () => {
    const month = new Date().getMonth() + 1;
    if (month >= 1 && month <= 4) return 1;
    if (month >= 5 && month <= 8) return 2;
    return 3;
};

const getProfitColor = (profit) => {
    if (profit > 0) return 'text-green-900';
    if (profit < 0) return 'text-red-600';
    return 'text-gray-600';
};

const getMarginColor = (margin) => {
    if (margin >= 30) return 'text-green-900 font-bold';
    if (margin >= 20) return 'text-green-800';
    if (margin >= 10) return 'text-green-700';
    if (margin > 0) return 'text-green-600';
    return 'text-red-600';
};

const getCustomerTier = (totalSpent) => {
    if (totalSpent >= 10000000) return { name: 'Platinum', color: 'bg-purple-100 text-purple-800', icon: Crown };
    if (totalSpent >= 5000000) return { name: 'Gold', color: 'bg-yellow-100 text-yellow-800', icon: Medal };
    if (totalSpent >= 1000000) return { name: 'Silver', color: 'bg-gray-100 text-gray-800', icon: Award };
    if (totalSpent >= 500000) return { name: 'Bronze', color: 'bg-orange-100 text-orange-800', icon: Award };
    return { name: 'Regular', color: 'bg-blue-100 text-blue-800', icon: UserCheck };
};

export default function ComprehensiveAnalytics() {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('customers'); // 'customers', 'materials', 'ranking'

    // Customer Analytics State
    const [topCustomers, setTopCustomers] = useState([]);
    const [customerSummary, setCustomerSummary] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerDetails, setCustomerDetails] = useState(null);

    // Material Analytics State
    const [topMaterialsDetailed, setTopMaterialsDetailed] = useState([]);
    const [materialsRanking, setMaterialsRanking] = useState([]);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [materialPerformance, setMaterialPerformance] = useState(null);

    // Filters
    const [selectedYear, setSelectedYear] = useState(getCurrentYear());
    const [selectedSession, setSelectedSession] = useState('');
    const [rankingType, setRankingType] = useState('revenue');
    const [customerCriteria, setCustomerCriteria] = useState('total_revenue');
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showMaterialModal, setShowMaterialModal] = useState(false);

    const years = Array.from({ length: 5 }, (_, i) => getCurrentYear() - i);
    const rankingTypes = [
        { value: 'quantity', label: 'By Quantity Sold', icon: Package },
        { value: 'revenue', label: 'By Revenue', icon: DollarSign },
        { value: 'profit', label: 'By Profit', icon: TrendingUp },
        { value: 'transactions', label: 'By Transactions', icon: ShoppingBag },
        { value: 'profit_margin', label: 'By Profit Margin', icon: Percent }
    ];

    const customerCriteriaOptions = [
        { value: 'total_revenue', label: 'Total Revenue', icon: DollarSign },
        { value: 'total_profit', label: 'Total Profit', icon: TrendingUp },
        { value: 'total_quantity', label: 'Quantity Purchased', icon: Package },
        { value: 'total_sales', label: 'Number of Sales', icon: ShoppingBag },
        { value: 'profit_margin', label: 'Profit Margin', icon: Percent },
        { value: 'average_order_value', label: 'Avg Order Value', icon: Activity }
    ];

    useEffect(() => {
        if (activeTab === 'customers') {
            fetchTopCustomers();
            fetchCustomerSummary();
        } else if (activeTab === 'materials') {
            fetchTopMaterialsDetailed();
        } else if (activeTab === 'ranking') {
            fetchMaterialsRanking();
        }
    }, [activeTab, selectedYear, selectedSession, rankingType, customerCriteria]);

    // Customer Analytics Functions
    const fetchTopCustomers = async () => {
        setLoading(true);
        try {
            const result = await saleService.getTopCustomers({
                limit: 20,
                criteria: customerCriteria,
                year: selectedYear,
                session: selectedSession || undefined
            });
            if (result.success) {
                setTopCustomers(result.data);
            } else {
                toast.error(result.message || 'Failed to load top customers');
            }
        } catch (error) {
            console.error('Error fetching top customers:', error);
            toast.error('Network error. Could not load top customers.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerSummary = async () => {
        try {
            const result = await saleService.getAllCustomersSummary({
                year: selectedYear,
                session: selectedSession || undefined,
                sort_by: customerCriteria
            });
            if (result.success) {
                setCustomerSummary(result.data);
            }
        } catch (error) {
            console.error('Error fetching customer summary:', error);
        }
    };

    const fetchCustomerDetails = async (customerId) => {
        setLoading(true);
        try {
            const result = await saleService.getCustomerDetailedAnalytics(customerId, {
                year: selectedYear,
                session: selectedSession || undefined
            });
            if (result.success) {
                setCustomerDetails(result.data);
                setShowCustomerModal(true);
            } else {
                toast.error(result.message || 'Failed to load customer details');
            }
        } catch (error) {
            console.error('Error fetching customer details:', error);
            toast.error('Network error. Could not load customer details.');
        } finally {
            setLoading(false);
        }
    };

    // Material Analytics Functions
    const fetchTopMaterialsDetailed = async () => {
        setLoading(true);
        try {
            const result = await saleService.getTopSellingMaterialsDetailed({
                limit: 20,
                year: selectedYear,
                session: selectedSession || undefined
            });
            if (result.success) {
                setTopMaterialsDetailed(result.data);
            } else {
                toast.error(result.message || 'Failed to load top materials');
            }
        } catch (error) {
            console.error('Error fetching top materials:', error);
            toast.error('Network error. Could not load top materials.');
        } finally {
            setLoading(false);
        }
    };

    const fetchMaterialsRanking = async () => {
        setLoading(true);
        try {
            const result = await saleService.getMaterialsRanking({
                type: rankingType,
                limit: 30,
                year: selectedYear,
                session: selectedSession || undefined
            });
            if (result.success) {
                setMaterialsRanking(result.data.ranking || []);
            } else {
                toast.error(result.message || 'Failed to load materials ranking');
            }
        } catch (error) {
            console.error('Error fetching materials ranking:', error);
            toast.error('Network error. Could not load materials ranking.');
        } finally {
            setLoading(false);
        }
    };

    const fetchMaterialPerformance = async (materialId) => {
        setLoading(true);
        try {
            const result = await saleService.getMaterialPerformanceComparison(materialId);
            if (result.success) {
                setMaterialPerformance(result.data);
                setShowMaterialModal(true);
            } else {
                toast.error(result.message || 'Failed to load material performance');
            }
        } catch (error) {
            console.error('Error fetching material performance:', error);
            toast.error('Network error. Could not load material performance.');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        if (activeTab === 'customers') {
            fetchTopCustomers();
            fetchCustomerSummary();
        } else if (activeTab === 'materials') {
            fetchTopMaterialsDetailed();
        } else if (activeTab === 'ranking') {
            fetchMaterialsRanking();
        }
    };

    const handleExport = () => {
        let data = [];
        let filename = '';

        if (activeTab === 'customers') {
            data = topCustomers.map(customer => ({
                'Customer Name': customer.customer.name,
                'Phone': customer.customer.phone_number,
                'Total Sales': customer.total_sales_count,
                'Total Quantity': customer.total_quantity_purchased,
                'Total Revenue': customer.total_revenue,
                'Total Profit': customer.total_profit,
                'Profit Margin': customer.profit_margin,
                'Avg Order Value': customer.average_order_value
            }));
            filename = `top_customers_${selectedYear}.csv`;
        } else if (activeTab === 'materials') {
            data = topMaterialsDetailed.map(material => ({
                'Material': material.material.name,
                'SKU': material.material.sku,
                'Quantity Sold': material.sales_metrics.total_quantity_sold,
                'Revenue': material.sales_metrics.total_revenue,
                'Profit': material.sales_metrics.total_profit,
                'Profit Margin': material.sales_metrics.profit_margin,
                'Transactions': material.sales_metrics.number_of_transactions,
                'Unique Customers': material.sales_metrics.number_of_unique_customers
            }));
            filename = `top_materials_${selectedYear}.csv`;
        }

        if (data.length > 0) {
            const csv = convertToCSV(data);
            downloadCSV(csv, filename);
            toast.success('Export started successfully');
        }
    };

    const convertToCSV = (data) => {
        const headers = Object.keys(data[0]);
        const rows = data.map(obj => headers.map(header => obj[header]).join(','));
        return [headers.join(','), ...rows].join('\n');
    };

    const downloadCSV = (csv, filename) => {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Calculate summary statistics
    const calculateCustomerStats = () => {
        const totalCustomers = topCustomers.length;
        const totalRevenue = topCustomers.reduce((sum, c) => sum + (c.total_revenue || 0), 0);
        const totalProfit = topCustomers.reduce((sum, c) => sum + (c.total_profit || 0), 0);
        const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;

        return { totalCustomers, totalRevenue, totalProfit, avgMargin };
    };

    const customerStats = calculateCustomerStats();

    return (
        <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <BarChart3 className="w-6 h-6 mr-3 text-green-900" />
                        Advanced Analytics
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Comprehensive insights into customers and materials performance
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Refresh
                    </button>

                    <button
                        onClick={handleExport}
                        disabled={loading || (activeTab === 'customers' ? topCustomers.length === 0 : topMaterialsDetailed.length === 0)}
                        className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>

                    <Link
                        to="/inventory/sales/list"
                        className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Sales
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Year
                        </label>
                        <div className="relative">
                            <div className="absolute left-3 top-3 text-gray-400">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="w-40 pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-900/20 focus:border-green-900"
                            >
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Session
                        </label>
                        <div className="relative">
                            <div className="absolute left-3 top-3 text-gray-400">
                                <Clock className="w-5 h-5" />
                            </div>
                            <select
                                value={selectedSession}
                                onChange={(e) => setSelectedSession(e.target.value)}
                                className="w-48 pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-900/20 focus:border-green-900"
                            >
                                <option value="">All Sessions</option>
                                <option value="1">Session 1 (Jan - Apr)</option>
                                <option value="2">Session 2 (May - Aug)</option>
                                <option value="3">Session 3 (Sep - Dec)</option>
                            </select>
                        </div>
                    </div>

                    {activeTab === 'customers' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sort By
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-3 text-gray-400">
                                    <Filter className="w-5 h-5" />
                                </div>
                                <select
                                    value={customerCriteria}
                                    onChange={(e) => setCustomerCriteria(e.target.value)}
                                    className="w-48 pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-900/20 focus:border-green-900"
                                >
                                    {customerCriteriaOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ranking' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ranking Type
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-3 text-gray-400">
                                    <PieChart className="w-5 h-5" />
                                </div>
                                <select
                                    value={rankingType}
                                    onChange={(e) => setRankingType(e.target.value)}
                                    className="w-48 pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-900/20 focus:border-green-900"
                                >
                                    {rankingTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 bg-white rounded-t-lg">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('customers')}
                        className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm transition-colors ${activeTab === 'customers'
                            ? 'border-green-900 text-green-900'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Users className="w-5 h-5 mr-2" />
                        Customer Analytics
                    </button>
                    <button
                        onClick={() => setActiveTab('materials')}
                        className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm transition-colors ${activeTab === 'materials'
                            ? 'border-green-900 text-green-900'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Package className="w-5 h-5 mr-2" />
                        Top Materials
                    </button>
                    <button
                        onClick={() => setActiveTab('ranking')}
                        className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm transition-colors ${activeTab === 'ranking'
                            ? 'border-green-900 text-green-900'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Medal className="w-5 h-5 mr-2" />
                        Materials Ranking
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="space-y-6">
                {activeTab === 'customers' && (
                    <>
                        {/* Customer Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium">Top Customers Analyzed</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(customerStats.totalCustomers)}</p>
                                    </div>
                                    <div className="bg-gray-100 rounded-full p-3">
                                        <Users className="w-6 h-6 text-gray-700" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(customerStats.totalRevenue)}</p>
                                    </div>
                                    <div className="bg-gray-100 rounded-full p-3">
                                        <DollarSign className="w-6 h-6 text-gray-700" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium">Total Profit</p>
                                        <p className={`text-2xl font-bold mt-2 ${getProfitColor(customerStats.totalProfit)}`}>
                                            {formatCurrency(customerStats.totalProfit)}
                                        </p>
                                    </div>
                                    <div className="bg-gray-100 rounded-full p-3">
                                        <TrendingUp className={`w-6 h-6 ${customerStats.totalProfit >= 0 ? 'text-green-900' : 'text-red-600'}`} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium">Avg Profit Margin</p>
                                        <p className={`text-2xl font-bold mt-2 ${getMarginColor(customerStats.avgMargin)}`}>
                                            {customerStats.avgMargin.toFixed(1)}%
                                        </p>
                                    </div>
                                    <div className="bg-gray-100 rounded-full p-3">
                                        <Percent className="w-6 h-6 text-green-900" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top Customers Table */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Top Customers</h2>
                                <p className="text-sm text-gray-600 mt-1">Ranked by {customerCriteriaOptions.find(o => o.value === customerCriteria)?.label}</p>
                            </div>
                            <div className="overflow-x-auto">
                                {loading ? (
                                    <div className="flex justify-center items-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-green-900" />
                                    </div>
                                ) : topCustomers.length === 0 ? (
                                    <div className="p-12 text-center text-gray-500">
                                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                        <p>No customer data available for the selected period</p>
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {topCustomers.map((customer, index) => {
                                                const TierIcon = getCustomerTier(customer.total_revenue).icon;
                                                const tierInfo = getCustomerTier(customer.total_revenue);
                                                return (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                {index === 0 && <Crown className="w-5 h-5 text-yellow-500 mr-2" />}
                                                                <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">{customer.customer.name}</div>
                                                                <div className="text-xs text-gray-500">{customer.customer.phone_number}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <div className="text-sm text-gray-900">{formatNumber(customer.total_sales_count)}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <div className="text-sm text-gray-900">{formatNumber(customer.total_quantity_purchased)}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <div className="text-sm font-semibold text-green-900">{formatCurrency(customer.total_revenue)}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <div className={`text-sm font-medium ${getProfitColor(customer.total_profit)}`}>
                                                                {formatCurrency(customer.total_profit)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <div className={`text-sm font-medium ${getMarginColor(customer.profit_margin)}`}>
                                                                {customer.profit_margin.toFixed(1)}%
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tierInfo.color}`}>
                                                                <TierIcon className="w-3 h-3 mr-1" />
                                                                {tierInfo.name}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <button
                                                                onClick={() => fetchCustomerDetails(customer.customer.id)}
                                                                className="text-green-900 hover:text-green-700 transition-colors"
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-5 h-5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'materials' && (
                    <>
                        {/* Top Materials Table */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Top Selling Materials</h2>
                                <p className="text-sm text-gray-600 mt-1">Based on quantity sold with detailed metrics</p>
                            </div>
                            <div className="overflow-x-auto">
                                {loading ? (
                                    <div className="flex justify-center items-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-green-900" />
                                    </div>
                                ) : topMaterialsDetailed.length === 0 ? (
                                    <div className="p-12 text-center text-gray-500">
                                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                        <p>No material data available for the selected period</p>
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Customers</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Status</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {topMaterialsDetailed.map((material, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            {index === 0 && <Star className="w-5 h-5 text-yellow-500 mr-2" />}
                                                            <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{material.material.name}</div>
                                                            <div className="text-xs text-gray-500">SKU: {material.material.sku} | Unit: {material.material.unit}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="text-sm font-semibold text-gray-900">{formatNumber(material.sales_metrics.total_quantity_sold)}</div>
                                                        <div className="text-xs text-gray-500">Avg {formatNumber(material.quantity_metrics.average_quantity_per_sale)}/sale</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="text-sm font-semibold text-green-900">{formatCurrency(material.sales_metrics.total_revenue)}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className={`text-sm font-medium ${getProfitColor(material.sales_metrics.total_profit)}`}>
                                                            {formatCurrency(material.sales_metrics.total_profit)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className={`text-sm font-medium ${getMarginColor(material.sales_metrics.profit_margin)}`}>
                                                            {material.sales_metrics.profit_margin.toFixed(1)}%
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="text-sm text-gray-900">{formatNumber(material.sales_metrics.number_of_transactions)}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="text-sm text-gray-900">{formatNumber(material.sales_metrics.number_of_unique_customers)}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="text-sm">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${material.inventory_metrics.current_stock <= material.inventory_metrics.reorder_level
                                                                ? 'bg-red-100 text-red-800'
                                                                : material.inventory_metrics.current_stock >= material.inventory_metrics.maximum_stock
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-green-100 text-green-800'
                                                                }`}>
                                                                {formatNumber(material.inventory_metrics.current_stock)} in stock
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Turnover: {material.inventory_metrics.stock_turnover_rate}x
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <button
                                                            onClick={() => fetchMaterialPerformance(material.material.id)}
                                                            className="text-green-900 hover:text-green-700 transition-colors"
                                                            title="View Performance"
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'ranking' && (
                    <>
                        {/* Materials Ranking Table */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Materials Ranking</h2>
                                <p className="text-sm text-gray-600 mt-1">Ranked by {rankingTypes.find(t => t.value === rankingType)?.label}</p>
                            </div>
                            <div className="overflow-x-auto">
                                {loading ? (
                                    <div className="flex justify-center items-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-green-900" />
                                    </div>
                                ) : materialsRanking.length === 0 ? (
                                    <div className="p-12 text-center text-gray-500">
                                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                        <p>No ranking data available for the selected period</p>
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg/Sale</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Customers</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {materialsRanking.map((item) => (
                                                <tr key={item.material.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            {item.rank === 1 && <Medal className="w-5 h-5 text-yellow-500 mr-2" />}
                                                            {item.rank === 2 && <Medal className="w-5 h-5 text-gray-400 mr-2" />}
                                                            {item.rank === 3 && <Medal className="w-5 h-5 text-orange-500 mr-2" />}
                                                            <span className="text-sm font-medium text-gray-900">#{item.rank}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{item.material.name}</div>
                                                            <div className="text-xs text-gray-500">SKU: {item.material.sku}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="text-sm font-semibold text-gray-900">{formatNumber(item.metrics.total_quantity_sold)}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="text-sm font-semibold text-green-900">{formatCurrency(item.metrics.total_revenue)}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className={`text-sm font-medium ${getProfitColor(item.metrics.total_profit)}`}>
                                                            {formatCurrency(item.metrics.total_profit)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className={`text-sm font-medium ${getMarginColor(item.metrics.profit_margin)}`}>
                                                            {item.metrics.profit_margin.toFixed(1)}%
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="text-sm text-gray-900">{formatNumber(item.metrics.number_of_transactions)}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="text-sm text-gray-900">{formatNumber(item.metrics.average_quantity_per_sale)}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="text-sm text-gray-900">{formatNumber(item.metrics.number_of_unique_customers)}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Customer Details Modal */}
            {showCustomerModal && customerDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Customer Details</h2>
                                <p className="text-sm text-gray-600">{customerDetails.customer.name}</p>
                            </div>
                            <button
                                onClick={() => setShowCustomerModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Customer Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600">Total Sales</p>
                                    <p className="text-2xl font-bold text-gray-900">{formatNumber(customerDetails.summary.total_sales_count)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600">Total Revenue</p>
                                    <p className="text-2xl font-bold text-green-900">{formatCurrency(customerDetails.summary.total_revenue)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600">Total Profit</p>
                                    <p className={`text-2xl font-bold ${getProfitColor(customerDetails.summary.total_profit)}`}>
                                        {formatCurrency(customerDetails.summary.total_profit)}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600">Profit Margin</p>
                                    <p className={`text-2xl font-bold ${getMarginColor(customerDetails.summary.profit_margin)}`}>
                                        {customerDetails.summary.profit_margin.toFixed(1)}%
                                    </p>
                                </div>
                            </div>

                            {/* Lifetime Metrics */}
                            <div className="bg-blue-50 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Lifetime Metrics</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-600">Customer Since</p>
                                        <p className="text-sm font-medium">{formatDate(customerDetails.customer.created_at)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">Lifetime Value</p>
                                        <p className="text-sm font-medium">{formatCurrency(customerDetails.lifetime_metrics.lifetime_value)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">Years Active</p>
                                        <p className="text-sm font-medium">{customerDetails.lifetime_metrics.customer_lifetime_years}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">Frequency/Year</p>
                                        <p className="text-sm font-medium">{customerDetails.lifetime_metrics.purchase_frequency_per_year.toFixed(1)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Top Purchased Materials */}
                            {customerDetails.material_purchases && customerDetails.material_purchases.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Most Purchased Materials</h3>
                                    <div className="space-y-2">
                                        {customerDetails.material_purchases.slice(0, 5).map((material, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-900">{material.material__name}</p>
                                                    <p className="text-xs text-gray-500">SKU: {material.material__sku}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-gray-900">{formatNumber(material.total_quantity)} units</p>
                                                    <p className="text-sm text-green-900">{formatCurrency(material.total_revenue)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Material Performance Modal */}
            {showMaterialModal && materialPerformance && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Material Performance</h2>
                                <p className="text-sm text-gray-600">{materialPerformance.material.name}</p>
                            </div>
                            <button
                                onClick={() => setShowMaterialModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Year Comparison */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">{materialPerformance.performance_comparison.current_year.year}</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Quantity Sold:</span>
                                            <span className="font-medium">{formatNumber(materialPerformance.performance_comparison.current_year.total_quantity)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Revenue:</span>
                                            <span className="font-medium text-green-900">{formatCurrency(materialPerformance.performance_comparison.current_year.total_revenue)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Profit:</span>
                                            <span className={`font-medium ${getProfitColor(materialPerformance.performance_comparison.current_year.total_profit)}`}>
                                                {formatCurrency(materialPerformance.performance_comparison.current_year.total_profit)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Transactions:</span>
                                            <span className="font-medium">{formatNumber(materialPerformance.performance_comparison.current_year.transactions)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">{materialPerformance.performance_comparison.previous_year.year}</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Quantity Sold:</span>
                                            <span className="font-medium">{formatNumber(materialPerformance.performance_comparison.previous_year.total_quantity)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Revenue:</span>
                                            <span className="font-medium text-green-900">{formatCurrency(materialPerformance.performance_comparison.previous_year.total_revenue)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Profit:</span>
                                            <span className={`font-medium ${getProfitColor(materialPerformance.performance_comparison.previous_year.total_profit)}`}>
                                                {formatCurrency(materialPerformance.performance_comparison.previous_year.total_profit)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Transactions:</span>
                                            <span className="font-medium">{formatNumber(materialPerformance.performance_comparison.previous_year.transactions)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Growth Indicators */}
                            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Year-over-Year Growth</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600">Quantity Growth</p>
                                        <p className={`text-xl font-bold ${materialPerformance.performance_comparison.growth_percentages.quantity >= 0 ? 'text-green-900' : 'text-red-600'}`}>
                                            {materialPerformance.performance_comparison.growth_percentages.quantity >= 0 ? '+' : ''}
                                            {materialPerformance.performance_comparison.growth_percentages.quantity.toFixed(1)}%
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600">Revenue Growth</p>
                                        <p className={`text-xl font-bold ${materialPerformance.performance_comparison.growth_percentages.revenue >= 0 ? 'text-green-900' : 'text-red-600'}`}>
                                            {materialPerformance.performance_comparison.growth_percentages.revenue >= 0 ? '+' : ''}
                                            {materialPerformance.performance_comparison.growth_percentages.revenue.toFixed(1)}%
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600">Profit Growth</p>
                                        <p className={`text-xl font-bold ${materialPerformance.performance_comparison.growth_percentages.profit >= 0 ? 'text-green-900' : 'text-red-600'}`}>
                                            {materialPerformance.performance_comparison.growth_percentages.profit >= 0 ? '+' : ''}
                                            {materialPerformance.performance_comparison.growth_percentages.profit.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Top Customers for this Material */}
                            {materialPerformance.top_customer_segments && materialPerformance.top_customer_segments.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Top Customers for this Material</h3>
                                    <div className="space-y-2">
                                        {materialPerformance.top_customer_segments.map((customer, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-900">{customer.sale__customer__name}</p>
                                                    <p className="text-xs text-gray-500">{customer.sale__customer__phone_number}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-gray-900">{formatNumber(customer.total_quantity)} units</p>
                                                    <p className="text-sm text-green-900">{formatCurrency(customer.total_revenue)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}