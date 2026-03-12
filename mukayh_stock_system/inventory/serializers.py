from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Category, Supplier, Material, StockMovement,
    DemandForecast, Alert, StockAnalytics
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
    """Serializer for material list view"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    stock_status = serializers.CharField(read_only=True)
    category=CategorySerializer(read_only=True) 
    supplier=SupplierSerializer(read_only=True)
    stock_value = serializers.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        read_only=True
    )
    
    class Meta:
        model = Material
        fields = [
            'id', 'name', 'sku', 'category', 'category_name',
            'supplier', 'supplier_name', 'unit', 'unit_price',
            'current_stock', 'reorder_level', 'maximum_stock',
            'stock_status', 'stock_value', 'is_active','updated_at','category','supplier'
        ]


class MaterialDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for material"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    supplier_details = SupplierSerializer(source='supplier', read_only=True)
    stock_status = serializers.CharField(read_only=True)
    stock_value = serializers.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        read_only=True
    )
    is_low_stock = serializers.BooleanField(read_only=True)
    is_overstock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Material
        fields = [
            'id', 'name', 'sku', 'category', 'category_name',
            'supplier', 'supplier_name', 'supplier_details',
            'description', 'unit', 'unit_price', 'current_stock',
            'reorder_level', 'maximum_stock', 'stock_status',
            'stock_value', 'is_low_stock', 'is_overstock',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MaterialCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating materials"""
    
    class Meta:
        model = Material
        fields = [
            'id', 'name', 'sku', 'category', 'supplier',
            'description', 'unit', 'unit_price', 'current_stock',
            'reorder_level', 'maximum_stock', 'is_active'
        ]
        read_only_fields = ['id']
    
    def validate_sku(self, value):
        # Check if SKU already exists
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
        return data


class StockMovementSerializer(serializers.ModelSerializer):
    """Serializer for stock movements"""
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_sku = serializers.CharField(source='material.sku', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    total_value = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        read_only=True
    )
    
    class Meta:
        model = StockMovement
        fields = [
            'id', 'material', 'material_name', 'material_sku',
            'movement_type', 'quantity', 'previous_stock', 'new_stock',
            'unit_price', 'total_value', 'reference_number', 'notes',
            'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = [
            'id', 'previous_stock', 'new_stock', 'created_by', 
            'created_at', 'total_value' 
        ]
    
    def create(self, validated_data):
        try:
            material = validated_data['material']
            quantity = validated_data['quantity']
            movement_type = validated_data['movement_type']
            
            # Log the incoming data for debugging
            print(f"Creating stock movement:")
            print(f"  Material: {material.id} - {material.name}")
            print(f"  Movement type: {movement_type}")
            print(f"  Quantity: {quantity}")
            print(f"  Current stock before: {material.current_stock}")
            
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
            print(f"  Current stock after: {material.current_stock}")
            
            # Save material
            material.save()
            
            # Create the stock movement
            movement = super().create(validated_data)
            
            # Import and check alerts
            from .utils.alerts import check_and_create_low_stock_alert, check_and_resolve_low_stock_alert
            
            if movement_type in ['OUT', 'DAMAGED', 'RETURN', 'ADJUSTMENT']:
                print(f"  Checking for low stock alert...")
                alert_created = check_and_create_low_stock_alert(material)
                if alert_created:
                    print(f"  Low stock alert created")
            
            if movement_type == 'IN':
                print(f"  Checking to resolve low stock alerts...")
                resolved = check_and_resolve_low_stock_alert(material)
                if resolved:
                    print(f"  Low stock alerts resolved")
            
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
    """Serializer for stock analytics"""
    
    class Meta:
        model = StockAnalytics
        fields = [
            'id', 'date', 'total_stock_value', 'total_materials',
            'low_stock_items', 'overstock_items', 'stock_in_quantity',
            'stock_out_quantity', 'stock_turnover_rate', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""
    total_materials = serializers.IntegerField()
    total_stock_value = serializers.DecimalField(max_digits=15, decimal_places=2)
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
    stock_value = serializers.DecimalField(max_digits=15, decimal_places=2)


# Add serializer for stock adjustment
class StockAdjustmentSerializer(serializers.Serializer):
    """Serializer for stock adjustment"""
    quantity = serializers.IntegerField(required=True)
    reason = serializers.CharField(required=True, max_length=255)
    notes = serializers.CharField(required=False, allow_blank=True)
    reference_number = serializers.CharField(required=False, max_length=50)


# Add serializer for bulk stock update
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