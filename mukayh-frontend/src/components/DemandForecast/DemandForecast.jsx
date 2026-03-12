import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    TrendingUp, Calendar, Filter, RefreshCw, ChevronLeft, ChevronRight,
    X, Eye, Download, Package, AlertCircle, Target, Zap,
    CheckCircle, Clock, Info, Calculator
} from 'lucide-react';
import { demandForecastService, materialService } from '../../api';

const DemandForecastPage = () => {
    const [forecasts, setForecasts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [materialFilter, setMaterialFilter] = useState('All');
    const [materials, setMaterials] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const forecastsResult = await demandForecastService.getAllForecasts();
            const materialsResult = await materialService.getAllMaterials();

            if (forecastsResult.success && Array.isArray(forecastsResult.data)) {
                setForecasts(forecastsResult.data);
            } else {
                toast.error('Failed to load demand forecasts');
                setForecasts([]);
            }

            if (materialsResult.success && Array.isArray(materialsResult.data)) {
                setMaterials(materialsResult.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
            setForecasts([]);
        } finally {
            setLoading(false);
        }
    };

    const getConfidenceColor = (score) => {
        if (score >= 90) return 'bg-green-100 text-green-800';
        if (score >= 70) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    const getStatusIcon = (forecast) => {
        const today = new Date().toISOString().split('T')[0];
        if (forecast.forecast_date < today) {
            return { icon: Clock, color: 'text-gray-500', label: 'Past' };
        } else if (forecast.forecast_date === today) {
            return { icon: AlertCircle, color: 'text-orange-500', label: 'Today' };
        } else {
            const daysUntil = Math.ceil((new Date(forecast.forecast_date) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysUntil <= 7) {
                return { icon: Zap, color: 'text-red-500', label: 'Critical' };
            } else if (daysUntil <= 30) {
                return { icon: Target, color: 'text-blue-500', label: 'Upcoming' };
            } else {
                return { icon: Calendar, color: 'text-green-500', label: 'Future' };
            }
        }
    };

    const formatDate = (dateString) => {
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

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num || 0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading demand forecasts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <TrendingUp className="w-6 h-6 mr-3 text-blue-600" />
                        Demand Forecasting
                    </h1>
                    <p className="text-gray-600 mt-1">
                        AI-powered demand predictions for inventory planning
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Forecast List</h2>
                    <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                        <div className="relative flex-1 max-w-md">
                            <input
                                type="text"
                                placeholder="Search forecasts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={materialFilter}
                            onChange={(e) => setMaterialFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                {forecasts.length === 0 ? (
                    <div className="text-center py-12">
                        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No demand forecasts found
                        </h3>
                        <p className="text-gray-500">
                            No demand forecasts have been generated yet.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Material
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Forecast Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Predicted Demand
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Confidence
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Algorithm
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {forecasts
                                    .filter(forecast => {
                                        if (searchTerm) {
                                            return forecast.material_name?.toLowerCase().includes(searchTerm.toLowerCase());
                                        }
                                        return true;
                                    })
                                    .filter(forecast => materialFilter === 'All' || forecast.material == materialFilter)
                                    .slice(0, 10)
                                    .map((forecast, index) => {
                                        const status = getStatusIcon(forecast);
                                        const StatusIcon = status.icon;
                                        return (
                                            <tr key={forecast.id || index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                            <Package className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {forecast.material_name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                SKU: {forecast.material_sku}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {formatDate(forecast.forecast_date)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {formatNumber(forecast.predicted_demand)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {forecast.material_unit}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${getConfidenceColor(forecast.confidence_score)}`}>
                                                        {forecast.confidence_score}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">
                                                        {forecast.algorithm_used}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm">
                                                        <StatusIcon className={`w-4 h-4 mr-2 ${status.color}`} />
                                                        <span className="text-gray-900">{status.label}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DemandForecastPage;