import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Bell, AlertCircle, AlertTriangle, CheckCircle, Clock, Filter,
    RefreshCw, ChevronLeft, ChevronRight, X, Eye, MoreVertical,
    Search, Package, Check, XCircle, User, Calendar
} from 'lucide-react';
import { alertService } from '../../api';
import { toast } from 'react-toastify';

const AlertsList = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [alertsPerPage] = useState(10);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState(null);

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const result = await alertService.getAllAlerts();
            if (result.success) {
                setAlerts(result.data);
            }
        } catch (error) {
            console.error('Error fetching alerts:', error);
            toast.error('Failed to load alerts');
        } finally {
            setLoading(false);
        }
    };

    const getCurrentPageAlerts = () => {
        const indexOfLast = currentPage * alertsPerPage;
        const indexOfFirst = indexOfLast - alertsPerPage;
        return alerts.slice(indexOfFirst, indexOfLast);
    };

    const totalPages = Math.ceil(alerts.length / alertsPerPage);
    const startIndex = (currentPage - 1) * alertsPerPage + 1;
    const endIndex = Math.min(currentPage * alertsPerPage, alerts.length);

    const handleDropdownToggle = (alertId, e) => {
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === alertId ? null : alertId);
    };

    const handleViewDetails = (alert) => {
        setSelectedAlert(alert);
        setShowDetailModal(true);
        setOpenDropdownId(null);
    };

    const handleResolveAlert = async () => {
        if (!selectedAlert) return;

        try {
            const result = await alertService.resolveAlert(selectedAlert.id);
            if (result.success) {
                toast.success('Alert marked as resolved');
                setShowResolveModal(false);
                setShowDetailModal(false);
                fetchAlerts();
            } else {
                toast.error(result.message || 'Failed to resolve alert');
            }
        } catch (error) {
            console.error('Error resolving alert:', error);
            toast.error('Failed to resolve alert');
        }
    };

    const getAlertTypeBadge = (alertType) => {
        const alertTypes = {
            'LOW_STOCK': { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
            'OVERSTOCK': { label: 'Overstock', color: 'bg-purple-100 text-purple-800', icon: Package },
            'REORDER': { label: 'Reorder Required', color: 'bg-orange-100 text-orange-800', icon: Bell },
            'ANOMALY': { label: 'Data Anomaly', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
            'FORECAST': { label: 'Forecast Alert', color: 'bg-blue-100 text-blue-800', icon: Clock }
        };

        const type = alertTypes[alertType] || { label: alertType, color: 'bg-gray-100 text-gray-800', icon: Bell };
        const Icon = type.icon;

        return (
            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${type.color}`}>
                <Icon className="w-3 h-3 mr-1.5" />
                {type.label}
            </span>
        );
    };

    const getPriorityBadge = (priority) => {
        const priorityLevels = {
            'CRITICAL': { label: 'Critical', color: 'bg-red-100 text-red-800', icon: AlertCircle },
            'HIGH': { label: 'High', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
            'MEDIUM': { label: 'Medium', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
            'LOW': { label: 'Low', color: 'bg-blue-100 text-blue-800', icon: Bell }
        };

        const level = priorityLevels[priority] || { label: priority, color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
        const Icon = level.icon;

        return (
            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${level.color}`}>
                <Icon className="w-3 h-3 mr-1.5" />
                {level.label}
            </span>
        );
    };

    const getStatusBadge = (isResolved) => {
        return (
            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${isResolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isResolved ? <CheckCircle className="w-3 h-3 mr-1.5" /> : <Clock className="w-3 h-3 mr-1.5" />}
                {isResolved ? 'Resolved' : 'Unresolved'}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatShortDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading alerts...</p>
                </div>
            </div>
        );
    }

    const currentPageAlerts = getCurrentPageAlerts();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Bell className="w-6 h-6 mr-3 text-blue-600" />
                        System Alerts
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Monitor and manage system notifications and warnings
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={fetchAlerts}
                        className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Alerts Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {alerts.length === 0 ? (
                    <div className="text-center py-12">
                        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
                        <p className="text-gray-500 mb-4">
                            No system alerts available.
                        </p>
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
                                            Alert Details
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Material
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Priority
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentPageAlerts.map((alert, index) => (
                                        <tr key={alert.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-1 whitespace-nowrap">
                                                <span className="text-gray-500">#{startIndex + index}</span>
                                            </td>
                                            <td className="px-6 py-1">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {alert.title}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {alert.message?.length > 100
                                                            ? `${alert.message.substring(0, 100)}...`
                                                            : alert.message}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-1 whitespace-nowrap">
                                                {alert.material_name ? (
                                                    <div className="text-sm text-gray-900">
                                                        {alert.material_name}
                                                        {alert.material_sku && (
                                                            <div className="text-xs text-gray-500">
                                                                SKU: {alert.material_sku}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-1 whitespace-nowrap">
                                                {getAlertTypeBadge(alert.alert_type)}
                                            </td>
                                            <td className="px-6 py-1 whitespace-nowrap">
                                                {getPriorityBadge(alert.priority)}
                                            </td>
                                            <td className="px-6 py-1 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    {getStatusBadge(alert.is_resolved)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-1 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {formatShortDate(alert.created_at)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-1 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => handleDropdownToggle(alert.id, e)}
                                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>

                                                    {openDropdownId === alert.id && (
                                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                                            <button
                                                                onClick={() => handleViewDetails(alert)}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                            >
                                                                <Eye className="w-4 h-4 mr-3 text-gray-400" />
                                                                View Details
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {alerts.length > 0 && (
                            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Showing {startIndex} to {endIndex} of {alerts.length} alerts
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

            {/* Alert Detail Modal */}
            {showDetailModal && selectedAlert && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Alert Details</h2>
                                <p className="text-gray-600 text-sm">ID: {selectedAlert.id}</p>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Alert Header */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                            <Bell className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {selectedAlert.title}
                                            </h3>
                                            <div className="flex items-center space-x-2 mt-2">
                                                {getAlertTypeBadge(selectedAlert.alert_type)}
                                                {getPriorityBadge(selectedAlert.priority)}
                                                {getStatusBadge(selectedAlert.is_resolved)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Alert Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        Alert Information
                                    </h3>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Alert Type</span>
                                            <div className="mt-2">
                                                {getAlertTypeBadge(selectedAlert.alert_type)}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Priority</span>
                                            <div className="mt-2">
                                                {getPriorityBadge(selectedAlert.priority)}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Status</span>
                                            <div className="mt-2">
                                                {getStatusBadge(selectedAlert.is_resolved)}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Created At</span>
                                            <p className="font-semibold text-gray-900">
                                                {formatDate(selectedAlert.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Material Information */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        Related Material
                                    </h3>
                                    {selectedAlert.material_name ? (
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <Package className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{selectedAlert.material_name}</p>
                                                    <p className="text-sm text-gray-600">SKU: {selectedAlert.material_sku}</p>
                                                </div>
                                            </div>
                                            <Link
                                                to={`/inventory/materials/${selectedAlert.material}`}
                                                className="text-sm text-blue-600 hover:text-blue-700"
                                            >
                                                View Material Details →
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                                            <p className="text-gray-500">No material associated with this alert</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Message */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Message
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-gray-900 whitespace-pre-wrap">
                                        {selectedAlert.message}
                                    </p>
                                </div>
                            </div>

                            {/* Resolution Information */}
                            {selectedAlert.is_resolved && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-green-800 mb-3">
                                        Resolution Information
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-xs text-green-600 uppercase">Resolved By</span>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <User className="w-4 h-4 text-green-400" />
                                                <p className="font-semibold text-gray-900">
                                                    {selectedAlert.resolved_by_name || 'System'}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs text-green-600 uppercase">Resolved At</span>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <Calendar className="w-4 h-4 text-green-400" />
                                                <p className="font-semibold text-gray-900">
                                                    {formatDate(selectedAlert.resolved_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
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

export default AlertsList;