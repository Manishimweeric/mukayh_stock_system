import React, { useState, useEffect } from 'react';
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
    Fingerprint,
    Boxes,
    Cpu,
    Globe
} from 'lucide-react';

const LoginPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const savedEmail = localStorage.getItem('last_login_email');
        if (savedEmail) {
            setFormData(prev => ({ ...prev, email: savedEmail }));
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors({ ...errors, [name]: '' });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email.trim()) newErrors.email = 'Required';
        if (!formData.password) newErrors.password = 'Required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const result = await authService.login(formData.email, formData.password);

            if (result.success) {
                navigate("/inventory")
                toast.success('Welcome back! Login successful.');
            } else {
                toast.error('Login failed. Check your credentials. 🤯')
            }
        } catch (error) {
            console.log(error)
            toast.error('Connection failed. Please check your network.');
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="min-h-screen bg-[#022c22] flex items-center justify-center p-4 lg:p-8 font-sans">

            <div className="w-full max-w-7xl  bg-[#064e3b] text-slate-200 flex flex-col lg:flex-row overflow-hidden rounded-3xl shadow-2xl border border-white/5">
                <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 overflow-hidden border-r border-white/10 bg-[#042f2e]">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-20 group cursor-default">
                            <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
                                <Boxes size={24} className="text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tighter text-white uppercase">MUKAYH</span>
                        </div>

                        <h1 className="text-5xl xl:text-6xl font-medium text-white leading-tight tracking-tight mb-8">
                            The future of <br />
                            <span className="text-blue-400">material intelligence.</span>
                        </h1>
                        <p className="text-emerald-100/70 text-lg max-w-md leading-relaxed">
                            Streamline your supply chain with our AI-enhanced procurement engine.
                        </p>
                    </div>

                    <div className="relative z-10 grid grid-cols-2 gap-8 mt-10">
                        <div className="space-y-2">
                            <Globe className="text-blue-400 size-5" />
                            <h4 className="text-white font-medium">Global Network</h4>
                            <p className="text-sm text-emerald-100/50">Real-time tracking across 40+ regions.</p>
                        </div>
                        <div className="space-y-2">
                            <Cpu className="text-blue-400 size-5" />
                            <h4 className="text-white font-medium">Predictive AI</h4>
                            <p className="text-sm text-emerald-100/50">Stockouts reduced by up to 85%.</p>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative bg-[#042f2e]">
                    <div className="w-full max-w-md">
                        <div className="lg:hidden flex items-center gap-2 mb-12">
                            <Boxes size={28} className="text-blue-400" />
                            <span className="text-2xl font-bold tracking-tighter text-white">MUKAYH</span>
                        </div>

                        <div className="mb-10">
                            <h2 className="text-3xl font-semibold text-white mb-2">Portal Access</h2>
                            <p className="text-emerald-100/50 text-sm">Please enter your credentials to continue.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-xs uppercase tracking-widest text-emerald-200/50 font-bold ml-1">Work Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-emerald-200/30 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-white/[0.05] border border-white/10 text-white pl-12 pr-4 py-4 rounded-2xl focus:bg-white/[0.08] focus:border-blue-500/50 outline-none transition-all"
                                        placeholder="Enter email..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs uppercase tracking-widest text-emerald-200/50 font-bold">Password</label>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-emerald-200/30 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-white/[0.05] border border-white/10 text-white pl-12 pr-12 py-4 rounded-2xl focus:bg-white/[0.08] focus:border-blue-500/50 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-200/30 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white text-black hover:bg-blue-50 disabled:opacity-50 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-xl"
                            >
                                {loading ? <Loader2 className="animate-spin size-5" /> : (
                                    <>
                                        <span>Authorize Access</span>
                                        <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <footer className="mt-16 flex items-center justify-between border-t border-white/10 pt-8">
                            <div className="flex items-center gap-2 text-emerald-200/30">
                                <Fingerprint size={16} />
                                <span className="text-[10px] uppercase font-bold tracking-widest">v2.4.0-Secure</span>
                            </div>
                            <span className="text-[10px] text-emerald-200/30 uppercase font-bold tracking-widest">© 2026 MUKAYH</span>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;