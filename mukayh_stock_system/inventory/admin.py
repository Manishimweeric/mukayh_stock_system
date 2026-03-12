# admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Category, Supplier, Material,
    StockMovement, DemandForecast, Alert, StockAnalytics
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active']
    list_filter = ['role', 'is_active', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone', 'is_verified')}),
    )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name']
    ordering = ['name']


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact_person', 'email', 'phone', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'contact_person', 'email']
    ordering = ['name']


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = [
        'sku', 'name', 'category', 'supplier', 'unit',
        'unit_price', 'current_stock', 'reorder_level', 'is_active'
    ]
    list_filter = ['category', 'supplier', 'unit', 'is_active']
    search_fields = ['name', 'sku', 'description']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = [
        'material', 'movement_type', 'quantity',
        'previous_stock', 'new_stock', 'created_by', 'created_at'
    ]
    list_filter = ['movement_type', 'created_at']
    search_fields = ['material__name', 'reference_number']
    ordering = ['-created_at']
    readonly_fields = ['previous_stock', 'new_stock', 'created_at']


@admin.register(DemandForecast)
class DemandForecastAdmin(admin.ModelAdmin):
    list_display = [
        'material', 'forecast_date', 'predicted_demand',
        'confidence_score', 'actual_demand', 'algorithm_used'
    ]
    list_filter = ['forecast_date', 'algorithm_used']
    search_fields = ['material__name']
    ordering = ['-forecast_date']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = [
        'alert_type', 'priority', 'material', 'title',
        'is_resolved', 'resolved_by', 'created_at'
    ]
    list_filter = ['alert_type', 'priority', 'is_resolved']
    search_fields = ['title', 'message', 'material__name']
    ordering = ['-created_at']
    readonly_fields = ['created_at']


@admin.register(StockAnalytics)
class StockAnalyticsAdmin(admin.ModelAdmin):
    list_display = [
        'date', 'total_stock_value', 'total_materials',
        'low_stock_items', 'overstock_items', 'stock_turnover_rate'
    ]
    list_filter = ['date']
    ordering = ['-date']
    readonly_fields = ['created_at', 'updated_at']