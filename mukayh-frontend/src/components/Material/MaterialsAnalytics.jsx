import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Package, Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
    X, Eye, Calendar, DollarSign, TrendingUp, TrendingDown,
    AlertCircle, Clock, CheckCircle, Download, Percent,
    AlertTriangle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { materialService, categoryService, supplierService } from '../../api';
import MaterialsAnalyticsPDFGenerator from '../Reports/MaterialsAnalyticsPDFGenerator';

const MaterialsAnalyticsPage = () => {
    const [materials, setMaterials] = useState([]);
    const [filteredMaterials, setFilteredMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [showFilters, setShowFilters] = useState(true);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [apiMessage, setApiMessage] = useState(null);
    const [suggestions, setSuggestions] = useState([]);

    const [stockStatusFilter, setStockStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [supplierFilter, setSupplierFilter] = useState('all');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [profitMarginRange, setProfitMarginRange] = useState({ min: '', max: '' });
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

    const [lastUpdated, setLastUpdated] = useState(new Date());

    useEffect(() => {
        fetchData();
    }, [dateRange.from, dateRange.to, searchTerm, stockStatusFilter, categoryFilter, supplierFilter, priceRange.min, priceRange.max, profitMarginRange.min, profitMarginRange.max]);

    const fetchData = async () => {
        setLoading(true);
        setApiMessage(null);
        setSuggestions([]);

        try {
            const params = {};
            if (dateRange.from) params.from_date = dateRange.from;
            if (dateRange.to) params.to_date = dateRange.to;
            if (searchTerm) params.search = searchTerm;
            if (stockStatusFilter !== 'all') params.stock_status = stockStatusFilter;
            if (categoryFilter !== 'all') params.category = categoryFilter;
            if (supplierFilter !== 'all') params.supplier = supplierFilter;
            if (priceRange.min) params.min_price = priceRange.min;
            if (priceRange.max) params.max_price = priceRange.max;
            if (profitMarginRange.min) params.min_margin = profitMarginRange.min;
            if (profitMarginRange.max) params.max_margin = profitMarginRange.max;

            const [materialsRes, categoriesRes, suppliersRes] = await Promise.all([
                materialService.getFilteredMaterials(params),
                categoryService.getAllCategories(),
                supplierService.getAllSuppliers()
            ]);

            if (materialsRes.success && materialsRes.data) {
                if (materialsRes.data.message) {
                    setApiMessage(materialsRes.data.message);
                    setSuggestions(materialsRes.data.suggestions || []);
                    setMaterials([]);
                    setFilteredMaterials([]);
                } else if (Array.isArray(materialsRes.data)) {
                    setMaterials(materialsRes.data);
                    setFilteredMaterials(materialsRes.data);
                } else {
                    setMaterials([]);
                    setFilteredMaterials([]);
                }
            } else {
                setMaterials([]);
                setFilteredMaterials([]);
            }

            if (categoriesRes.success) {
                setCategories(categoriesRes.data);
            }

            if (suppliersRes.success) {
                setSuppliers(suppliersRes.data);
            }

            setLastUpdated(new Date());
            setCurrentPage(1);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load materials data');
            setMaterials([]);
            setFilteredMaterials([]);
            setApiMessage('Unable to connect to the server. Please check your internet connection.');
        } finally {
            setLoading(false);
        }
    };

    const getCurrentPageMaterials = () => {
        if (!Array.isArray(filteredMaterials)) return [];
        const indexOfLast = currentPage * itemsPerPage;
        const indexOfFirst = indexOfLast - itemsPerPage;
        return filteredMaterials.slice(indexOfFirst, indexOfLast);
    };

    const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, filteredMaterials.length);

    const handleViewDetails = (material) => {
        setSelectedMaterial(material);
        setShowDetailModal(true);
    };

    const handleDownloadPDF = async () => {
        if (filteredMaterials.length === 0) {
            toast.warning('No materials data to export');
            return;
        }

        const filters = {
            searchTerm,
            stockStatusFilter,
            categoryFilter,
            supplierFilter,
            priceRange,
            profitMarginRange,
            dateRange
        };

        await MaterialsAnalyticsPDFGenerator.generateMaterialsReport(
            filteredMaterials,
            filters,
            categories,
            suppliers,
            null,
            toast
        );
    };

    const getStockStatus = (material) => {
        const currentStock = parseFloat(material.current_stock) || 0;
        const reorderLevel = parseFloat(material.reorder_level) || 0;
        const maximumStock = parseFloat(material.maximum_stock) || 0;

        if (currentStock <= reorderLevel) {
            return { status: 'Low Stock', color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle };
        } else if (currentStock >= maximumStock) {
            return { status: 'Overstock', color: 'text-orange-600', bg: 'bg-orange-100', icon: TrendingDown };
        } else {
            return { status: 'Normal', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle };
        }
    };

    const calculateProfitMargin = (material) => {
        const selling = parseFloat(material.selling_price) || 0;
        const buying = parseFloat(material.buying_price) || 0;
        if (selling === 0) return 0;
        return ((selling - buying) / selling * 100).toFixed(1);
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

    const calculateStockAnalytics = () => {
        let totalCostValue = 0;
        let totalSellingValue = 0;
        let lowStock = 0;
        let overstock = 0;
        let totalMargin = 0;
        let marginCount = 0;

        filteredMaterials.forEach(material => {
            const stock = parseFloat(material.current_stock) || 0;
            const buyingPrice = parseFloat(material.buying_price) || 0;
            const sellingPrice = parseFloat(material.selling_price) || 0;

            totalCostValue += stock * buyingPrice;
            totalSellingValue += stock * sellingPrice;

            const reorderLevel = parseFloat(material.reorder_level) || 0;
            const maximumStock = parseFloat(material.maximum_stock) || 0;

            if (stock <= reorderLevel) lowStock++;
            if (stock >= maximumStock) overstock++;

            if (sellingPrice > 0) {
                const margin = ((sellingPrice - buyingPrice) / sellingPrice) * 100;
                totalMargin += margin;
                marginCount++;
            }
        });

        return {
            total_materials: filteredMaterials.length,
            total_stock_value_at_cost: totalCostValue,
            total_stock_value_at_selling: totalSellingValue,
            potential_profit: totalSellingValue - totalCostValue,
            low_stock_count: lowStock,
            overstock_count: overstock,
            average_profit_margin: marginCount > 0 ? (totalMargin / marginCount).toFixed(2) : 0
        };
    };

    const stockAnalytics = calculateStockAnalytics();

    const clearFilters = () => {
        setSearchTerm('');
        setStockStatusFilter('all');
        setCategoryFilter('all');
        setSupplierFilter('all');
        setPriceRange({ min: '', max: '' });
        setProfitMarginRange({ min: '', max: '' });
        setDateRange({ from: '', to: '' });
        setShowFilters(false);
        fetchData();
    };

    const applyFilters = () => {
        fetchData();
        setShowFilters(false);
        toast.success('Filters applied');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading materials...</p>
                </div>
            </div>
        );
    }

    const currentPageMaterials = getCurrentPageMaterials();
    const hasMaterials = Array.isArray(filteredMaterials) && filteredMaterials.length > 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Package className="w-6 h-6 mr-3 text-blue-600" />
                        Materials Analytics
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Filter and analyze construction materials
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={filteredMaterials.length === 0}
                        className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF
                    </button>
                    <button
                        onClick={fetchData}
                        className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                </div>
            </div>



            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center px-4 py-2 text-gray-600 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                        {(stockStatusFilter !== 'all' || categoryFilter !== 'all' || supplierFilter !== 'all' ||
                            priceRange.min || priceRange.max || profitMarginRange.min || profitMarginRange.max ||
                            dateRange.from || dateRange.to) && (
                                <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full"></span>
                            )}
                    </button>
                </div>

                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
                                <select
                                    value={stockStatusFilter}
                                    onChange={(e) => setStockStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All</option>
                                    <option value="low">Low Stock</option>
                                    <option value="normal">Normal</option>
                                    <option value="overstock">Overstock</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                                <select
                                    value={supplierFilter}
                                    onChange={(e) => setSupplierFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Suppliers</option>
                                    {suppliers.map(sup => (
                                        <option key={sup.id} value={sup.id}>{sup.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range (RWF)</label>
                                <div className="flex space-x-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={priceRange.min}
                                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={priceRange.max}
                                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Profit Margin (%)</label>
                                <div className="flex space-x-2">
                                    <input
                                        type="number"
                                        placeholder="Min %"
                                        value={profitMarginRange.min}
                                        onChange={(e) => setProfitMarginRange({ ...profitMarginRange, min: e.target.value })}
                                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max %"
                                        value={profitMarginRange.max}
                                        onChange={(e) => setProfitMarginRange({ ...profitMarginRange, max: e.target.value })}
                                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                                <div className="flex space-x-2">
                                    <input
                                        type="date"
                                        value={dateRange.from}
                                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="date"
                                        value={dateRange.to}
                                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-gray-600">
                                Showing {filteredMaterials.length} materials
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={applyFilters}
                                    className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <Calendar className="w-3 h-3 mr-1" />
                                    Apply Filters
                                </button>
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    Clear all filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {apiMessage ? (
                    <div className="text-center py-12">
                        <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Materials Found</h3>
                        <p className="text-gray-600 mb-4">{apiMessage}</p>
                        {suggestions.length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto text-left">
                                <h4 className="font-medium text-gray-900 mb-2">Suggestions:</h4>
                                <ul className="space-y-1">
                                    {suggestions.map((suggestion, idx) => (
                                        <li key={idx} className="text-sm text-gray-600 flex items-start">
                                            <span className="text-blue-500 mr-2">•</span>
                                            {suggestion}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <button
                            onClick={clearFilters}
                            className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Clear Filters & Refresh
                        </button>
                    </div>
                ) : !hasMaterials ? (
                    <div className="text-center py-12">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {materials.length === 0 ? 'No materials found' : 'No matching materials'}
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm || stockStatusFilter !== 'all' || categoryFilter !== 'all' || supplierFilter !== 'all' || dateRange.from || dateRange.to
                                ? 'No materials match your filters. Try adjusting your search criteria.'
                                : 'No materials available.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock Value</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margin</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {currentPageMaterials.map((material, index) => {
                                        const stockStatus = getStockStatus(material);
                                        const margin = calculateProfitMargin(material);
                                        const stockValue = (parseFloat(material.current_stock) || 0) * (parseFloat(material.selling_price) || 0);
                                        const StockStatusIcon = stockStatus.icon;

                                        return (
                                            <tr key={material.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-gray-500">#{startIndex + index}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{material.name}</p>
                                                        <p className="text-xs text-gray-500">SKU: {material.sku}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-sm text-gray-900">
                                                        {categories.find(c => c.id == material.category)?.name || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {formatNumber(material.current_stock)} {material.unit}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Reorder: {formatNumber(material.reorder_level)}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    <span className="text-sm text-gray-900">
                                                        {formatCurrency(material.selling_price)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {formatCurrency(stockValue)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    <span className={`text-sm font-semibold ${parseFloat(margin) >= 20 ? 'text-green-600' : parseFloat(margin) >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                        {margin}%
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                                                        <StockStatusIcon className="w-3 h-3 mr-1" />
                                                        {stockStatus.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleViewDetails(material)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
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
                                    Showing {startIndex} to {endIndex} of {filteredMaterials.length} materials
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

            {showDetailModal && selectedMaterial && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Material Details</h2>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Material Name</p>
                                    <p className="font-medium text-gray-900">{selectedMaterial.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">SKU</p>
                                    <p className="font-medium text-gray-900">{selectedMaterial.sku}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Category</p>
                                    <p className="font-medium text-gray-900">
                                        {categories.find(c => c.id == selectedMaterial.category)?.name || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Supplier</p>
                                    <p className="font-medium text-gray-900">
                                        {suppliers.find(s => s.id == selectedMaterial.supplier)?.name || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Current Stock</p>
                                    <p className="font-medium text-gray-900">
                                        {formatNumber(selectedMaterial.current_stock)} {selectedMaterial.unit}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Unit</p>
                                    <p className="font-medium text-gray-900">{selectedMaterial.unit || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Buying Price</p>
                                    <p className="font-medium text-gray-900">{formatCurrency(selectedMaterial.buying_price)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Selling Price</p>
                                    <p className="font-medium text-gray-900">{formatCurrency(selectedMaterial.selling_price)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Reorder Level</p>
                                    <p className="font-medium text-gray-900">{formatNumber(selectedMaterial.reorder_level)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Maximum Stock</p>
                                    <p className="font-medium text-gray-900">{formatNumber(selectedMaterial.maximum_stock)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Profit Margin</p>
                                    <p className="font-medium text-green-600">{calculateProfitMargin(selectedMaterial)}%</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Expiry Date</p>
                                    <p className="font-medium text-gray-900">{formatDate(selectedMaterial.expiry_date)}</p>
                                </div>
                            </div>
                            {selectedMaterial.description && (
                                <div>
                                    <p className="text-sm text-gray-500">Description</p>
                                    <p className="text-gray-700">{selectedMaterial.description}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
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

export default MaterialsAnalyticsPage;