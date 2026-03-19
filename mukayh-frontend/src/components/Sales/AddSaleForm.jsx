import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    ShoppingBag,
    ArrowLeft,
    Save,
    Loader2,
    Plus,
    Trash2,
    User,
    Package,
    DollarSign,
    Percent,
    Calculator,
    Receipt,
    Search,
    TrendingUp,
    TrendingDown,
    Info,
    ReceiptText
} from 'lucide-react';
import { saleService, customerService, materialService } from '../../api';

// Helper function defined BEFORE the component
const getCurrentSession = () => {
    const month = new Date().getMonth() + 1;
    if (month >= 1 && month <= 4) return 1;
    if (month >= 5 && month <= 8) return 2;
    return 3;
};

// Helper function for currency formatting
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('rw-RW', {
        style: 'currency',
        currency: 'RWF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Math.round(amount || 0));
};

export default function AddSaleForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const preselectedCustomer = queryParams.get('customer');

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [customers, setCustomers] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [filteredMaterials, setFilteredMaterials] = useState([]);
    const [materialSearch, setMaterialSearch] = useState('');

    const [formData, setFormData] = useState({
        customer: preselectedCustomer || '',
        session: getCurrentSession(),
        year: new Date().getFullYear(),
        notes: '',
        items: []
    });

    const [currentItem, setCurrentItem] = useState({
        material: '',
        quantity: 1,
        selling_price: '',
        vat_rate: 18 // Fixed at 18%
    });

    const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
    const [selectedMaterialDetails, setSelectedMaterialDetails] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (materialSearch && materials.length > 0) {
            const filtered = materials.filter(m =>
                m.name?.toLowerCase().includes(materialSearch.toLowerCase()) ||
                m.sku?.toLowerCase().includes(materialSearch.toLowerCase())
            );
            setFilteredMaterials(filtered);
        } else {
            setFilteredMaterials(materials);
        }
    }, [materialSearch, materials]);

    useEffect(() => {
        if (currentItem.material) {
            const material = materials.find(m => m.id == currentItem.material);
            setSelectedMaterialDetails(material);
        } else {
            setSelectedMaterialDetails(null);
        }
    }, [currentItem.material, materials]);

    const fetchData = async () => {
        setLoadingData(true);
        try {
            const customersResult = await customerService.getAllCustomers();
            if (customersResult.success) {
                setCustomers(customersResult.data);
            }

            const materialsResult = await materialService.getAllMaterials({ is_active: true });
            if (materialsResult.success) {
                setMaterials(materialsResult.data);
                setFilteredMaterials(materialsResult.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoadingData(false);
        }
    };

    const handleCustomerChange = (e) => {
        setFormData(prev => ({
            ...prev,
            customer: e.target.value
        }));
    };

    const handleItemChange = (e) => {
        const { name, value } = e.target;
        setCurrentItem(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleMaterialSelect = (material) => {
        setCurrentItem({
            material: material.id,
            quantity: 1,
            selling_price: material.selling_price || material.unit_price,
            vat_rate: 18
        });
        setMaterialSearch(material.name);
        setShowMaterialDropdown(false);
    };

    const addItem = () => {
        if (!currentItem.material) {
            toast.error('Please select a material');
            return;
        }
        if (!currentItem.quantity || currentItem.quantity <= 0) {
            toast.error('Quantity must be greater than 0');
            return;
        }
        if (!currentItem.selling_price || currentItem.selling_price <= 0) {
            toast.error('Selling price must be greater than 0');
            return;
        }

        const material = materials.find(m => m.id == currentItem.material);
        const quantity = parseFloat(currentItem.quantity);
        const sellingPrice = parseFloat(currentItem.selling_price);
        const vatRate = parseFloat(currentItem.vat_rate);

        // Calculate totals
        const subtotal = quantity * sellingPrice; // Price without VAT
        const vatAmount = subtotal * (vatRate / 100); // VAT = subtotal * 18/100
        const totalAmount = subtotal + vatAmount; // Total with VAT
        const costTotal = quantity * material.buying_price;
        const profit = totalAmount - costTotal;

        // Check if selling price is less than buying price
        if (sellingPrice < material.buying_price) {
            if (!window.confirm('Warning: Selling price is less than buying price. This will result in a loss. Are you sure you want to continue?')) {
                return;
            }
        }

        const newItem = {
            material_id: currentItem.material,
            material_name: material?.name,
            material_sku: material?.sku,
            material_unit: material?.unit,
            buying_price: material?.buying_price,
            quantity: quantity,
            selling_price: sellingPrice,
            vat_rate: vatRate,
            // Calculated values
            subtotal: subtotal,
            vat_amount: vatAmount,
            total_amount: totalAmount,
            cost_total: costTotal,
            profit: profit,
            margin: totalAmount > 0 ? (profit / totalAmount * 100) : 0
        };

        setFormData(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));

        // Reset current item
        setCurrentItem({
            material: '',
            quantity: 1,
            selling_price: '',
            vat_rate: 18
        });
        setMaterialSearch('');
    };

    const removeItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const calculateGrandTotals = () => {
        let subtotal = 0;
        let totalVat = 0;
        let totalAmount = 0;
        let totalCost = 0;

        formData.items.forEach(item => {
            subtotal += item.subtotal || 0;
            totalVat += item.vat_amount || 0;
            totalAmount += item.total_amount || 0;
            totalCost += item.cost_total || 0;
        });

        const totalProfit = totalAmount - totalCost;
        const averageMargin = totalAmount > 0 ? (totalProfit / totalAmount * 100) : 0;

        return {
            subtotal,
            totalVat,
            totalAmount,
            totalCost,
            totalProfit,
            averageMargin
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.customer) {
            toast.error('Please select a customer');
            return;
        }

        if (formData.items.length === 0) {
            toast.error('Please add at least one item');
            return;
        }

        setLoading(true);

        try {
            const saleData = {
                customer: parseInt(formData.customer),
                session: parseInt(formData.session),
                year: parseInt(formData.year),
                notes: formData.notes,
                items: formData.items.map(item => ({
                    material: item.material_id,
                    quantity: item.quantity,
                    selling_price: item.selling_price,
                    vat_rate: item.vat_rate
                }))
            };

            console.log('Submitting sale data:', saleData);

            const result = await saleService.createSale(saleData);

            if (result.success) {
                toast.success('Sale created successfully!');
                navigate('/inventory/sales/list');
            } else {
                const errorMsg = typeof result.message === 'object'
                    ? Object.values(result.message).flat()[0]
                    : result.message || 'Sale creation failed';
                toast.error(errorMsg);
            }
        } catch (error) {
            console.error('Error creating sale:', error);
            toast.error('Network error. Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    const totals = calculateGrandTotals();

    const getProfitColor = (profit) => {
        if (profit > 0) return 'text-green-600';
        if (profit < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    const getMarginColor = (margin) => {
        if (margin >= 20) return 'text-green-600';
        if (margin >= 10) return 'text-yellow-600';
        if (margin > 0) return 'text-orange-600';
        return 'text-red-600';
    };

    if (loadingData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading form data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <ShoppingBag className="w-6 h-6 mr-3 text-blue-600" />
                        Create New Sale
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Record a new customer sale with 18% VAT
                    </p>
                </div>

                <Link
                    to="/inventory/sales/list"
                    className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Sales
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer and Session Info */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Sale Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Customer *
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-3 text-gray-400">
                                    <User className="w-5 h-5" />
                                </div>
                                <select
                                    name="customer"
                                    value={formData.customer}
                                    onChange={handleCustomerChange}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 appearance-none"
                                    required
                                >
                                    <option value="">Select Customer</option>
                                    {customers.map(customer => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.name} - {customer.phone_number}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Session *
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-3 text-gray-400">
                                    <Receipt className="w-5 h-5" />
                                </div>
                                <select
                                    name="session"
                                    value={formData.session}
                                    onChange={(e) => setFormData(prev => ({ ...prev, session: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 appearance-none"
                                    required
                                >
                                    <option value="1">Session 1 (Jan - Apr)</option>
                                    <option value="2">Session 2 (May - Aug)</option>
                                    <option value="3">Session 3 (Sep - Dec)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Year *
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-3 text-gray-400">
                                    <Calculator className="w-5 h-5" />
                                </div>
                                <input
                                    type="number"
                                    name="year"
                                    value={formData.year}
                                    onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                    required
                                    min="2020"
                                    max="2030"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Items Section */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Items</h2>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Material *
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-3 text-gray-400">
                                    <Package className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    value={materialSearch}
                                    onChange={(e) => {
                                        setMaterialSearch(e.target.value);
                                        setShowMaterialDropdown(true);
                                        if (!e.target.value) {
                                            setCurrentItem(prev => ({ ...prev, material: '' }));
                                        }
                                    }}
                                    onFocus={() => setShowMaterialDropdown(true)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                    placeholder="Search material..."
                                />
                                {showMaterialDropdown && filteredMaterials.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {filteredMaterials.map(material => (
                                            <div
                                                key={material.id}
                                                onClick={() => handleMaterialSelect(material)}
                                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                            >
                                                <div className="font-medium text-gray-900">{material.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    SKU: {material.sku} | Stock: {material.current_stock} {material.unit}<br />
                                                    Buying: {formatCurrency(material.buying_price)} |
                                                    Selling: {formatCurrency(material.selling_price)} |
                                                    Margin: {material.profit_margin?.toFixed(1)}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quantity *
                            </label>
                            <input
                                type="number"
                                name="quantity"
                                value={currentItem.quantity}
                                onChange={handleItemChange}
                                className="w-full px-3 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                min="0.01"
                                step="0.01"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Price (excl VAT) *
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-3 text-gray-400">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <input
                                    type="number"
                                    name="selling_price"
                                    value={currentItem.selling_price}
                                    onChange={handleItemChange}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                    min="0.01"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                VAT Rate (%)
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-3 text-gray-400">
                                    <Percent className="w-5 h-5" />
                                </div>
                                <input
                                    type="number"
                                    name="vat_rate"
                                    value={currentItem.vat_rate}
                                    onChange={handleItemChange}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    readOnly // Make it read-only if you want to force 18%
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <button
                                type="button"
                                onClick={addItem}
                                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Item
                            </button>
                        </div>
                    </div>

                    {/* Selected Material Info */}
                    {selectedMaterialDetails && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-blue-700">
                                <Info className="w-4 h-4" />
                                <span>
                                    Buying Price: {formatCurrency(selectedMaterialDetails.buying_price)} |
                                    Suggested Selling: {formatCurrency(selectedMaterialDetails.selling_price)} |
                                    Expected Margin: {selectedMaterialDetails.profit_margin?.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Items Table */}
                    {formData.items.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-md font-medium text-gray-900 mb-3">Added Items</h3>
                            <div className="bg-gray-50 rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Material</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Price (excl VAT)</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">VAT Rate</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">VAT Amount</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Subtotal</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total (incl VAT)</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Cost</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Profit</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {formData.items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-2">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {item.material_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        SKU: {item.material_sku}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    {item.quantity} {item.material_unit}
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    {formatCurrency(item.selling_price)}
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    {item.vat_rate}%
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    {formatCurrency(item.vat_amount)}
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    {formatCurrency(item.subtotal)}
                                                </td>
                                                <td className="px-4 py-2 text-right font-medium">
                                                    {formatCurrency(item.total_amount)}
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    {formatCurrency(item.cost_total)}
                                                </td>
                                                <td className={`px-4 py-2 text-right font-medium ${getProfitColor(item.profit)}`}>
                                                    {formatCurrency(item.profit)}
                                                    <div className="text-xs">
                                                        ({item.margin.toFixed(1)}%)
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-100">
                                        <tr>
                                            <td colSpan="4" className="px-4 py-2 text-right font-medium">Totals:</td>
                                            <td className="px-4 py-2 text-right font-medium">
                                                {formatCurrency(totals.totalVat)}
                                            </td>
                                            <td className="px-4 py-2 text-right font-medium">
                                                {formatCurrency(totals.subtotal)}
                                            </td>
                                            <td className="px-4 py-2 text-right font-bold text-green-600">
                                                {formatCurrency(totals.totalAmount)}
                                            </td>
                                            <td className="px-4 py-2 text-right font-medium">
                                                {formatCurrency(totals.totalCost)}
                                            </td>
                                            <td className={`px-4 py-2 text-right font-bold ${getProfitColor(totals.totalProfit)}`}>
                                                {formatCurrency(totals.totalProfit)}
                                            </td>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <td colSpan="8" className="px-4 py-2 text-right text-sm text-gray-600">
                                                VAT Total: {formatCurrency(totals.totalVat)} ({(totals.totalVat / totals.subtotal * 100).toFixed(1)}% of subtotal) |
                                                Cost: {formatCurrency(totals.totalCost)} |
                                                Margin: <span className={getMarginColor(totals.averageMargin)}>
                                                    {totals.averageMargin.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td></td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Notes */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (Optional)
                    </label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                        placeholder="Add any additional notes about this sale..."
                    />
                </div>

                {/* Profit Summary Card */}
                {formData.items.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Subtotal (excl VAT)</p>
                                <p className="text-xl font-bold text-gray-700">{formatCurrency(totals.subtotal)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">VAT Total (18%)</p>
                                <p className="text-xl font-bold text-blue-600">{formatCurrency(totals.totalVat)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total (incl VAT)</p>
                                <p className="text-xl font-bold text-green-600">{formatCurrency(totals.totalAmount)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Cost</p>
                                <p className="text-xl font-bold text-gray-700">{formatCurrency(totals.totalCost)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Profit</p>
                                <p className={`text-xl font-bold ${getProfitColor(totals.totalProfit)}`}>
                                    {formatCurrency(totals.totalProfit)}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Margin: <span className={getMarginColor(totals.averageMargin)}>
                                        {totals.averageMargin.toFixed(1)}%
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Actions */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-end gap-4">
                        <Link
                            to="/sales/list"
                            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading || formData.items.length === 0}
                            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Creating Sale...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Create Sale</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}