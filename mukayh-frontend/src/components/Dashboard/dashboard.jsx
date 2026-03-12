import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Package, TrendingUp, AlertTriangle, DollarSign,
    Users, Box, Layers, RefreshCw, ChevronRight,
    Activity, Warehouse, FileText, ShoppingCart,
    Calendar, AlertCircle, CheckCircle
} from 'lucide-react';
import { dashboardService } from '../../api';
import { toast } from 'react-toastify';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        setLoading(true);
        try {
            const result = await dashboardService.getDashboardStats();
            if (result.success) {
                setStats(result.data);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            toast.error('Failed to load dashboard statistics');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('rw-RW', {
            style: 'currency',
            currency: 'RWF',
            currencyDisplay: 'symbol',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Math.round(amount || 0));
    };
    const formatNumber = (value) => {
        return new Intl.NumberFormat('en-US').format(value);
    };

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Total Materials</p>
                            {loading ? (
                                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-2"></div>
                            ) : (
                                <div className="flex items-end mt-2">
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        {formatNumber(stats?.total_materials || 0)}
                                    </h3>
                                </div>
                            )}
                        </div>
                        <div className="p-3 rounded-lg bg-blue-50">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Total Stock Value</p>
                            {loading ? (
                                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-2"></div>
                            ) : (
                                <div className="flex items-end mt-2">
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(stats?.total_stock_value || 0)}
                                    </h3>
                                </div>
                            )}
                        </div>
                        <div className="p-3 rounded-lg bg-green-50">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Today's Movements</p>
                            {loading ? (
                                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-2"></div>
                            ) : (
                                <div className="flex items-end mt-2">
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        {formatNumber(stats?.todays_movements || 0)}
                                    </h3>
                                </div>
                            )}
                        </div>
                        <div className="p-3 rounded-lg bg-purple-50">
                            <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Active Alerts</p>
                            {loading ? (
                                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-2"></div>
                            ) : (
                                <div className="flex items-end mt-2">
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        {formatNumber(stats?.active_alerts || 0)}
                                    </h3>
                                </div>
                            )}
                        </div>
                        <div className="p-3 rounded-lg bg-red-50">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                            Low Stock Items
                        </h2>
                        <Link
                            to="/inventory/alerts?type=low_stock"
                            className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            View All
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>
                    <div className="flex items-center">
                        <div className="flex-1">
                            {loading ? (
                                <div className="h-12 w-32 bg-gray-200 rounded animate-pulse"></div>
                            ) : (
                                <>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {formatNumber(stats?.low_stock_count || 0)}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Items below reorder level
                                    </p>
                                </>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Attention Needed
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center">
                            <Box className="w-5 h-5 mr-2 text-yellow-600" />
                            Overstock Items
                        </h2>
                        <Link
                            to="/inventory/alerts?type=overstock"
                            className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            View All
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>
                    <div className="flex items-center">
                        <div className="flex-1">
                            {loading ? (
                                <div className="h-12 w-32 bg-gray-200 rounded animate-pulse"></div>
                            ) : (
                                <>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {formatNumber(stats?.overstock_count || 0)}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Items above maximum stock
                                    </p>
                                </>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                Review Needed
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center">
                            <Layers className="w-5 h-5 mr-2 text-blue-500" />
                            Total Categories
                        </h3>
                    </div>
                    <div className="text-center">
                        {loading ? (
                            <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto animate-pulse"></div>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                                    <span className="text-2xl font-bold text-blue-600">
                                        {formatNumber(stats?.total_categories || 0)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-3">Material categories</p>
                            </>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center">
                            <Users className="w-5 h-5 mr-2 text-green-500" />
                            Active Suppliers
                        </h3>
                    </div>
                    <div className="text-center">
                        {loading ? (
                            <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto animate-pulse"></div>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                    <span className="text-2xl font-bold text-green-600">
                                        {formatNumber(stats?.total_suppliers || 0)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-3">Active suppliers</p>
                            </>
                        )}
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h3>
                    <div className="space-y-4">
                        <Link
                            to="/inventory/items/list"
                            className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <div className="flex items-center">
                                <Package className="w-5 h-5 text-blue-600 mr-3" />
                                <span className="font-medium text-gray-900">Manage Materials</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Link>

                        <Link
                            to="/inventory/stock/movement/list"
                            className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <div className="flex items-center">
                                <TrendingUp className="w-5 h-5 text-purple-600 mr-3" />
                                <span className="font-medium text-gray-900">Stock Movements</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Link>

                        <Link
                            to="/inventory/alerts"
                            className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <div className="flex items-center">
                                <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                                <span className="font-medium text-gray-900">View All Alerts</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Link>


                    </div>
                </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Inventory Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                        <div className="text-sm text-gray-600 mb-2">Materials Value</div>
                        {loading ? (
                            <div className="h-8 w-32 bg-gray-200 rounded mx-auto animate-pulse"></div>
                        ) : (
                            <div className="text-2xl font-bold text-gray-900">
                                {formatCurrency(stats?.total_stock_value || 0)}
                            </div>
                        )}
                    </div>

                    <div className="text-center">
                        <div className="text-sm text-gray-600 mb-2">Total Materials</div>
                        {loading ? (
                            <div className="h-8 w-32 bg-gray-200 rounded mx-auto animate-pulse"></div>
                        ) : (
                            <div className="text-2xl font-bold text-gray-900">
                                {formatNumber(stats?.total_materials || 0)}
                            </div>
                        )}
                    </div>

                    <div className="text-center">
                        <div className="text-sm text-gray-600 mb-2">Active Alerts</div>
                        {loading ? (
                            <div className="h-8 w-32 bg-gray-200 rounded mx-auto animate-pulse"></div>
                        ) : (
                            <div className="text-2xl font-bold text-gray-900">
                                {formatNumber(stats?.active_alerts || 0)}
                            </div>
                        )}
                    </div>

                    <div className="text-center">
                        <div className="text-sm text-gray-600 mb-2">Today's Activity</div>
                        {loading ? (
                            <div className="h-8 w-32 bg-gray-200 rounded mx-auto animate-pulse"></div>
                        ) : (
                            <div className="text-2xl font-bold text-gray-900">
                                {formatNumber(stats?.todays_movements || 0)} movements
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;