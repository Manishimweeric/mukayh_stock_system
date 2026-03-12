import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    BarChart3, Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
    X, Eye, MoreVertical, Calendar, Tag, DollarSign,
    ArrowUp, ArrowDown, Package, User, Clock, Layers, FileText
} from 'lucide-react';
import { stockMovementService, materialService } from '../../api';
import StockMovementsPDFGenerator from '../Reports/StockMovementsPDFGenerator';

const StockMovementsList = () => {
    const [movements, setMovements] = useState([]);
    const [filteredMovements, setFilteredMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [movementTypeFilter, setMovementTypeFilter] = useState('All');
    const [materialFilter, setMaterialFilter] = useState('All');
    const [materials, setMaterials] = useState([]);
    const [dateRange, setDateRange] = useState({
        start_date: '',
        end_date: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [movementsPerPage] = useState(10);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedMovement, setSelectedMovement] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState(null);

    const movementTypes = [
        { value: 'IN', label: 'Stock In', color: 'bg-green-100 text-green-800', icon: ArrowUp },
        { value: 'OUT', label: 'Stock Out', color: 'bg-red-100 text-red-800', icon: ArrowDown }
    ];

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        filterMovements();
    }, [movements, searchTerm, movementTypeFilter, materialFilter, dateRange]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const movementsResult = await stockMovementService.getAllMovements();
            const materialsResult = await materialService.getAllMaterials();

            if (movementsResult.success && Array.isArray(movementsResult.data)) {
                setMovements(movementsResult.data);
            } else {
                toast.error('Failed to load stock movements');
                setMovements([]);
            }

            if (materialsResult.success && Array.isArray(materialsResult.data)) {
                setMaterials(materialsResult.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
            setMovements([]);
        } finally {
            setLoading(false);
        }
    };

    const filterMovements = () => {
        if (!Array.isArray(movements)) {
            setFilteredMovements([]);
            return;
        }

        let filtered = [...movements];

        if (searchTerm) {
            filtered = filtered.filter(movement =>
                (movement.material_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (movement.material_sku?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (movement.reference_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (movement.notes?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            );
        }

        if (movementTypeFilter !== 'All') {
            filtered = filtered.filter(movement => movement.movement_type === movementTypeFilter);
        }

        if (materialFilter !== 'All') {
            filtered = filtered.filter(movement => movement.material == materialFilter);
        }

        if (dateRange.start_date) {
            filtered = filtered.filter(movement =>
                new Date(movement.created_at) >= new Date(dateRange.start_date)
            );
        }

        if (dateRange.end_date) {
            filtered = filtered.filter(movement =>
                new Date(movement.created_at) <= new Date(dateRange.end_date + 'T23:59:59')
            );
        }

        setFilteredMovements(filtered);
        setCurrentPage(1);
    };

    const getCurrentPageMovements = () => {
        if (!Array.isArray(filteredMovements)) return [];

        const indexOfLast = currentPage * movementsPerPage;
        const indexOfFirst = indexOfLast - movementsPerPage;
        return filteredMovements.slice(indexOfFirst, indexOfLast);
    };

    const totalPages = Math.ceil(filteredMovements.length / movementsPerPage) || 1;
    const startIndex = (currentPage - 1) * movementsPerPage + 1;
    const endIndex = Math.min(currentPage * movementsPerPage, filteredMovements.length);

    const handleDropdownToggle = (movementId, e) => {
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === movementId ? null : movementId);
    };

    const handleViewDetails = (movement) => {
        setSelectedMovement(movement);
        setShowDetailModal(true);
        setOpenDropdownId(null);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
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

    const generatePDFReport = async () => {
        const filters = {
            searchTerm,
            movementTypeFilter,
            materialFilter
        };

        await StockMovementsPDFGenerator.generateStockMovementsReport(
            filteredMovements,
            filters,
            materials,
            toast
        );
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

    const getMovementTypeInfo = (type) => {
        const movement = movementTypes.find(m => m.value === type);
        return movement || { label: type, color: 'bg-gray-100 text-gray-800', icon: BarChart3 };
    };

    const getMaterialName = (materialId) => {
        const material = materials.find(mat => mat.id == materialId);
        return material ? material.name : 'Unknown Material';
    };

    const getStockChange = (movement) => {
        if (movement.movement_type === 'IN') {
            return `+${movement.quantity}`;
        } else {
            return `-${movement.quantity}`;
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setMovementTypeFilter('All');
        setMaterialFilter('All');
        setDateRange({
            start_date: '',
            end_date: ''
        });
        setShowFilters(false);
    };

    const getSummaryStats = () => {
        const filtered = filteredMovements;
        const totalIn = filtered
            .filter(m => m.movement_type === 'IN')
            .reduce((sum, m) => sum + (parseFloat(m.quantity) || 0), 0);

        const totalOut = filtered
            .filter(m => m.movement_type === 'OUT')
            .reduce((sum, m) => sum + (parseFloat(m.quantity) || 0), 0);

        const totalValue = filtered.reduce((sum, m) => sum + (parseFloat(m.total_value) || 0), 0);

        return {
            total: filtered.length,
            totalIn,
            totalOut,
            totalValue,
            netChange: totalIn - totalOut
        };
    };

    const summaryStats = getSummaryStats();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading stock movements...</p>
                </div>
            </div>
        );
    }

    const currentPageMovements = getCurrentPageMovements();
    const hasMovements = Array.isArray(filteredMovements) && filteredMovements.length > 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <BarChart3 className="w-6 h-6 mr-3 text-blue-600" />
                        Stock Movements
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Track all stock movements (In/Out) history
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
                        to="/inventory/stock/movement"
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <ArrowUp className="w-4 h-4 mr-2" />
                        New Movement
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Total Movements</p>
                            <p className="text-xl font-semibold text-gray-900">{summaryStats.total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <ArrowUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Total Stock In</p>
                            <p className="text-xl font-semibold text-gray-900">{summaryStats.totalIn.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <ArrowDown className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Total Stock Out</p>
                            <p className="text-xl font-semibold text-gray-900">{summaryStats.totalOut.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Total Value</p>
                            <p className="text-xl font-semibold text-gray-900">{formatCurrency(summaryStats.totalValue)}</p>
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
                            placeholder="Search by material name, SKU, reference, or notes..."
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
                                    Movement Type
                                </label>
                                <select
                                    value={movementTypeFilter}
                                    onChange={(e) => setMovementTypeFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="All">All Types</option>
                                    {movementTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Material
                                </label>
                                <select
                                    value={materialFilter}
                                    onChange={(e) => setMaterialFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="All">All Materials</option>
                                    {materials.map(material => (
                                        <option key={material.id} value={material.id}>
                                            {material.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.start_date}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.end_date}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-gray-600">
                                Showing {filteredMovements.length} of {movements.length} movements
                            </div>
                            <button
                                onClick={clearFilters}
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
                {!hasMovements ? (
                    <div className="text-center py-12">
                        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {movements.length === 0 ? 'No stock movements found' : 'No matching movements'}
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm || movementTypeFilter !== 'All' || materialFilter !== 'All' || dateRange.start_date || dateRange.end_date
                                ? 'No movements match your current filters.'
                                : 'No stock movements recorded yet.'}
                        </p>
                        <Link
                            to="/inventory/movements/create"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <ArrowUp className="w-4 h-4 mr-2" />
                            {movements.length === 0 ? 'Record First Movement' : 'Record New Movement'}
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
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Quantity
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Value
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Reference
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created By
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>

                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentPageMovements.map((movement, index) => {
                                        const movementType = getMovementTypeInfo(movement.movement_type);
                                        const MovementIcon = movementType.icon;
                                        return (
                                            <tr key={movement.id || index} className="hover:bg-gray-50">
                                                <td className="px-6 py-2 whitespace-nowrap">
                                                    <span className="text-gray-500">#{startIndex + index}</span>
                                                </td>
                                                <td className="px-6 py-2">
                                                    <div className="flex items-center">

                                                        <div className="">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {movement.material_name || getMaterialName(movement.material)}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                SKU: {movement.material_sku}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-2 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${movementType.color}`}>
                                                        <MovementIcon className="w-3 h-3 mr-1.5" />
                                                        {movementType.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-2 whitespace-nowrap">
                                                    <div className="space-y-1">
                                                        <div className={`text-sm font-medium ${movement.movement_type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                                                            {getStockChange(movement)}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {movement.previous_stock} → {movement.new_stock}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-2 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {formatCurrency(movement.total_value)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {formatCurrency(movement.unit_price)}/unit
                                                    </div>
                                                </td>
                                                <td className="px-6 py-2">
                                                    <div className="max-w-xs">
                                                        <p className="text-sm text-gray-900 line-clamp-2">
                                                            {movement.reference_number || 'No reference'}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-2 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0">
                                                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                                <User className="w-4 h-4 text-gray-600" />
                                                            </div>
                                                        </div>
                                                        <div className="ml-3">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {movement.created_by_name || 'Unknown User'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar className="w-3 h-3 text-gray-400" />
                                                        <span className="text-sm text-gray-900">
                                                            {formatShortDate(movement.created_at)}
                                                        </span>
                                                    </div>
                                                </td>

                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {hasMovements && (
                            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Showing {startIndex} to {endIndex} of {filteredMovements.length} movements
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

            {showDetailModal && selectedMovement && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Movement Details</h2>
                                <p className="text-gray-600 text-sm">ID: {selectedMovement.id}</p>
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
                                                {selectedMovement.material_name}
                                            </h3>
                                            <div className="flex items-center space-x-2 mt-2">
                                                {(() => {
                                                    const movementType = getMovementTypeInfo(selectedMovement.movement_type);
                                                    const Icon = movementType.icon;
                                                    return (
                                                        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${movementType.color}`}>
                                                            <Icon className="w-3 h-3 mr-1.5" />
                                                            {movementType.label}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Movement Information</h3>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Movement Type</span>
                                            {(() => {
                                                const movementType = getMovementTypeInfo(selectedMovement.movement_type);
                                                const Icon = movementType.icon;
                                                return (
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <Icon className="w-4 h-4" />
                                                        <p className="font-semibold text-gray-900">{movementType.label}</p>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Quantity</span>
                                            <p className={`font-semibold text-gray-900 text-lg ${selectedMovement.movement_type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                                                {getStockChange(selectedMovement)} {selectedMovement.material?.unit || 'units'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Stock Before/After</span>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className="text-gray-900">{selectedMovement.previous_stock}</span>
                                                <ArrowRight className="w-4 h-4 text-gray-400" />
                                                <span className="font-semibold text-gray-900">{selectedMovement.new_stock}</span>
                                                <span className="text-sm text-gray-500">{selectedMovement.material?.unit || 'units'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h3>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Unit Price</span>
                                            <p className="font-semibold text-gray-900 text-lg">
                                                {formatCurrency(selectedMovement.unit_price)}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Total Value</span>
                                            <p className="font-semibold text-gray-900 text-lg text-blue-600">
                                                {formatCurrency(selectedMovement.total_value)}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Reference Number</span>
                                            <p className="font-semibold text-gray-900">
                                                {selectedMovement.reference_number || 'Not provided'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-gray-900 whitespace-pre-wrap">
                                        {selectedMovement.notes || 'No notes provided'}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">
                                    Audit Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase">Created By</span>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <p className="font-semibold text-gray-900">
                                                {selectedMovement.created_by_name || 'Unknown User'}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase">Created At</span>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <p className="font-semibold text-gray-900">
                                                {formatDate(selectedMovement.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
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

export default StockMovementsList;