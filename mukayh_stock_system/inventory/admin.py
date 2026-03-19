from django.contrib import admin
from django.utils.html import format_html
from .models import (
    User, Category, Supplier, Material, StockMovement,
    DemandForecast, Alert, StockAnalytics, Customer, Sale, SaleItem
)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'phone', 'is_verified', 'is_active', 'created_at']
    list_filter = ['role', 'is_verified', 'is_active']
    search_fields = ['username', 'email', 'phone']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('User Information', {
            'fields': ('username', 'email', 'password', 'role', 'phone')
        }),
        ('Personal Info', {
            'fields': ('first_name', 'last_name')
        }),
        ('Permissions', {
            'fields': ('is_verified', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Important Dates', {
            'fields': ('last_login', 'created_at', 'updated_at')
        }),
    )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'material_count', 'created_at']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']
    
    def material_count(self, obj):
        return obj.materials.count()
    material_count.short_description = 'Materials'


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact_person', 'email', 'phone', 'is_active', 'material_count']
    list_filter = ['is_active']
    search_fields = ['name', 'contact_person', 'email']
    readonly_fields = ['created_at', 'updated_at']
    
    def material_count(self, obj):
        return obj.materials.count()
    material_count.short_description = 'Materials'


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = [
        'sku', 'name', 'category', 'supplier', 'unit',
        'buying_price', 'selling_price', 'profit_margin',
        'current_stock', 'stock_status_colored', 'is_active'
    ]
    list_filter = ['category', 'supplier', 'unit', 'is_active']
    search_fields = ['name', 'sku', 'description']
    readonly_fields = ['created_at', 'updated_at', 'stock_value_at_cost', 'stock_value_at_selling', 'potential_profit']
    list_editable = ['buying_price', 'selling_price', 'is_active']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'sku', 'category', 'supplier', 'description')
        }),
        ('Pricing', {
            'fields': ('unit', 'buying_price', 'selling_price')
        }),
        ('Stock Management', {
            'fields': ('current_stock', 'reorder_level', 'maximum_stock')
        }),
        ('Calculated Values', {
            'fields': ('stock_value_at_cost', 'stock_value_at_selling', 'potential_profit'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active', 'created_at', 'updated_at')
        }),
    )
    
    def profit_margin(self, obj):
        margin = obj.profit_margin_percentage
        color = 'green' if margin > 20 else 'orange' if margin > 10 else 'red'
        return format_html(
            '<span style="color: {};">{}%</span>',
            color,
            round(margin, 2)
        )
    profit_margin.short_description = 'Margin %'
    
    def stock_status_colored(self, obj):
        if obj.is_low_stock:
            return format_html('<span style="color: red; font-weight: bold;">LOW STOCK</span>')
        elif obj.is_overstock:
            return format_html('<span style="color: orange; font-weight: bold;">OVERSTOCK</span>')
        return format_html('<span style="color: green;">Normal</span>')
    stock_status_colored.short_description = 'Stock Status'
    
    def stock_value_at_cost(self, obj):
        return f"{obj.stock_value_at_cost:,.2f} RWF"
    stock_value_at_cost.short_description = 'Value (Cost)'
    
    def stock_value_at_selling(self, obj):
        return f"{obj.stock_value_at_selling:,.2f} RWF"
    stock_value_at_selling.short_description = 'Value (Selling)'
    
    def potential_profit(self, obj):
        return f"{obj.potential_profit:,.2f} RWF"
    potential_profit.short_description = 'Potential Profit'


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'material', 'movement_type_colored', 'quantity',
        'previous_stock', 'new_stock', 'value_at_buying', 'value_at_selling',
        'created_by', 'created_at'
    ]
    list_filter = ['movement_type', 'created_at']
    search_fields = ['material__name', 'material__sku', 'reference_number']
    readonly_fields = ['previous_stock', 'new_stock', 'created_at']
    
    def movement_type_colored(self, obj):
        colors = {
            'IN': 'green',
            'OUT': 'red',
            'ADJUSTMENT': 'blue',
            'RETURN': 'orange',
            'DAMAGED': 'purple'
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colors.get(obj.movement_type, 'black'),
            obj.get_movement_type_display()
        )
    movement_type_colored.short_description = 'Movement Type'
    
    def value_at_buying(self, obj):
        return f"{obj.total_value_at_buying:,.2f} RWF"
    value_at_buying.short_description = 'Value (Cost)'
    
    def value_at_selling(self, obj):
        return f"{obj.total_value_at_selling:,.2f} RWF"
    value_at_selling.short_description = 'Value (Selling)'


@admin.register(DemandForecast)
class DemandForecastAdmin(admin.ModelAdmin):
    list_display = [
        'material', 'forecast_date', 'predicted_demand',
        'confidence_score_colored', 'actual_demand', 'accuracy_colored'
    ]
    list_filter = ['forecast_date', 'algorithm_used']
    search_fields = ['material__name', 'material__sku']
    readonly_fields = ['created_at', 'updated_at']
    
    def confidence_score_colored(self, obj):
        if obj.confidence_score >= 80:
            color = 'green'
        elif obj.confidence_score >= 60:
            color = 'orange'
        else:
            color = 'red'
        return format_html(
            '<span style="color: {};">{}%</span>',
            color,
            obj.confidence_score
        )
    confidence_score_colored.short_description = 'Confidence'
    
    def accuracy_colored(self, obj):
        accuracy = obj.accuracy
        if accuracy is None:
            return 'N/A'
        if accuracy >= 80:
            color = 'green'
        elif accuracy >= 60:
            color = 'orange'
        else:
            color = 'red'
        return format_html(
            '<span style="color: {};">{}%</span>',
            color,
            round(accuracy, 2)
        )
    accuracy_colored.short_description = 'Accuracy'


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'alert_type_colored', 'priority_colored',
        'material', 'is_resolved', 'created_at'
    ]
    list_filter = ['alert_type', 'priority', 'is_resolved', 'created_at']
    search_fields = ['title', 'message', 'material__name']
    readonly_fields = ['created_at']
    
    def alert_type_colored(self, obj):
        colors = {
            'LOW_STOCK': 'red',
            'OVERSTOCK': 'orange',
            'REORDER': 'blue',
            'ANOMALY': 'purple',
            'FORECAST': 'green'
        }
        return format_html(
            '<span style="color: {};">{}</span>',
            colors.get(obj.alert_type, 'black'),
            obj.get_alert_type_display()
        )
    alert_type_colored.short_description = 'Type'
    
    def priority_colored(self, obj):
        colors = {
            'LOW': 'green',
            'MEDIUM': 'orange',
            'HIGH': 'red',
            'CRITICAL': 'darkred'
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colors.get(obj.priority, 'black'),
            obj.get_priority_display()
        )
    priority_colored.short_description = 'Priority'


@admin.register(StockAnalytics)
class StockAnalyticsAdmin(admin.ModelAdmin):
    list_display = [
        'date', 
        'total_stock_value_at_cost', 
        'total_stock_value_at_selling',
        'total_potential_profit',
        'total_materials', 
        'low_stock_items', 
        'overstock_items'
    ]
    list_filter = ['date']
    readonly_fields = ['created_at', 'updated_at']
    
    def total_stock_value_at_cost(self, obj):
        return f"{obj.total_stock_value_at_cost:,.2f} RWF"
    total_stock_value_at_cost.short_description = 'Value (Cost)'
    
    def total_stock_value_at_selling(self, obj):
        return f"{obj.total_stock_value_at_selling:,.2f} RWF"
    total_stock_value_at_selling.short_description = 'Value (Selling)'
    
    def total_potential_profit(self, obj):
        return f"{obj.total_potential_profit:,.2f} RWF"
    total_potential_profit.short_description = 'Potential Profit'


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone_number', 'tin', 'total_sales', 'total_spent', 'created_at']
    search_fields = ['name', 'phone_number', 'tin']
    readonly_fields = ['created_at']
    
    def total_sales(self, obj):
        return obj.sales.count()
    total_sales.short_description = 'Sales Count'
    
    def total_spent(self, obj):
        total = obj.sales.aggregate(total=models.Sum('total_amount'))['total'] or 0
        return f"{total:,.2f} RWF"
    total_spent.short_description = 'Total Spent'


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 1
    readonly_fields = ['subtotal', 'vat_amount', 'total_amount', 'cost_total', 'profit']
    fields = ['material', 'quantity', 'selling_price', 'buying_price', 'vat_rate', 
              'subtotal', 'vat_amount', 'total_amount', 'cost_total', 'profit']


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = [
        'receipt_number', 'customer', 'session_year', 
        'total_amount_colored', 'profit_colored', 'profit_margin',
        'created_by', 'sale_date'
    ]
    list_filter = ['session', 'year', 'sale_date']
    search_fields = ['receipt_number', 'customer__name', 'customer__phone_number']
    readonly_fields = ['receipt_number', 'total_quantity', 'subtotal', 'total_vat', 
                      'total_amount', 'total_cost', 'total_profit', 'sale_date']
    inlines = [SaleItemInline]
    
    fieldsets = (
        ('Sale Information', {
            'fields': ('receipt_number', 'customer', 'session', 'year', 'sale_date')
        }),
        ('Totals', {
            'fields': ('total_quantity', 'subtotal', 'total_vat', 'total_amount', 
                      'total_cost', 'total_profit')
        }),
        ('Additional Info', {
            'fields': ('created_by', 'notes')
        }),
    )
    
    def session_year(self, obj):
        return f"Session {obj.session} - {obj.year}"
    session_year.short_description = 'Session/Year'
    
    def total_amount_colored(self, obj):
        return format_html(
            '<span style="color: green; font-weight: bold;">{:,.2f} RWF</span>',
            obj.total_amount
        )
    total_amount_colored.short_description = 'Total'
    
    def profit_colored(self, obj):
        color = 'green' if obj.total_profit > 0 else 'red'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{:,.2f} RWF</span>',
            color,
            obj.total_profit
        )
    profit_colored.short_description = 'Profit'
    
    def profit_margin(self, obj):
        margin = obj.profit_margin_percentage
        color = 'green' if margin > 20 else 'orange' if margin > 10 else 'red'
        return format_html(
            '<span style="color: {};">{}%</span>',
            color,
            round(margin, 2)
        )
    profit_margin.short_description = 'Margin %'


@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):
    list_display = [
        'sale', 'material', 'quantity', 
        'selling_price', 'buying_price',
        'subtotal', 'profit_colored', 'profit_margin'
    ]
    list_filter = ['sale__sale_date', 'material__category']
    search_fields = ['material__name', 'sale__receipt_number']
    readonly_fields = ['subtotal', 'vat_amount', 'total_amount', 'cost_total', 'profit']
    
    def profit_colored(self, obj):
        color = 'green' if obj.profit > 0 else 'red'
        return format_html(
            '<span style="color: {};">{:,.2f} RWF</span>',
            color,
            obj.profit
        )
    profit_colored.short_description = 'Profit'
    
    def profit_margin(self, obj):
        margin = obj.profit_margin_percentage
        color = 'green' if margin > 20 else 'orange' if margin > 10 else 'red'
        return format_html(
            '<span style="color: {};">{}%</span>',
            color,
            round(margin, 2)
        )
    profit_margin.short_description = 'Margin %'