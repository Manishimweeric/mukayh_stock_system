import axios from "axios";
import { toast } from 'react-toastify';

const API_BASE_URL = "http://127.0.0.1:8000/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
    timeout: 30000,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) config.headers.Authorization = `Token ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user_data");
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

const handleError = (error) => {
    let errorMessage = "Request failed";

    if (error.response) {
        const data = error.response.data;

        if (data.detail) {
            errorMessage = data.detail;
        } else if (data.error) {
            errorMessage = data.error;
        } else if (data.errors) {
            const firstKey = Object.keys(data.errors)[0];
            if (Array.isArray(data.errors[firstKey])) {
                errorMessage = data.errors[firstKey][0];
            } else {
                errorMessage = data.errors[firstKey];
            }
        } else if (typeof data === 'object') {
            const firstKey = Object.keys(data)[0];
            if (Array.isArray(data[firstKey])) {
                errorMessage = data[firstKey][0];
            }
        }
    } else if (error.request) {
        errorMessage = "Network error. Please check your connection.";
    }

    // toast.error(errorMessage);
    console.log(errorMessage)

    return {
        success: false,
        message: errorMessage,
        status: error.response?.status || 0,
        details: error.response?.data
    };
};

export const authService = {
    async register(userData) {
        try {
            const res = await api.post("/auth/register/", userData);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async login(email, password) {
        try {
            const res = await api.post("/auth/login/", { email, password });

            if (res.data.token) {
                localStorage.setItem("token", res.data.token);
                localStorage.setItem("user_data", JSON.stringify(res.data.user));
            }
            console.log(res.data)

            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async logout() {
        try {
            await api.post("/auth/logout/");
            toast.info("Logged out successfully");
        } catch (error) {
            console.error("Logout API call failed:", error);
        }
        localStorage.removeItem("token");
        localStorage.removeItem("user_data");
        return { success: true };
    },

    async getCurrentUser() {
        try {
            const res = await api.get("/auth/me/");
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    }
};

// Dashboard Services
export const dashboardService = {
    async getDashboardStats() {
        try {
            const res = await api.get("/dashboard/stats/");
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async getStockTrends() {
        try {
            const res = await api.get("/dashboard/trends/");
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    }
};

export const categoryService = {
    async getAllCategories() {
        try {
            const res = await api.get("/categories/");
            return { success: true, data: res.data.results };
        } catch (error) {
            return handleError(error);
        }
    },

    async getCategoryById(id) {
        try {
            const res = await api.get(`/categories/${id}/`);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async createCategory(categoryData) {
        try {
            const res = await api.post("/categories/", categoryData);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async updateCategory(id, categoryData) {
        try {
            const res = await api.put(`/categories/${id}/`, categoryData);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteCategory(id) {
        try {
            const res = await api.delete(`/categories/${id}/`);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    }
};

export const supplierService = {
    async getAllSuppliers(params = {}) {
        try {
            const res = await api.get("/suppliers/", { params });
            return { success: true, data: res.data.results };
        } catch (error) {
            return handleError(error);
        }
    },

    async getSupplierById(id) {
        try {
            const res = await api.get(`/suppliers/${id}/`);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async createSupplier(supplierData) {
        try {
            const res = await api.post("/suppliers/", supplierData);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async updateSupplier(id, supplierData) {
        try {
            const res = await api.put(`/suppliers/${id}/`, supplierData);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteSupplier(id) {
        try {
            const res = await api.delete(`/suppliers/${id}/`);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    }
};

// Material Services
export const materialService = {
    async getAllMaterials(params = {}) {
        try {
            const res = await api.get("/materials/", { params });
            return { success: true, data: res.data.results };
        } catch (error) {
            return handleError(error);
        }
    },

    async getMaterialById(id) {
        try {
            const res = await api.get(`/materials/${id}/`);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async createMaterial(materialData) {
        try {
            const res = await api.post("/materials/", materialData);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async updateMaterial(id, materialData) {
        try {
            const res = await api.put(`/materials/${id}/`, materialData);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteMaterial(id) {
        try {
            const res = await api.delete(`/materials/${id}/`);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async getLowStockMaterials() {
        try {
            const res = await api.get("/materials/low_stock/");
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async getOverstockMaterials() {
        try {
            const res = await api.get("/materials/overstock/");
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async getStockHistory(materialId) {
        try {
            const res = await api.get(`/materials/${materialId}/stock_history/`);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },
    async searchMaterials(searchTerm) {
        try {
            const res = await api.get('/materials/', {
                params: {
                    search: searchTerm
                }
            });
            return { success: true, data: res.data.results };
        } catch (error) {
            return handleError(error);
        }
    }
};

// Stock Movement Services
export const stockMovementService = {
    async getAllMovements(params = {}) {
        try {
            const res = await api.get("/stock-movements/", { params });
            return { success: true, data: res.data.results };
        } catch (error) {
            return handleError(error);
        }
    },

    async getMovementById(id) {
        try {
            const res = await api.get(`/stock-movements/${id}/`);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async createMovement(movementData) {
        try {
            const res = await api.post("/stock-movements/", movementData);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async getRecentMovements() {
        try {
            const res = await api.get("/stock-movements/recent/");
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    }
};

// Demand Forecast Services
export const demandForecastService = {
    async getAllForecasts(params = {}) {
        try {
            const res = await api.get("/forecasts/", { params });
            return { success: true, data: res.data.results };
        } catch (error) {
            return handleError(error);
        }
    },

    async getForecastById(id) {
        try {
            const res = await api.get(`/forecasts/${id}/`);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async createForecast(forecastData) {
        try {
            const res = await api.post("/forecasts/", forecastData);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async updateForecast(id, forecastData) {
        try {
            const res = await api.put(`/forecasts/${id}/`, forecastData);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteForecast(id) {
        try {
            const res = await api.delete(`/forecasts/${id}/`);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async generateForecasts() {
        try {
            const res = await api.post("/forecasts/generate/");
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    }
};

export const alertService = {
    async getAllAlerts(params = {}) {
        try {
            const res = await api.get("/alerts/", { params });
            return { success: true, data: res.data.results };
        } catch (error) {
            return handleError(error);
        }
    },

    async getAlertById(id) {
        try {
            const res = await api.get(`/alerts/${id}/`);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async createAlert(alertData) {
        try {
            const res = await api.post("/alerts/", alertData);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async updateAlert(id, alertData) {
        try {
            const res = await api.patch(`/alerts/${id}/`, alertData);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async resolveAlert(id) {
        try {
            const res = await api.post(`/alerts/${id}/resolve/`);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async getUnresolvedAlerts() {
        try {
            const res = await api.get("/alerts/unresolved/");
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    }
};

// Analytics Services
export const analyticsService = {
    async getAllAnalytics() {
        try {
            const res = await api.get("/analytics/");
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async getAnalyticsById(id) {
        try {
            const res = await api.get(`/analytics/${id}/`);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    }
};

// User Services
export const userService = {
    async getAllUsers() {
        try {
            const res = await api.get("/users/");
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async getUserById(id) {
        try {
            const res = await api.get(`/users/${id}/`);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async updateUser(id, userData) {
        try {
            const res = await api.put(`/users/${id}/`, userData);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteUser(id) {
        try {
            const res = await api.delete(`/users/${id}/`);
            return { success: true, data: res.data };
        } catch (error) {
            return handleError(error);
        }
    }
};

export const getCurrentUser = () => {
    const userData = localStorage.getItem("user_data");
    if (!userData) return null;
    try {
        return JSON.parse(userData);
    } catch (error) {
        console.error("Error parsing user data:", error);
        return null;
    }
};

export const stockServices = {
    auth: authService,
    dashboard: dashboardService,
    categories: categoryService,
    suppliers: supplierService,
    materials: materialService,
    movements: stockMovementService,
    forecasts: demandForecastService,
    alerts: alertService,
    analytics: analyticsService,
    users: userService,
    getCurrentUser
};

export default api;