import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../api';
import { toast } from 'react-toastify';
import {
    User,
    Mail,
    Phone,
    Shield,
    Key,
    UserPlus,
    ArrowLeft,
    ArrowRight,
    Loader2,
    Eye,
    EyeOff,
    Briefcase,
    Building,
    Users
} from 'lucide-react';

export default function AddUserForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
        role: 'MANAGER',
        phone: '',
        is_verified: false
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.password_confirm) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const userData = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                password_confirm: formData.password_confirm,
                first_name: formData.first_name,
                last_name: formData.last_name,
                role: formData.role,
                phone: formData.phone,
                is_verified: formData.is_verified
            };

            const result = await authService.register(userData);

            if (result.success) {
                toast.success('User created successfully!');
                navigate('/inventory/users/list');
            } else {
                const errorMsg = typeof result.error === 'object'
                    ? Object.values(result.error).flat()[0]
                    : result.message;
                toast.error(errorMsg || 'User creation failed');
            }
        } catch (error) {
            console.log(error)
            toast.error('Network error. Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    };
    const roleOptions = [
        { value: 'ADMIN', label: 'Administrator', icon: Shield },
        { value: 'MANAGER', label: 'Manager', icon: Briefcase }
    ];

    return (
        <div className="space-y-3 max-w-5xl mx-auto  ">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <UserPlus className="w-6 h-6 mr-3 text-blue-600" />
                        Add New User
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Create a new user account for inventory management
                    </p>
                </div>

                <Link
                    to="/inventory/users/list"
                    className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Users
                </Link>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Role</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {roleOptions.map((role) => (
                                    <div
                                        key={role.value}
                                        onClick={() => setFormData(prev => ({ ...prev, role: role.value }))}
                                        className={`p-1 border-2 rounded-xl cursor-pointer transition-all duration-200 ${formData.role === role.value
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${formData.role === role.value ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                                <role.icon className={`w-4 h-4 ${formData.role === role.value ? 'text-blue-600' : 'text-gray-600'}`} />
                                            </div>
                                            <div>
                                                <div className="font-medium">{role.label}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        First Name *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 text-gray-400">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            placeholder="John"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Last Name *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 text-gray-400">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            placeholder="Doe"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Username *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 text-gray-400">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            placeholder="johndoe123"
                                            required
                                        />
                                    </div>
                                </div>
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
                                            placeholder="john@company.com"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
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
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Selected Role
                                    </label>
                                    <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-100">
                                                {roleOptions.find(r => r.value === formData.role)?.icon &&
                                                    React.createElement(roleOptions.find(r => r.value === formData.role).icon, {
                                                        className: "w-4 h-4 text-blue-600"
                                                    })
                                                }
                                            </div>
                                            <span className="font-medium text-gray-900">
                                                {roleOptions.find(r => r.value === formData.role)?.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Password *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 text-gray-400">
                                            <Key className="w-5 h-5" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            placeholder="At least 8 characters"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm Password *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 text-gray-400">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password_confirm"
                                            value={formData.password_confirm}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            placeholder="Confirm your password"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className=" border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-gray-600 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${{
                                            'ADMIN': 'bg-red-100 text-red-800',
                                            'MANAGER': 'bg-blue-100 text-blue-800',
                                        }[formData.role]}`}>
                                            {roleOptions.find(r => r.value === formData.role)?.label}
                                        </div>
                                        <span>Selected Role</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Link
                                        to="/inventory/users/list"
                                        className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Creating User...</span>
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="w-4 h-4" />
                                                <span>Create User</span>
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