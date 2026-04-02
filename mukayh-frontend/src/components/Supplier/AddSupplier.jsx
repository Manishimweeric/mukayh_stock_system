import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    Building,
    User,
    Mail,
    Phone,
    MapPin,
    ArrowLeft,
    Save,
    Loader2,
    Truck,
    CheckCircle,
    XCircle,
    Lock,
    Eye,
    EyeOff,
    ShieldCheck
} from 'lucide-react';

import { supplierService } from '../../api';

export default function AddSupplierForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        is_active: true
    });

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
            toast.error("Supplier name is required");
            return;
        }

        if (!formData.contact_person.trim()) {
            toast.error("Contact person is required");
            return;
        }

        if (!formData.email.trim()) {
            toast.error("Email is required");
            return;
        }

        if (!formData.phone.trim()) {
            toast.error("Phone number is required");
            return;
        }

        if (!formData.password.trim()) {
            toast.error("Password is required");
            return;
        }

        if (formData.password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        setLoading(true);

        try {
            const nameParts = formData.contact_person.trim().split(' ');
            const userFirstName = nameParts[0];
            const userLastName = nameParts.slice(1).join(' ') || '-';

            const supplierData = {
                name: formData.name.trim(),
                contact_person: formData.contact_person.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                address: formData.address.trim(),
                is_active: formData.is_active,
                user_email: formData.email.trim(),
                user_first_name: formData.name.trim(),
                user_last_name: userLastName,
                user_password: formData.password,
            };

            const result = await supplierService.createSupplier(supplierData);

            if (result.success) {
                toast.success('Supplier created successfully!');
                navigate('/inventory/suppliers/list');
            } else {
                const errorMsg = typeof result.error === 'object'
                    ? Object.values(result.error).flat()[0]
                    : result.message || 'Supplier creation failed';
                toast.error(errorMsg);
            }
        } catch (error) {
            console.error('Error creating supplier:', error);
            toast.error('Network error. Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    const isSubmitDisabled =
        loading ||
        !formData.name.trim() ||
        !formData.contact_person.trim() ||
        !formData.email.trim() ||
        !formData.phone.trim() ||
        !formData.password.trim();

    return (
        <div className="space-y-3 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Truck className="w-6 h-6 mr-3 text-blue-600" />
                        Add New Supplier
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Add a new supplier for construction materials
                    </p>
                </div>

                <Link
                    to="/inventory/suppliers/list"
                    className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Suppliers
                </Link>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* ── Supplier Info ── */}
                        <div>
                            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Building className="w-4 h-4 text-blue-500" />
                                Supplier Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Supplier Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Supplier Name *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 text-gray-400">
                                            <Building className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            placeholder="ABC Construction Supplies"
                                            required
                                            maxLength={200}
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">Maximum 200 characters</p>
                                </div>

                                {/* Contact Person */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Contact Person *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 text-gray-400">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="text"
                                            name="contact_person"
                                            value={formData.contact_person}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            placeholder="John Doe"
                                            required
                                            maxLength={100}
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        First and last name — used for the user account
                                    </p>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 text-gray-400">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            placeholder="contact@supplier.com"
                                            required
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Also used as the supplier's login email
                                    </p>
                                </div>

                                {/* Phone */}
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
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            placeholder="+1 (555) 123-4567"
                                            required
                                            maxLength={15}
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">Maximum 15 characters</p>
                                </div>
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Address
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-3 text-gray-400">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none"
                                    placeholder="123 Main Street, City, State, ZIP Code"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Full address of the supplier</p>
                        </div>

                        {/* ── User Account Section ── */}
                        <div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
                            <h2 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-blue-500" />
                                Supplier Login Account
                            </h2>
                            <p className="text-xs text-gray-500 mb-4">
                                A login account will be created for this supplier using their email and the password below.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Login Email — readonly derived */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Login Email
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 text-gray-400">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            readOnly
                                            className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                                            placeholder="Auto-filled from email above"
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-400">Copied from supplier email</p>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Account Password *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 text-gray-400">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            placeholder="Min. 8 characters"
                                            required
                                            minLength={8}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(v => !v)}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
                                </div>
                            </div>
                        </div>

                        {/* ── Status ── */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Supplier Status</h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs text-gray-500 uppercase">Account Status</span>
                                    <p className="text-sm text-gray-900 mt-1">
                                        {formData.is_active ? (
                                            <span className="flex items-center text-green-600">
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Active — Can supply materials
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-red-600">
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Inactive — Cannot supply materials
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-900">
                                        {formData.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* ── Footer ── */}
                        <div className="pt-6 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-gray-600 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${formData.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {formData.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                        <span>Supplier Status</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Link
                                        to="/inventory/suppliers/list"
                                        className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={isSubmitDisabled}
                                        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Creating Supplier...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                <span>Create Supplier</span>
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