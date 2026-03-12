import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Layers, Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
    X, Eye, MoreVertical, FolderPlus, Tag, FileText,
    Calendar, Edit, Trash2, AlertCircle, Clock, Info
} from 'lucide-react';
import { toast } from 'react-toastify';
import { categoryService } from '../../api';

const CategoriesList = () => {
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [categoriesPerPage] = useState(10);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        filterCategories();
    }, [categories, searchTerm]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const result = await categoryService.getAllCategories();
            if (result.success) {
                setCategories(result.data);
            } else {
                toast.error('Failed to load categories');
                setCategories([]);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const deleteCategory = async (id) => {
        try {
            const res = await categoryService.deleteCategory(id);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    };

    const filterCategories = () => {
        let filtered = [...categories];

        if (searchTerm) {
            filtered = filtered.filter(category =>
                category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                category.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredCategories(filtered);
        setCurrentPage(1);
    };

    const handleDeleteCategory = async () => {
        if (!categoryToDelete) return;

        setDeleteLoading(true);
        try {
            const result = await deleteCategory(categoryToDelete.id);

            if (result.success) {
                toast.success('Category deleted successfully!');
                setCategories(prev => prev.filter(cat => cat.id !== categoryToDelete.id));
                setShowDeleteModal(false);
                setCategoryToDelete(null);
            } else {
                toast.error(result.error || 'Failed to delete category');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Network error. Could not delete category.');
        } finally {
            setDeleteLoading(false);
        }
    };

    const confirmDelete = (category) => {
        setCategoryToDelete(category);
        setShowDeleteModal(true);
        setOpenDropdownId(null);
    };

    const getCurrentPageCategories = () => {
        const indexOfLast = currentPage * categoriesPerPage;
        const indexOfFirst = indexOfLast - categoriesPerPage;
        return filteredCategories.slice(indexOfFirst, indexOfLast);
    };

    const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage);
    const startIndex = (currentPage - 1) * categoriesPerPage + 1;
    const endIndex = Math.min(currentPage * categoriesPerPage, filteredCategories.length);

    const handleDropdownToggle = (categoryId, e) => {
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === categoryId ? null : categoryId);
    };

    const handleViewDetails = (category) => {
        setSelectedCategory(category);
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
            return 'Invalid date';
        }
    };

    const getMaterialCountBadge = (count) => {
        if (count === undefined || count === null) return null;

        const color = count > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
        return (
            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${color}`}>
                {count} material{count !== 1 ? 's' : ''}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading categories...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Layers className="w-6 h-6 mr-3 text-blue-600" />
                        Categories Management
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage material categories (Cement, Steel, Wood, etc.)
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={fetchCategories}
                        className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>

                    <Link
                        to="/inventory/categories/add"
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <FolderPlus className="w-4 h-4 mr-2" />
                        Add Category
                    </Link>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by category name or description..."
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
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Showing {filteredCategories.length} of {categories.length} categories
                            </div>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
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

            {/* Categories Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {filteredCategories.length === 0 ? (
                    <div className="text-center py-12">
                        <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {categories.length === 0 ? 'No categories found' : 'No matching categories'}
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm
                                ? 'No categories match your search term.'
                                : 'No categories available. Create your first category to get started.'}
                        </p>
                        <Link
                            to="/inventory/categories/add-new"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FolderPlus className="w-4 h-4 mr-2" />
                            {categories.length === 0 ? 'Add First Category' : 'Add New Category'}
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
                                            Category
                                        </th>

                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Materials
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Last Updated
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {getCurrentPageCategories().map((category, index) => (
                                        <tr key={category.id || index} className="hover:bg-gray-50">
                                            <td className="px-6 py-1 whitespace-nowrap">
                                                <span className="text-gray-500">#{startIndex + index}</span>
                                            </td>
                                            <td className="px-6 py-1">
                                                <div className="flex items-center">

                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {category.name || 'Unnamed Category'}
                                                        </div>

                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-1 whitespace-nowrap">
                                                {getMaterialCountBadge(category.material_count)}
                                            </td>
                                            <td className="px-6 py-1 whitespace-nowrap">
                                                <div className="flex items-center space-x-1">
                                                    <Calendar className="w-3 h-3 text-gray-400" />
                                                    <span className="text-sm text-gray-900">
                                                        {formatShortDate(category.created_at)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-1 whitespace-nowrap">
                                                <div className="flex items-center space-x-1">
                                                    <Clock className="w-3 h-3 text-gray-400" />
                                                    <span className="text-sm text-gray-900">
                                                        {formatShortDate(category.updated_at)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-1 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => handleDropdownToggle(category.id, e)}
                                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>

                                                    {openDropdownId === category.id && (
                                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                                            <button
                                                                onClick={() => handleViewDetails(category)}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                            >
                                                                <Eye className="w-4 h-4 mr-3 text-gray-400" />
                                                                View Details
                                                            </button>
                                                            <button
                                                                onClick={() => confirmDelete(category)}
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

                        {/* Pagination */}
                        {filteredCategories.length > 0 && (
                            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Showing {startIndex} to {endIndex} of {filteredCategories.length} categories
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

            {/* Category Detail Modal */}
            {showDetailModal && selectedCategory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Category Details</h2>
                                <p className="text-gray-600 text-sm">ID: {selectedCategory.id}</p>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Category Header */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <Layers className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900">
                                                {selectedCategory.name}
                                            </h3>
                                            <div className="flex items-center space-x-2 mt-2">
                                                {getMaterialCountBadge(selectedCategory.material_count)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Category Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <Info className="w-5 h-5 mr-2 text-blue-600" />
                                        Category Information
                                    </h3>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Category Name</span>
                                            <p className="font-semibold text-gray-900 text-lg">{selectedCategory.name}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Category ID</span>
                                            <p className="font-semibold text-gray-900">{selectedCategory.id}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Description</span>
                                            <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                                                {selectedCategory.description || 'No description provided'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Timestamps */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                                        Timestamps
                                    </h3>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Created At</span>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <p className="font-semibold text-gray-900">
                                                    {formatDate(selectedCategory.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Last Updated</span>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                <p className="font-semibold text-gray-900">
                                                    {formatDate(selectedCategory.updated_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                            <Link
                                to={`/inventory/categories/edit/${selectedCategory.id}`}
                                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Category
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

            {/* Delete Confirmation Modal */}
            {showDeleteModal && categoryToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                                Delete Category
                            </h3>
                            <p className="text-gray-600 text-center mb-6">
                                Are you sure you want to delete the category <span className="font-semibold">"{categoryToDelete.name}"</span>?
                                {(categoryToDelete.material_count > 0) && (
                                    <span className="block mt-2 text-red-600">
                                        This category contains {categoryToDelete.material_count} material(s).
                                        Deleting it may affect associated materials.
                                    </span>
                                )}
                            </p>
                            <div className="flex justify-center space-x-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setCategoryToDelete(null);
                                    }}
                                    disabled={deleteLoading}
                                    className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteCategory}
                                    disabled={deleteLoading}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                                >
                                    {deleteLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete Category'
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

export default CategoriesList;