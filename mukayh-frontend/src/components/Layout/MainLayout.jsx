import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    Home, Package, Boxes, Truck, AlertCircle, TrendingUp,
    BarChart3, Users, Settings, Bell, HelpCircle, LogOut,
    Menu, X, Search, ChevronDown, Plus,
    FileText, Download, Upload, RefreshCw, Tag, Warehouse,
    Activity, PieChart, LineChart, BarChart
} from "lucide-react";
import { toast } from 'react-toastify';
import { authService, getCurrentUser } from '../../api';

const menuConfig = [
    {
        name: "Dashboard",
        icon: <Home className="w-5 h-5" />,
        path: "/inventory/dashboard/admin",
        roles: ["ADMIN", "MANAGER", "STAFF"],
        hasSubItems: false,
    },
    {
        name: "Users Management",
        icon: <Users className="w-5 h-5" />,
        path: "/inventory/users/list",
        roles: ["ADMIN"]
    },
    {
        name: "Suppliers",
        icon: <Truck className="w-5 h-5" />,
        path: "/inventory/suppliers/list",
        roles: ["ADMIN", "MANAGER", "SUPPLIER"],
        hasSubItems: true,
        subItems: [
            {
                name: "Suppliers List",
                icon: <Users className="w-4 h-4" />,
                path: "/inventory/suppliers/list",
                roles: ["ADMIN", "MANAGER"]
            },

            {
                name: "Supplier Orders",
                icon: <FileText className="w-4 h-4" />,
                path: "/inventory/supplier-orders/list",
                roles: ["ADMIN", "MANAGER"]
            },
            {
                name: "Supplier",
                icon: <FileText className="w-4 h-4" />,
                path: "/inventory/supplier-orders/supplier",
                roles: ["SUPPLIER"]
            },
        ]
    },
    {
        name: "Customers",
        icon: <Truck className="w-5 h-5" />,
        path: "/inventory/customers/list",
        roles: ["ADMIN", "MANAGER"],
        hasSubItems: false,
    },
    {
        name: "Inventory",
        icon: <Package className="w-5 h-5" />,
        path: "/inventory/items",
        roles: ["ADMIN", "MANAGER", "STAFF"],
        hasSubItems: true,
        subItems: [
            {
                name: "All Items",
                icon: <Boxes className="w-4 h-4" />,
                path: "/inventory/items/list",
                roles: ["ADMIN", "MANAGER", "STAFF"],
            },
            {
                name: "Add New Item",
                icon: <Plus className="w-4 h-4" />,
                path: "/inventory/item/add-new",
                roles: ["ADMIN", "MANAGER"],
            },
            {
                name: "Low Stock",
                icon: <AlertCircle className="w-4 h-4" />,
                path: "/inventory/items/low-stock",
                roles: ["ADMIN", "MANAGER", "STAFF"],
            },
            {
                name: "Categories",
                icon: <Tag className="w-4 h-4" />,
                path: "/inventory/categories/list",
                roles: ["ADMIN", "MANAGER"],
            },
            {
                name: "Inventory Analytics",
                icon: <BarChart className="w-4 h-4" />,
                path: "/inventory/analytics/products",
                roles: ["ADMIN", "MANAGER"],
            },
            {
                name: "Materials Reports",
                icon: <BarChart className="w-4 h-4" />,
                path: "/inventory/analytics/materials",
                roles: ["ADMIN", "MANAGER"],
            },

        ],
    },
    {
        name: "Stock Movement",
        icon: <TrendingUp className="w-5 h-5" />,
        path: "/inventory/movements",
        roles: ["ADMIN", "MANAGER", "STAFF"],
        hasSubItems: true,
        subItems: [
            {
                name: "All Movements",
                icon: <Activity className="w-4 h-4" />,
                path: "/inventory/stock/movement/list",
                roles: ["ADMIN", "MANAGER", "STAFF"],
            },
            {
                name: "Stock In / Out",
                icon: <Download className="w-4 h-4" />,
                path: "/inventory/stock/movement",
                roles: ["ADMIN", "MANAGER"],
            },

        ],
    },

    {
        name: "Sales Transactions",
        icon: <TrendingUp className="w-5 h-5" />,
        path: "/inventory/sales",
        roles: ["ADMIN", "MANAGER", "STAFF"],
        hasSubItems: true,
        subItems: [
            {
                name: "Comprehensive Analytics",
                icon: <PieChart className="w-4 h-4" />,
                path: "/inventory/sales/comprehensive",
                roles: ["ADMIN", "MANAGER"],
            },
            {
                name: "Analytics",
                icon: <LineChart className="w-4 h-4" />,
                path: "/inventory/sales/analytics",
                roles: ["ADMIN", "MANAGER"],
            },
            {
                name: "Summary",
                icon: <BarChart3 className="w-4 h-4" />,
                path: "/inventory/sales/summary",
                roles: ["ADMIN", "MANAGER"],
            },
            {
                name: "Sales List",
                icon: <Activity className="w-4 h-4" />,
                path: "/inventory/sales/list",
                roles: ["ADMIN", "MANAGER", "STAFF"],
            },

        ],
    },
    {
        name: "Inventory Alerts",
        icon: <Bell className="w-5 h-5" />,
        path: "/inventory/alerts",
        roles: ["ADMIN", "MANAGER", "STAFF"],
        hasSubItems: false,
    },

];

const getFilteredMenuItems = (userData) => {
    if (!userData) return [];

    const userRole = userData.role?.toUpperCase();

    return menuConfig.filter(item => {
        const hasAccess = item.roles.some(role => role === userRole);
        if (!hasAccess) return false;

        if (item.hasSubItems) {
            const filteredSubItems = item.subItems.filter(subItem =>
                subItem.roles.some(role => role === userRole)
            );
            return filteredSubItems.length > 0;
        }

        return true;
    }).map(item => {
        if (item.hasSubItems) {
            const filteredSubItems = item.subItems.filter(subItem =>
                subItem.roles.some(role => role === userRole)
            );
            return { ...item, subItems: filteredSubItems };
        }
        return item;
    });
};

const getInitialUserData = () => {
    try {
        const storedUserData = getCurrentUser();
        if (!storedUserData) {
            return null;
        }

        const fullName = storedUserData.full_name || 'User';
        const firstName = fullName.split(' ')[0] || 'User';
        const lastName = fullName.split(' ')[1] || '';

        return {
            id: storedUserData.id,
            fullName: fullName || 'User',
            firstName: firstName,
            lastName: lastName,
            email: storedUserData.email || 'user@inventory.com',
            role: storedUserData.role || 'STAFF',
            avatarColor: getRandomColor()
        };
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
};

const getRandomColor = () => {
    const colors = [
        'bg-gradient-to-r from-emerald-500 to-teal-600',
        'bg-gradient-to-r from-blue-500 to-cyan-500',
        'bg-gradient-to-r from-indigo-500 to-purple-500',
        'bg-gradient-to-r from-amber-500 to-orange-500',
        'bg-gradient-to-r from-rose-500 to-pink-500'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};

const InventoryLayout = ({ activePage, onPageChange }) => {
    const [userData, setUserData] = useState(getInitialUserData);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState({});
    const [notifications] = useState(5);
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = useMemo(() =>
        getFilteredMenuItems(userData),
        [userData]
    );

    useEffect(() => {
        if (userData === null) {
            navigate("/login");
        }
    }, [userData, navigate]);

    useEffect(() => {
        if (menuItems.length > 0) {
            const currentPath = location.pathname;
            const mainItem = menuItems.find(item =>
                item.path === currentPath ||
                item.subItems?.some(sub => sub.path === currentPath)
            );

            if (mainItem && mainItem.hasSubItems) {
                setExpandedMenus(prev => ({
                    ...prev,
                    [mainItem.path]: true
                }));
            }
        }
    }, [menuItems, location.pathname]);

    const handleMenuClick = (path, hasSubItems = false) => {
        if (hasSubItems) {
            setExpandedMenus(prev => ({
                ...prev,
                [path]: !prev[path]
            }));
        } else {
            if (onPageChange) {
                const pageId = path.split('/').pop();
                onPageChange(pageId);
            }
            navigate(path);
            if (window.innerWidth < 1024) {
                setSidebarOpen(false);
            }
        }
    };

    const handleSubMenuClick = (path) => {
        if (onPageChange) {
            const pageId = path.split('/').pop();
            onPageChange(pageId);
        }
        navigate(path);
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    };

    const handleLogout = async () => {
        try {
            await authService.logout();
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Error logging out');
        }
    };

    if (userData === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-700 font-medium">Loading Inventory System...</p>
                </div>
            </div>
        );
    }

    const getActiveMenuName = () => {
        for (const item of menuItems) {
            if (item.path === location.pathname) return item.name;
            if (item.subItems) {
                const subItem = item.subItems.find(sub => sub.path === location.pathname);
                if (subItem) return subItem.name;
            }
        }
        return 'Dashboard';
    };

    const getRoleDisplayName = (role) => {
        switch (role) {
            case 'ADMIN':
                return 'Administrator';
            case 'MANAGER':
                return 'Inventory Manager';
            case 'STAFF':
                return 'Inventory Staff';
            default:
                return role;
        }
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    const isSubActive = (subItems) => {
        return subItems?.some(sub => location.pathname === sub.path);
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-[#0F172A] text-gray-800 
                transform transition-all duration-300 ease-in-out shadow-xl
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
            `}>
                <div className="flex items-center justify-between h-20 px-6 border-b border-slate-800/50">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center">
                            <Warehouse className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">MUKAYH</h1>
                            <p className="text-xs text-slate-400">Inventory Management</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-3 py-6 h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar">
                    <nav className="space-y-1">
                        {menuItems.map((item, index) => (
                            <div key={`${item.path}-${index}`}>
                                <button
                                    onClick={() => handleMenuClick(item.path, item.hasSubItems)}
                                    className={`
                                        w-full flex items-center justify-between px-4 py-3 rounded-lg text-left
                                        transition-all duration-200 group relative
                                        ${(isActive(item.path) || isSubActive(item.subItems))
                                            ? 'bg-indigo-600/20 text-white border-l-4 border-indigo-500'
                                            : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                                        }
                                    `}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`
                                            transition-colors duration-200
                                            ${(isActive(item.path) || isSubActive(item.subItems))
                                                ? 'text-indigo-300'
                                                : 'text-slate-400 group-hover:text-indigo-300'
                                            }
                                        `}>
                                            {item.icon}
                                        </div>
                                        <span className="font-medium text-sm">
                                            {item.name}
                                        </span>
                                    </div>
                                    {item.hasSubItems && (
                                        <ChevronDown className={`
                                            w-4 h-4 transition-transform duration-200
                                            ${expandedMenus[item.path] ? 'rotate-180' : ''}
                                            ${(isActive(item.path) || isSubActive(item.subItems))
                                                ? 'text-indigo-300'
                                                : 'text-slate-500'
                                            }
                                        `} />
                                    )}
                                </button>

                                {item.hasSubItems && expandedMenus[item.path] && (
                                    <div className="ml-5 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                        {item.subItems.map((subItem, subIndex) => (
                                            <button
                                                key={`${subItem.path}-${subIndex}`}
                                                onClick={() => handleSubMenuClick(subItem.path)}
                                                className={`
                                                    w-full flex items-center px-4 py-2.5 rounded-lg text-left
                                                    transition-all duration-200 group
                                                    ${isActive(subItem.path)
                                                        ? 'bg-indigo-600/20 text-white'
                                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                                    }
                                                `}
                                            >
                                                <div className={`
                                                    mr-3 transition-colors duration-200
                                                    ${isActive(subItem.path)
                                                        ? 'text-indigo-300'
                                                        : 'text-slate-500 group-hover:text-indigo-300'
                                                    }
                                                `}>
                                                    {subItem.icon}
                                                </div>
                                                <span className="text-sm">
                                                    {subItem.name}
                                                </span>
                                                {isActive(subItem.path) && (
                                                    <div className="ml-auto w-2 h-2 bg-indigo-400 rounded-full"></div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>

                </div>
            </aside>

            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-72' : 'ml-0'}`}>
                <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
                    <div className="px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6">
                                <button
                                    onClick={() => setSidebarOpen(!sidebarOpen)}
                                    className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                                >
                                    <Menu className="w-5 h-5" />
                                </button>
                                <div className="hidden lg:flex items-center space-x-2">
                                    <span className="text-gray-900 font-bold text-lg">{getActiveMenuName()}</span>
                                    <div className="text-sm text-gray-500 ml-4">
                                        Inventory Management System
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="relative hidden md:block">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-72 pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
                                        placeholder="Search items, suppliers, SKU..."
                                    />
                                </div>

                                <div className="relative">
                                    <button
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        className="flex items-center space-x-3 pl-3 pr-4 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                                    >
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm bg-blue-900`}>
                                            <span className="text-white text-xs font-semibold">
                                                {userData?.firstName?.[0]?.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold text-gray-900 text-sm">
                                                {userData?.firstName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {getRoleDisplayName(userData?.role)}
                                            </p>
                                        </div>
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                    </button>

                                    {dropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <p className="font-semibold text-gray-900">
                                                    {userData?.fullName}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-0.5">{userData?.email}</p>
                                                <div className="mt-2">
                                                    <div className={`inline-flex px-2 py-1 rounded text-xs font-medium ${userData?.role === 'ADMIN'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : userData?.role === 'MANAGER'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-emerald-100 text-emerald-800'
                                                        }`}>
                                                        {getRoleDisplayName(userData?.role)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="py-1">
                                                <button className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left">
                                                    <Settings className="w-4 h-4 mr-3" />
                                                    Account Settings
                                                </button>
                                                <button className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left">
                                                    <HelpCircle className="w-4 h-4 mr-3" />
                                                    Help & Support
                                                </button>
                                                <div className="border-t border-gray-100 my-1"></div>
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors w-full text-left"
                                                >
                                                    <LogOut className="w-4 h-4 mr-3" />
                                                    Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="xl:hidden mt-4 grid grid-cols-2 gap-3">
                        </div>
                    </div>
                </header>
                <main className="max-w-8xl ml-2 mr-2 mx-auto p-6">
                    <Outlet />
                </main>
            </div>
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}
        </div>
    );
};

export default InventoryLayout;