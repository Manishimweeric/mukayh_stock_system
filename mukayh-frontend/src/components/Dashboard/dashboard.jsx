import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    TrendingUp, TrendingDown, Package, DollarSign, ShoppingCart,
    AlertCircle, Truck, Users, ArrowUp, ArrowDown, Calendar,
    RefreshCw, Eye, Download, Printer, ChevronRight,
    Activity, BarChart, PieChart, Clock, CheckCircle, XCircle,
    Zap, Target, Award, Star, MessageCircle, Bell, Info
} from 'lucide-react';
import { toast } from 'react-toastify';
import { dashboardService } from '../../api';

const DashboardPage = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        inventory: {
            total_materials: 0,
            inventory_cost: 0,
            inventory_value: 0,
            potential_profit: 0,
            low_stock_count: 0,
            overstock_count: 0
        },
        sales: {
            total_sales: 0,
            total_revenue: 0,
            total_profit: 0,
            avg_profit_margin: 0
        },
        alerts: {
            active_alerts: 0
        },
        stock_movements: {
            total_in: 0,
            total_out: 0
        },
        top_materials: [],
        top_customers: [],
        supplier_orders: {
            pending_orders: 0,
            delivered_orders: 0
        },
        monthly_sales_trend: [],
        stock_value_trend: []
    });

    const [lastUpdated, setLastUpdated] = useState(new Date());

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const result = await dashboardService.getDashboardSummary();
            if (result.success) {
                setStats(result.data);
                setLastUpdated(new Date());
                console.log('Dashboard data loaded:', result.data);
            } else {
                toast.error('Failed to load dashboard data');
            }
        } catch (error) {
            console.error('Error fetching dashboard:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('rw-RW', {
            style: 'currency',
            currency: 'RWF',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Math.round(amount || 0));
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat().format(Math.round(num || 0));
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">


            <div className="">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Inventory Value</p>
                                <p className="text-2xl font-bold text-gray-900 mt-2">
                                    {formatCurrency(stats.inventory.inventory_value)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Cost: {formatCurrency(stats.inventory.inventory_cost)}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Package className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Potential Profit</span>
                                <span className="font-semibold text-green-600">
                                    {formatCurrency(stats.inventory.potential_profit)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Revenue Card */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Monthly Revenue</p>
                                <p className="text-2xl font-bold text-gray-900 mt-2">
                                    {formatCurrency(stats.sales.total_revenue)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Profit: {formatCurrency(stats.sales.total_profit)}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Profit Margin</span>
                                <span className="font-semibold text-green-600">
                                    {stats.sales.avg_profit_margin}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Stock Status</p>
                                <div className="flex items-center space-x-4 mt-2">
                                    <div>
                                        <p className="text-2xl font-bold text-yellow-600">
                                            {stats.inventory.low_stock_count}
                                        </p>
                                        <p className="text-xs text-gray-500">Low Stock</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-red-600">
                                            {stats.inventory.overstock_count}
                                        </p>
                                        <p className="text-xs text-gray-500">Overstock</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <Link to="/inventory/items/low-stock" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                                View Alerts
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                    </div>

                    {/* Orders Card */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Supplier Orders</p>
                                <div className="flex items-center space-x-4 mt-2">
                                    <div>
                                        <p className="text-2xl font-bold text-orange-600">
                                            {stats.supplier_orders.pending_orders}
                                        </p>
                                        <p className="text-xs text-gray-500">Pending</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-green-600">
                                            {stats.supplier_orders.delivered_orders}
                                        </p>
                                        <p className="text-xs text-gray-500">Delivered</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Truck className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <Link to="/inventory/supplier-orders/list" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                                Manage Orders
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Additional Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-700 font-medium">Total Materials</p>
                                <p className="text-3xl font-bold text-blue-900 mt-2">
                                    {formatNumber(stats.inventory.total_materials)}
                                </p>
                            </div>
                            <Package className="w-10 h-10 text-blue-600 opacity-50" />
                        </div>
                        <div className="mt-2">
                            <p className="text-xs text-blue-600">Active materials in inventory</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-700 font-medium">Stock Movement</p>
                                <div className="flex items-center space-x-4 mt-2">
                                    <div className="flex items-center">
                                        <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
                                        <span className="text-xl font-bold text-green-900">
                                            {formatNumber(stats.stock_movements.total_in)}
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <ArrowDown className="w-4 h-4 text-red-600 mr-1" />
                                        <span className="text-xl font-bold text-red-900">
                                            {formatNumber(stats.stock_movements.total_out)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Activity className="w-10 h-10 text-green-600 opacity-50" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-purple-700 font-medium">Active Alerts</p>
                                <p className="text-3xl font-bold text-purple-900 mt-2">
                                    {stats.alerts.active_alerts}
                                </p>
                            </div>
                            <Bell className="w-10 h-10 text-purple-600 opacity-50" />
                        </div>
                        <div className="mt-2">
                            <p className="text-xs text-purple-600">Requires attention</p>
                        </div>
                    </div>
                </div>

                {/* Charts and Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Monthly Sales Trend */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                                Monthly Sales Trend
                            </h3>
                        </div>
                        <div className="p-6">
                            {stats.monthly_sales_trend && stats.monthly_sales_trend.length > 0 ? (
                                <div className="space-y-4">
                                    {stats.monthly_sales_trend.map((month, index) => (
                                        <div key={index} className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">{formatDate(month.month)}</span>
                                                <span className="font-medium text-gray-900">
                                                    {formatCurrency(month.total_revenue)}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-green-600 rounded-full h-2 transition-all duration-500"
                                                    style={{
                                                        width: `${Math.min(100, (month.total_revenue / Math.max(...stats.monthly_sales_trend.map(m => m.total_revenue), 1)) * 100)}%`
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>Profit: {formatCurrency(month.total_profit)}</span>
                                                <span>Margin: {month.total_revenue > 0 ? ((month.total_profit / month.total_revenue) * 100).toFixed(1) : 0}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <BarChart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500">No sales data available</p>
                                    <p className="text-xs text-gray-400 mt-2">Sales will appear here once you make your first sale</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Selling Materials */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <Star className="w-5 h-5 mr-2 text-yellow-600" />
                                Top Selling Materials
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {stats.top_materials && stats.top_materials.length > 0 ? (
                                stats.top_materials.map((material, index) => (
                                    <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p className="font-medium text-gray-900">{material.material__name}</p>
                                                <p className="text-xs text-gray-500">SKU: {material.material__sku}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900">{formatNumber(material.total_quantity)} units</p>
                                                <p className="text-sm text-green-600">{formatCurrency(material.total_revenue)}</p>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div
                                                className="bg-blue-600 rounded-full h-1.5"
                                                style={{
                                                    width: `${(material.total_quantity / (stats.top_materials[0]?.total_quantity || 1)) * 100}%`
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500">No sales data available</p>
                                    <p className="text-xs text-gray-400 mt-2">Top selling materials will appear here once you make sales</p>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                            <Link to="/inventory/sales/list" className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-end">
                                View All Sales
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top Customers */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <Users className="w-5 h-5 mr-2 text-blue-600" />
                                Top Customers
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {stats.top_customers && stats.top_customers.length > 0 ? (
                                stats.top_customers.map((customer, index) => (
                                    <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-semibold text-gray-400">#{index + 1}</span>
                                                    <p className="font-medium text-gray-900">{customer.customer__name}</p>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">{customer.customer__phone_number}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-green-600">{formatCurrency(customer.total_revenue)}</p>
                                                <p className="text-xs text-gray-500">{customer.total_sales} purchases</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500">No customer data available</p>
                                    <p className="text-xs text-gray-400 mt-2">Top customers will appear here once you make sales</p>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                            <Link to="/inventory/customers/list" className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-end">
                                View All Customers
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                    </div>

                    {/* Stock Movement Trend */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <Activity className="w-5 h-5 mr-2 text-purple-600" />
                                Stock Movement Trend
                            </h3>
                        </div>
                        <div className="p-6">
                            {stats.stock_value_trend && stats.stock_value_trend.length > 0 ? (
                                <div className="space-y-3">
                                    {stats.stock_value_trend.slice(0, 7).map((day, index) => {
                                        const maxTotal = Math.max(...stats.stock_value_trend.map(d => (d.stock_in || 0) + (d.stock_out || 0)), 1);
                                        const inPercentage = ((day.stock_in || 0) / maxTotal) * 100;
                                        const outPercentage = ((day.stock_out || 0) / maxTotal) * 100;

                                        return (
                                            <div key={index} className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600 w-24">{formatDate(day.day)}</span>
                                                <div className="flex-1 mx-4">
                                                    <div className="flex space-x-1">
                                                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className="bg-green-500 rounded-full h-2 transition-all"
                                                                style={{ width: `${inPercentage}%` }}
                                                            ></div>
                                                        </div>
                                                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className="bg-red-500 rounded-full h-2 transition-all"
                                                                style={{ width: `${outPercentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right w-20">
                                                    <span className="text-green-600 text-xs">+{formatNumber(day.stock_in || 0)}</span>
                                                    <span className="text-gray-400 mx-1">/</span>
                                                    <span className="text-red-600 text-xs">-{formatNumber(day.stock_out || 0)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500">No stock movement data available</p>
                                    <p className="text-xs text-gray-400 mt-2">Stock movements will appear here when items are added or sold</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
};

export default DashboardPage;