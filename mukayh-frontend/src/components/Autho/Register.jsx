import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../api';
import { toast } from 'react-toastify';
import {
    Mail,
    Lock,
    ArrowRight,
    Loader2,
    Eye,
    EyeOff,
    User,
    Phone,
    ShieldCheck,
    Boxes,
    Fingerprint,
    ChevronDown
} from 'lucide-react';

const RegisterPage = () => {
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
            const result = await authService.register(formData);

            if (result.success) {
                toast.success('Account created successfully!');
                navigate('/login');
            } else {
                const errorMsg = typeof result.error === 'object'
                    ? Object.values(result.error).flat()[0]
                    : result.message;
                toast.error(errorMsg || 'Registration failed');
            }
        } catch (error) {
            console.log(error)
            toast.error('Network error. Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    const InputField = ({ label, icon: Icon, ...props }) => (
        <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest text-emerald-200/50 font-bold ml-1">{label}</label>
            <div className="relative group">
                <Icon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-emerald-200/30 group-focus-within:text-blue-400 transition-colors" />
                <input
                    {...props}
                    className="w-full bg-white/[0.05] border border-white/10 text-white pl-12 pr-4 py-3 rounded-2xl focus:bg-white/[0.08] focus:border-blue-500/50 outline-none transition-all"
                />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#022c22] flex items-center justify-center p-4 lg:p-8 font-sans">
            <div className="w-full max-w-7xl bg-[#064e3b] text-slate-200 flex flex-col lg:flex-row overflow-hidden rounded-3xl shadow-2xl border border-white/5">

                <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 overflow-hidden border-r border-white/10 bg-[#042f2e]">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-20">
                            <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
                                <Boxes size={24} className="text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tighter text-white uppercase">MUKAYH</span>
                        </div>
                        <h1 className="text-5xl xl:text-6xl font-medium text-white leading-tight mb-8">
                            Join the <br />
                            <span className="text-blue-400">intelligence network.</span>
                        </h1>
                    </div>
                    <div className="relative z-10">
                        <div className="space-y-2">
                            <ShieldCheck className="text-blue-400 size-5" />
                            <h4 className="text-white font-medium">Secure Access</h4>
                            <p className="text-sm text-emerald-100/50">Enterprise-grade encryption for all users.</p>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 relative bg-[#042f2e]">
                    <div className="w-full max-w-md">
                        <div className="mb-8">
                            <h2 className="text-3xl font-semibold text-white mb-2">Create Account</h2>
                            <p className="text-emerald-100/50 text-sm">Join the platform to start managing materials.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="First Name" icon={User} name="first_name" placeholder="John" value={formData.first_name} onChange={handleChange} required />
                                <InputField label="Last Name" icon={User} name="last_name" placeholder="Doe" value={formData.last_name} onChange={handleChange} required />
                            </div>

                            <InputField label="Username" icon={Fingerprint} name="username" placeholder="johndoe123" value={formData.username} onChange={handleChange} required />
                            <InputField label="Work Email" icon={Mail} type="email" name="email" placeholder="john@company.com" value={formData.email} onChange={handleChange} required />

                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Phone" icon={Phone} name="phone" placeholder="+1..." value={formData.phone} onChange={handleChange} />
                                <div className="space-y-1.5">
                                    <label className="text-xs uppercase tracking-widest text-emerald-200/50 font-bold ml-1">Role</label>
                                    <div className="relative">
                                        <select
                                            name="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                            className="w-full bg-white/[0.05] border border-white/10 text-white pl-4 pr-10 py-3 rounded-2xl focus:bg-white/[0.08] focus:border-blue-500/50 outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="ADMIN" className="bg-[#042f2e]">Administrator</option>
                                            <option value="MANAGER" className="bg-[#042f2e]">Manager</option>
                                            <option value="WAREHOUSE" className="bg-[#042f2e]">Warehouse Staff</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-emerald-200/30 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs uppercase tracking-widest text-emerald-200/50 font-bold ml-1">Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-emerald-200/30 group-focus-within:text-blue-400 transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full bg-white/[0.05] border border-white/10 text-white pl-11 pr-4 py-3 rounded-2xl focus:bg-white/[0.08] focus:border-blue-500/50 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs uppercase tracking-widest text-emerald-200/50 font-bold ml-1">Confirm</label>
                                    <div className="relative group">
                                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-emerald-200/30 group-focus-within:text-blue-400 transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password_confirm"
                                            value={formData.password_confirm}
                                            onChange={handleChange}
                                            className="w-full bg-white/[0.05] border border-white/10 text-white pl-11 pr-4 py-3 rounded-2xl focus:bg-white/[0.08] focus:border-blue-500/50 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-xs text-emerald-200/50 hover:text-blue-400 transition-colors flex items-center gap-1 ml-1"
                            >
                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                {showPassword ? "Hide Passwords" : "Show Passwords"}
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white text-black hover:bg-blue-50 disabled:opacity-50 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group mt-4 shadow-xl"
                            >
                                {loading ? <Loader2 className="animate-spin size-5" /> : (
                                    <>
                                        <span>Initialize Account</span>
                                        <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-emerald-100/50 text-sm">
                                Already have an account?{' '}
                                <Link to="/login" className="text-blue-400 hover:underline font-medium">Sign In</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;