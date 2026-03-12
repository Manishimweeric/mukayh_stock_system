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

urlpatterns = [
    path('auth/register/', views.register_user, name='register'),
    path('auth/login/', views.login_user, name='login'),
    path('auth/logout/', views.logout_user, name='logout'),
    path('auth/me/', views.current_user, name='current-user'),
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    path('dashboard/trends/', views.stock_trends, name='stock-trends'),    
    path('users/', views.get_all_users, name='get_all_users'),
    path('', include(router.urls)),
]