import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    UserPlus,
    ArrowLeft,
    Save,
    Loader2,
    User,
    Phone,
    CreditCard,
    CheckCircle
} from 'lucide-react';
import { customerService } from '../../api';

export default function AddCustomerForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone_number: '',
        tin: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error("Customer name is required");
            return;
        }

        if (!formData.phone_number.trim()) {
            toast.error("Phone number is required");
            return;
        }

        setLoading(true);

        try {
            const result = await customerService.createCustomer(formData);

            if (result.success) {
                toast.success('Customer created successfully!');
                navigate('/inventory/customers/list');
            } else {
                const errorMsg = typeof result.message === 'object'
                    ? Object.values(result.message).flat()[0]
                    : result.message || 'Customer creation failed';
                toast.error(errorMsg);
            }
        } catch (error) {
            console.error('Error creating customer:', error);
            toast.error('Network error. Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-3 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <UserPlus className="w-6 h-6 mr-3 text-blue-600" />
                        Add New Customer
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Add a new customer to the system
                    </p>
                </div>

                <Link
                    to="/inventory/customers/list"
                    className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Customers
                </Link>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Customer Name *
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-3 text-gray-400">
                                    <User className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                    placeholder="John Doe or Business Name"
                                    required
                                    maxLength={200}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number *
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-3 text-gray-400">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <input
                                    type="tel"
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                    placeholder="+250 788 123 456"
                                    required
                                    maxLength={15}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                TIN Number (Optional)
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-3 text-gray-400">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    name="tin"
                                    value={formData.tin}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                    placeholder="123456789"
                                    maxLength={50}
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Tax Identification Number (for business customers)
                            </p>
                        </div>

                        <div className="pt-6 border-t border-gray-200">
                            <div className="flex items-center justify-end gap-4">
                                <Link
                                    to="/customers/list"
                                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={loading || !formData.name.trim() || !formData.phone_number.trim()}
                                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Creating Customer...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Create Customer</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}