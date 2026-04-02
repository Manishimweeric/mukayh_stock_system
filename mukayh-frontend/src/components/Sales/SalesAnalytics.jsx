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
    Receipt,
    TrendingUp as TrendingUpIcon,
    Award,
    Clock,
    ChevronDown,
    ChevronUp,
    Eye,
    Star,
    Zap
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

export default function SalesAnalytics() {
    const [loading, setLoading] = useState(false);
    const [topMaterials, setTopMaterials] = useState([]);
    const [dailySales, setDailySales] = useState([]);
    const [selectedYear, setSelectedYear] = useState(getCurrentYear());
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedDays, setSelectedDays] = useState(30);
    const [showTopMaterials, setShowTopMaterials] = useState(true);
    const [showDailySales, setShowDailySales] = useState(true);

    const years = Array.from({ length: 5 }, (_, i) => getCurrentYear() - i);
    const daysOptions = [7, 14, 30, 60, 90];

    useEffect(() => {
        fetchTopMaterials();
        fetchDailySales();
    }, [selectedYear, selectedSession, selectedDays]);

    const fetchTopMaterials = async () => {
        try {
            const params = { year: selectedYear, limit: 10 };
            if (selectedSession) {
                params.session = selectedSession;
            }

            const result = await saleService.getTopSellingMaterials(params);
            if (result.success) {
                setTopMaterials(result.data);
            } else {
                toast.error(result.message || 'Failed to load top selling materials');
            }
        } catch (error) {
            console.error('Error fetching top materials:', error);
            toast.error('Network error. Could not load top selling materials.');
        }
    };

    const fetchDailySales = async () => {
        try {
            const params = { days: selectedDays };
            const result = await saleService.getDailySales(params);
            if (result.success) {
                setDailySales(result.data);
            } else {
                toast.error(result.message || 'Failed to load daily sales');
            }
        } catch (error) {
            console.error('Error fetching daily sales:', error);
            toast.error('Network error. Could not load daily sales.');
        }
    };

    const handleRefresh = () => {
        setLoading(true);
        Promise.all([fetchTopMaterials(), fetchDailySales()]).finally(() => {
            setLoading(false);
        });
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

    const calculateTotals = () => {
        const totalRevenue = dailySales.reduce((sum, day) => sum + (day.revenue || 0), 0);
        const totalProfit = dailySales.reduce((sum, day) => sum + (day.profit || 0), 0);
        const totalSales = dailySales.reduce((sum, day) => sum + (day.count || 0), 0);
        const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;

        return { totalRevenue, totalProfit, totalSales, averageMargin };
    };

    const totals = calculateTotals();

    return (
        <div className="space-y-6 ">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <BarChart3 className="w-6 h-6 mr-3 text-green-900" />
                        Sales Analytics
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Track top selling products and daily sales performance
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
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
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
                            Session
                        </label>
                        <div className="relative">
                            <div className="absolute left-3 top-3 text-gray-400">
                                <Receipt className="w-5 h-5" />
                            </div>
                            <select
                                value={selectedSession}
                                onChange={(e) => setSelectedSession(e.target.value)}
                                className="w-48 pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-900/20 focus:border-green-900 text-gray-900"
                            >
                                <option value="">All Sessions</option>
                                <option value="1">Session 1 (Jan - Apr)</option>
                                <option value="2">Session 2 (May - Aug)</option>
                                <option value="3">Session 3 (Sep - Dec)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Days
                        </label>
                        <div className="relative">
                            <div className="absolute left-3 top-3 text-gray-400">
                                <Clock className="w-5 h-5" />
                            </div>
                            <select
                                value={selectedDays}
                                onChange={(e) => setSelectedDays(parseInt(e.target.value))}
                                className="w-32 pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-900/20 focus:border-green-900 text-gray-900"
                            >
                                {daysOptions.map(days => (
                                    <option key={days} value={days}>{days} Days</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedSession && (
                        <div className="flex items-center text-sm text-green-900 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                            <span>Filtering by Session {selectedSession}, {selectedYear}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Total Sales</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(totals.totalSales)}</p>
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
                            <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(totals.totalRevenue)}</p>
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
                            <p className={`text-2xl font-bold mt-2 ${getProfitColor(totals.totalProfit)}`}>
                                {formatCurrency(totals.totalProfit)}
                            </p>
                        </div>
                        <div className="bg-gray-100 rounded-full p-3">
                            <TrendingUpIcon className={`w-6 h-6 ${totals.totalProfit >= 0 ? 'text-green-900' : 'text-red-600'}`} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Avg Profit Margin</p>
                            <p className={`text-2xl font-bold mt-2 ${getMarginColor(totals.averageMargin)}`}>
                                {totals.averageMargin.toFixed(1)}%
                            </p>
                        </div>
                        <div className="bg-gray-100 rounded-full p-3">
                            <Zap className="w-6 h-6 text-green-900" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
                <button
                    onClick={() => setShowTopMaterials(!showTopMaterials)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-green-900" />
                        <h2 className="text-lg font-semibold text-gray-900">Top Selling Materials</h2>
                        <span className="text-sm text-gray-500">(Based on quantity sold)</span>
                    </div>
                    {showTopMaterials ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                </button>

                {showTopMaterials && (
                    <div className="border-t border-gray-200">
                        {topMaterials.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                <p>No sales data available for the selected period</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Count</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {topMaterials.map((material, index) => (
                                            <tr key={material.material_id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {index === 0 && <Star className="w-5 h-5 text-yellow-500 mr-2" />}
                                                        <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{material.material_name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-sm text-gray-600">{material.material_sku}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-sm font-semibold text-gray-900">{formatNumber(material.total_quantity_sold)}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-sm text-green-900">{formatCurrency(material.total_revenue)}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className={`text-sm font-medium ${getProfitColor(material.total_profit)}`}>
                                                        {formatCurrency(material.total_profit)}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-sm text-gray-600">{formatNumber(material.number_of_sales)}</div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
                <button
                    onClick={() => setShowDailySales(!showDailySales)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-green-900" />
                        <h2 className="text-lg font-semibold text-gray-900">Daily Sales Performance</h2>
                        <span className="text-sm text-gray-500">(Last {selectedDays} days)</span>
                    </div>
                    {showDailySales ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                </button>

                {showDailySales && (
                    <div className="border-t border-gray-200">
                        {dailySales.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                <p>No sales data available for the selected period</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Count</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {dailySales.map((day, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{formatDate(day.date)}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-sm text-gray-900">{formatNumber(day.count)}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-sm text-green-900">{formatCurrency(day.revenue)}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-sm text-gray-600">{formatCurrency(day.cost)}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className={`text-sm font-medium ${getProfitColor(day.profit)}`}>
                                                        {formatCurrency(day.profit)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className={`text-sm font-medium ${getMarginColor(day.margin)}`}>
                                                        {day.margin?.toFixed(1)}%
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50">
                                        <tr>
                                            <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">Totals:</td>
                                            <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                                                {formatNumber(totals.totalSales)}
                                            </td>
                                            <td className="px-6 py-3 text-right text-sm font-bold text-green-900">
                                                {formatCurrency(totals.totalRevenue)}
                                            </td>
                                            <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                                                {formatCurrency(dailySales.reduce((sum, day) => sum + (day.cost || 0), 0))}
                                            </td>
                                            <td className="px-6 py-3 text-right text-sm font-bold text-green-900">
                                                {formatCurrency(totals.totalProfit)}
                                            </td>
                                            <td className="px-6 py-3 text-right text-sm font-bold text-green-900">
                                                {totals.averageMargin.toFixed(1)}%
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}