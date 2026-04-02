import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    ArrowLeft, Save, Plus, Trash2, X, Package, Truck,
    Calendar, Users, FileText, AlertCircle, CheckCircle,
    DollarSign, ShoppingBag, Loader, ChevronLeft
} from 'lucide-react';
import { toast } from 'react-toastify';
import { supplierOrderService, supplierService, materialService } from '../../api';

const SupplierOrderForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);
    const [suppliers, setSuppliers] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [showItemModal, setShowItemModal] = useState(false);
    const [activeSection, setActiveSection] = useState('basic');

    const [formData, setFormData] = useState({
        name: '',
        supplier: '',
        expected_delivery_date: '',
        notes: ''
    });

    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        fetchInitialData();
        if (isEditMode) {
            fetchOrderDetails();
        }
    }, [id]);

    const fetchInitialData = async () => {
        try {
            const [suppliersRes, materialsRes] = await Promise.all([
                supplierService.getAllSuppliers(),
                materialService.getAllMaterials()
            ]);

            if (suppliersRes.success) {
                setSuppliers(suppliersRes.data);
            }

            if (materialsRes.success) {
                setMaterials(materialsRes.data);
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
            toast.error('Failed to load required data');
        }
    };

    const fetchOrderDetails = async () => {
        try {
            const result = await supplierOrderService.getSupplierOrderById(id);
            if (result.success) {
                const order = result.data;
                setFormData({
                    name: order.name,
                    supplier: order.supplier,
                    expected_delivery_date: order.expected_delivery_date,
                    notes: order.notes || ''
                });

                const itemsResult = await supplierOrderService.getItemsByOrder(id);
                if (itemsResult.success) {
                    setOrderItems(itemsResult.data.map(item => ({
                        id: item.id,
                        material: item.material,
                        material_name: item.material_name,
                        material_sku: item.material_sku,
                        quantity: parseFloat(item.quantity),
                        unit_price: parseFloat(item.unit_price),
                        total_cost: parseFloat(item.total_cost)
                    })));
                }
            } else {
                toast.error('Failed to load order details');
                navigate('/inventory/supplier-orders');
            }
        } catch (error) {
            console.error('Error fetching order:', error);
            toast.error('Failed to load order details');
            navigate('/inventory/supplier-orders');
        } finally {
            setInitialLoading(false);
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.name.trim()) {
            errors.name = 'Order name is required';
        }

        if (!formData.supplier) {
            errors.supplier = 'Please select a supplier';
        }

        if (!formData.expected_delivery_date) {
            errors.expected_delivery_date = 'Expected delivery date is required';
        } else {
            const selectedDate = new Date(formData.expected_delivery_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
                errors.expected_delivery_date = 'Expected delivery date cannot be in the past';
            }
        }

        if (orderItems.length === 0) {
            errors.items = 'At least one item is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleAddItem = () => {
        setEditingItem(null);
        setSelectedMaterial(null);
        setShowItemModal(true);
    };

    const handleEditItem = (item) => {
        setEditingItem(item);
        setSelectedMaterial({
            id: item.material,
            name: item.material_name,
            sku: item.material_sku
        });
        setShowItemModal(true);
    };

    const handleSaveItem = (itemData) => {
        if (editingItem) {
            setOrderItems(prev => prev.map(item =>
                item.id === editingItem.id ? { ...item, ...itemData } : item
            ));
        } else {
            setOrderItems(prev => [...prev, { ...itemData, id: Date.now() }]);
        }
        setShowItemModal(false);
        if (formErrors.items) {
            setFormErrors(prev => ({ ...prev, items: '' }));
        }
    };

    const handleRemoveItem = (itemId) => {
        if (window.confirm('Are you sure you want to remove this item?')) {
            setOrderItems(prev => prev.filter(item => item.id !== itemId));
        }
    };

    const calculateTotalCost = () => {
        return orderItems.reduce((total, item) => total + (item.quantity * item.unit_price), 0);
    };

    const calculateTotalQuantity = () => {
        return orderItems.reduce((total, item) => total + item.quantity, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the errors before submitting');
            // Scroll to first error
            const firstError = document.querySelector('.border-red-500');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setLoading(true);

        try {
            const orderData = {
                name: formData.name,
                supplier: parseInt(formData.supplier),
                expected_delivery_date: formData.expected_delivery_date,
                notes: formData.notes,
                items: orderItems.map(item => ({
                    material: item.material,
                    quantity: item.quantity,
                    unit_price: item.unit_price
                }))
            };

            let result;
            if (isEditMode) {
                result = await supplierOrderService.updateSupplierOrder(id, orderData);
            } else {
                result = await supplierOrderService.createSupplierOrder(orderData);
            }

            if (result.success) {
                toast.success(isEditMode ? 'Order updated successfully' : 'Order created successfully');
                navigate('/inventory/supplier-orders/list');
            } else {
                toast.error(result.message || 'Failed to save order');
            }
        } catch (error) {
            console.error('Error saving order:', error);
            toast.error('An error occurred while saving the order');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 font-medium">Loading order details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header with Back Button */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/inventory/supplier-orders/list')}
                                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 mr-1" />
                                <span>Back to Orders</span>
                            </button>
                            <div className="h-6 w-px bg-gray-300"></div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    {isEditMode ? 'Edit Supplier Order' : 'Create Supplier Order'}
                                </h1>
                                <p className="text-sm text-gray-500">
                                    {isEditMode
                                        ? 'Update order details and manage items'
                                        : 'Fill in the details to create a new supplier order'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                type="button"
                                onClick={() => navigate('/inventory/supplier-orders')}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                {loading ? (
                                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                {isEditMode ? 'Update Order' : 'Create Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Progress Steps */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between max-w-md mx-auto">
                            <button
                                type="button"
                                onClick={() => setActiveSection('basic')}
                                className={`flex flex-col items-center ${activeSection === 'basic' ? 'text-blue-600' : 'text-gray-400'}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${activeSection === 'basic' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                                    1
                                </div>
                                <span className="text-xs font-medium">Basic Info</span>
                            </button>
                            <div className={`flex-1 h-0.5 mx-4 ${activeSection === 'items' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                            <button
                                type="button"
                                onClick={() => setActiveSection('items')}
                                className={`flex flex-col items-center ${activeSection === 'items' ? 'text-blue-600' : 'text-gray-400'}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${activeSection === 'items' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                                    2
                                </div>
                                <span className="text-xs font-medium">Order Items</span>
                            </button>
                        </div>
                    </div>

                    {/* Order Information Section */}
                    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden transition-all ${activeSection === 'basic' ? 'block' : 'hidden'}`}>
                        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="flex items-center">
                                <Package className="w-5 h-5 text-blue-600 mr-2" />
                                <h2 className="text-lg font-semibold text-gray-900">Order Information</h2>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">Basic details about the supplier order</p>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Order Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Monthly Cement Order - March 2024"
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${formErrors.name ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {formErrors.name && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            {formErrors.name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Supplier <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="supplier"
                                        value={formData.supplier}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${formErrors.supplier ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value="">Select a supplier</option>
                                        {suppliers.map(supplier => (
                                            <option key={supplier.id} value={supplier.id}>
                                                {supplier.name} - {supplier.phone_number}
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.supplier && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            {formErrors.supplier}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Expected Delivery Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="expected_delivery_date"
                                        value={formData.expected_delivery_date}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${formErrors.expected_delivery_date ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {formErrors.expected_delivery_date && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            {formErrors.expected_delivery_date}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        rows="3"
                                        placeholder="Additional notes about this order..."
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setActiveSection('items')}
                                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Next: Order Items
                                    <ChevronLeft className="w-4 h-4 ml-2 rotate-180" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Order Items Section */}
                    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden transition-all ${activeSection === 'items' ? 'block' : 'hidden'}`}>
                        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center">
                                        <ShoppingBag className="w-5 h-5 text-green-600 mr-2" />
                                        <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">Add materials to be ordered from the supplier</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Item
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            {formErrors.items && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                                    <span>{formErrors.items}</span>
                                </div>
                            )}

                            {orderItems.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Package className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No items added yet</h3>
                                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                                        Start adding materials to this order. Click the button below to add your first item.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add First Item
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Material
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Quantity
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Unit Price (RWF)
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Total (RWF)
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {orderItems.map((item) => (
                                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {item.material_name}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    SKU: {item.material_sku}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                                                            {item.quantity.toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                                                            {item.unit_price.toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                                            {(item.quantity * item.unit_price).toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex items-center justify-center space-x-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleEditItem(item)}
                                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="Edit item"
                                                                >
                                                                    <FileText className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveItem(item.id)}
                                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Remove item"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-50 border-t border-gray-200">
                                                <tr>
                                                    <td colSpan="2" className="px-4 py-3 text-right font-medium text-gray-900">
                                                        Totals:
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                                                        {calculateTotalQuantity().toLocaleString()} units
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                        {calculateTotalCost().toLocaleString()} RWF
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>

                                    {/* Summary Cards */}
                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-blue-200 rounded-lg">
                                                    <ShoppingBag className="w-5 h-5 text-blue-700" />
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-blue-700 font-medium">Total Items</p>
                                                    <p className="text-2xl font-bold text-blue-900">
                                                        {orderItems.length}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-green-200 rounded-lg">
                                                    <Package className="w-5 h-5 text-green-700" />
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-green-700 font-medium">Total Quantity</p>
                                                    <p className="text-2xl font-bold text-green-900">
                                                        {calculateTotalQuantity().toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-purple-200 rounded-lg">
                                                    <DollarSign className="w-5 h-5 text-purple-700" />
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-purple-700 font-medium">Total Order Value</p>
                                                    <p className="text-2xl font-bold text-purple-900">
                                                        {calculateTotalCost().toLocaleString()} RWF
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setActiveSection('basic')}
                                            className="flex items-center px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-2" />
                                            Back to Basic Info
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                        >
                                            {loading ? (
                                                <Loader className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4 mr-2" />
                                            )}
                                            {isEditMode ? 'Update Order' : 'Create Order'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            {/* Add/Edit Item Modal */}
            {showItemModal && (
                <ItemModal
                    materials={materials}
                    selectedMaterial={selectedMaterial}
                    editingItem={editingItem}
                    onSave={handleSaveItem}
                    onClose={() => setShowItemModal(false)}
                />
            )}
        </div>
    );
};

// Item Modal Component (improved)
const ItemModal = ({ materials, selectedMaterial, editingItem, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        material: editingItem?.material || selectedMaterial?.id || '',
        material_name: editingItem?.material_name || selectedMaterial?.name || '',
        material_sku: editingItem?.material_sku || selectedMaterial?.sku || '',
        quantity: editingItem?.quantity || '',
        unit_price: editingItem?.unit_price || ''
    });
    const [errors, setErrors] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [showMaterialList, setShowMaterialList] = useState(false);

    const filteredMaterials = materials.filter(material =>
        material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleMaterialSelect = (material) => {
        setFormData({
            ...formData,
            material: material.id,
            material_name: material.name,
            material_sku: material.sku
        });
        setShowMaterialList(false);
        setSearchTerm('');
    };

    const validateItem = () => {
        const newErrors = {};

        if (!formData.material) {
            newErrors.material = 'Please select a material';
        }

        if (!formData.quantity || formData.quantity <= 0) {
            newErrors.quantity = 'Quantity must be greater than 0';
        } else if (isNaN(formData.quantity)) {
            newErrors.quantity = 'Quantity must be a number';
        }

        if (!formData.unit_price || formData.unit_price <= 0) {
            newErrors.unit_price = 'Unit price must be greater than 0';
        } else if (isNaN(formData.unit_price)) {
            newErrors.unit_price = 'Unit price must be a number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateItem()) {
            onSave({
                material: parseInt(formData.material),
                material_name: formData.material_name,
                material_sku: formData.material_sku,
                quantity: parseFloat(formData.quantity),
                unit_price: parseFloat(formData.unit_price)
            });
        }
    };

    const totalCost = formData.quantity && formData.unit_price
        ? (parseFloat(formData.quantity) * parseFloat(formData.unit_price)).toFixed(2)
        : 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-fadeIn">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {editingItem ? 'Edit Order Item' : 'Add Order Item'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Material Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Material <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            {!formData.material ? (
                                <>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setShowMaterialList(true);
                                        }}
                                        onFocus={() => setShowMaterialList(true)}
                                        placeholder="Search for a material..."
                                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.material ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {showMaterialList && filteredMaterials.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {filteredMaterials.map(material => (
                                                <button
                                                    key={material.id}
                                                    type="button"
                                                    onClick={() => handleMaterialSelect(material)}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="font-medium text-gray-900">{material.name}</div>
                                                    <div className="text-sm text-gray-500">SKU: {material.sku}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                    <div>
                                        <div className="font-medium text-gray-900">{formData.material_name}</div>
                                        <div className="text-sm text-gray-500">SKU: {formData.material_sku}</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, material: '', material_name: '', material_sku: '' })}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                        {errors.material && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {errors.material}
                            </p>
                        )}
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            placeholder="Enter quantity"
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.quantity ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.quantity && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {errors.quantity}
                            </p>
                        )}
                    </div>

                    {/* Unit Price */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Unit Price (RWF) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.unit_price}
                            onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                            placeholder="Enter unit price"
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.unit_price ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.unit_price && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {errors.unit_price}
                            </p>
                        )}
                    </div>

                    {/* Total Preview */}
                    {formData.quantity && formData.unit_price && (
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-blue-700">Total Cost:</span>
                                <span className="text-xl font-bold text-blue-900">
                                    {parseFloat(totalCost).toLocaleString()} RWF
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        {editingItem ? 'Update Item' : 'Add Item'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SupplierOrderForm;