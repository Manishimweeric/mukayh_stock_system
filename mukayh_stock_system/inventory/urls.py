from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'suppliers', views.SupplierViewSet, basename='supplier')
router.register(r'materials', views.MaterialViewSet, basename='material')
router.register(r'stock-movements', views.StockMovementViewSet, basename='stock-movement')
router.register(r'forecasts', views.DemandForecastViewSet, basename='forecast')
router.register(r'alerts', views.AlertViewSet, basename='alert')
router.register(r'analytics', views.AnalyticsViewSet, basename='analytics')
router.register(r'customers', views.CustomerViewSet, basename='customer')
router.register(r'sales', views.SaleViewSet, basename='sale')
router.register(r'sale-items', views.SaleItemViewSet, basename='sale-item')
router.register(r'customer-analytics',views.CustomerAnalyticsViewSet, basename='customer-analytics')
router.register(r'material-sales-analytics', views.MaterialSalesAnalyticsViewSet, basename='material-sales-analytics')
router.register(r'supplier-orders', views.SupplierOrderViewSet, basename='supplier-order')

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', views.register_user, name='register'),
    path('auth/login/', views.login_user, name='login'),
    path('auth/logout/', views.logout_user, name='logout'),
    path('auth/me/', views.current_user, name='current-user'),
    
    # User management
    path('users/', views.get_all_users, name='get_all_users'),
    
    # Dashboard endpoints
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    path('dashboard/trends/', views.stock_trends, name='stock-trends'),
    path('dashboard/profit-analysis/', views.profit_analysis, name='profit-analysis'),
    
    # Material profit analysis
    path('materials/profit-analysis/', views.MaterialViewSet.as_view({'get': 'profit_analysis'}), name='materials-profit-analysis'),
    
    # Stock movement value analysis
    path('stock-movements/value-summary/', views.StockMovementViewSet.as_view({'get': 'value_summary'}), name='stock-movements-value-summary'),
    
    # Sale item profit summary
    path('sale-items/profit-summary/', views.SaleItemViewSet.as_view({'get': 'profit_summary'}), name='sale-items-profit-summary'),
    
    # Sales analytics endpoints
    path('sales/summary/', views.SaleViewSet.as_view({'get': 'summary'}), name='sales-summary'),
    path('sales/top-selling/', views.SaleViewSet.as_view({'get': 'top_selling'}), name='top-selling'),
    path('sales/daily/', views.SaleViewSet.as_view({'get': 'daily_sales'}), name='daily-sales'),
    
    # Customer analytics endpoints
    path('customers/<int:pk>/purchase-history/', views.CustomerViewSet.as_view({'get': 'purchase_history'}), name='customer-purchase-history'),
    path('customers/<int:pk>/summary/', views.CustomerViewSet.as_view({'get': 'summary'}), name='customer-summary'),

     path(
        'supplier-orders/by-supplier/<int:supplier_id>/',
        views.SupplierOrderViewSet.as_view({'get': 'get_orders_by_supplier'}),
        name='supplier-orders-by-supplier'
    ),

    path('dashboard/summary/', views.dashboard_summary, name='dashboard-summary'),


    path('products/top-selling/', views.top_selling_materials, name='top-selling-materials'),
    path('products/movement-analysis/', views.material_movement_analysis, name='material-movement-analysis'),
    path('products/recommendations/', views.system_recommendations, name='system-recommendations'),
    path('products/expired-notifications/', views.expired_products_notification, name='expired-products-notification'),
    path('customers/top/', views.top_customers, name='top-customers'),
    
    # Include all router URLs
    path('', include(router.urls)),
]