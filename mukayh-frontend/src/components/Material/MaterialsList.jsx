import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Package, Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
    X, Eye, MoreVertical, PackagePlus, Tag, DollarSign,
    Layers, Truck, Box, AlertCircle, CheckCircle, XCircle,
    Calendar, Edit, Trash2, BarChart3, ArrowLeft, Plus,
    TrendingUp, TrendingDown, Minus, Info, FileText
} from 'lucide-react';
import { toast } from 'react-toastify';
import { materialService, categoryService, supplierService } from '../../api';
import InventoryPDFGenerator from '../Reports/InventoryPDFGenerator';

const MaterialsList = () => {
    const [materials, setMaterials] = useState([]);
    const [filteredMaterials, setFilteredMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [materialsPerPage] = useState(10);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        filterMaterials();
    }, [materials, searchTerm, statusFilter, categoryFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const materialsResult = await materialService.getAllMaterials();
            const categoriesResult = await categoryService.getAllCategories();
            const suppliersResult = await supplierService.getAllSuppliers();

            if (materialsResult.success) {
                setMaterials(materialsResult.data);
            } else {
                toast.error('Failed to load materials');
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
        if (!Array.isArray(materials)) {
            setFilteredMaterials([]);
            return;
        }

        let filtered = [...materials];

        if (searchTerm) {
            filtered = filtered.filter(material =>
                (material.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (material.sku?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (material.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== 'All') {
            if (statusFilter === 'Active') {
                filtered = filtered.filter(material => material.is_active);
            } else if (statusFilter === 'Inactive') {
                filtered = filtered.filter(material => !material.is_active);
            } else if (statusFilter === 'LowStock') {
                filtered = filtered.filter(material => {
                    const currentStock = parseFloat(material.current_stock) || 0;
                    const reorderLevel = parseFloat(material.reorder_level) || 0;
                    return currentStock <= reorderLevel;
                });
            } else if (statusFilter === 'Overstock') {
                filtered = filtered.filter(material => {
                    const currentStock = parseFloat(material.current_stock) || 0;
                    const maximumStock = parseFloat(material.maximum_stock) || 0;
                    return currentStock >= maximumStock;
                });
            }
        }

        if (categoryFilter !== 'All') {
            filtered = filtered.filter(material => material.category == categoryFilter);
        }

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

    const generatePDFReport = async () => {
        const filters = {
            searchTerm,
            statusFilter,
            categoryFilter
        };

        await InventoryPDFGenerator.generateInventoryReport(
            filteredMaterials,
            filters,
            categories,
            suppliers,
            toast
        );
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
                {isActive ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                {isActive ? 'Active' : 'Inactive'}
            </span>
        );
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

    const stockSummary = {
        total: filteredMaterials.length,
        lowStock: filteredMaterials.filter(mat => {
            const stock = parseFloat(mat.current_stock) || 0;
            const reorder = parseFloat(mat.reorder_level) || 0;
            return stock <= reorder;
        }).length,
        overstock: filteredMaterials.filter(mat => {
            const stock = parseFloat(mat.current_stock) || 0;
            const max = parseFloat(mat.maximum_stock) || 0;
            return stock >= max;
        }).length,
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
                        <Package className="w-6 h-6 mr-3 text-blue-600" />
                        Materials Management
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage all construction materials and inventory
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

                    <button
                        onClick={() => generatePDFReport()}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Report
                    </button>

                    <Link
                        to="/inventory/item/add-new"
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <PackagePlus className="w-4 h-4 mr-2" />
                        Add Material
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Total Materials</p>
                            <p className="text-xl font-semibold text-gray-900">{stockSummary.total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Low Stock</p>
                            <p className="text-xl font-semibold text-gray-900">{stockSummary.lowStock}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Overstock</p>
                            <p className="text-xl font-semibold text-gray-900">{stockSummary.overstock}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Total Value</p>
                            <p className="text-xl font-semibold text-gray-900">{formatCurrency(stockSummary.totalValue)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, SKU, or description..."
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="All">All Status</option>
                                    <option value="Active">Active Only</option>
                                    <option value="Inactive">Inactive Only</option>
                                    <option value="LowStock">Low Stock</option>
                                    <option value="Overstock">Overstock</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="All">All Categories</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-gray-600">
                                Showing {filteredMaterials.length} of {materials.length} materials
                            </div>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('All');
                                    setCategoryFilter('All');
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

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {!hasMaterials ? (
                    <div className="text-center py-12">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {materials.length === 0 ? 'No materials found' : 'No matching materials'}
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm || statusFilter !== 'All' || categoryFilter !== 'All'
                                ? 'No materials match your current filters.'
                                : 'No materials available. Create your first material to get started.'}
                        </p>
                        <Link
                            to="/inventory/item/add-new"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <PackagePlus className="w-4 h-4 mr-2" />
                            {materials.length === 0 ? 'Add First Material' : 'Add New Material'}
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
                                            Material
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Stock
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Updated
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentPageMaterials.map((material, index) => {
                                        return (
                                            <tr key={material.id || index} className="hover:bg-gray-50">
                                                <td className="px-6 py-1 whitespace-nowrap">
                                                    <span className="text-gray-500">#{startIndex + index}</span>
                                                </td>
                                                <td className="px-6 py-1">
                                                    <div className="flex items-center">

                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {material.name || 'Unnamed Material'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-1 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                                        <Layers className="w-3 h-3 mr-1" />
                                                        {material.category?.name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-1">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between">

                                                            <span className="text-sm font-medium text-gray-900">
                                                                {material.current_stock} {material.unit}
                                                            </span>
                                                        </div>

                                                    </div>
                                                </td>
                                                <td className="px-6 py-1 whitespace-nowrap">
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {formatCurrency(material.unit_price)}
                                                        </div>

                                                    </div>
                                                </td>
                                                <td className="px-6 py-1">
                                                    <div className="space-y-2">

                                                        <div>
                                                            {getActiveStatusBadge(material.is_active)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-1 whitespace-nowrap">
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar className="w-3 h-3 text-gray-400" />
                                                        <span className="text-sm text-gray-900">
                                                            {formatShortDate(material.updated_at)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-1 whitespace-nowrap text-right text-sm font-medium">
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
                                                                    Edit
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
                        )}
                    </>
                )}
            </div>

            {showDetailModal && selectedMaterial && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Material Details</h2>
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
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <Package className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900">
                                                {selectedMaterial.name}
                                            </h3>
                                            <div className="flex items-center space-x-2 mt-2">
                                                <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${getStockStatus(selectedMaterial).color}`}>
                                                    {getStockStatus(selectedMaterial).status}
                                                </span>
                                                {getActiveStatusBadge(selectedMaterial.is_active)}
                                            </div>
                                        </div>
                                    </div>
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
                                            <p className="font-semibold text-gray-900">{selectedMaterial.category?.name}</p>
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
                                            <span className="text-xs text-gray-500 uppercase">Current Stock Value</span>
                                            <p className="font-semibold text-gray-900 text-lg text-blue-600">
                                                {formatCurrency((parseFloat(selectedMaterial.current_stock) || 0) * (parseFloat(selectedMaterial.unit_price) || 0))}
                                            </p>
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
                                            <p className="font-semibold text-gray-900 text-lg">
                                                {selectedMaterial.current_stock} {selectedMaterial.unit}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Reorder Level</span>
                                            <p className="text-gray-900">{selectedMaterial.reorder_level} {selectedMaterial.unit}</p>
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
                                to={`/inventory/materials/edit/${selectedMaterial.id}`}
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

export default MaterialsList;