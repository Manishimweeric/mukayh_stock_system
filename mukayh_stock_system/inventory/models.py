# models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from decimal import Decimal


class User(AbstractUser):
    """Extended user model with role-based access"""
    ROLE_CHOICES = [
        ('ADMIN', 'Administrator'),
        ('MANAGER', 'Manager'),
        ('WAREHOUSE', 'Warehouse Staff'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='WAREHOUSE')
    phone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(unique=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name='customuser_set',
        related_query_name='customuser',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='customuser_set',
        related_query_name='customuser',
    )
    
    class Meta:
        db_table = 'users'
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"


class Category(models.Model):
    """Material categories (Cement, Steel, Wood, etc.)"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Supplier(models.Model):
    """Supplier information for materials"""
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=15)
    address = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'suppliers'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Material(models.Model):
    """Construction materials/stock items"""
    UNIT_CHOICES = [
        ('KG', 'Kilograms'),
        ('TON', 'Tons'),
        ('PCS', 'Pieces'),
        ('BAG', 'Bags'),
        ('M', 'Meters'),
        ('M2', 'Square Meters'),
        ('M3', 'Cubic Meters'),
        ('L', 'Liters'),
        ('BOX', 'Boxes'),
    ]
    
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, unique=True, verbose_name='SKU')
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='materials')
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name='materials')
    description = models.TextField(blank=True)
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES)
    unit_price = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    current_stock = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    reorder_level = models.DecimalField(max_digits=12, decimal_places=2, default=10)
    maximum_stock = models.DecimalField(max_digits=12, decimal_places=2, default=1000)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'materials'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.sku})"
    
    @property
    def is_low_stock(self):
        """Check if stock is below reorder level"""
        return self.current_stock <= self.reorder_level
    
    @property
    def is_overstock(self):
        """Check if stock exceeds maximum level"""
        return self.current_stock >= self.maximum_stock
    
    @property
    def stock_value(self):
        """Calculate total value of current stock"""
        return self.current_stock * self.unit_price
    
    @property
    def stock_status(self):
        """Get stock status"""
        if self.is_low_stock:
            return 'LOW'
        elif self.is_overstock:
            return 'OVERSTOCK'
        return 'NORMAL'


class StockMovement(models.Model):
    """Track all stock movements (in/out/adjustments)"""
    MOVEMENT_TYPES = [
        ('IN', 'Stock In'),
        ('OUT', 'Stock Out'),
        ('ADJUSTMENT', 'Stock Adjustment'),
        ('RETURN', 'Return to Supplier'),
        ('DAMAGED', 'Damaged/Loss'),
    ]
    
    material = models.ForeignKey(Material, on_delete=models.PROTECT, related_name='movements')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    previous_stock = models.DecimalField(max_digits=12, decimal_places=2)
    new_stock = models.DecimalField(max_digits=12, decimal_places=2)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    reference_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='stock_movements')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'stock_movements'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.material.name} - {self.movement_type} - {self.quantity}"
    
    @property
    def total_value(self):
        """Calculate value of this movement"""
        if self.unit_price:
            return self.quantity * self.unit_price
        return self.quantity * self.material.unit_price


class DemandForecast(models.Model):
    """AI-generated demand predictions"""
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='forecasts')
    forecast_date = models.DateField()
    predicted_demand = models.DecimalField(max_digits=12, decimal_places=2)
    confidence_score = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        help_text='Confidence level (0-100%)'
    )
    actual_demand = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    algorithm_used = models.CharField(max_length=50, default='ARIMA')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'demand_forecasts'
        unique_together = ['material', 'forecast_date']
        ordering = ['-forecast_date']
    
    def __str__(self):
        return f"{self.material.name} - {self.forecast_date}"
    
    @property
    def accuracy(self):
        """Calculate forecast accuracy if actual demand is recorded"""
        if self.actual_demand is not None:
            error = abs(self.predicted_demand - self.actual_demand)
            if self.actual_demand > 0:
                return 100 - (error / self.actual_demand * 100)
        return None


class Alert(models.Model):
    """System alerts and notifications"""
    ALERT_TYPES = [
        ('LOW_STOCK', 'Low Stock Alert'),
        ('OVERSTOCK', 'Overstock Warning'),
        ('REORDER', 'Reorder Required'),
        ('ANOMALY', 'Data Anomaly Detected'),
        ('FORECAST', 'Forecast Alert'),
    ]
    
    PRIORITY_LEVELS = [
        ('LOW', 'Low Priority'),
        ('MEDIUM', 'Medium Priority'),
        ('HIGH', 'High Priority'),
        ('CRITICAL', 'Critical'),
    ]
    
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    priority = models.CharField(max_length=10, choices=PRIORITY_LEVELS)
    material = models.ForeignKey(
        Material, 
        on_delete=models.CASCADE, 
        related_name='alerts',
        null=True,
        blank=True
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='resolved_alerts'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'alerts'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.alert_type} - {self.title}"


class StockAnalytics(models.Model):
    """Daily analytics and metrics"""
    date = models.DateField(unique=True)
    total_stock_value = models.DecimalField(max_digits=15, decimal_places=2)
    total_materials = models.IntegerField()
    low_stock_items = models.IntegerField()
    overstock_items = models.IntegerField()
    stock_in_quantity = models.DecimalField(max_digits=12, decimal_places=2)
    stock_out_quantity = models.DecimalField(max_digits=12, decimal_places=2)
    stock_turnover_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'stock_analytics'
        ordering = ['-date']
        verbose_name_plural = 'Stock Analytics'
    
    def __str__(self):
        return f"Analytics - {self.date}"