import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Package,
    PieChart,
    Calendar,
    BarChart3,
    ArrowLeft,
    RefreshCw,
    Loader2,
    Receipt,
    CreditCard,
    Wallet,
    Percent,
    Activity,
    Award,
    ChevronDown,
    ChevronUp
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

const getCurrentYear = () => {
    return new Date().getFullYear();
};

const getCurrentSession = () => {
    const month = new Date().getMonth() + 1;
    if (month >= 1 && month <= 4) return 1;
    if (month >= 5 && month <= 8) return 2;
    return 3;
};

export default function SalesSummary() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState(null);
    const [selectedYear, setSelectedYear] = useState(getCurrentYear());
    const [selectedSession, setSelectedSession] = useState('');
    const [showSessionDetails, setShowSessionDetails] = useState(true);

    const years = Array.from({ length: 5 }, (_, i) => getCurrentYear() - i);

    useEffect(() => {
        fetchSummary();
    }, [selectedYear, selectedSession]);

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const params = { year: selectedYear };
            if (selectedSession) {
                params.session = selectedSession;
            }

            const result = await saleService.getSalesSummary(params);
            if (result.success) {
                setSummary(result.data);
            } else {
                toast.error(result.message || 'Failed to load sales summary');
            }
        } catch (error) {
            console.error('Error fetching summary:', error);
            toast.error('Network error. Could not load sales summary.');
        } finally {
            setLoading(false);
        }
    };

    const handleYearChange = (year) => {
        setSelectedYear(year);
        setSelectedSession('');
    };

    const handleSessionChange = (session) => {
        setSelectedSession(session);
    };

    const getProfitColor = (profit) => {
        if (profit > 0) return 'text-green-900';
        if (profit < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    const getMarginColor = (margin) => {
        if (margin >= 20) return 'text-green-900';
        if (margin >= 10) return 'text-green-800';
        if (margin > 0) return 'text-green-700';
        return 'text-red-600';
    };

    if (loading && !summary) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-green-900 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 text-lg">Loading sales summary...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 ">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <BarChart3 className="w-6 h-6 mr-3 text-green-900" />
                        Sales Summary
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Overview of sales performance and profitability
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={fetchSummary}
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

                    <Link
                        to="/inventory/sales/list"
                        className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Sales
                    </Link>
                </div>
            </div>

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
                                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                                className="w-40 pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-900/20 focus:border-green-900 text-gray-900"
                            >
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Session (Optional)
                        </label>
                        <div className="relative">
                            <div className="absolute left-3 top-3 text-gray-400">
                                <Receipt className="w-5 h-5" />
                            </div>
                            <select
                                value={selectedSession}
                                onChange={(e) => handleSessionChange(e.target.value)}
                                className="w-48 pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-900/20 focus:border-green-900 text-gray-900"
                            >
                                <option value="">All Sessions</option>
                                <option value="1">Session 1 (Jan - Apr)</option>
                                <option value="2">Session 2 (May - Aug)</option>
                                <option value="3">Session 3 (Sep - Dec)</option>
                            </select>
                        </div>
                    </div>

                    {selectedSession && (
                        <div className="flex items-center text-sm text-green-900 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                            <span>Showing data for Session {selectedSession}, {selectedYear}</span>
                        </div>
                    )}
                </div>
            </div>

            {summary && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Total Sales</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(summary.total_sales)}</p>
                                </div>
                                <div className="bg-gray-100 rounded-full p-3">
                                    <Package className="w-6 h-6 text-gray-700" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(summary.total_revenue)}</p>
                                </div>
                                <div className="bg-gray-100 rounded-full p-3">
                                    <DollarSign className="w-6 h-6 text-gray-700" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Total Cost</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(summary.total_cost)}</p>
                                </div>
                                <div className="bg-gray-100 rounded-full p-3">
                                    <Wallet className="w-6 h-6 text-gray-700" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Total Profit</p>
                                    <p className={`text-2xl font-bold mt-2 ${getProfitColor(summary.total_profit)}`}>
                                        {formatCurrency(summary.total_profit)}
                                    </p>
                                    <p className="text-xs mt-1 text-gray-500">
                                        Margin: {summary.average_profit_margin}%
                                    </p>
                                </div>
                                <div className="bg-gray-100 rounded-full p-3">
                                    {summary.total_profit >= 0 ? (
                                        <TrendingUp className="w-6 h-6 text-green-900" />
                                    ) : (
                                        <TrendingDown className="w-6 h-6 text-red-600" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200">
                        <button
                            onClick={() => setShowSessionDetails(!showSessionDetails)}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <PieChart className="w-5 h-5 text-green-900" />
                                <h2 className="text-lg font-semibold text-gray-900">Session Breakdown</h2>
                            </div>
                            {showSessionDetails ? (
                                <ChevronUp className="w-5 h-5 text-gray-500" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                            )}
                        </button>

                        {showSessionDetails && (
                            <div className="border-t border-gray-200">
                                <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Session 1</h3>
                                            <span className="text-sm text-gray-500">Jan - Apr</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Sales Count</span>
                                                <span className="font-semibold text-gray-900">{formatNumber(summary.session_1_sales)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Revenue</span>
                                                <span className="font-semibold text-green-900">{formatCurrency(summary.session_1_revenue)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Profit</span>
                                                <span className={`font-semibold ${getProfitColor(summary.session_1_profit)}`}>
                                                    {formatCurrency(summary.session_1_profit)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Profit Margin</span>
                                                <span className={`font-semibold ${getMarginColor(summary.session_1_margin)}`}>
                                                    {summary.session_1_margin}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Session 2</h3>
                                            <span className="text-sm text-gray-500">May - Aug</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Sales Count</span>
                                                <span className="font-semibold text-gray-900">{formatNumber(summary.session_2_sales)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Revenue</span>
                                                <span className="font-semibold text-green-900">{formatCurrency(summary.session_2_revenue)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Profit</span>
                                                <span className={`font-semibold ${getProfitColor(summary.session_2_profit)}`}>
                                                    {formatCurrency(summary.session_2_profit)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Profit Margin</span>
                                                <span className={`font-semibold ${getMarginColor(summary.session_2_margin)}`}>
                                                    {summary.session_2_margin}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Session 3</h3>
                                            <span className="text-sm text-gray-500">Sep - Dec</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Sales Count</span>
                                                <span className="font-semibold text-gray-900">{formatNumber(summary.session_3_sales)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Revenue</span>
                                                <span className="font-semibold text-green-900">{formatCurrency(summary.session_3_revenue)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Profit</span>
                                                <span className={`font-semibold ${getProfitColor(summary.session_3_profit)}`}>
                                                    {formatCurrency(summary.session_3_profit)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Profit Margin</span>
                                                <span className={`font-semibold ${getMarginColor(summary.session_3_margin)}`}>
                                                    {summary.session_3_margin}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Activity className="w-5 h-5 text-green-900" />
                            <h2 className="text-lg font-semibold text-gray-900">Key Performance Indicators</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Award className="w-4 h-4 text-green-900" />
                                    <span className="text-sm font-medium text-gray-600">Average Profit Margin</span>
                                </div>
                                <p className={`text-2xl font-bold ${getMarginColor(summary.average_profit_margin)}`}>
                                    {summary.average_profit_margin}%
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Overall profitability</p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Percent className="w-4 h-4 text-green-900" />
                                    <span className="text-sm font-medium text-gray-600">Revenue per Sale</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(summary.total_revenue / (summary.total_sales || 1))}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Average transaction value</p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <CreditCard className="w-4 h-4 text-green-900" />
                                    <span className="text-sm font-medium text-gray-600">Profit per Sale</span>
                                </div>
                                <p className={`text-2xl font-bold ${getProfitColor(summary.total_profit)}`}>
                                    {formatCurrency(summary.total_profit / (summary.total_sales || 1))}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Average profit per transaction</p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}