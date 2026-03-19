from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Category, Supplier, Material, StockMovement,
    DemandForecast, Alert, StockAnalytics, Customer, Sale, SaleItem
)

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone', 'role'
        ]
        read_only_fields = ['id']
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords do not match")
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user data"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'phone', 'role', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for material categories"""
    material_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'material_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_material_count(self, obj):
        return obj.materials.filter(is_active=True).count()


class SupplierSerializer(serializers.ModelSerializer):
    """Serializer for suppliers"""
    material_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'contact_person', 'email', 'phone',
            'address', 'is_active', 'material_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_material_count(self, obj):
        return obj.materials.filter(is_active=True).count()


class MaterialListSerializer(serializers.ModelSerializer):
    """Serializer for material list view with buying and selling prices"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    stock_status = serializers.CharField(read_only=True)
    profit_margin = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    potential_profit = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    stock_value_at_cost = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    stock_value_at_selling = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    
    class Meta:
        model = Material
        fields = [
            'id', 'name', 'sku', 'category', 'category_name',
            'supplier', 'supplier_name', 'unit', 
            'buying_price', 'selling_price', 'profit_margin',
            'current_stock', 'reorder_level', 'maximum_stock',
            'stock_status', 'stock_value_at_cost', 'stock_value_at_selling',
            'potential_profit', 'is_active', 'updated_at'
        ]


class MaterialDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for material with all price information"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    supplier_details = SupplierSerializer(source='supplier', read_only=True)
    stock_status = serializers.CharField(read_only=True)
    stock_value_at_cost = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    stock_value_at_selling = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    potential_profit = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    profit_margin = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    is_overstock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Material
        fields = [
            'id', 'name', 'sku', 'category', 'category_name',
            'supplier', 'supplier_name', 'supplier_details',
            'description', 'unit', 
            'buying_price', 'selling_price', 'profit_margin',
            'current_stock', 'reorder_level', 'maximum_stock',
            'stock_status', 'stock_value_at_cost', 'stock_value_at_selling',
            'potential_profit', 'is_low_stock', 'is_overstock',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MaterialCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating materials with buying and selling prices"""
    
    class Meta:
        model = Material
        fields = [
            'id', 'name', 'sku', 'category', 'supplier',
            'description', 'unit', 
            'buying_price', 'selling_price',
            'current_stock', 'reorder_level', 'maximum_stock',
            'is_active'
        ]
        read_only_fields = ['id']
    
    def validate_sku(self, value):
        if self.instance:
            if Material.objects.exclude(id=self.instance.id).filter(sku=value).exists():
                raise serializers.ValidationError("SKU already exists")
        else:
            if Material.objects.filter(sku=value).exists():
                raise serializers.ValidationError("SKU already exists")
        return value
    
    def validate(self, data):
        if 'reorder_level' in data and 'maximum_stock' in data:
            if data['reorder_level'] >= data['maximum_stock']:
                raise serializers.ValidationError(
                    "Reorder level must be less than maximum stock"
                )
        
        # Validate that selling price is greater than buying price
        if 'buying_price' in data and 'selling_price' in data:
            if data['selling_price'] <= data['buying_price']:
                raise serializers.ValidationError(
                    "Selling price must be greater than buying price"
                )
        
        return data


class StockMovementSerializer(serializers.ModelSerializer):
    """Serializer for stock movements with price tracking"""
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_sku = serializers.CharField(source='material.sku', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    # Value calculations
    total_value_at_buying = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    total_value_at_selling = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    
    class Meta:
        model = StockMovement
        fields = [
            'id', 'material', 'material_name', 'material_sku',
            'movement_type', 'quantity', 'previous_stock', 'new_stock',
            'buying_price', 'selling_price',
            'total_value_at_buying', 'total_value_at_selling',
            'reference_number', 'notes',
            'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = [
            'id', 'previous_stock', 'new_stock', 'created_by', 
            'created_at', 'total_value_at_buying', 'total_value_at_selling'
        ]
    
    def create(self, validated_data):
        try:
            material = validated_data['material']
            quantity = validated_data['quantity']
            movement_type = validated_data['movement_type']
            
            # Store current prices
            validated_data['buying_price'] = material.buying_price
            validated_data['selling_price'] = material.selling_price
            
            validated_data['previous_stock'] = material.current_stock
            
            if movement_type == 'IN':
                material.current_stock += quantity
            elif movement_type in ['OUT', 'DAMAGED', 'RETURN']:
                if material.current_stock < quantity:
                    raise serializers.ValidationError(
                        f"Insufficient stock. Available: {material.current_stock}, Requested: {quantity}"
                    )
                material.current_stock -= quantity
            elif movement_type == 'ADJUSTMENT':
                material.current_stock = quantity
            else:
                raise serializers.ValidationError(f"Invalid movement type: {movement_type}")
            
            validated_data['new_stock'] = material.current_stock
            
            material.save()
            
            movement = super().create(validated_data)
            
            from .utils.alerts import check_and_create_low_stock_alert, check_and_resolve_low_stock_alert
            
            if movement_type in ['OUT', 'DAMAGED', 'RETURN', 'ADJUSTMENT']:
                alert_created = check_and_create_low_stock_alert(material)
            
            if movement_type == 'IN':
                resolved = check_and_resolve_low_stock_alert(material)
            
            return movement
            
        except Exception as e:
            print(f"Error creating stock movement: {str(e)}")
            import traceback
            traceback.print_exc()
            raise


class DemandForecastSerializer(serializers.ModelSerializer):
    """Serializer for demand forecasts"""
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_sku = serializers.CharField(source='material.sku', read_only=True)
    accuracy = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True
    )
    
    class Meta:
        model = DemandForecast
        fields = [
            'id', 'material', 'material_name', 'material_sku',
            'forecast_date', 'predicted_demand', 'confidence_score',
            'actual_demand', 'accuracy', 'algorithm_used',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AlertSerializer(serializers.ModelSerializer):
    """Serializer for alerts"""
    material_name = serializers.CharField(source='material.name', read_only=True)
    resolved_by_name = serializers.CharField(
        source='resolved_by.get_full_name',
        read_only=True
    )
    
    class Meta:
        model = Alert
        fields = [
            'id', 'alert_type', 'priority', 'material', 'material_name',
            'title', 'message', 'is_resolved', 'resolved_by',
            'resolved_by_name', 'resolved_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class StockAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for stock analytics with price information"""
    
    class Meta:
        model = StockAnalytics
        fields = [
            'id', 'date', 
            'total_stock_value_at_cost', 'total_stock_value_at_selling',
            'total_potential_profit',
            'total_materials', 'low_stock_items', 'overstock_items',
            'stock_in_quantity', 'stock_out_quantity', 
            'stock_turnover_rate', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics with profit information"""
    total_materials = serializers.IntegerField()
    total_stock_value_at_cost = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_stock_value_at_selling = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_potential_profit = serializers.DecimalField(max_digits=15, decimal_places=2)
    low_stock_count = serializers.IntegerField()
    overstock_count = serializers.IntegerField()
    active_alerts = serializers.IntegerField()
    todays_movements = serializers.IntegerField()
    total_categories = serializers.IntegerField()
    total_suppliers = serializers.IntegerField()


class StockTrendSerializer(serializers.Serializer):
    """Serializer for stock trends"""
    date = serializers.DateField()
    stock_in = serializers.DecimalField(max_digits=12, decimal_places=2)
    stock_out = serializers.DecimalField(max_digits=12, decimal_places=2)
    stock_value_at_cost = serializers.DecimalField(max_digits=15, decimal_places=2)
    stock_value_at_selling = serializers.DecimalField(max_digits=15, decimal_places=2)


class StockAdjustmentSerializer(serializers.Serializer):
    """Serializer for stock adjustment"""
    quantity = serializers.IntegerField(required=True)
    reason = serializers.CharField(required=True, max_length=255)
    notes = serializers.CharField(required=False, allow_blank=True)
    reference_number = serializers.CharField(required=False, max_length=50)


class BulkStockUpdateSerializer(serializers.Serializer):
    """Serializer for bulk stock update"""
    material_id = serializers.IntegerField(required=True)
    quantity = serializers.IntegerField(required=True)
    movement_type = serializers.ChoiceField(
        choices=['IN', 'OUT', 'ADJUSTMENT'],
        required=True
    )
    reference_number = serializers.CharField(required=False, max_length=50)
    notes = serializers.CharField(required=False, allow_blank=True)


# Customer and Sale Serializers
class CustomerSerializer(serializers.ModelSerializer):
    """Serializer for customers"""
    total_sales = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'phone_number', 'tin',
            'total_sales', 'total_spent', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_total_sales(self, obj):
        return obj.sales.count()
    
    def get_total_spent(self, obj):
        from django.db.models import Sum
        total = obj.sales.aggregate(total=Sum('total_amount'))['total']
        return total or 0


class CustomerCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating customers"""
    
    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone_number', 'tin']
        read_only_fields = ['id']


class SaleItemSerializer(serializers.ModelSerializer):
    """Serializer for sale items with profit calculations"""
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_sku = serializers.CharField(source='material.sku', read_only=True)
    material_unit = serializers.CharField(source='material.unit', read_only=True)
    profit_margin = serializers.SerializerMethodField()
    markup_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = SaleItem
        fields = [
            'id', 'material', 'material_name', 'material_sku', 'material_unit',
            'quantity', 'selling_price', 'buying_price',
            'vat_rate', 'vat_amount', 'subtotal', 'total_amount',
            'cost_total', 'profit', 'profit_margin', 'markup_percentage',
            'created_at'
        ]
        read_only_fields = ['id', 'vat_amount', 'subtotal', 'total_amount', 
                           'cost_total', 'profit', 'created_at']
    
    def get_profit_margin(self, obj):
        return obj.profit_margin_percentage
    
    def get_markup_percentage(self, obj):
        return obj.markup_percentage
    
    def validate(self, data):
        if data.get('quantity', 0) <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero")
        
        if data.get('selling_price', 0) <= 0:
            raise serializers.ValidationError("Selling price must be greater than zero")
        
        if 'buying_price' in data and 'selling_price' in data:
            if data['selling_price'] <= data['buying_price']:
                raise serializers.ValidationError(
                    "Selling price must be greater than buying price to make a profit"
                )
        
        return data


class SaleListSerializer(serializers.ModelSerializer):
    """Serializer for sale list view"""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone_number', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    items_count = serializers.SerializerMethodField()
    session_name = serializers.SerializerMethodField()
    profit_margin = serializers.SerializerMethodField()
    
    class Meta:
        model = Sale
        fields = [
            'id', 'receipt_number', 'customer', 'customer_name', 'customer_phone',
            'session', 'session_name', 'year', 'total_quantity',
            'subtotal', 'total_vat', 'total_amount', 'total_cost',
            'total_profit', 'profit_margin',
            'created_by', 'created_by_name', 'sale_date', 'notes',
            'items_count'
        ]
        read_only_fields = ['id', 'receipt_number', 'total_quantity', 'subtotal',
                           'total_vat', 'total_amount', 'total_cost', 'total_profit',
                           'sale_date']
    
    def get_items_count(self, obj):
        return obj.items.count()
    
    def get_session_name(self, obj):
        return dict(obj.SESSION_CHOICES).get(obj.session, f'Session {obj.session}')
    
    def get_profit_margin(self, obj):
        return obj.profit_margin_percentage


class SaleDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for sale with items and profit analysis"""
    customer_details = CustomerSerializer(source='customer', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    items = SaleItemSerializer(many=True, read_only=True)
    session_name = serializers.SerializerMethodField()
    profit_margin = serializers.SerializerMethodField()
    
    # Profit breakdown
    profit_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    
    class Meta:
        model = Sale
        fields = [
            'id', 'receipt_number', 'customer', 'customer_details',
            'session', 'session_name', 'year',
            'total_quantity', 'subtotal', 'total_vat', 'total_amount',
            'total_cost', 'total_profit', 'profit_margin', 'profit_percentage',
            'created_by', 'created_by_name', 'sale_date', 'notes',
            'items'
        ]
        read_only_fields = ['id', 'receipt_number', 'total_quantity', 'subtotal',
                           'total_vat', 'total_amount', 'total_cost', 'total_profit',
                           'sale_date']
    
    def get_session_name(self, obj):
        return dict(obj.SESSION_CHOICES).get(obj.session, f'Session {obj.session}')
    
    def get_profit_margin(self, obj):
        return obj.profit_margin_percentage

from decimal import Decimal

class SaleCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating sales with items"""
    items = serializers.ListField(write_only=True, child=serializers.DictField())
    
    class Meta:
        model = Sale
        fields = [
            'id', 'customer', 'session', 'year',
            'created_by', 'notes', 'items'
        ]
        read_only_fields = ['id']
        extra_kwargs = {
            'created_by': {'required': False, 'allow_null': True}
        }
    
    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required")
        
        for index, item in enumerate(value):
            if not item.get('material'):
                raise serializers.ValidationError(f"Item {index + 1}: Material is required")
            
            try:
                quantity = Decimal(str(item.get('quantity', 0)))
                if quantity <= 0:
                    raise serializers.ValidationError(f"Item {index + 1}: Quantity must be greater than 0")
            except:
                raise serializers.ValidationError(f"Item {index + 1}: Invalid quantity")
            
            try:
                selling_price = Decimal(str(item.get('selling_price', 0)))
                if selling_price <= 0:
                    raise serializers.ValidationError(f"Item {index + 1}: Selling price must be greater than 0")
            except:
                raise serializers.ValidationError(f"Item {index + 1}: Invalid selling price")
            
            try:
                vat_rate = Decimal(str(item.get('vat_rate', 16)))
                if vat_rate < 0 or vat_rate > 100:
                    raise serializers.ValidationError(f"Item {index + 1}: VAT rate must be between 0 and 100")
            except:
                raise serializers.ValidationError(f"Item {index + 1}: Invalid VAT rate")
        
        return value
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        
        # If created_by is not provided, set to None (requires nullable field in model)
        if 'created_by' not in validated_data:
            validated_data['created_by'] = None
        
        # Create the sale
        sale = Sale.objects.create(**validated_data)
        
        from .models import Material
        
        for item_data in items_data:
            # Convert all values to Decimal for calculations
            material_id = item_data.get('material')
            quantity = Decimal(str(item_data.get('quantity', 1)))
            selling_price_incl_vat = Decimal(str(item_data.get('selling_price', 0)))
            vat_rate = Decimal(str(item_data.get('vat_rate', 16)))
            
            # Get the material
            material = Material.objects.get(id=material_id)
            
            # Calculate price excluding VAT
            # selling_price_incl_vat = price_excl_vat * (1 + vat_rate/100)
            # price_excl_vat = selling_price_incl_vat / (1 + vat_rate/100)
            vat_multiplier = Decimal('1') + (vat_rate / Decimal('100'))
            price_excluding_vat = selling_price_incl_vat / vat_multiplier
            
            # Calculate VAT amount per unit
            vat_amount_per_unit = price_excluding_vat * (vat_rate / Decimal('100'))
            
            # Calculate totals
            subtotal = quantity * price_excluding_vat
            total_vat = quantity * vat_amount_per_unit
            total_amount = quantity * selling_price_incl_vat
            cost_total = quantity * material.buying_price
            profit = total_amount - cost_total
            
            # Create sale item
            SaleItem.objects.create(
                sale=sale,
                material=material,
                quantity=quantity,
                selling_price=price_excluding_vat,  # Store price excluding VAT
                buying_price=material.buying_price,
                vat_rate=vat_rate,
                vat_amount=total_vat,  # Total VAT for this item
                subtotal=subtotal,
                total_amount=total_amount,  # Total including VAT
                cost_total=cost_total,
                profit=profit
            )
        
        # Update sale totals
        sale.update_totals()
        return sale
    
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        # Update sale fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update items if provided
        if items_data is not None:
            # Remove existing items
            instance.items.all().delete()
            
            from .models import Material
            
            for item_data in items_data:
                material_id = item_data.get('material')
                quantity = Decimal(str(item_data.get('quantity', 1)))
                selling_price_incl_vat = Decimal(str(item_data.get('selling_price', 0)))
                vat_rate = Decimal(str(item_data.get('vat_rate', 16)))
                
                material = Material.objects.get(id=material_id)
                
                vat_multiplier = Decimal('1') + (vat_rate / Decimal('100'))
                price_excluding_vat = selling_price_incl_vat / vat_multiplier
                vat_amount_per_unit = price_excluding_vat * (vat_rate / Decimal('100'))
                
                SaleItem.objects.create(
                    sale=instance,
                    material=material,
                    quantity=quantity,
                    selling_price=price_excluding_vat,
                    buying_price=material.buying_price,
                    vat_rate=vat_rate,
                    vat_amount=quantity * vat_amount_per_unit,
                    subtotal=quantity * price_excluding_vat,
                    total_amount=quantity * selling_price_incl_vat,
                    cost_total=quantity * material.buying_price,
                    profit=(quantity * selling_price_incl_vat) - (quantity * material.buying_price)
                )
            
            # Update sale totals
            instance.update_totals()
        
        return instance
class SaleSummarySerializer(serializers.Serializer):
    """Serializer for sale summary/analytics with profit analysis"""
    total_sales = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_cost = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_profit = serializers.DecimalField(max_digits=15, decimal_places=2)
    average_profit_margin = serializers.DecimalField(max_digits=5, decimal_places=2)
    
    # Profit breakdown by session
    session_1_sales = serializers.IntegerField()
    session_2_sales = serializers.IntegerField()
    session_3_sales = serializers.IntegerField()
    
    session_1_revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    session_2_revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    session_3_revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    
    session_1_profit = serializers.DecimalField(max_digits=15, decimal_places=2)
    session_2_profit = serializers.DecimalField(max_digits=15, decimal_places=2)
    session_3_profit = serializers.DecimalField(max_digits=15, decimal_places=2)
    
    session_1_margin = serializers.DecimalField(max_digits=5, decimal_places=2)
    session_2_margin = serializers.DecimalField(max_digits=5, decimal_places=2)
    session_3_margin = serializers.DecimalField(max_digits=5, decimal_places=2)


class TopSellingMaterialSerializer(serializers.Serializer):
    """Serializer for top selling materials with profit analysis"""
    material_id = serializers.IntegerField()
    material_name = serializers.CharField()
    material_sku = serializers.CharField()
    total_quantity_sold = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_profit = serializers.DecimalField(max_digits=15, decimal_places=2)
    average_profit_margin = serializers.DecimalField(max_digits=5, decimal_places=2)
    number_of_sales = serializers.IntegerField()


class ProfitAnalysisSerializer(serializers.Serializer):
    """Serializer for overall profit analysis"""
    total_revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_cost = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_profit = serializers.DecimalField(max_digits=15, decimal_places=2)
    average_profit_margin = serializers.DecimalField(max_digits=5, decimal_places=2)
    
    # Inventory value
    inventory_value_at_cost = serializers.DecimalField(max_digits=15, decimal_places=2)
    inventory_value_at_selling = serializers.DecimalField(max_digits=15, decimal_places=2)
    potential_profit = serializers.DecimalField(max_digits=15, decimal_places=2)
    
    # Period comparison
    previous_period_revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    previous_period_profit = serializers.DecimalField(max_digits=15, decimal_places=2)
    revenue_growth = serializers.DecimalField(max_digits=5, decimal_places=2)
    profit_growth = serializers.DecimalField(max_digits=5, decimal_places=2)