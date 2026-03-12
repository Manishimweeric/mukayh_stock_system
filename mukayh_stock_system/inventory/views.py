# views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from datetime import timedelta, datetime
from decimal import Decimal

from .models import (
    Category, Supplier, Material, StockMovement,
    DemandForecast, Alert, StockAnalytics, User
)
from .serializers import (
    CategorySerializer, SupplierSerializer,
    MaterialListSerializer, MaterialDetailSerializer,
    MaterialCreateUpdateSerializer, StockMovementSerializer,
    DemandForecastSerializer, AlertSerializer,
    StockAnalyticsSerializer, UserSerializer,
    UserRegistrationSerializer, UserLoginSerializer,
    DashboardStatsSerializer
)
from .permissions import IsAdminOrManager, IsAdminOnly


# Authentication Views
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Register a new user"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'user': UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)
    
    print(serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """User login with email and password"""
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        try:
            user = User.objects.get(email=email)
            user = authenticate(username=user.username, password=password)
            
            if user:
                token, created = Token.objects.get_or_create(user=user)
                return Response({
                    'user': UserSerializer(user).data,
                    'token': token.key
                })
            else:
                return Response(
                    {'error': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_user(request):
    """User logout"""
    request.user.auth_token.delete()
    return Response({'message': 'Logged out successfully'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Get current user details"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


# Category ViewSet
class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing categories"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrManager()]
        return super().get_permissions()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_users(request):
    """Get all users (admin only)"""
    if request.user.role != 'ADMIN':
        return Response(
            {'error': 'You do not have permission to view all users'},
            status=status.HTTP_403_FORBIDDEN
        )
    users = User.objects.all().order_by('-created_at')
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

class SupplierViewSet(viewsets.ModelViewSet):
    """ViewSet for managing suppliers"""
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrManager()]
        return super().get_permissions()


# Material ViewSet
class MaterialViewSet(viewsets.ModelViewSet):
    """ViewSet for managing materials/stock items"""
    queryset = Material.objects.select_related('category', 'supplier').all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return MaterialListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return MaterialCreateUpdateSerializer
        return MaterialDetailSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category_id=category)
        
        # Filter by supplier
        supplier = self.request.query_params.get('supplier', None)
        if supplier:
            queryset = queryset.filter(supplier_id=supplier)
        
        # Filter by stock status
        stock_status = self.request.query_params.get('stock_status', None)
        if stock_status == 'low':
            queryset = queryset.filter(current_stock__lte=F('reorder_level'))
        elif stock_status == 'overstock':
            queryset = queryset.filter(current_stock__gte=F('maximum_stock'))
        
        # Filter active/inactive
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Search
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(sku__icontains=search) |
                Q(description__icontains=search)
            )
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get materials with low stock"""
        materials = self.get_queryset().filter(
            current_stock__lte=F('reorder_level'),
            is_active=True
        )
        serializer = self.get_serializer(materials, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overstock(self, request):
        """Get materials with overstock"""
        materials = self.get_queryset().filter(
            current_stock__gte=F('maximum_stock'),
            is_active=True
        )
        serializer = self.get_serializer(materials, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def stock_history(self, request, pk=None):
        """Get stock movement history for a material"""
        material = self.get_object()
        movements = StockMovement.objects.filter(material=material).order_by('-created_at')[:50]
        serializer = StockMovementSerializer(movements, many=True)
        return Response(serializer.data)
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrManager()]
        return super().get_permissions()


# Stock Movement ViewSet
class StockMovementViewSet(viewsets.ModelViewSet):
    """ViewSet for managing stock movements"""
    queryset = StockMovement.objects.select_related(
        'material', 'created_by'
    ).all()
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by material
        material = self.request.query_params.get('material', None)
        if material:
            queryset = queryset.filter(material_id=material)
        
        # Filter by movement type
        movement_type = self.request.query_params.get('movement_type', None)
        if movement_type:
            queryset = queryset.filter(movement_type=movement_type)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent stock movements"""
        movements = self.get_queryset()[:20]
        serializer = self.get_serializer(movements, many=True)
        return Response(serializer.data)


# Demand Forecast ViewSet
class DemandForecastViewSet(viewsets.ModelViewSet):
    """ViewSet for demand forecasts"""
    queryset = DemandForecast.objects.select_related('material').all()
    serializer_class = DemandForecastSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by material
        material = self.request.query_params.get('material', None)
        if material:
            queryset = queryset.filter(material_id=material)
        
        # Filter future forecasts
        future_only = self.request.query_params.get('future_only', None)
        if future_only == 'true':
            queryset = queryset.filter(forecast_date__gte=timezone.now().date())
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate demand forecasts for materials"""
        # This would call AI/ML algorithms
        # For now, return a placeholder response
        return Response({
            'message': 'Forecast generation started',
            'status': 'processing'
        })
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy', 'generate']:
            return [IsAdminOrManager()]
        return super().get_permissions()


# Alert ViewSet
class AlertViewSet(viewsets.ModelViewSet):
    """ViewSet for alerts"""
    queryset = Alert.objects.select_related('material', 'resolved_by').all()
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        is_resolved = self.request.query_params.get('is_resolved', None)
        if is_resolved is not None:
            queryset = queryset.filter(is_resolved=is_resolved.lower() == 'true')
        priority = self.request.query_params.get('priority', None)
        if priority:
            queryset = queryset.filter(priority=priority.upper())
        alert_type = self.request.query_params.get('alert_type', None)
        if alert_type:
            queryset = queryset.filter(alert_type=alert_type.upper())
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Mark alert as resolved"""
        alert = self.get_object()
        alert.is_resolved = True
        alert.resolved_by = request.user
        alert.resolved_at = timezone.now()
        alert.save()
        
        serializer = self.get_serializer(alert)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def unresolved(self, request):
        """Get unresolved alerts"""
        alerts = self.get_queryset().filter(is_resolved=False)
        serializer = self.get_serializer(alerts, many=True)
        return Response(serializer.data)


# Analytics ViewSet
class AnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for stock analytics"""
    queryset = StockAnalytics.objects.all()
    serializer_class = StockAnalyticsSerializer
    permission_classes = [IsAuthenticated]


# Dashboard API
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics"""
    today = timezone.now().date()
    
    # Calculate stats
    total_materials = Material.objects.filter(is_active=True).count()
    total_stock_value = Material.objects.filter(is_active=True).aggregate(
        total=Sum(F('current_stock') * F('unit_price'))
    )['total'] or Decimal('0')
    
    low_stock_count = Material.objects.filter(
        is_active=True,
        current_stock__lte=F('reorder_level')
    ).count()
    
    overstock_count = Material.objects.filter(
        is_active=True,
        current_stock__gte=F('maximum_stock')
    ).count()
    
    active_alerts = Alert.objects.filter(is_resolved=False).count()
    
    todays_movements = StockMovement.objects.filter(
        created_at__date=today
    ).count()
    
    total_categories = Category.objects.count()
    total_suppliers = Supplier.objects.filter(is_active=True).count()
    
    data = {
        'total_materials': total_materials,
        'total_stock_value': total_stock_value,
        'low_stock_count': low_stock_count,
        'overstock_count': overstock_count,
        'active_alerts': active_alerts,
        'todays_movements': todays_movements,
        'total_categories': total_categories,
        'total_suppliers': total_suppliers
    }
    
    serializer = DashboardStatsSerializer(data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stock_trends(request):
    """Get stock trends for the last 30 days"""
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=30)
    
    movements = StockMovement.objects.filter(
        created_at__date__gte=start_date,
        created_at__date__lte=end_date
    ).values('created_at__date').annotate(
        stock_in=Sum('quantity', filter=Q(movement_type='IN')),
        stock_out=Sum('quantity', filter=Q(movement_type='OUT'))
    ).order_by('created_at__date')
    
    return Response(movements)