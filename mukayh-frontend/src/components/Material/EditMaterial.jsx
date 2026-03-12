import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    Package,
    Tag,
    FileText,
    DollarSign,
    ArrowLeft,
    Save,
    Loader2,
    PackagePlus,
    Box,
    Truck,
    Layers,
    BarChart3,
    AlertCircle,
    RefreshCw
} from 'lucide-react';

import { materialService, categoryService, supplierService } from '../../api';

export default function EditMaterialForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: '',
        supplier: '',
        description: '',
        unit: 'KG',
        unit_price: '',
        current_stock: '0',
        reorder_level: '10',
        maximum_stock: '1000',
        is_active: true
    });

    const unitOptions = [
        { value: 'KG', label: 'Kilograms' },
        { value: 'TON', label: 'Tons' },
        { value: 'PCS', label: 'Pieces' },
        { value: 'BAG', label: 'Bags' },
        { value: 'M', label: 'Meters' },
        { value: 'M2', label: 'Square Meters' },
        { value: 'M3', label: 'Cubic Meters' },
        { value: 'L', label: 'Liters' },
        { value: 'BOX', label: 'Boxes' },
    ];

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoadingData(true);
        try {
            const materialResult = await materialService.getMaterialById(id);
            const categoriesResult = await categoryService.getAllCategories();
            const suppliersResult = await supplierService.getAllSuppliers();

            if (materialResult.success) {
                const material = materialResult.data;
                setFormData({
                    name: material.name || '',
                    sku: material.sku || '',
                    category: material.category?.toString() || material.category_id?.toString() || '',
                    supplier: material.supplier?.toString() || material.supplier_id?.toString() || '',
                    description: material.description || '',
                    unit: material.unit || 'KG',
                    unit_price: material.unit_price?.toString() || '',
                    current_stock: material.current_stock?.toString() || '0',
                    reorder_level: material.reorder_level?.toString() || '10',
                    maximum_stock: material.maximum_stock?.toString() || '1000',
                    is_active: material.is_active !== false
                });
            } else {
                toast.error('Failed to load material data');
                navigate('/inventory/items/list');
            }

            if (categoriesResult.success) {
                setCategories(categoriesResult.data);
            }

            if (suppliersResult.success) {
                setSuppliers(suppliersResult.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
            navigate('/inventory/items/list');
        } finally {
            setLoadingData(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error("Material name is required");
            return;
        }

        if (!formData.sku.trim()) {
            toast.error("SKU is required");
            return;
        }

        if (!formData.category) {
            toast.error("Category is required");
            return;
        }

        if (!formData.supplier) {
            toast.error("Supplier is required");
            return;
        }

        if (!formData.unit_price || parseFloat(formData.unit_price) <= 0) {
            toast.error("Unit price must be greater than 0");
            return;
        }

        setLoading(true);

        try {
            const materialData = {
                name: formData.name.trim(),
                sku: formData.sku.trim(),
                category: formData.category,
                supplier: formData.supplier,
                description: formData.description.trim(),
                unit: formData.unit,
                unit_price: parseFloat(formData.unit_price),
                current_stock: parseFloat(formData.current_stock),
                reorder_level: parseFloat(formData.reorder_level),
                maximum_stock: parseFloat(formData.maximum_stock),
                is_active: formData.is_active
            };

            const result = await materialService.updateMaterial(id, materialData);

            if (result.id || result.success) {
                toast.success('Material updated successfully!');
                navigate('/inventory/items/list');
            } else {
                const errorMsg = typeof result.error === 'object'
                    ? Object.values(result.error).flat()[0]
                    : result.message || 'Material update failed';
                toast.error(errorMsg);
            }
        } catch (error) {
            console.error('Error updating material:', error);
            toast.error('Network error. Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    };


    const getStockStatus = () => {
        const currentStock = parseFloat(formData.current_stock) || 0;
        const reorderLevel = parseFloat(formData.reorder_level) || 0;
        const maximumStock = parseFloat(formData.maximum_stock) || 0;

        if (currentStock <= reorderLevel) {
            return { status: 'LOW', color: 'bg-red-100 text-red-800', icon: AlertCircle };
        } else if (currentStock >= maximumStock) {
            return { status: 'OVERSTOCK', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle };
        } else {
            return { status: 'NORMAL', color: 'bg-green-100 text-green-800', icon: BarChart3 };
        }
    };

    const stockStatus = getStockStatus();
    const StockStatusIcon = stockStatus.icon;

    if (loadingData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading material data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <PackagePlus className="w-6 h-6 mr-3 text-blue-600" />
                        Edit Material
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Update material information and inventory details
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={fetchData}
                        className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reload
                    </button>
                    <Link
                        to="/inventory/items/list"
                        className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Materials
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Material Name *
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-3 text-gray-400">
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                        placeholder="Cement, Steel Bars, Plywood, etc."
                                        required
                                        maxLength={200}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Maximum 200 characters
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    SKU (Stock Keeping Unit) *
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-3 text-gray-400">
                                        <Tag className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        name="sku"
                                        value={formData.sku}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                        placeholder="MAT-CEM-001"
                                        required
                                        maxLength={50}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Unique identifier for this material
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category *
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-3 text-gray-400">
                                        <Layers className="w-5 h-5" />
                                    </div>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 appearance-none"
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Supplier *
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-3 text-gray-400">
                                        <Truck className="w-5 h-5" />
                                    </div>
                                    <select
                                        name="supplier"
                                        value={formData.supplier}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 appearance-none"
                                        required
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map(supplier => (
                                            <option key={supplier.id} value={supplier.id}>
                                                {supplier.company_name || supplier.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Unit *
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-3 text-gray-400">
                                        <Box className="w-5 h-5" />
                                    </div>
                                    <select
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 appearance-none"
                                        required
                                    >
                                        {unitOptions.map(unit => (
                                            <option key={unit.value} value={unit.value}>
                                                {unit.label} ({unit.value})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Unit Price *
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-3 text-gray-400">
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="number"
                                        name="unit_price"
                                        value={formData.unit_price}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0.01"
                                        required
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Price per unit
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-3 text-gray-400">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none"
                                    placeholder="Enter material description, specifications, or notes..."
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Optional description for the material
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Current Stock
                                </label>
                                <input
                                    type="number"
                                    name="current_stock"
                                    value={formData.current_stock}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                    placeholder="0"
                                    step="0.01"
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reorder Level
                                </label>
                                <input
                                    type="number"
                                    name="reorder_level"
                                    value={formData.reorder_level}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                    placeholder="10"
                                    step="0.01"
                                    min="0"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Alert when stock reaches this level
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Maximum Stock
                                </label>
                                <input
                                    type="number"
                                    name="maximum_stock"
                                    value={formData.maximum_stock}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                    placeholder="1000"
                                    step="0.01"
                                    min="0"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Maximum storage capacity
                                </p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-gray-600 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                                            {stockStatus.status}
                                        </span>
                                        <span>Stock Status</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Link
                                        to="/inventory/items/list"
                                        className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={loading || !formData.name.trim() || !formData.sku.trim() || !formData.category || !formData.supplier}
                                        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Updating Material...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                <span>Update Material</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}