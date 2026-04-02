import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    TrendingUp, TrendingDown, Package, DollarSign, AlertCircle,
    RefreshCw, ChevronRight, Activity, BarChart, PieChart,
    Clock, CheckCircle, XCircle, Zap, Target, Award, Star,
    Flame, ThumbsUp, ThumbsDown, Minus, Calendar, Filter,
    Download, Printer, Eye, MessageCircle, Lightbulb,
    AlertTriangle, ShoppingCart, Truck, Users, Settings,
    Trophy, Medal, Crown
} from 'lucide-react';
import { toast } from 'react-toastify';
import { productService, customerService } from '../../api';

const ProductAnalyticsPage = () => {
    const [loading, setLoading] = useState(true);
    const [topSelling, setTopSelling] = useState([]);
    const [movementAnalysis, setMovementAnalysis] = useState([]);
    const [recommendations, setRecommendations] = useState({
        low_stock: [],
        overstock: [],
        high_margin_low_sales: []
    });
    const [expiredNotifications, setExpiredNotifications] = useState({
        expired_products: [],
        soon_to_expire_products: []
    });
    const [topCustomers, setTopCustomers] = useState([]);
    const [customerCriteria, setCustomerCriteria] = useState('total_revenue');
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [dateRange, setDateRange] = useState({
        start_date: '',
        end_date: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    useEffect(() => {
        fetchAllData();
    }, [customerCriteria]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [topSellingRes, movementRes, recommendationsRes, expiredRes, topCustomersRes] = await Promise.all([
                productService.getTopSellingMaterials({ limit: 10 }),
                productService.getMaterialMovementAnalysis(),
                productService.getSystemRecommendations(),
                productService.getExpiredProductsNotification(),
                productService.getTopCustomers({ limit: 5, criteria: customerCriteria })
            ]);

            if (topSellingRes.success) {
                setTopSelling(topSellingRes.data);
            }

            if (movementRes.success) {
                setMovementAnalysis(movementRes.data);
            }

            if (recommendationsRes.success) {
                setRecommendations(recommendationsRes.data);
            }

            if (expiredRes.success) {
                setExpiredNotifications(expiredRes.data);
            }

            if (topCustomersRes.success) {
                setTopCustomers(topCustomersRes.data);
            }

            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Failed to load analytics data');
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
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    const getRankIcon = (index) => {
        switch (index) {
            case 0:
                return <Crown className="w-5 h-5 text-yellow-500" />;
            case 1:
                return <Medal className="w-5 h-5 text-gray-400" />;
            case 2:
                return <Medal className="w-5 h-5 text-amber-600" />;
            default:
                return <Trophy className="w-5 h-5 text-blue-400" />;
        }
    };

    const getRankColor = (index) => {
        switch (index) {
            case 0:
                return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
            case 1:
                return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
            case 2:
                return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200';
            default:
                return 'bg-white';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 font-medium">Loading product analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="">
                {(expiredNotifications.expired_products.length > 0 || expiredNotifications.soon_to_expire_products.length > 0) && (
                    <div className="mb-8">
                        {expiredNotifications.expired_products.length > 0 && (
                            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-4">
                                <div className="flex items-start">
                                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-red-800">Expired Products</h3>
                                        <p className="text-sm text-red-700 mt-1">
                                            {expiredNotifications.expired_products.length} product(s) have expired and need immediate attention.
                                        </p>
                                        <div className="mt-2 space-y-1">
                                            {expiredNotifications.expired_products.slice(0, 3).map((product, idx) => (
                                                <p key={idx} className="text-xs text-red-600">
                                                    • {product.name} (SKU: {product.sku}) - Expired on {formatDate(product.expiry_date)}
                                                </p>
                                            ))}
                                            {expiredNotifications.expired_products.length > 3 && (
                                                <p className="text-xs text-red-600">And {expiredNotifications.expired_products.length - 3} more...</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {expiredNotifications.soon_to_expire_products.length > 0 && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
                                <div className="flex items-start">
                                    <Clock className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-yellow-800">Soon-to-Expire Products</h3>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            {expiredNotifications.soon_to_expire_products.length} product(s) will expire within the next 30 days.
                                        </p>
                                        <div className="mt-2 space-y-1">
                                            {expiredNotifications.soon_to_expire_products.slice(0, 3).map((product, idx) => (
                                                <p key={idx} className="text-xs text-yellow-600">
                                                    • {product.name} (SKU: {product.sku}) - Expires on {formatDate(product.expiry_date)}
                                                </p>
                                            ))}
                                            {expiredNotifications.soon_to_expire_products.length > 3 && (
                                                <p className="text-xs text-yellow-600">And {expiredNotifications.soon_to_expire_products.length - 3} more...</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Star className="w-5 h-5 mr-2 text-yellow-600" />
                            Top Selling Products
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Most purchased products based on quantity sold
                        </p>
                    </div>
                    <div className="p-6">
                        {topSelling.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {topSelling.map((product, index) => (
                                    <div key={index} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{product.material__name}</p>
                                                    <p className="text-xs text-gray-500">{product.material__sku}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-gray-900">{formatNumber(product.total_quantity)}</p>
                                                <p className="text-xs text-gray-500">units sold</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-500">No sales data available</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Activity className="w-5 h-5 mr-2 text-purple-600" />
                            Product Movement Analysis
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Products categorized by demand and movement
                        </p>
                    </div>
                    <div className="p-6">
                        {movementAnalysis.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-green-50 px-4 py-3 border-b">
                                        <h3 className="font-semibold text-green-800 flex items-center">
                                            <Flame className="w-4 h-4 mr-2" />
                                            High Demand
                                        </h3>
                                    </div>
                                    <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                                        {movementAnalysis.filter(m => m.movement_category === 'GOOD').length > 0 ? (
                                            movementAnalysis.filter(m => m.movement_category === 'GOOD').map((product, idx) => (
                                                <div key={idx} className="p-3 hover:bg-gray-50">
                                                    <p className="font-medium text-gray-900 text-sm">{product.material__name}</p>
                                                    <p className="text-xs text-gray-500">SKU: {product.material__sku}</p>
                                                    <p className="text-xs text-green-600 mt-1">{formatNumber(product.total_quantity)} units sold</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-gray-500 text-sm">No high demand products</div>
                                        )}
                                    </div>
                                </div>

                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-yellow-50 px-4 py-3 border-b">
                                        <h3 className="font-semibold text-yellow-800 flex items-center">
                                            <Minus className="w-4 h-4 mr-2" />
                                            Medium Demand
                                        </h3>
                                    </div>
                                    <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                                        {movementAnalysis.filter(m => m.movement_category === 'MEDIUM').length > 0 ? (
                                            movementAnalysis.filter(m => m.movement_category === 'MEDIUM').map((product, idx) => (
                                                <div key={idx} className="p-3 hover:bg-gray-50">
                                                    <p className="font-medium text-gray-900 text-sm">{product.material__name}</p>
                                                    <p className="text-xs text-gray-500">SKU: {product.material__sku}</p>
                                                    <p className="text-xs text-yellow-600 mt-1">{formatNumber(product.total_quantity)} units sold</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-gray-500 text-sm">No medium demand products</div>
                                        )}
                                    </div>
                                </div>

                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-red-50 px-4 py-3 border-b">
                                        <h3 className="font-semibold text-red-800 flex items-center">
                                            <AlertTriangle className="w-4 h-4 mr-2" />
                                            Low Demand
                                        </h3>
                                    </div>
                                    <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                                        {movementAnalysis.filter(m => m.movement_category === 'POOR').length > 0 ? (
                                            movementAnalysis.filter(m => m.movement_category === 'POOR').map((product, idx) => (
                                                <div key={idx} className="p-3 hover:bg-gray-50">
                                                    <p className="font-medium text-gray-900 text-sm">{product.material__name}</p>
                                                    <p className="text-xs text-gray-500">SKU: {product.material__sku}</p>
                                                    <p className="text-xs text-red-600 mt-1">{formatNumber(product.total_quantity)} units sold</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-gray-500 text-sm">No low demand products</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-500">No movement data available</p>
                                <p className="text-xs text-gray-400 mt-2">Product movement analysis will appear here once you have sales data</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                                    Top Customers
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Most valuable customers based on performance
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <label className="text-sm text-gray-600">Sort by:</label>
                                <select
                                    value={customerCriteria}
                                    onChange={(e) => setCustomerCriteria(e.target.value)}
                                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="total_revenue">Total Revenue</option>
                                    <option value="total_profit">Total Profit</option>
                                    <option value="total_sales_count">Number of Sales</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        {topCustomers.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {topCustomers.map((customerData, index) => (
                                    <div
                                        key={index}
                                        className={`border rounded-lg p-4 transition-all hover:shadow-md ${getRankColor(index)}`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                                                    {getRankIcon(index)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{customerData.customer.name}</p>
                                                    <p className="text-xs text-gray-500">{customerData.customer.phone_number}</p>
                                                    {customerData.customer.tin && (
                                                        <p className="text-xs text-gray-400">TIN: {customerData.customer.tin}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-gray-500">Rank</div>
                                                <div className="text-xl font-bold text-gray-900">#{index + 1}</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200">
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500">Total Sales</p>
                                                <p className="text-lg font-semibold text-gray-900">
                                                    {formatNumber(customerData.total_sales_count)}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500">Revenue</p>
                                                <p className="text-lg font-semibold text-green-600">
                                                    {formatCurrency(customerData.total_revenue)}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500">Profit</p>
                                                <p className="text-lg font-semibold text-blue-600">
                                                    {formatCurrency(customerData.total_profit)}
                                                </p>
                                            </div>
                                        </div>


                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-500">No customer data available</p>
                                <p className="text-xs text-gray-400 mt-2">Top customers will appear here once you have sales</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
                            <h3 className="font-semibold text-gray-900 flex items-center">
                                <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
                                Low Stock Alert
                            </h3>
                            <p className="text-xs text-gray-600 mt-1">Products below reorder level</p>
                        </div>
                        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                            {recommendations.low_stock && recommendations.low_stock.length > 0 ? (
                                recommendations.low_stock.map((product, idx) => (
                                    <div key={idx} className="p-4 hover:bg-gray-50">
                                        <p className="font-medium text-gray-900">{product.name}</p>
                                        <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                                        <div className="mt-2 flex justify-between text-sm">
                                            <span className="text-gray-600">Current Stock:</span>
                                            <span className="font-medium text-red-600">{formatNumber(product.current_stock)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Reorder Level:</span>
                                            <span className="font-medium text-orange-600">{formatNumber(product.reorder_level)}</span>
                                        </div>
                                        <Link
                                            to={`/inventory/materials/${product.id}/order`}
                                            className="mt-3 inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                                        >
                                            <Truck className="w-3 h-3 mr-1" />
                                            Create Purchase Order
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center">
                                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                                    <p className="text-gray-500 text-sm">No low stock items</p>
                                    <p className="text-xs text-gray-400 mt-1">All products are well stocked</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
                            <h3 className="font-semibold text-gray-900 flex items-center">
                                <Package className="w-5 h-5 mr-2 text-red-600" />
                                Overstock Alert
                            </h3>
                            <p className="text-xs text-gray-600 mt-1">Products above maximum stock level</p>
                        </div>
                        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                            {recommendations.overstock && recommendations.overstock.length > 0 ? (
                                recommendations.overstock.map((product, idx) => (
                                    <div key={idx} className="p-4 hover:bg-gray-50">
                                        <p className="font-medium text-gray-900">{product.name}</p>
                                        <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                                        <div className="mt-2 flex justify-between text-sm">
                                            <span className="text-gray-600">Current Stock:</span>
                                            <span className="font-medium text-red-600">{formatNumber(product.current_stock)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Maximum Level:</span>
                                            <span className="font-medium text-orange-600">{formatNumber(product.maximum_stock)}</span>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500">
                                            💡 Consider running promotions or discounts to reduce excess stock
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center">
                                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                                    <p className="text-gray-500 text-sm">No overstock items</p>
                                    <p className="text-xs text-gray-400 mt-1">Inventory levels are well managed</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50">
                            <h3 className="font-semibold text-gray-900 flex items-center">
                                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                                High Margin, Low Sales
                            </h3>
                            <p className="text-xs text-gray-600 mt-1">Products with good profit but low movement</p>
                        </div>
                        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                            {recommendations.high_margin_low_sales && recommendations.high_margin_low_sales.length > 0 ? (
                                recommendations.high_margin_low_sales.map((product, idx) => (
                                    <div key={idx} className="p-4 hover:bg-gray-50">
                                        <p className="font-medium text-gray-900">{product.material__name}</p>
                                        <p className="text-xs text-gray-500">SKU: {product.material__sku}</p>
                                        <div className="mt-2 flex justify-between text-sm">
                                            <span className="text-gray-600">Units Sold:</span>
                                            <span className="font-medium text-orange-600">{formatNumber(product.total_quantity)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Profit Margin:</span>
                                            <span className="font-medium text-green-600">{product.profit_margin?.toFixed(1)}%</span>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500">
                                            💡 Increase marketing efforts for this profitable product
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center">
                                    <Lightbulb className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                                    <p className="text-gray-500 text-sm">No opportunities found</p>
                                    <p className="text-xs text-gray-400 mt-1">All high-margin products are selling well</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductAnalyticsPage;