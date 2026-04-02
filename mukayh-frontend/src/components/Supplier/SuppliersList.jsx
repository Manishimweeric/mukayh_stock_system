import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Truck, Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
    X, Eye, MoreVertical, Building, User, Mail, Phone,
    MapPin, Calendar, Edit, Trash2, AlertCircle, CheckCircle,
    XCircle, ArrowLeft, Plus
} from 'lucide-react';
import { toast } from 'react-toastify';
import { supplierService } from '../../api';

const SuppliersList = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [suppliersPerPage] = useState(10);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState(null);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    useEffect(() => {
        filterSuppliers();
    }, [suppliers, searchTerm, statusFilter]);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const result = await supplierService.getAllSuppliers();
            if (result.success && Array.isArray(result.data)) {
                setSuppliers(result.data);
            } else {
                toast.error('Failed to load suppliers');
                setSuppliers([]);
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            toast.error('Failed to load suppliers');
            setSuppliers([]);
        } finally {
            setLoading(false);
        }
    };

    const filterSuppliers = () => {
        if (!Array.isArray(suppliers)) {
            setFilteredSuppliers([]);
            return;
        }

        let filtered = [...suppliers];

        if (searchTerm) {
            filtered = filtered.filter(supplier =>
                (supplier.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (supplier.contact_person?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (supplier.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (supplier.phone?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== 'All') {
            filtered = filtered.filter(supplier =>
                supplier.is_active === (statusFilter === 'Active')
            );
        }

        setFilteredSuppliers(filtered);
        setCurrentPage(1);
    };

    const handleDeleteSupplier = async () => {
        if (!supplierToDelete) return;

        setDeleteLoading(true);
        try {
            const result = await supplierService.deleteSupplier(supplierToDelete.id);

            if (result.success) {
                toast.success('Supplier deleted successfully!');
                setSuppliers(prev => prev.filter(sup => sup.id !== supplierToDelete.id));
                setShowDeleteModal(false);
                setSupplierToDelete(null);
            } else {
                toast.error(result.error || 'Failed to delete supplier');
            }
        } catch (error) {
            console.error('Error deleting supplier:', error);
            toast.error('Network error. Could not delete supplier.');
        } finally {
            setDeleteLoading(false);
        }
    };

    const confirmDelete = (supplier) => {
        setSupplierToDelete(supplier);
        setShowDeleteModal(true);
        setOpenDropdownId(null);
    };

    const getCurrentPageSuppliers = () => {
        if (!Array.isArray(filteredSuppliers)) return [];

        const indexOfLast = currentPage * suppliersPerPage;
        const indexOfFirst = indexOfLast - suppliersPerPage;
        return filteredSuppliers.slice(indexOfFirst, indexOfLast);
    };

    const totalPages = Math.ceil(filteredSuppliers.length / suppliersPerPage) || 1;
    const startIndex = (currentPage - 1) * suppliersPerPage + 1;
    const endIndex = Math.min(currentPage * suppliersPerPage, filteredSuppliers.length);

    const handleDropdownToggle = (supplierId, e) => {
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === supplierId ? null : supplierId);
    };

    const handleViewDetails = (supplier) => {
        setSelectedSupplier(supplier);
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

    const getStatusBadge = (isActive) => {
        return (
            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isActive ? <CheckCircle className="w-3 h-3 mr-1.5" /> : <XCircle className="w-3 h-3 mr-1.5" />}
                {isActive ? 'Active' : 'Inactive'}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading suppliers...</p>
                </div>
            </div>
        );
    }

    const currentPageSuppliers = getCurrentPageSuppliers();
    const hasSuppliers = Array.isArray(filteredSuppliers) && filteredSuppliers.length > 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Truck className="w-6 h-6 mr-3 text-blue-600" />
                        Suppliers Management
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage all suppliers for construction materials
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={fetchSuppliers}
                        className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>

                    <Link
                        to="/inventory/suppliers/add-new"
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Supplier
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, contact person, email, or phone..."
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-gray-600">
                                Showing {filteredSuppliers.length} of {suppliers.length} suppliers
                            </div>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('All');
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
                {!hasSuppliers ? (
                    <div className="text-center py-12">
                        <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {suppliers.length === 0 ? 'No suppliers found' : 'No matching suppliers'}
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm || statusFilter !== 'All'
                                ? 'No suppliers match your current filters.'
                                : 'No suppliers available. Create your first supplier to get started.'}
                        </p>
                        <Link
                            to="/inventory/suppliers/add-new"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {suppliers.length === 0 ? 'Add First Supplier' : 'Add New Supplier'}
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
                                            Supplier
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Contact
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Added
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentPageSuppliers.map((supplier, index) => (
                                        <tr key={supplier.id || index} className="hover:bg-gray-50">
                                            <td className="px-6 py-1 whitespace-nowrap">
                                                <span className="text-gray-500">#{startIndex + index}</span>
                                            </td>
                                            <td className="px-6 py-1">
                                                <div className="flex items-center">

                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {supplier.name || 'Unnamed Supplier'}
                                                        </div>

                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-1">
                                                <div className="space-y-1">
                                                    <div className="text-xs text-gray-500">
                                                        {supplier.phone}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-1 whitespace-nowrap">
                                                {getStatusBadge(supplier.is_active)}
                                            </td>
                                            <td className="px-6 py-1 whitespace-nowrap">
                                                <div className="flex items-center space-x-1">
                                                    <Calendar className="w-3 h-3 text-gray-400" />
                                                    <span className="text-sm text-gray-900">
                                                        {formatShortDate(supplier.created_at)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-1 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => handleDropdownToggle(supplier.id, e)}
                                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>

                                                    {openDropdownId === supplier.id && (
                                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                                            <button
                                                                onClick={() => handleViewDetails(supplier)}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                            >
                                                                <Eye className="w-4 h-4 mr-3 text-gray-400" />
                                                                View Details
                                                            </button>
                                                            <button
                                                                onClick={() => confirmDelete(supplier)}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-3" />
                                                                Delete
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

                        {hasSuppliers && (
                            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Showing {startIndex} to {endIndex} of {filteredSuppliers.length} suppliers
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

            {showDetailModal && selectedSupplier && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Supplier Details</h2>
                                <p className="text-gray-600 text-sm">ID: {selectedSupplier.id}</p>
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
                                            <Building className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900">
                                                {selectedSupplier.name}
                                            </h3>
                                            <div className="flex items-center space-x-2 mt-2">
                                                {getStatusBadge(selectedSupplier.is_active)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <Building className="w-5 h-5 mr-2 text-blue-600" />
                                        Company Information
                                    </h3>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Supplier Name</span>
                                            <p className="font-semibold text-gray-900 text-lg">{selectedSupplier.name}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Contact Person</span>
                                            <p className="font-semibold text-gray-900">{selectedSupplier.contact_person}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <Phone className="w-5 h-5 mr-2 text-blue-600" />
                                        Contact Information
                                    </h3>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Email Address</span>
                                            <p className="font-semibold text-gray-900">{selectedSupplier.email}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Phone Number</span>
                                            <p className="font-semibold text-gray-900">{selectedSupplier.phone}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                                    Address
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-gray-900 whitespace-pre-wrap">
                                        {selectedSupplier.address || 'No address provided'}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">
                                    Account Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase">Created At</span>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <p className="font-semibold text-gray-900">
                                                {formatDate(selectedSupplier.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase">Last Updated</span>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <p className="font-semibold text-gray-900">
                                                {formatDate(selectedSupplier.updated_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
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

            {showDeleteModal && supplierToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                                Delete Supplier
                            </h3>
                            <p className="text-gray-600 text-center mb-6">
                                Are you sure you want to delete the supplier <span className="font-semibold">"{supplierToDelete.name}"</span>?
                                This action cannot be undone.
                            </p>
                            <div className="flex justify-center space-x-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setSupplierToDelete(null);
                                    }}
                                    disabled={deleteLoading}
                                    className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteSupplier}
                                    disabled={deleteLoading}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                                >
                                    {deleteLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete Supplier'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuppliersList;