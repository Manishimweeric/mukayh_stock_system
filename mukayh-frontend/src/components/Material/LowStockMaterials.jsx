import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Package, Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
    X, Eye, MoreVertical, Tag, DollarSign,
    Layers, Truck, Box, AlertCircle, CheckCircle,
    Calendar, Edit, BarChart3, ArrowLeft, Bell,
    TrendingDown, Info, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { materialService, categoryService, supplierService } from '../../api';

const LowStockMaterials = () => {
    const [materials, setMaterials] = useState([]);
    const [filteredMaterials, setFilteredMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [materialsPerPage] = useState(10);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        filterMaterials();
    }, [materials]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const lowStockResult = await materialService.getLowStockMaterials();
            const categoriesResult = await categoryService.getAllCategories();
            const suppliersResult = await supplierService.getAllSuppliers();

            if (lowStockResult.success) {
                setMaterials(lowStockResult.data);
            } else {
                toast.error('Failed to load low stock materials');
                setMaterials([]);
            }

            if (categoriesResult.success && Array.isArray(categoriesResult.data)) {
                setCategories(categoriesResult.data);
            }

            if (suppliersResult.success && Array.isArray(suppliersResult.data)) {
                setSuppliers(suppliersResult.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
            setMaterials([]);
        } finally {
            setLoading(false);
        }
    };

    const filterMaterials = () => {
        let filtered = [...materials];
        setFilteredMaterials(filtered);
        setCurrentPage(1);
    };

    const getCurrentPageMaterials = () => {
        if (!Array.isArray(filteredMaterials)) return [];

        const indexOfLast = currentPage * materialsPerPage;
        const indexOfFirst = indexOfLast - materialsPerPage;
        return filteredMaterials.slice(indexOfFirst, indexOfLast);
    };

    const totalPages = Math.ceil(filteredMaterials.length / materialsPerPage) || 1;
    const startIndex = (currentPage - 1) * materialsPerPage + 1;
    const endIndex = Math.min(currentPage * materialsPerPage, filteredMaterials.length);

    const handleDropdownToggle = (materialId, e) => {
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === materialId ? null : materialId);
    };

    const handleViewDetails = (material) => {
        setSelectedMaterial(material);
        setShowDetailModal(true);
        setOpenDropdownId(null);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        try {
            return new Date(dateString).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.log(error)
            return 'Invalid date';
        }
    };

    const formatShortDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.log(error)
            return 'Invalid date';
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

    const getStockStatus = (material) => {
        const currentStock = parseFloat(material.current_stock) || 0;
        const reorderLevel = parseFloat(material.reorder_level) || 0;
        const maximumStock = parseFloat(material.maximum_stock) || 0;

        if (currentStock <= reorderLevel) {
            return { status: 'LOW', color: 'bg-red-100 text-red-800', icon: AlertCircle };
        } else if (currentStock >= maximumStock) {
            return { status: 'OVERSTOCK', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle };
        } else {
            return { status: 'NORMAL', color: 'bg-green-100 text-green-800', icon: BarChart3 };
        }
    };

    const getActiveStatusBadge = (isActive) => {
        return (
            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isActive ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                {isActive ? 'Active' : 'Inactive'}
            </span>
        );
    };

    const getCategoryName = (categoryId) => {
        const category = categories.find(cat => cat.id == categoryId);
        return category ? category.name : 'Unknown';
    };

    const getSupplierName = (supplierId) => {
        const supplier = suppliers.find(sup => sup.id == supplierId);
        return supplier ? supplier.name : 'Unknown';
    };

    const getUnitLabel = (unitCode) => {
        const unitMap = {
            'KG': 'Kilograms',
            'TON': 'Tons',
            'PCS': 'Pieces',
            'BAG': 'Bags',
            'M': 'Meters',
            'M2': 'Square Meters',
            'M3': 'Cubic Meters',
            'L': 'Liters',
            'BOX': 'Boxes'
        };
        return unitMap[unitCode] || unitCode;
    };

    const calculateStockDeficit = (material) => {
        const currentStock = parseFloat(material.current_stock) || 0;
        const reorderLevel = parseFloat(material.reorder_level) || 0;
        return reorderLevel - currentStock;
    };

    const calculateUrgencyLevel = (material) => {
        const currentStock = parseFloat(material.current_stock) || 0;
        const reorderLevel = parseFloat(material.reorder_level) || 0;

        if (currentStock === 0) return { level: 'CRITICAL', color: 'bg-red-600 text-white' };
        if (currentStock <= reorderLevel * 0.25) return { level: 'HIGH', color: 'bg-orange-100 text-orange-800' };
        if (currentStock <= reorderLevel * 0.5) return { level: 'MEDIUM', color: 'bg-yellow-100 text-yellow-800' };
        return { level: 'LOW', color: 'bg-blue-100 text-blue-800' };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading low stock materials...</p>
                </div>
            </div>
        );
    }

    const currentPageMaterials = getCurrentPageMaterials();
    const hasMaterials = Array.isArray(filteredMaterials) && filteredMaterials.length > 0;

    const stockSummary = {
        total: filteredMaterials.length,
        critical: filteredMaterials.filter(mat => parseFloat(mat.current_stock) === 0).length,
        highUrgency: filteredMaterials.filter(mat => {
            const stock = parseFloat(mat.current_stock) || 0;
            const reorder = parseFloat(mat.reorder_level) || 0;
            return stock <= reorder * 0.25;
        }).length,
        totalDeficit: filteredMaterials.reduce((sum, mat) => {
            return sum + calculateStockDeficit(mat);
        }, 0),
        totalValue: filteredMaterials.reduce((sum, mat) => {
            const stock = parseFloat(mat.current_stock) || 0;
            const price = parseFloat(mat.unit_price) || 0;
            return sum + (stock * price);
        }, 0)
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Bell className="w-6 h-6 mr-3 text-red-600" />
                        Low Stock Materials
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Materials that need immediate attention and reordering
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
                        to="/inventory/items/list"
                        className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to All Materials
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Low Stock Items</p>
                            <p className="text-xl font-semibold text-gray-900">{stockSummary.total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-600 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Critical (Out of Stock)</p>
                            <p className="text-xl font-semibold text-gray-900">{stockSummary.critical}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <TrendingDown className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Total Deficit</p>
                            <p className="text-xl font-semibold text-gray-900">
                                {stockSummary.totalDeficit.toFixed(2)} units
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Current Stock Value</p>
                            <p className="text-xl font-semibold text-gray-900">{formatCurrency(stockSummary.totalValue)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {!hasMaterials ? (
                    <div className="text-center py-12">
                        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No low stock materials found
                        </h3>

                        <div className="flex justify-center space-x-3">
                            <Link
                                to="/inventory/items/list"
                                className="inline-flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                View All Materials
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-red-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                                            NO
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                                            Material
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                                            Stock Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                                            Current vs Reorder
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                                            Deficit
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                                            Urgency
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                                            Updated
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-red-700 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentPageMaterials.map((material, index) => {
                                        const stockStatus = getStockStatus(material);
                                        const urgency = calculateUrgencyLevel(material);
                                        const deficit = calculateStockDeficit(material);
                                        const percentage = ((parseFloat(material.current_stock) || 0) / (parseFloat(material.reorder_level) || 1)) * 100;

                                        return (
                                            <tr key={material.id || index} className="hover:bg-red-50/30">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-gray-500">#{startIndex + index}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0">
                                                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                                                <Package className="w-5 h-5 text-red-600" />
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {material.name || 'Unnamed Material'}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                SKU: {material.sku || 'N/A'}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                Category: {getCategoryName(material.category)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="space-y-2">
                                                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                                                            <stockStatus.icon className="w-3 h-3 mr-1" />
                                                            {stockStatus.status}
                                                        </span>
                                                        <div>
                                                            {getActiveStatusBadge(material.is_active)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-gray-500">Current:</span>
                                                            <span className="text-sm font-medium text-red-600">
                                                                {material.current_stock} {material.unit}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-gray-500">Reorder Level:</span>
                                                            <span className="text-sm font-medium text-gray-900">{material.reorder_level} {material.unit}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                            <div
                                                                className="bg-red-600 h-1.5 rounded-full"
                                                                style={{ width: `${Math.min(percentage, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                        <div className="text-xs text-gray-500 text-center">
                                                            {percentage.toFixed(1)}% of reorder level
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="space-y-1">
                                                        <div className="text-lg font-bold text-red-600">
                                                            {deficit.toFixed(2)} {material.unit}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Need to reorder
                                                        </div>
                                                        <div className="text-xs font-medium text-blue-600">
                                                            Price: {formatCurrency(material.unit_price)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${urgency.color}`}>
                                                        <AlertCircle className="w-3 h-3 mr-1" />
                                                        {urgency.level}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar className="w-3 h-3 text-gray-400" />
                                                        <span className="text-sm text-gray-900">
                                                            {formatShortDate(material.updated_at)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => handleDropdownToggle(material.id, e)}
                                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>

                                                        {openDropdownId === material.id && (
                                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                                                <button
                                                                    onClick={() => handleViewDetails(material)}
                                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                                >
                                                                    <Eye className="w-4 h-4 mr-3 text-gray-400" />
                                                                    View Details
                                                                </button>
                                                                <Link
                                                                    to={`/inventory/items/edit/${material.id}`}
                                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                                >
                                                                    <Edit className="w-4 h-4 mr-3 text-gray-400" />
                                                                    Edit Material
                                                                </Link>
                                                                <Link
                                                                    to={`/inventory/purchases/create?material=${material.id}`}
                                                                    className="flex items-center w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors"
                                                                >
                                                                    <Tag className="w-4 h-4 mr-3" />
                                                                    Create Purchase Order
                                                                </Link>
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

                        {hasMaterials && (
                            <div className="px-6 py-4 border-t border-gray-200 bg-red-50">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-red-700">
                                        Showing {startIndex} to {endIndex} of {filteredMaterials.length} low stock materials
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="p-2 text-red-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                            ? 'bg-red-600 text-white'
                                                            : 'text-red-700 hover:bg-red-100'
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
                                            className="p-2 text-red-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {showDetailModal && selectedMaterial && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Low Stock Material Details</h2>
                                <p className="text-gray-600 text-sm">SKU: {selectedMaterial.sku}</p>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center">
                                            <Package className="w-8 h-8 text-red-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900">
                                                {selectedMaterial.name}
                                            </h3>
                                            <div className="flex items-center space-x-2 mt-2">
                                                <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${getStockStatus(selectedMaterial).color}`}>
                                                    {getStockStatus(selectedMaterial).status}
                                                </span>
                                                <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${calculateUrgencyLevel(selectedMaterial).color}`}>
                                                    {calculateUrgencyLevel(selectedMaterial).level} URGENCY
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium text-red-800 mb-2">Immediate Action Required</h4>
                                        <p className="text-sm text-red-600">
                                            This material has {calculateStockDeficit(selectedMaterial).toFixed(2)} {selectedMaterial.unit} deficit below reorder level.
                                        </p>
                                    </div>
                                    <Link
                                        to={`/inventory/purchases/create?material=${selectedMaterial.id}`}
                                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        <Tag className="w-4 h-4 mr-2" />
                                        Create Purchase Order
                                    </Link>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <Info className="w-5 h-5 mr-2 text-blue-600" />
                                        Basic Information
                                    </h3>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Material Name</span>
                                            <p className="font-semibold text-gray-900 text-lg">{selectedMaterial.name}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">SKU</span>
                                            <p className="font-semibold text-gray-900">{selectedMaterial.sku}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Description</span>
                                            <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                                                {selectedMaterial.description || 'No description provided'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <Layers className="w-5 h-5 mr-2 text-blue-600" />
                                        Classification
                                    </h3>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Category</span>
                                            <p className="font-semibold text-gray-900">{getCategoryName(selectedMaterial.category)}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Supplier</span>
                                            <p className="font-semibold text-gray-900">{getSupplierName(selectedMaterial.supplier)}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Unit of Measurement</span>
                                            <p className="font-semibold text-gray-900">
                                                {getUnitLabel(selectedMaterial.unit)} ({selectedMaterial.unit})
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                                        Pricing Information
                                    </h3>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Unit Price</span>
                                            <p className="font-semibold text-gray-900 text-lg">
                                                {formatCurrency(selectedMaterial.unit_price)}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Reorder Cost</span>
                                            <p className="font-semibold text-gray-900 text-lg text-red-600">
                                                {formatCurrency(calculateStockDeficit(selectedMaterial) * (parseFloat(selectedMaterial.unit_price) || 0))}
                                            </p>
                                            <p className="text-xs text-gray-500">Estimated cost to restock to reorder level</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                                        Stock Information
                                    </h3>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Current Stock</span>
                                            <p className="font-semibold text-gray-900 text-lg text-red-600">
                                                {selectedMaterial.current_stock} {selectedMaterial.unit}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Reorder Level</span>
                                            <p className="text-gray-900">{selectedMaterial.reorder_level} {selectedMaterial.unit}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Deficit Amount</span>
                                            <p className="font-semibold text-gray-900 text-lg">
                                                {calculateStockDeficit(selectedMaterial).toFixed(2)} {selectedMaterial.unit}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Maximum Stock</span>
                                            <p className="text-gray-900">{selectedMaterial.maximum_stock} {selectedMaterial.unit}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">
                                    Timestamps
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase">Created At</span>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <p className="font-semibold text-gray-900">
                                                {formatDate(selectedMaterial.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase">Last Updated</span>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <p className="font-semibold text-gray-900">
                                                {formatDate(selectedMaterial.updated_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                            <Link
                                to={`/inventory/items/edit/${selectedMaterial.id}`}
                                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Material
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

export default LowStockMaterials;