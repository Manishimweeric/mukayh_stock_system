import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    Package, Search, ArrowLeft, RefreshCw,
    ArrowUp, ArrowDown, FileText, DollarSign,
    Save, Loader2, Calendar, Tag,
    AlertCircle, BarChart3, Hash
} from 'lucide-react';
import { materialService, stockMovementService } from '../../api';

export default function StockMovementPage() {
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [recentMovements, setRecentMovements] = useState([]);
    const [loadingMovements, setLoadingMovements] = useState(false);

    const [formData, setFormData] = useState({
        movement_type: 'IN',
        quantity: '',
        reference_number: '',
        notes: '',
        material_id: ''
    });

    const movementTypes = [
        { value: 'IN', label: 'Stock In', color: 'bg-green-100 text-green-800', icon: ArrowUp, description: 'Add stock to inventory' },
        { value: 'OUT', label: 'Stock Out', color: 'bg-red-100 text-red-800', icon: ArrowDown, description: 'Remove stock from inventory' }
    ];

    useEffect(() => {
        fetchRecentMovements();
    }, []);

    const fetchRecentMovements = async () => {
        setLoadingMovements(true);
        try {
            const result = await stockMovementService.getRecentMovements();
            if (result.success) {
                setRecentMovements(result.data.slice(0, 2));
            }
        } catch (error) {
            console.error('Error fetching recent movements:', error);
        } finally {
            setLoadingMovements(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            toast.error('Please enter a search term');
            return;
        }

        setSearching(true);
        try {
            const result = await materialService.getAllMaterials({ search: searchTerm });

            if (result.success) {
                const materials = Array.isArray(result.data) ? result.data :
                    (result.data.results ? result.data.results :
                        (result.data.data ? result.data.data : []));

                setSearchResults(materials);

                if (materials.length === 0) {
                    toast.info('No materials found matching your search');
                }
            } else {
                toast.error('Failed to search materials');
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Error searching materials:', error);
            toast.error('Network error during search');
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const selectMaterial = (material) => {
        setSelectedMaterial(material);
        setSearchTerm('');
        setSearchResults([]);
        setFormData({
            movement_type: 'IN',
            quantity: '',
            reference_number: '',
            notes: '',
            material_id: material.id
        });
    };

    const clearSelection = () => {
        setSelectedMaterial(null);
        setFormData({
            movement_type: 'IN',
            quantity: '',
            reference_number: '',
            notes: '',
            material_id: ''
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const calculateNewStock = () => {
        if (!selectedMaterial || !formData.quantity) return null;

        const currentStock = parseFloat(selectedMaterial.current_stock) || 0;
        const quantity = parseFloat(formData.quantity) || 0;

        if (formData.movement_type === 'IN') {
            return currentStock + quantity;
        } else {
            return currentStock - quantity;
        }
    };

    const getMovementValue = () => {
        const quantity = parseFloat(formData.quantity) || 0;
        const unitPrice = parseFloat(selectedMaterial?.unit_price) || 0;
        return quantity * unitPrice;
    };

    const validateForm = () => {
        if (!selectedMaterial) {
            toast.error('Please select a material first');
            return false;
        }

        if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
            toast.error('Quantity must be greater than 0');
            return false;
        }

        if (formData.movement_type === 'OUT') {
            const currentStock = parseFloat(selectedMaterial.current_stock) || 0;
            const quantity = parseFloat(formData.quantity) || 0;

            if (quantity > currentStock) {
                toast.error(`Insufficient stock. Available: ${currentStock} ${selectedMaterial.unit}`);
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            const movementData = {
                material: selectedMaterial.id,
                movement_type: formData.movement_type,
                quantity: parseFloat(formData.quantity),
                unit_price: parseFloat(selectedMaterial.unit_price),
                reference_number: formData.reference_number.trim(),
                notes: formData.notes.trim()
            };

            const result = await stockMovementService.createMovement(movementData);

            if (result.success) {
                toast.success('Stock movement recorded successfully!');
                clearSelection();
                fetchRecentMovements();

                await materialService.getMaterialById(selectedMaterial.id);
            } else {
                const errorMsg = typeof result.error === 'object'
                    ? Object.values(result.error).flat()[0]
                    : result.message || 'Failed to record stock movement';
                toast.error(errorMsg);
            }
        } catch (error) {
            console.error('Error creating stock movement:', error);
            toast.error('Network error. Could not record movement.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString('en-US', {
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('rw-RW', {
            style: 'currency',
            currency: 'RWF',
            currencyDisplay: 'symbol',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Math.round(amount || 0));
    };

    const getMovementIcon = (type) => {
        const movement = movementTypes.find(m => m.value === type);
        return movement ? movement.icon : ArrowUp;
    };

    const getMovementColor = (type) => {
        const movement = movementTypes.find(m => m.value === type);
        return movement ? movement.color : 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <BarChart3 className="w-6 h-6 mr-3 text-blue-600" />
                        Stock Movement
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Record stock movements (In/Out) for materials
                    </p>
                </div>

                <Link
                    to="/inventory/items/list"
                    className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Materials
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Search className="w-5 h-5 mr-2 text-blue-600" />
                            Search Material
                        </h2>

                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="flex space-x-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by material name, SKU, or description..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={!!selectedMaterial}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={searching || !!selectedMaterial}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    {searching ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Search className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                            {selectedMaterial && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-green-100 rounded-lg">
                                                <Package className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900">{selectedMaterial.name}</h3>
                                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                    <span>SKU: {selectedMaterial.sku}</span>
                                                    <span>•</span>
                                                    <span>Category: {selectedMaterial.category?.name || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={clearSelection}
                                            className="text-sm text-gray-500 hover:text-gray-700"
                                        >
                                            Change
                                        </button>
                                    </div>
                                </div>
                            )}

                            {searchResults.length > 0 && !selectedMaterial && (
                                <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                                    <div className="bg-gray-50 px-4 py-2 border-b">
                                        <p className="text-sm font-medium text-gray-700">
                                            Search Results ({searchResults.length})
                                        </p>
                                    </div>
                                    {searchResults.map(material => (
                                        <div
                                            key={material.id}
                                            onClick={() => selectMaterial(material)}
                                            className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900">{material.name}</div>
                                                    <div className="text-sm text-gray-600">SKU: {material.sku}</div>
                                                    <div className="flex items-center space-x-3 mt-1">
                                                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                                            {material.category?.name || 'Uncategorized'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {material.current_stock} {material.unit}
                                                    </div>
                                                    <div className="text-xs text-gray-600">Current Stock</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!selectedMaterial && !searchResults.length && searchTerm && (
                                <div className="text-center py-8">
                                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">Search for materials to get started</p>
                                </div>
                            )}
                        </form>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                                Recent Movements
                            </h2>
                            <button
                                onClick={fetchRecentMovements}
                                disabled={loadingMovements}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <RefreshCw className={`w-4 h-4 ${loadingMovements ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        {loadingMovements ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                            </div>
                        ) : recentMovements.length === 0 ? (
                            <div className="text-center py-8">
                                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No recent movements</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentMovements.map(movement => {
                                    const MovementIcon = getMovementIcon(movement.movement_type);
                                    const movementColor = getMovementColor(movement.movement_type);
                                    return (
                                        <div key={movement.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${movementColor}`}>
                                                            <MovementIcon className="w-3 h-3 mr-1" />
                                                            {movementTypes.find(m => m.value === movement.movement_type)?.label}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {formatDate(movement.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="font-medium text-gray-900 text-sm">
                                                        {movement.material_name || movement.material?.name || 'Unknown Material'}
                                                    </p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {movement.quantity} {movement.material?.unit} • {formatCurrency(movement.total_value)}
                                                    </p>
                                                    {movement.reference_number && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Ref: {movement.reference_number}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <Link
                                to="/inventory/stock/movement/list"
                                className="flex items-center justify-center text-sm text-blue-600 hover:text-blue-700"
                            >
                                <span>View All Movements</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {selectedMaterial ? (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                                Record Stock Movement
                            </h2>

                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase">Current Stock</span>
                                        <p className="text-xl font-semibold text-gray-900">
                                            {selectedMaterial.current_stock} {selectedMaterial.unit}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase">Unit Price</span>
                                        <p className="text-xl font-semibold text-gray-900">
                                            {formatCurrency(selectedMaterial.unit_price)}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase">Stock Value</span>
                                        <p className="text-xl font-semibold text-blue-600">
                                            {formatCurrency(selectedMaterial.current_stock * selectedMaterial.unit_price)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Movement Type *
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {movementTypes.map((movement) => {
                                            const Icon = movement.icon;
                                            return (
                                                <div
                                                    key={movement.value}
                                                    onClick={() => setFormData(prev => ({ ...prev, movement_type: movement.value }))}
                                                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${formData.movement_type === movement.value
                                                        ? `${movement.color.replace('100', '500').replace('800', '900')} border-current`
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`p-2 rounded-lg ${formData.movement_type === movement.value ? 'bg-white/20' : 'bg-gray-100'}`}>
                                                            <Icon className={`w-5 h-5 ${formData.movement_type === movement.value ? 'text-white' : 'text-gray-600'}`} />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{movement.label}</div>
                                                            <div className="text-xs opacity-75">{movement.description}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Quantity *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 text-gray-400">
                                            <Hash className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="number"
                                            name="quantity"
                                            value={formData.quantity}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            placeholder="Enter quantity"
                                            step="0.01"
                                            min="0.01"
                                            required
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Quantity in {selectedMaterial.unit}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reference Number
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 text-gray-400">
                                            <Tag className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="text"
                                            name="reference_number"
                                            value={formData.reference_number}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            placeholder="PO-123, Invoice-456, etc."
                                            maxLength={100}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 text-gray-400">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none"
                                            placeholder="Add notes about this movement..."
                                        />
                                    </div>
                                </div>

                                {formData.quantity && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h3 className="text-sm font-medium text-blue-800 mb-3">Movement Preview</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-xs text-blue-600 uppercase">New Stock Level</span>
                                                <p className="text-lg font-semibold text-blue-900">
                                                    {calculateNewStock()} {selectedMaterial.unit}
                                                </p>
                                                <p className="text-xs text-blue-600">
                                                    {formData.movement_type === 'IN' ? '+' : '-'}{formData.quantity} {selectedMaterial.unit}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-blue-600 uppercase">Movement Value</span>
                                                <p className="text-lg font-semibold text-blue-900">
                                                    {formatCurrency(getMovementValue())}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-6 border-t border-gray-200">
                                    <div className="flex items-center justify-end space-x-4">
                                        <button
                                            type="button"
                                            onClick={clearSelection}
                                            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading || !formData.quantity}
                                            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>Recording...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4" />
                                                    <span>Record Movement</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="text-center py-12">
                                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Material Selected</h3>
                                <p className="text-gray-500 mb-6">
                                    Search and select a material from the left panel to record stock movement
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}