import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    ArrowLeft, Save, Package, Truck, Calendar, Users, FileText,
    AlertCircle, CheckCircle, Clock, X, Search, Filter,
    ChevronLeft, ChevronRight, Plus, Minus, Loader,
    DollarSign, ShoppingBag, Printer, Download
} from 'lucide-react';
import { toast } from 'react-toastify';
import { supplierOrderService, materialService } from '../../api';

const SupplierOrderReceive = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState({});
    const [showPartialModal, setShowPartialModal] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [partialQuantity, setPartialQuantity] = useState('');

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        setLoading(true);
        try {
            const orderResult = await supplierOrderService.getSupplierOrderById(id);
            if (orderResult.success) {
                setOrder(orderResult.data);

                // Fetch order items
                const itemsResult = await supplierOrderService.getItemsByOrder(id);
                if (itemsResult.success) {
                    const formattedItems = itemsResult.data.map(item => ({
                        ...item,
                        quantity: parseFloat(item.quantity),
                        received_quantity: parseFloat(item.received_quantity) || 0,
                        remaining_quantity: parseFloat(item.remaining_quantity) || parseFloat(item.quantity),
                        unit_price: parseFloat(item.unit_price),
                        total_cost: parseFloat(item.total_cost)
                    }));
                    setItems(formattedItems);

                    // Initialize selected items with default values
                    const initialSelected = {};
                    formattedItems.forEach(item => {
                        if (!item.is_received) {
                            initialSelected[item.id] = {
                                selected: true,
                                quantity: item.remaining_quantity
                            };
                        }
                    });
                    setSelectedItems(initialSelected);
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
            setLoading(false);
        }
    };

    const handleItemSelect = (itemId, isSelected) => {
        setSelectedItems(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                selected: isSelected
            }
        }));
    };

    const handleQuantityChange = (itemId, quantity) => {
        const item = items.find(i => i.id === itemId);
        const maxQuantity = item.remaining_quantity;
        let newQuantity = parseFloat(quantity);

        if (isNaN(newQuantity) || newQuantity < 0) {
            newQuantity = 0;
        }
        if (newQuantity > maxQuantity) {
            newQuantity = maxQuantity;
        }

        setSelectedItems(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                quantity: newQuantity
            }
        }));
    };

    const openPartialReceiveModal = (item) => {
        setCurrentItem(item);
        setPartialQuantity(item.remaining_quantity.toString());
        setShowPartialModal(true);
    };

    const handlePartialReceive = () => {
        let quantity = parseFloat(partialQuantity);
        if (isNaN(quantity) || quantity <= 0) {
            toast.error('Please enter a valid quantity');
            return;
        }

        const maxQuantity = currentItem.remaining_quantity;
        if (quantity > maxQuantity) {
            toast.error(`Quantity cannot exceed remaining quantity (${maxQuantity})`);
            return;
        }

        setSelectedItems(prev => ({
            ...prev,
            [currentItem.id]: {
                selected: true,
                quantity: quantity
            }
        }));

        setShowPartialModal(false);
        setCurrentItem(null);
        setPartialQuantity('');
    };

    const calculateTotalToReceive = () => {
        let totalItems = 0;
        let totalValue = 0;

        Object.entries(selectedItems).forEach(([itemId, data]) => {
            if (data.selected && data.quantity > 0) {
                const item = items.find(i => i.id === parseInt(itemId));
                if (item) {
                    totalItems++;
                    totalValue += data.quantity * item.unit_price;
                }
            }
        });

        return { totalItems, totalValue };
    };

    const handleSubmit = async () => {
        // Filter selected items with positive quantity
        const itemsToReceive = [];
        Object.entries(selectedItems).forEach(([itemId, data]) => {
            if (data.selected && data.quantity > 0) {
                itemsToReceive.push({
                    id: parseInt(itemId),
                    quantity: data.quantity
                });
            }
        });

        if (itemsToReceive.length === 0) {
            toast.error('Please select at least one item to receive');
            return;
        }

        if (window.confirm(`Are you sure you want to receive ${itemsToReceive.length} item(s) for this order? This will update inventory levels.`)) {
            setSubmitting(true);
            try {
                // Process each item
                for (const item of itemsToReceive) {
                    const result = await supplierOrderService.markOrderAsReceived(order.id);
                    if (!result.success) {
                        throw new Error(`Failed to receive item`);
                    }
                }

                toast.success('Order items received successfully! Inventory has been updated.');
                navigate('/inventory/supplier-orders');
            } catch (error) {
                console.error('Error receiving order:', error);
                toast.error('Failed to receive order items. Please try again.');
            } finally {
                setSubmitting(false);
            }
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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'PENDING': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
            'RECEIVED': { color: 'bg-blue-100 text-blue-800', icon: FileText },
            'ACCEPTED': { color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
            'DELIVERED': { color: 'bg-green-100 text-green-800', icon: Truck },
            'CANCELLED': { color: 'bg-red-100 text-red-800', icon: AlertCircle }
        };

        const config = statusConfig[status] || statusConfig.PENDING;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                <Icon className="w-4 h-4 mr-1.5" />
                {status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 font-medium">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h3>
                    <p className="text-gray-600 mb-6">The order you're looking for doesn't exist.</p>
                    <Link
                        to="/inventory/supplier-orders"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Orders
                    </Link>
                </div>
            </div>
        );
    }

    const isOrderCompleted = order.status === 'DELIVERED';
    const isOrderCancelled = order.status === 'CANCELLED';
    const { totalItems, totalValue } = calculateTotalToReceive();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/inventory/supplier-orders')}
                                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 mr-1" />
                                <span>Back to Orders</span>
                            </button>
                            <div className="h-6 w-px bg-gray-300"></div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 flex items-center">
                                    <Truck className="w-5 h-5 mr-2 text-green-600" />
                                    Receive Supplier Order
                                </h1>
                                <p className="text-sm text-gray-500">
                                    Receive items from supplier and update inventory
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            {!isOrderCompleted && !isOrderCancelled && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || totalItems === 0}
                                    className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    {submitting ? (
                                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                    )}
                                    Confirm Receipt
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">
                    {/* Order Summary */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Order Name</p>
                                    <p className="font-medium text-gray-900">{order.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">{order.order_number}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Supplier</p>
                                    <div className="flex items-center">
                                        <Users className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="font-medium text-gray-900">{order.supplier_name}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Order Date</p>
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-gray-900">{formatDate(order.order_date)}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Status</p>
                                    {getStatusBadge(order.status)}
                                </div>
                            </div>

                            {order.expected_delivery_date && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-center">
                                        <Truck className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-600">Expected Delivery: </span>
                                        <span className="ml-2 font-medium text-gray-900">{formatDate(order.expected_delivery_date)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Receive Items */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Receive Items</h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Select items to receive and specify quantities
                                    </p>
                                </div>
                                {!isOrderCompleted && !isOrderCancelled && (
                                    <div className="text-sm text-green-600">
                                        <Package className="w-4 h-4 inline mr-1" />
                                        {totalItems} item(s) selected
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6">
                            {isOrderCompleted ? (
                                <div className="text-center py-12">
                                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Already Delivered</h3>
                                    <p className="text-gray-600">This order has already been marked as delivered.</p>
                                </div>
                            ) : isOrderCancelled ? (
                                <div className="text-center py-12">
                                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Cancelled</h3>
                                    <p className="text-gray-600">This order has been cancelled and cannot be received.</p>
                                </div>
                            ) : items.length === 0 ? (
                                <div className="text-center py-12">
                                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Items Found</h3>
                                    <p className="text-gray-600">This order has no items to receive.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                                                        Select
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Material
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Ordered
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Previously Received
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Remaining
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Unit Price
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Quantity to Receive
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Subtotal
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {items.map((item) => {
                                                    const isFullyReceived = item.is_received;
                                                    const remaining = item.remaining_quantity;
                                                    const selected = selectedItems[item.id]?.selected || false;
                                                    const receiveQuantity = selectedItems[item.id]?.quantity || 0;
                                                    const subtotal = receiveQuantity * item.unit_price;

                                                    if (isFullyReceived) {
                                                        return (
                                                            <tr key={item.id} className="bg-gray-50">
                                                                <td className="px-4 py-3">
                                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                                </td>
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
                                                                <td colSpan="6" className="px-4 py-3 text-center text-sm text-green-600">
                                                                    <CheckCircle className="w-4 h-4 inline mr-1" />
                                                                    Fully Received
                                                                </td>
                                                            </tr>
                                                        );
                                                    }

                                                    return (
                                                        <tr key={item.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selected}
                                                                    onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                                />
                                                            </td>
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
                                                            <td className="px-4 py-3 text-right text-sm text-gray-600">
                                                                {item.received_quantity.toLocaleString()}
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-sm font-medium text-blue-600">
                                                                {remaining.toLocaleString()}
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-sm text-gray-900">
                                                                {formatCurrency(item.unit_price)}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <div className="flex items-center justify-center space-x-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (selected) {
                                                                                const newQuantity = Math.max(0, receiveQuantity - 1);
                                                                                handleQuantityChange(item.id, newQuantity);
                                                                            }
                                                                        }}
                                                                        disabled={!selected}
                                                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                                                    >
                                                                        <Minus className="w-4 h-4" />
                                                                    </button>
                                                                    <input
                                                                        type="number"
                                                                        value={receiveQuantity}
                                                                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                                        disabled={!selected}
                                                                        className="w-24 px-2 py-1 text-center text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                                                        step="1"
                                                                        min="0"
                                                                        max={remaining}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (selected) {
                                                                                const newQuantity = Math.min(remaining, receiveQuantity + 1);
                                                                                handleQuantityChange(item.id, newQuantity);
                                                                            }
                                                                        }}
                                                                        disabled={!selected}
                                                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                                                    >
                                                                        <Plus className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openPartialReceiveModal(item)}
                                                                        className="ml-1 p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                        title="Receive all remaining"
                                                                    >
                                                                        <Package className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                                                                {selected && receiveQuantity > 0 ? formatCurrency(subtotal) : '-'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            {totalItems > 0 && (
                                                <tfoot className="bg-gray-50 border-t border-gray-200">
                                                    <tr>
                                                        <td colSpan="6" className="px-4 py-3 text-right font-medium text-gray-900">
                                                            Total to Receive:
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-bold text-gray-900">
                                                            {totalItems} item(s)
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold text-green-600">
                                                            {formatCurrency(totalValue)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>
                                    </div>

                                    {/* Summary Cards */}
                                    {totalItems > 0 && (
                                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                                                <div className="flex items-center">
                                                    <div className="p-2 bg-blue-200 rounded-lg">
                                                        <Package className="w-5 h-5 text-blue-700" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm text-blue-700 font-medium">Items to Receive</p>
                                                        <p className="text-2xl font-bold text-blue-900">
                                                            {totalItems}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                                                <div className="flex items-center">
                                                    <div className="p-2 bg-green-200 rounded-lg">
                                                        <DollarSign className="w-5 h-5 text-green-700" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm text-green-700 font-medium">Total Value</p>
                                                        <p className="text-2xl font-bold text-green-900">
                                                            {formatCurrency(totalValue)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                                                <div className="flex items-center">
                                                    <div className="p-2 bg-purple-200 rounded-lg">
                                                        <ShoppingBag className="w-5 h-5 text-purple-700" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm text-purple-700 font-medium">Order Status</p>
                                                        <p className="text-lg font-bold text-purple-900">
                                                            {order.status}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Notes Section */}
                    {order.notes && (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-lg font-semibold text-gray-900">Order Notes</h2>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-700">{order.notes}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Partial Receive Modal */}
            {showPartialModal && currentItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Receive Items</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {currentItem.material_name}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowPartialModal(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quantity to Receive
                                </label>
                                <input
                                    type="number"
                                    value={partialQuantity}
                                    onChange={(e) => setPartialQuantity(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    step="1"
                                    min="0"
                                    max={currentItem.remaining_quantity}
                                />
                                <p className="mt-2 text-sm text-gray-500">
                                    Available: {currentItem.remaining_quantity.toLocaleString()} units
                                </p>
                            </div>

                            <div className="bg-blue-50 rounded-lg p-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-blue-600">Total Cost:</span>
                                    <span className="text-lg font-semibold text-blue-900">
                                        {formatCurrency(parseFloat(partialQuantity || 0) * currentItem.unit_price)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => setShowPartialModal(false)}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePartialReceive}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Add to Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplierOrderReceive;