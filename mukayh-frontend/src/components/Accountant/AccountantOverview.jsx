import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    Wallet, Search, RefreshCw, X, Calendar, User, Package,
    ArrowUp, RotateCcw, ShoppingBag, Truck, DollarSign, Scale,
    CheckCircle, XCircle, Loader
} from 'lucide-react';
import { accountantService, supplierOrderService } from '../../api';

const TABS = [
    { key: 'supplier_orders', label: 'Requests to Supplier', icon: ShoppingBag },
    { key: 'stock_in', label: 'Stock In', icon: ArrowUp },
    { key: 'returns', label: 'Returns', icon: RotateCcw },
];

const STATUS_COLORS = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    RECEIVED: 'bg-blue-100 text-blue-800',
    ACCEPTED: 'bg-indigo-100 text-indigo-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
};

const ACCOUNTANT_STATUS_COLORS = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
};

const AccountantOverview = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('supplier_orders');
    const [searchTerm, setSearchTerm] = useState('');
    const [overview, setOverview] = useState({ supplier_orders: [], stock_in: [], returns: [] });
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [reviewModal, setReviewModal] = useState(null);
    const [reviewNote, setReviewNote] = useState('');
    const [processingReview, setProcessingReview] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const result = await accountantService.getOverview();
        if (result.success) {
            setOverview({
                supplier_orders: result.data.supplier_orders || [],
                stock_in: result.data.stock_in || [],
                returns: result.data.returns || [],
            });
        } else {
            toast.error(result.message || 'Failed to load accountant overview');
        }
        setLoading(false);
    };

    const openReviewModal = (order, decision) => {
        setReviewModal({ order, decision });
        setReviewNote('');
    };

    const submitReview = async () => {
        if (!reviewModal) return;
        const { order, decision } = reviewModal;

        if (decision === 'REJECTED' && !reviewNote.trim()) {
            toast.error('Please provide a note explaining the rejection');
            return;
        }

        setProcessingReview(true);
        const result = await supplierOrderService.accountantReviewOrder(order.id, {
            decision,
            note: reviewNote.trim(),
        });
        setProcessingReview(false);

        if (result.success) {
            toast.success(decision === 'APPROVED' ? 'Order approved' : 'Order rejected');
            setReviewModal(null);
            setReviewNote('');
            fetchData();
        } else {
            toast.error(result.message || 'Failed to submit review');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('rw-RW', {
            style: 'currency',
            currency: 'RWF',
            currencyDisplay: 'symbol',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Math.round(amount || 0));
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            });
        } catch {
            return 'Invalid date';
        }
    };

    const getFilteredRecords = () => {
        const records = overview[activeTab] || [];
        if (!searchTerm) return records;

        const term = searchTerm.toLowerCase();
        if (activeTab === 'supplier_orders') {
            return records.filter(r =>
                (r.name?.toLowerCase() || '').includes(term) ||
                (r.order_number?.toLowerCase() || '').includes(term) ||
                (r.supplier_name?.toLowerCase() || '').includes(term)
            );
        }
        return records.filter(r =>
            (r.material_name?.toLowerCase() || '').includes(term) ||
            (r.material_sku?.toLowerCase() || '').includes(term) ||
            (r.reference_number?.toLowerCase() || '').includes(term)
        );
    };

    const filteredRecords = getFilteredRecords();

    const getTotals = () => {
        const totalSupplierOrdersCost = overview.supplier_orders.reduce(
            (sum, o) => sum + (parseFloat(o.total_cost) || 0), 0
        );
        const totalStockInValue = overview.stock_in.reduce(
            (sum, m) => sum + (parseFloat(m.total_value_at_buying) || 0), 0
        );
        const totalReturnsValue = overview.returns.reduce(
            (sum, m) => sum + (parseFloat(m.total_value_at_buying) || 0), 0
        );
        const pendingOrders = overview.supplier_orders.filter(
            o => ['PENDING', 'RECEIVED', 'ACCEPTED'].includes(o.status)
        ).length;

        return {
            totalSupplierOrdersCost,
            totalStockInValue,
            totalReturnsValue,
            netStockValue: totalStockInValue - totalReturnsValue,
            pendingOrders,
        };
    };

    const totals = getTotals();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading accountant overview...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Wallet className="w-6 h-6 mr-3 text-blue-600" />
                        Accountant Overview
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Read-only view of all requests to suppliers, stock-in, and returns
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <ShoppingBag className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Total Supplier Orders Cost</p>
                            <p className="text-xl font-semibold text-gray-900">{formatCurrency(totals.totalSupplierOrdersCost)}</p>
                            <p className="text-xs text-gray-400">{totals.pendingOrders} pending</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <ArrowUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Total Stock In Value</p>
                            <p className="text-xl font-semibold text-gray-900">{formatCurrency(totals.totalStockInValue)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <RotateCcw className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Total Returns Value</p>
                            <p className="text-xl font-semibold text-gray-900">{formatCurrency(totals.totalReturnsValue)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Scale className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Net Stock Value (In - Returns)</p>
                            <p className="text-xl font-semibold text-gray-900">{formatCurrency(totals.netStockValue)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const count = (overview[tab.key] || []).length;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key); setSearchTerm(''); }}
                            className={`bg-white rounded-lg border p-4 text-left transition-colors ${
                                activeTab === tab.key ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center">
                                <div className={`p-2 rounded-lg ${activeTab === tab.key ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                    <Icon className={`w-5 h-5 ${activeTab === tab.key ? 'text-blue-600' : 'text-gray-600'}`} />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm text-gray-500">{tab.label}</p>
                                    <p className="text-xl font-semibold text-gray-900">{count}</p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {filteredRecords.length === 0 ? (
                    <div className="text-center py-12">
                        <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
                        <p className="text-gray-500">There is nothing to display for this section yet.</p>
                    </div>
                ) : activeTab === 'supplier_orders' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accountant Review</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredRecords.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td
                                            className="px-6 py-3 cursor-pointer"
                                            onClick={() => setSelectedRecord({ type: 'supplier_orders', data: order })}
                                        >
                                            <div className="text-sm font-medium text-gray-900">{order.name}</div>
                                            <div className="text-xs text-gray-500">{order.order_number}</div>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-900">{order.supplier_name}</td>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${ACCOUNTANT_STATUS_COLORS[order.accountant_status] || 'bg-gray-100 text-gray-800'}`}>
                                                {order.accountant_status || 'PENDING'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-900">{order.total_quantity}</td>
                                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{formatCurrency(order.total_cost)}</td>
                                        <td className="px-6 py-3 text-sm text-gray-500">{formatDate(order.order_date)}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-right">
                                            {(!order.accountant_status || order.accountant_status === 'PENDING') ? (
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => openReviewModal(order, 'APPROVED')}
                                                        className="flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                                        title="Approve Order"
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-1.5" />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => openReviewModal(order, 'REJECTED')}
                                                        className="flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                        title="Reject Order"
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1.5" />
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">Reviewed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Before/After</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredRecords.map((movement) => (
                                    <tr
                                        key={movement.id}
                                        className="hover:bg-gray-50 cursor-pointer"
                                        onClick={() => setSelectedRecord({ type: activeTab, data: movement })}
                                    >
                                        <td className="px-6 py-3">
                                            <div className="text-sm font-medium text-gray-900">{movement.material_name}</div>
                                            <div className="text-xs text-gray-500">SKU: {movement.material_sku}</div>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-900">{movement.quantity}</td>
                                        <td className="px-6 py-3 text-sm text-gray-500">{movement.previous_stock} → {movement.new_stock}</td>
                                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{formatCurrency(movement.total_value_at_buying)}</td>
                                        <td className="px-6 py-3 text-sm text-gray-900">{movement.reference_number || 'N/A'}</td>
                                        <td className="px-6 py-3 text-sm text-gray-900">{movement.created_by_name || 'Unknown'}</td>
                                        <td className="px-6 py-3 text-sm text-gray-500">{formatDate(movement.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedRecord && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">
                                {selectedRecord.type === 'supplier_orders' ? 'Supplier Order Details' : 'Stock Movement Details'}
                            </h2>
                            <button
                                onClick={() => setSelectedRecord(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {selectedRecord.type === 'supplier_orders' ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Order Number</span>
                                            <p className="font-semibold text-gray-900">{selectedRecord.data.order_number}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Status</span>
                                            <p className="font-semibold text-gray-900">{selectedRecord.data.status}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Supplier</span>
                                            <p className="font-semibold text-gray-900">{selectedRecord.data.supplier_name}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Created By</span>
                                            <p className="font-semibold text-gray-900">{selectedRecord.data.created_by_name}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Order Date</span>
                                            <p className="font-semibold text-gray-900">{formatDate(selectedRecord.data.order_date)}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Expected Delivery</span>
                                            <p className="font-semibold text-gray-900">{selectedRecord.data.expected_delivery_date || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Total Quantity</span>
                                            <p className="font-semibold text-gray-900">{selectedRecord.data.total_quantity}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Total Cost</span>
                                            <p className="font-semibold text-blue-600">{formatCurrency(selectedRecord.data.total_cost)}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Accountant Review</span>
                                            <p className="font-semibold text-gray-900">{selectedRecord.data.accountant_status || 'PENDING'}</p>
                                        </div>
                                        {selectedRecord.data.accountant_status !== 'PENDING' && (
                                            <div>
                                                <span className="text-xs text-gray-500 uppercase">Reviewed By</span>
                                                <p className="font-semibold text-gray-900">
                                                    {selectedRecord.data.accountant_reviewed_by_name || 'Unknown'} on {formatDate(selectedRecord.data.accountant_reviewed_at)}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {selectedRecord.data.accountant_note && (
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Accountant Note</span>
                                            <p className="text-gray-900 mt-1">{selectedRecord.data.accountant_note}</p>
                                        </div>
                                    )}

                                    {selectedRecord.data.notes && (
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Notes</span>
                                            <p className="text-gray-900 mt-1">{selectedRecord.data.notes}</p>
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Items</h3>
                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Received</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {(selectedRecord.data.items || []).map(item => (
                                                        <tr key={item.id}>
                                                            <td className="px-4 py-2 text-gray-900">{item.material_name}</td>
                                                            <td className="px-4 py-2 text-gray-900">{item.quantity}</td>
                                                            <td className="px-4 py-2 text-gray-900">{formatCurrency(item.unit_price)}</td>
                                                            <td className="px-4 py-2 text-gray-900">{formatCurrency(item.total_cost)}</td>
                                                            <td className="px-4 py-2 text-gray-900">{item.received_quantity} / {item.quantity}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase">Material</span>
                                        <p className="font-semibold text-gray-900">{selectedRecord.data.material_name}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase">SKU</span>
                                        <p className="font-semibold text-gray-900">{selectedRecord.data.material_sku}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase">Movement Type</span>
                                        <p className="font-semibold text-gray-900">{selectedRecord.data.movement_type}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase">Quantity</span>
                                        <p className="font-semibold text-gray-900">{selectedRecord.data.quantity}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase">Stock Before → After</span>
                                        <p className="font-semibold text-gray-900">{selectedRecord.data.previous_stock} → {selectedRecord.data.new_stock}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase">Buying Price</span>
                                        <p className="font-semibold text-gray-900">{formatCurrency(selectedRecord.data.buying_price)}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase">Value at Buying</span>
                                        <p className="font-semibold text-blue-600">{formatCurrency(selectedRecord.data.total_value_at_buying)}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase">Reference Number</span>
                                        <p className="font-semibold text-gray-900">{selectedRecord.data.reference_number || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-xs text-gray-500 uppercase">Notes</span>
                                        <p className="text-gray-900 mt-1">{selectedRecord.data.notes || 'No notes'}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase">Created By</span>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <p className="font-semibold text-gray-900">{selectedRecord.data.created_by_name || 'Unknown'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase">Created At</span>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <p className="font-semibold text-gray-900">{formatDate(selectedRecord.data.created_at)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => setSelectedRecord(null)}
                                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {reviewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {reviewModal.decision === 'APPROVED' ? 'Approve Order' : 'Reject Order'}
                            </h3>
                            <button
                                onClick={() => setReviewModal(null)}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-gray-600">
                                {reviewModal.decision === 'APPROVED'
                                    ? `Are you sure you want to approve "${reviewModal.order.name}" (${reviewModal.order.order_number})? The supplier will be able to see this order once approved.`
                                    : `Reject "${reviewModal.order.name}" (${reviewModal.order.order_number})? Please explain why.`}
                            </p>

                            {reviewModal.decision === 'REJECTED' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Note <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={reviewNote}
                                        onChange={(e) => setReviewNote(e.target.value)}
                                        rows="4"
                                        placeholder="Explain why this order is being rejected..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => setReviewModal(null)}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitReview}
                                disabled={processingReview}
                                className={`flex items-center px-4 py-2 rounded-lg text-white disabled:opacity-50 ${
                                    reviewModal.decision === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                }`}
                            >
                                {processingReview && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                                {reviewModal.decision === 'APPROVED' ? 'Yes, Approve' : 'Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountantOverview;
