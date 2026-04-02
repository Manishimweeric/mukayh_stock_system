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
    
    # Price fields
    buying_price = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Purchase price from supplier"
    )
    selling_price = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Selling price to customers"
    )
    
    # Stock fields
    current_stock = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    reorder_level = models.DecimalField(max_digits=12, decimal_places=2, default=10)
    maximum_stock = models.DecimalField(max_digits=12, decimal_places=2, default=1000)

    expiry_date = models.DateField(null=True, blank=True, verbose_name="Expiry Date")
    
    # Status
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
    def stock_value_at_cost(self):
        """Calculate total value of current stock at buying price"""
        return self.current_stock * self.buying_price
    
    @property
    def stock_value_at_selling(self):
        """Calculate total value of current stock at selling price"""
        return self.current_stock * self.selling_price
    
    @property
    def potential_profit(self):
        """Calculate potential profit if all current stock is sold"""
        return (self.selling_price - self.buying_price) * self.current_stock
    
    @property
    def profit_margin_percentage(self):
        """Calculate profit margin percentage"""
        if self.selling_price > 0:
            return ((self.selling_price - self.buying_price) / self.selling_price) * 100
        return 0
    
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
    
    # Use the current buying price at time of movement
    buying_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
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
    def total_value_at_buying(self):
        """Calculate value of this movement at buying price"""
        price = self.buying_price or self.material.buying_price
        return self.quantity * price
    
    @property
    def total_value_at_selling(self):
        """Calculate value of this movement at selling price"""
        price = self.selling_price or self.material.selling_price
        return self.quantity * price
    
    def save(self, *args, **kwargs):
        # Store the current prices at time of movement
        if not self.buying_price:
            self.buying_price = self.material.buying_price
        if not self.selling_price:
            self.selling_price = self.material.selling_price
        super().save(*args, **kwargs)


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
    total_stock_value_at_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_stock_value_at_selling = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_potential_profit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
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


class Customer(models.Model):
    name = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=15)
    tin = models.CharField(max_length=50, blank=True, null=True, verbose_name="TIN Number")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'customers'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} - {self.phone_number}"


class Sale(models.Model):
    SESSION_CHOICES = [
        (1, 'Session 1 (Jan - Apr)'),
        (2, 'Session 2 (May - Aug)'),
        (3, 'Session 3 (Sep - Dec)'),
    ]
    
    receipt_number = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='sales')
    
    session = models.IntegerField(choices=SESSION_CHOICES, help_text="Trading session/period")
    year = models.IntegerField(default=2024, help_text="Year of transaction")
    
    total_quantity = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    subtotal = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_vat = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_profit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='sales_created')
    sale_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'sales'
        ordering = ['-sale_date']
    
    def __str__(self):
        session_name = dict(self.SESSION_CHOICES).get(self.session, f'Session {self.session}')
        return f"Receipt {self.receipt_number} - {self.customer.name} - {session_name} {self.year}"
    
    def generate_receipt_number(self):
        from datetime import datetime
        import random
        now = datetime.now()
        random_num = random.randint(1000, 9999)
        return f"REC-{now.strftime('%Y%m%d')}-{random_num}"
    
    def save(self, *args, **kwargs):
        if not self.receipt_number:
            self.receipt_number = self.generate_receipt_number()
        
        if not self.session and self.sale_date:
            month = self.sale_date.month
            if 1 <= month <= 4:
                self.session = 1
            elif 5 <= month <= 8:
                self.session = 2
            elif 9 <= month <= 12:
                self.session = 3
        
        if not self.year and self.sale_date:
            self.year = self.sale_date.year
        
        super().save(*args, **kwargs)
    
    def update_totals(self):
        from django.db.models import Sum
        
        items = self.items.all()
        
        self.total_quantity = items.aggregate(total=Sum('quantity'))['total'] or 0
        self.subtotal = items.aggregate(total=Sum('subtotal'))['total'] or 0
        self.total_vat = items.aggregate(total=Sum('vat_amount'))['total'] or 0
        self.total_amount = items.aggregate(total=Sum('total_amount'))['total'] or 0
        self.total_cost = items.aggregate(total=Sum('cost_total'))['total'] or 0
        self.total_profit = items.aggregate(total=Sum('profit'))['total'] or 0
        
        self.save()
    
    @property
    def profit_margin_percentage(self):
        """Calculate overall profit margin for the sale"""
        if self.total_amount > 0:
            return (self.total_profit / self.total_amount) * 100
        return 0


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    material = models.ForeignKey(Material, on_delete=models.PROTECT, related_name='sale_items')
    
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Prices at time of sale (can override material prices)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2)
    buying_price = models.DecimalField(max_digits=12, decimal_places=2)
    
    # VAT
    vat_rate = models.DecimalField(max_digits=5, decimal_places=2, default=16.00)
    vat_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Totals
    subtotal = models.DecimalField(max_digits=15, decimal_places=2, default=0)  # quantity * selling_price
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)  # subtotal + vat
    
    # Profit
    cost_total = models.DecimalField(max_digits=15, decimal_places=2, default=0)  # quantity * buying_price
    profit = models.DecimalField(max_digits=15, decimal_places=2, default=0)  # total_amount - cost_total
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'sale_items'
    
    def __str__(self):
        return f"{self.material.name} x {self.quantity}"
    
    def save(self, *args, **kwargs):
        # Calculate if not already set
        if not self.subtotal:
            self.subtotal = self.quantity * self.selling_price
        
        if not self.vat_amount:
            self.vat_amount = self.subtotal * (self.vat_rate / 100)
        
        if not self.total_amount:
            self.total_amount = self.subtotal + self.vat_amount
        
        if not self.cost_total:
            self.cost_total = self.quantity * self.buying_price
        
        if not self.profit:
            self.profit = self.total_amount - self.cost_total
        
        super().save(*args, **kwargs)
        
        # Update sale totals
        self.sale.update_totals()
    
    @property
    def profit_margin_percentage(self):
        """Calculate profit margin for this item"""
        if self.total_amount > 0:
            return (self.profit / self.total_amount) * 100
        return 0
    
    @property
    def markup_percentage(self):
        """Calculate markup percentage based on buying price"""
        if self.buying_price > 0:
            return ((self.selling_price - self.buying_price) / self.buying_price) * 100
        return 0



class SupplierOrder(models.Model):
    """Model to track orders placed with suppliers"""

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('RECEIVED', 'Received by Supplier'),
        ('ACCEPTED', 'Accepted by Supplier'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
    ]

    name = models.CharField(max_length=200, verbose_name="Order Name", help_text="A descriptive name for the order (e.g., 'Monthly Cement Order')")
    order_number = models.CharField(max_length=50, unique=True, verbose_name="Order Number")
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name='orders')
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='supplier_orders')
    order_date = models.DateTimeField(auto_now_add=True)
    expected_delivery_date = models.DateField()
    actual_delivery_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    notes = models.TextField(blank=True)

    # Totals
    total_quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    class Meta:
        db_table = 'supplier_orders'
        ordering = ['-order_date']

    def __str__(self):
        return f"{self.name} ({self.order_number}) - {self.supplier.name}"

    def generate_order_number(self):
        from datetime import datetime
        import random
        now = datetime.now()
        random_num = random.randint(1000, 9999)
        return f"ORD-{now.strftime('%Y%m%d')}-{random_num}"

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = self.generate_order_number()

        super().save(*args, **kwargs)

    def update_totals(self):
        from django.db.models import Sum
        items = self.items.all()

        self.total_quantity = items.aggregate(total=Sum('quantity'))['total'] or 0
        self.total_cost = items.aggregate(total=Sum('total_cost'))['total'] or 0

        self.save()

    @property
    def is_overdue(self):
        """Check if the order is overdue"""
        if self.status != 'DELIVERED' and self.expected_delivery_date:
            from django.utils import timezone
            return self.expected_delivery_date < timezone.now().date()
        return False

    @property
    def is_fully_delivered(self):
        """Check if the order is fully delivered"""
        return self.status == 'DELIVERED'
    

class SupplierOrderItem(models.Model):
    """
    Model to track items in a supplier order.
    Each item represents a material ordered from a supplier, including quantity, price, and delivery status.
    """
    order = models.ForeignKey(
        'SupplierOrder',
        on_delete=models.CASCADE,
        related_name='items'
    )
    material = models.ForeignKey(
        'Material',
        on_delete=models.PROTECT,
        related_name='supplier_order_items'
    )
    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Quantity of the material ordered"
    )
    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Unit price of the material at the time of ordering"
    )
    total_cost = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        help_text="Total cost (quantity * unit_price)"
    )
    received_quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Quantity received so far"
    )
    is_received = models.BooleanField(
        default=False,
        help_text="Whether the full quantity has been received"
    )
    notes = models.TextField(
        blank=True,
        help_text="Additional notes about this item"
    )

    class Meta:
        db_table = 'supplier_order_items'
        ordering = ['-id']

    def __str__(self):
        return f"{self.material.name} x {self.quantity} (Order: {self.order.order_number})"

    def save(self, *args, **kwargs):
        """
        Override save to calculate total_cost automatically.
        """
        self.total_cost = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    @property
    def remaining_quantity(self):
        """
        Calculate the remaining quantity to be received.
        """
        return self.quantity - self.received_quantity

    @property
    def is_fully_received(self):
        """
        Check if the full quantity has been received.
        """
        return self.received_quantity >= self.quantity