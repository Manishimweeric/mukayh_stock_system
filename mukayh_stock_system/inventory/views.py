# views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate
from django.db.models import Sum, Count, Q, F, Avg
from django.utils import timezone
from datetime import timedelta, datetime
from decimal import Decimal
from . import models 
from django.db import models as django_models

from .models import (
    Category, Supplier, Material, StockMovement,
    DemandForecast, Alert, StockAnalytics, User, Customer, Sale, SaleItem
)
from .serializers import *
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
        email = self.request.query_params.get('email', None)

        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        if email is not None:
            queryset = queryset.filter(email=email)

        return queryset

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrManager()]
        return super().get_permissions()


# Material ViewSet
class MaterialViewSet(viewsets.ModelViewSet):
    """ViewSet for managing materials/stock items with buying and selling prices"""
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
        
        # Filter by profit margin
        min_margin = self.request.query_params.get('min_margin', None)
        if min_margin:
            queryset = queryset.filter(
                selling_price__gt=F('buying_price')
            ).extra(
                select={'margin': '(selling_price - buying_price) / selling_price * 100'}
            ).filter(margin__gte=float(min_margin))
        
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
    
    @action(detail=False, methods=['get'])
    def profit_analysis(self, request):
        """Get profit analysis for all materials"""
        materials = self.get_queryset().filter(is_active=True)
        
        total_inventory_cost = materials.aggregate(
            total=Sum(F('current_stock') * F('buying_price'))
        )['total'] or 0
        
        total_inventory_value = materials.aggregate(
            total=Sum(F('current_stock') * F('selling_price'))
        )['total'] or 0
        
        potential_profit = total_inventory_value - total_inventory_cost
        
        avg_margin = materials.extra(
            select={'margin': '(selling_price - buying_price) / selling_price * 100'}
        ).aggregate(avg=Avg('margin'))['avg'] or 0
        
        data = {
            'total_inventory_cost': total_inventory_cost,
            'total_inventory_value': total_inventory_value,
            'potential_profit': potential_profit,
            'average_margin': round(avg_margin, 2),
            'total_materials': materials.count()
        }
        
        return Response(data)
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrManager()]
        return super().get_permissions()
    
    
    @action(detail=False, methods=['get'], url_path='filter')
    def filter_materials(self, request):
        """Filter materials by various criteria"""
        queryset = Material.objects.select_related('category', 'supplier').filter(is_active=True)
        
        # Filter by date range
        from_date = request.query_params.get('from_date', None)
        to_date = request.query_params.get('to_date', None)
        if from_date:
            queryset = queryset.filter(created_at__date__gte=from_date)
        if to_date:
            queryset = queryset.filter(created_at__date__lte=to_date)
        
        # Filter by stock status
        stock_status = request.query_params.get('stock_status', None)
        if stock_status == 'low':
            queryset = queryset.filter(current_stock__lte=F('reorder_level'))
        elif stock_status == 'overstock':
            queryset = queryset.filter(current_stock__gte=F('maximum_stock'))
        elif stock_status == 'normal':
            queryset = queryset.filter(
                current_stock__gt=F('reorder_level'),
                current_stock__lt=F('maximum_stock')
            )
        
        # Filter by price range
        min_price = request.query_params.get('min_price', None)
        max_price = request.query_params.get('max_price', None)
        if min_price:
            queryset = queryset.filter(selling_price__gte=min_price)
        if max_price:
            queryset = queryset.filter(selling_price__lte=max_price)
        
        # Filter by profit margin
        min_margin = request.query_params.get('min_margin', None)
        max_margin = request.query_params.get('max_margin', None)
        if min_margin or max_margin:
            queryset = queryset.annotate(
                margin=((F('selling_price') - F('buying_price')) / F('selling_price') * 100)
            )
            if min_margin:
                queryset = queryset.filter(margin__gte=min_margin)
            if max_margin:
                queryset = queryset.filter(margin__lte=max_margin)
        
        # Filter by category
        category = request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category_id=category)
        
        # Filter by supplier
        supplier = request.query_params.get('supplier', None)
        if supplier:
            queryset = queryset.filter(supplier_id=supplier)
        
        # Search
        search = request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(sku__icontains=search) |
                Q(description__icontains=search)
            )
        
        if not queryset.exists():
            return Response(
                {
                    "message": "No materials found. Try adjusting your filters or add materials to the database.",
                    "suggestions": [
                        "Check if materials exist in the database.",
                        "Ensure materials are marked as active (is_active=True).",
                        "Try removing or adjusting filters."
                    ]
                },
                status=status.HTTP_200_OK
            )
        
        serializer = MaterialListSerializer(queryset, many=True)
        return Response(serializer.data)


# Stock Movement ViewSet
class StockMovementViewSet(viewsets.ModelViewSet):
    """ViewSet for managing stock movements with price tracking"""
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
    
    @action(detail=False, methods=['get'])
    def value_summary(self, request):
        """Get summary of stock movement values"""
        movements = self.get_queryset()
        
        total_in_value = movements.filter(movement_type='IN').aggregate(
            total=Sum(F('quantity') * F('buying_price'))
        )['total'] or 0
        
        total_out_value = movements.filter(movement_type='OUT').aggregate(
            total=Sum(F('quantity') * F('buying_price'))
        )['total'] or 0
        
        data = {
            'total_in_value': total_in_value,
            'total_out_value': total_out_value,
            'net_value_change': total_in_value - total_out_value
        }
        
        return Response(data)


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
    """ViewSet for stock analytics with price information"""
    queryset = StockAnalytics.objects.all()
    serializer_class = StockAnalyticsSerializer
    permission_classes = [IsAuthenticated]


# Dashboard API
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics with profit information"""
    today = timezone.now().date()
    
    # Calculate stats
    total_materials = Material.objects.filter(is_active=True).count()
    
    # Stock values at cost and selling
    total_stock_value_at_cost = Material.objects.filter(is_active=True).aggregate(
        total=Sum(F('current_stock') * F('buying_price'))
    )['total'] or Decimal('0')
    
    total_stock_value_at_selling = Material.objects.filter(is_active=True).aggregate(
        total=Sum(F('current_stock') * F('selling_price'))
    )['total'] or Decimal('0')
    
    total_potential_profit = total_stock_value_at_selling - total_stock_value_at_cost
    
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
        'total_stock_value_at_cost': total_stock_value_at_cost,
        'total_stock_value_at_selling': total_stock_value_at_selling,
        'total_potential_profit': total_potential_profit,
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
    """Get stock trends for the last 30 days with value information"""
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=30)
    
    movements = StockMovement.objects.filter(
        created_at__date__gte=start_date,
        created_at__date__lte=end_date
    ).values('created_at__date').annotate(
        stock_in=Sum('quantity', filter=Q(movement_type='IN')),
        stock_out=Sum('quantity', filter=Q(movement_type='OUT')),
        value_in=Sum(
            F('quantity') * F('buying_price'),
            filter=Q(movement_type='IN')
        ),
        value_out=Sum(
            F('quantity') * F('selling_price'),
            filter=Q(movement_type='OUT')
        )
    ).order_by('created_at__date')
    
    return Response(movements)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profit_analysis(request):
    """Get overall profit analysis"""
    # Current inventory value
    materials = Material.objects.filter(is_active=True)
    
    inventory_cost = materials.aggregate(
        total=Sum(F('current_stock') * F('buying_price'))
    )['total'] or 0
    
    inventory_value = materials.aggregate(
        total=Sum(F('current_stock') * F('selling_price'))
    )['total'] or 0
    
    potential_profit = inventory_value - inventory_cost
    
    # Sales performance
    current_year = timezone.now().year
    current_month = timezone.now().month
    
    # Current period (this month)
    current_period_sales = Sale.objects.filter(
        sale_date__year=current_year,
        sale_date__month=current_month
    ).aggregate(
        revenue=Sum('total_amount'),
        cost=Sum('total_cost'),
        profit=Sum('total_profit')
    )
    
    # Previous period (last month)
    if current_month == 1:
        prev_month = 12
        prev_year = current_year - 1
    else:
        prev_month = current_month - 1
        prev_year = current_year
    
    previous_period_sales = Sale.objects.filter(
        sale_date__year=prev_year,
        sale_date__month=prev_month
    ).aggregate(
        revenue=Sum('total_amount'),
        profit=Sum('total_profit')
    )
    
    # Calculate growth
    current_revenue = current_period_sales['revenue'] or 0
    previous_revenue = previous_period_sales['revenue'] or 0
    revenue_growth = ((current_revenue - previous_revenue) / previous_revenue * 100) if previous_revenue > 0 else 0
    
    current_profit = current_period_sales['profit'] or 0
    previous_profit = previous_period_sales['profit'] or 0
    profit_growth = ((current_profit - previous_profit) / previous_profit * 100) if previous_profit > 0 else 0
    
    data = {
        'total_revenue': current_revenue,
        'total_cost': current_period_sales['cost'] or 0,
        'total_profit': current_profit,
        'average_profit_margin': (current_profit / current_revenue * 100) if current_revenue > 0 else 0,
        'inventory_value_at_cost': inventory_cost,
        'inventory_value_at_selling': inventory_value,
        'potential_profit': potential_profit,
        'previous_period_revenue': previous_revenue,
        'previous_period_profit': previous_profit,
        'revenue_growth': round(revenue_growth, 2),
        'profit_growth': round(profit_growth, 2)
    }
    
    serializer = ProfitAnalysisSerializer(data)
    return Response(serializer.data)


# Customer ViewSet
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    permission_classes = [AllowAny]
    serializer_class = CustomerSerializer
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CustomerCreateUpdateSerializer
        return CustomerSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(phone_number__icontains=search) |
                Q(tin__icontains=search)
            )
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def purchase_history(self, request, pk=None):
        customer = self.get_object()
        sales = customer.sales.all().order_by('-sale_date')
        
        session = request.query_params.get('session', None)
        year = request.query_params.get('year', None)
        
        if session:
            sales = sales.filter(session=session)
        if year:
            sales = sales.filter(year=year)
        
        page = self.paginate_queryset(sales)
        if page is not None:
            serializer = SaleListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = SaleListSerializer(sales, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        customer = self.get_object()
        
        from django.db.models import Sum
        
        total_sales = customer.sales.count()
        total_spent = customer.sales.aggregate(total=Sum('total_amount'))['total'] or 0
        total_profit = customer.sales.aggregate(total=Sum('total_profit'))['total'] or 0
        
        last_purchase = customer.sales.order_by('-sale_date').first()
        
        session_breakdown = customer.sales.values('session').annotate(
            count=Count('id'),
            total=Sum('total_amount'),
            profit=Sum('total_profit'),
            avg_margin=Avg(F('total_profit') / F('total_amount') * 100)
        )
        
        data = {
            'customer_name': customer.name,
            'customer_phone': customer.phone_number,
            'customer_tin': customer.tin,
            'total_sales': total_sales,
            'total_spent': total_spent,
            'total_profit': total_profit,
            'average_order_value': total_spent / total_sales if total_sales > 0 else 0,
            'average_profit_margin': (total_profit / total_spent * 100) if total_spent > 0 else 0,
            'last_purchase_date': last_purchase.sale_date if last_purchase else None,
            'last_purchase_amount': last_purchase.total_amount if last_purchase else 0,
            'session_breakdown': session_breakdown
        }
        
        return Response(data)


# Sale ViewSet
class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.select_related('customer', 'created_by').prefetch_related('items').all()
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return SaleListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return SaleCreateUpdateSerializer
        return SaleDetailSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        customer = self.request.query_params.get('customer', None)
        if customer:
            queryset = queryset.filter(customer_id=customer)
        
        session = self.request.query_params.get('session', None)
        if session:
            queryset = queryset.filter(session=session)
        
        year = self.request.query_params.get('year', None)
        if year:
            queryset = queryset.filter(year=year)
        
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(sale_date__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(sale_date__date__lte=end_date)
        
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(receipt_number__icontains=search) |
                Q(customer__name__icontains=search) |
                Q(customer__phone_number__icontains=search)
            )
        
        # Filter by profit margin
        min_margin = self.request.query_params.get('min_margin', None)
        if min_margin:
            queryset = queryset.filter(
                total_amount__gt=0
            ).extra(
                select={'margin': 'total_profit / total_amount * 100'}
            ).filter(margin__gte=float(min_margin))
        
        return queryset
    
 
    def create(self, request, *args, **kwargs):
        print("=" * 60)
        print("🔵 CREATE METHOD CALLED")
        print("Request data:", request.data)
        print("User authenticated:", request.user.is_authenticated)
        print("User:", request.user)
        print("=" * 60)
        
        # Make a copy of the request data
        data = request.data.copy()
        
        # If user is authenticated, add them to the data
        if request.user.is_authenticated:
            data['created_by'] = request.user.id
            print(f"✅ Added logged-in user as created_by: {request.user.id}")
        else:
            print("⚠️ User not authenticated, created_by will be handled by serializer")
        
        serializer = self.get_serializer(data=data)
        
        if not serializer.is_valid():
            print("❌ Serializer errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        print("✅ Serializer valid")
        print("Validated data:", serializer.validated_data)
        
        try:
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            print("✅ Sale created successfully")
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            print("❌ Error in create:", str(e))
            import traceback
            traceback.print_exc()
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def perform_create(self, serializer):
        try:
            print("=" * 50)
            print("🔵 PERFORM CREATE CALLED")
            print("=" * 50)
            
            # Save the sale - created_by is already in validated_data from the view
            sale = serializer.save()
            
            print("✅ Sale created successfully!")
            print(f"Sale ID: {sale.id}")
            print(f"Receipt Number: {sale.receipt_number}")
            print(f"Created by: {sale.created_by}")
            print("=" * 50)
            
            return sale
            
        except Exception as e:
            print("❌ ERROR creating sale:")
            print(f"Error type: {type(e).__name__}")
            print(f"Error message: {str(e)}")
            print("=" * 50)
            import traceback
            traceback.print_exc()
            print("=" * 50)
            raise
    @action(detail=True, methods=['get'])
    def receipt(self, request, pk=None):
        sale = self.get_object()
        serializer = SaleDetailSerializer(sale)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        from django.db.models import Sum, Count
        
        year = request.query_params.get('year', timezone.now().year)
        session = request.query_params.get('session', None)
        
        sales = self.get_queryset()
        
        if session:
            sales = sales.filter(session=session, year=year)
        else:
            sales = sales.filter(year=year)
        
        total_sales = sales.count()
        total_revenue = sales.aggregate(total=Sum('total_amount'))['total'] or 0
        total_cost = sales.aggregate(total=Sum('total_cost'))['total'] or 0
        total_profit = sales.aggregate(total=Sum('total_profit'))['total'] or 0
        
        avg_profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        # Session breakdown with profit
        session_1_sales = sales.filter(session=1).count()
        session_2_sales = sales.filter(session=2).count()
        session_3_sales = sales.filter(session=3).count()
        
        session_1_revenue = sales.filter(session=1).aggregate(total=Sum('total_amount'))['total'] or 0
        session_2_revenue = sales.filter(session=2).aggregate(total=Sum('total_amount'))['total'] or 0
        session_3_revenue = sales.filter(session=3).aggregate(total=Sum('total_amount'))['total'] or 0
        
        session_1_profit = sales.filter(session=1).aggregate(total=Sum('total_profit'))['total'] or 0
        session_2_profit = sales.filter(session=2).aggregate(total=Sum('total_profit'))['total'] or 0
        session_3_profit = sales.filter(session=3).aggregate(total=Sum('total_profit'))['total'] or 0
        
        session_1_margin = (session_1_profit / session_1_revenue * 100) if session_1_revenue > 0 else 0
        session_2_margin = (session_2_profit / session_2_revenue * 100) if session_2_revenue > 0 else 0
        session_3_margin = (session_3_profit / session_3_revenue * 100) if session_3_revenue > 0 else 0
        
        data = {
            'total_sales': total_sales,
            'total_revenue': total_revenue,
            'total_cost': total_cost,
            'total_profit': total_profit,
            'average_profit_margin': round(avg_profit_margin, 2),
            'session_1_sales': session_1_sales,
            'session_2_sales': session_2_sales,
            'session_3_sales': session_3_sales,
            'session_1_revenue': session_1_revenue,
            'session_2_revenue': session_2_revenue,
            'session_3_revenue': session_3_revenue,
            'session_1_profit': session_1_profit,
            'session_2_profit': session_2_profit,
            'session_3_profit': session_3_profit,
            'session_1_margin': round(session_1_margin, 2),
            'session_2_margin': round(session_2_margin, 2),
            'session_3_margin': round(session_3_margin, 2)
        }
        
        serializer = SaleSummarySerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def top_selling(self, request):
        from django.db.models import Sum, Count, F, Avg
        
        limit = int(request.query_params.get('limit', 10))
        year = request.query_params.get('year', timezone.now().year)
        session = request.query_params.get('session', None)
        
        items = SaleItem.objects.filter(sale__year=year)
        
        if session:
            items = items.filter(sale__session=session)
        
        top_materials = items.values(
            'material_id',
            'material__name',
            'material__sku'
        ).annotate(
            total_quantity_sold=Sum('quantity'),
            total_revenue=Sum('total_amount'),
            total_profit=Sum('profit'),
            average_profit_margin=Avg(F('profit') / F('total_amount') * 100),
            number_of_sales=Count('sale_id', distinct=True)
        ).order_by('-total_quantity_sold')[:limit]
        
        # Format the data to match serializer field names
        formatted_data = []
        for material in top_materials:
            formatted_data.append({
                'material_id': material['material_id'],
                'material_name': material['material__name'],
                'material_sku': material['material__sku'],
                'total_quantity_sold': material['total_quantity_sold'],
                'total_revenue': material['total_revenue'],
                'total_profit': material['total_profit'],
                'average_profit_margin': material['average_profit_margin'],
                'number_of_sales': material['number_of_sales'],
            })
        
        serializer = TopSellingMaterialSerializer(formatted_data, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def daily_sales(self, request):
        from django.db.models import Sum, Count, DateField
        from django.db.models.functions import TruncDate
        
        days = int(request.query_params.get('days', 30))
        
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        daily_data = Sale.objects.filter(
            sale_date__date__gte=start_date,
            sale_date__date__lte=end_date
        ).annotate(
            date=TruncDate('sale_date', output_field=DateField())
        ).values('date').annotate(
            count=Count('id'),
            revenue=Sum('total_amount'),
            cost=Sum('total_cost'),
            profit=Sum('total_profit'),
            margin=Avg(F('total_profit') / F('total_amount') * 100)
        ).order_by('date')
        
        return Response(daily_data)


class SaleItemViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SaleItem.objects.select_related('sale', 'material').all()
    serializer_class = SaleItemSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        sale = self.request.query_params.get('sale', None)
        if sale:
            queryset = queryset.filter(sale_id=sale)
        
        material = self.request.query_params.get('material', None)
        if material:
            queryset = queryset.filter(material_id=material)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(sale__sale_date__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(sale__sale_date__date__lte=end_date)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def profit_summary(self, request):
        """Get profit summary for sale items"""
        items = self.get_queryset()
        
        total_revenue = items.aggregate(total=Sum('total_amount'))['total'] or 0
        total_cost = items.aggregate(total=Sum('cost_total'))['total'] or 0
        total_profit = items.aggregate(total=Sum('profit'))['total'] or 0
        
        avg_margin = items.aggregate(
            avg=Avg(F('profit') / F('total_amount') * 100)
        )['avg'] or 0
        
        data = {
            'total_revenue': total_revenue,
            'total_cost': total_cost,
            'total_profit': total_profit,
            'average_margin': round(avg_margin, 2),
            'total_items': items.count()
        }
        
        return Response(data)

# Add this to your views.py
class MaterialSalesAnalyticsViewSet(viewsets.ViewSet):
    """ViewSet for material sales analytics"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def top_selling_materials_detailed(self, request):
        """Get top selling materials with detailed analytics"""
        from django.db.models import Sum, Count, Avg, Max, F
        from django.db.models.functions import ExtractMonth
        
        limit = int(request.query_params.get('limit', 20))
        year = request.query_params.get('year', timezone.now().year)
        session = request.query_params.get('session', None)
        
        # Base queryset
        items = SaleItem.objects.filter(sale__year=year)
        
        if session:
            items = items.filter(sale__session=session)
        
        # Aggregate by material
        material_stats = items.values(
            'material_id',
            'material__name',
            'material__sku',
            'material__unit',
            'material__buying_price',
            'material__selling_price'
        ).annotate(
            # Sales metrics
            total_quantity_sold=Sum('quantity'),
            total_revenue=Sum('total_amount'),
            total_cost=Sum('cost_total'),
            total_profit=Sum('profit'),
            total_vat=Sum('vat_amount'),
            number_of_transactions=Count('sale_id', distinct=True),
            number_of_customers=Count('sale__customer_id', distinct=True),
            
            # Price metrics
            avg_selling_price=Avg('selling_price'),
            avg_buying_price=Avg('buying_price'),
            avg_profit_margin=Avg(
                django_models.Case(  # Use django_models instead of models
                    django_models.When(total_amount__gt=0, then=F('profit') / F('total_amount') * 100),
                    default=0,
                    output_field=django_models.DecimalField(max_digits=10, decimal_places=2)
                )
            ),
            
            # Quantity metrics
            avg_quantity_per_sale=Avg('quantity'),
            max_quantity_single_sale=Max('quantity')
        ).order_by('-total_quantity_sold')[:limit]
        
        # Format the data
        formatted_data = []
        for material in material_stats:
            # Get top customers for this material
            top_customers = SaleItem.objects.filter(
                material_id=material['material_id'],
                sale__year=year
            ).values(
                'sale__customer__id',
                'sale__customer__name',
                'sale__customer__phone_number'
            ).annotate(
                total_quantity=Sum('quantity'),
                total_revenue=Sum('total_amount'),
                total_profit=Sum('profit')
            ).order_by('-total_quantity')[:5]
            
            # Get sales trend over months
            sales_trend = SaleItem.objects.filter(
                material_id=material['material_id'],
                sale__year=year
            ).annotate(
                month=ExtractMonth('sale__sale_date')
            ).values('month').annotate(
                quantity_sold=Sum('quantity'),
                revenue=Sum('total_amount'),
                profit=Sum('profit')
            ).order_by('month')
            
            # Calculate stock metrics
            try:
                material_obj = Material.objects.get(id=material['material_id'])
                current_stock = material_obj.current_stock
                stock_turnover = (material['total_quantity_sold'] / current_stock) if current_stock > 0 else 0
                days_of_inventory = (current_stock / (material['total_quantity_sold'] / 365)) if material['total_quantity_sold'] > 0 else 0
            except Material.DoesNotExist:
                current_stock = 0
                stock_turnover = 0
                days_of_inventory = 0
            
            formatted_data.append({
                'material': {
                    'id': material['material_id'],
                    'name': material['material__name'],
                    'sku': material['material__sku'],
                    'unit': material['material__unit'],
                    'buying_price': material['material__buying_price'],
                    'selling_price': material['material__selling_price']
                },
                'sales_metrics': {
                    'total_quantity_sold': material['total_quantity_sold'],
                    'total_revenue': material['total_revenue'],
                    'total_cost': material['total_cost'],
                    'total_profit': material['total_profit'],
                    'total_vat': material['total_vat'],
                    'profit_margin': round(material['avg_profit_margin'] or 0, 2),
                    'number_of_transactions': material['number_of_transactions'],
                    'number_of_unique_customers': material['number_of_customers']
                },
                'price_metrics': {
                    'average_selling_price': material['avg_selling_price'],
                    'average_buying_price': material['avg_buying_price'],
                    'markup_percentage': ((material['avg_selling_price'] - material['avg_buying_price']) / material['avg_buying_price'] * 100) if material['avg_buying_price'] > 0 else 0
                },
                'quantity_metrics': {
                    'average_quantity_per_sale': material['avg_quantity_per_sale'],
                    'max_quantity_single_sale': material['max_quantity_single_sale']
                },
                'inventory_metrics': {
                    'current_stock': current_stock,
                    'stock_turnover_rate': round(stock_turnover, 2),
                    'days_of_inventory': round(days_of_inventory, 2),
                    'reorder_level': material_obj.reorder_level if material_obj else 0,
                    'maximum_stock': material_obj.maximum_stock if material_obj else 0
                },
                'sales_trend': sales_trend,
                'top_customers': top_customers
            })
        
        return Response(formatted_data)
    
    @action(detail=False, methods=['get'])
    def material_performance_comparison(self, request):
        """Compare material performance across different periods"""
        from django.db.models import Sum, Count
        
        material_id = request.query_params.get('material_id', None)
        if not material_id:
            return Response(
                {'error': 'material_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            material = Material.objects.get(id=material_id)
        except Material.DoesNotExist:
            return Response(
                {'error': 'Material not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Current year
        current_year = timezone.now().year
        previous_year = current_year - 1
        
        # Get sales for current and previous year
        current_year_sales = SaleItem.objects.filter(
            material=material,
            sale__year=current_year
        ).aggregate(
            quantity=Sum('quantity'),
            revenue=Sum('total_amount'),
            profit=Sum('profit'),
            transactions=Count('sale_id', distinct=True)
        )
        
        previous_year_sales = SaleItem.objects.filter(
            material=material,
            sale__year=previous_year
        ).aggregate(
            quantity=Sum('quantity'),
            revenue=Sum('total_amount'),
            profit=Sum('profit'),
            transactions=Count('sale_id', distinct=True)
        )
        
        # Calculate growth percentages
        quantity_growth = 0
        revenue_growth = 0
        profit_growth = 0
        
        if previous_year_sales['quantity'] and previous_year_sales['quantity'] > 0:
            quantity_growth = ((current_year_sales['quantity'] - previous_year_sales['quantity']) / previous_year_sales['quantity']) * 100
        
        if previous_year_sales['revenue'] and previous_year_sales['revenue'] > 0:
            revenue_growth = ((current_year_sales['revenue'] - previous_year_sales['revenue']) / previous_year_sales['revenue']) * 100
        
        if previous_year_sales['profit'] and previous_year_sales['profit'] > 0:
            profit_growth = ((current_year_sales['profit'] - previous_year_sales['profit']) / previous_year_sales['profit']) * 100
        
        # Get monthly performance for current year
        monthly_performance = SaleItem.objects.filter(
            material=material,
            sale__year=current_year
        ).annotate(
            month=django_models.functions.ExtractMonth('sale__sale_date')
        ).values('month').annotate(
            quantity=Sum('quantity'),
            revenue=Sum('total_amount'),
            profit=Sum('profit'),
            transactions=Count('sale_id', distinct=True)
        ).order_by('month')
        
        # Get customer segments for this material
        customer_segments = SaleItem.objects.filter(
            material=material,
            sale__year=current_year
        ).values(
            'sale__customer__name',
            'sale__customer__phone_number'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('total_amount'),
            total_profit=Sum('profit')
        ).order_by('-total_quantity')[:10]
        
        data = {
            'material': MaterialListSerializer(material).data,
            'performance_comparison': {
                'current_year': {
                    'year': current_year,
                    'total_quantity': current_year_sales['quantity'] or 0,
                    'total_revenue': current_year_sales['revenue'] or 0,
                    'total_profit': current_year_sales['profit'] or 0,
                    'transactions': current_year_sales['transactions'] or 0
                },
                'previous_year': {
                    'year': previous_year,
                    'total_quantity': previous_year_sales['quantity'] or 0,
                    'total_revenue': previous_year_sales['revenue'] or 0,
                    'total_profit': previous_year_sales['profit'] or 0,
                    'transactions': previous_year_sales['transactions'] or 0
                },
                'growth_percentages': {
                    'quantity': round(quantity_growth, 2),
                    'revenue': round(revenue_growth, 2),
                    'profit': round(profit_growth, 2)
                }
            },
            'monthly_performance': monthly_performance,
            'top_customer_segments': customer_segments
        }
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def materials_ranking(self, request):
        """Get ranking of materials based on different criteria"""
        from django.db.models import Sum, Count, Avg, F
        
        ranking_type = request.query_params.get('type', 'quantity')
        limit = int(request.query_params.get('limit', 20))
        year = request.query_params.get('year', timezone.now().year)
        session = request.query_params.get('session', None)
        
        # Define ranking criteria
        ranking_map = {
            'quantity': 'total_quantity_sold',
            'revenue': 'total_revenue',
            'profit': 'total_profit',
            'transactions': 'number_of_transactions',
            'profit_margin': 'avg_profit_margin'
        }
        
        sort_field = ranking_map.get(ranking_type, 'total_quantity_sold')
        
        # Base queryset
        items = SaleItem.objects.filter(sale__year=year)
        
        if session:
            items = items.filter(sale__session=session)
        
        # Aggregate by material
        material_ranking = items.values(
            'material_id',
            'material__name',
            'material__sku',
            'material__unit'
        ).annotate(
            total_quantity_sold=Sum('quantity'),
            total_revenue=Sum('total_amount'),
            total_cost=Sum('cost_total'),
            total_profit=Sum('profit'),
            total_vat=Sum('vat_amount'),
            number_of_transactions=Count('sale_id', distinct=True),
            number_of_customers=Count('sale__customer_id', distinct=True),
            avg_profit_margin=Avg(
                django_models.Case(  # Use django_models instead of models
                    django_models.When(total_amount__gt=0, then=F('profit') / F('total_amount') * 100),
                    default=0,
                    output_field=django_models.DecimalField(max_digits=10, decimal_places=2)
                )
            ),
            avg_quantity_per_sale=Avg('quantity')
        ).order_by(f'-{sort_field}')[:limit]
        
        # Format data
        formatted_ranking = []
        for idx, material in enumerate(material_ranking, 1):
            formatted_ranking.append({
                'rank': idx,
                'material': {
                    'id': material['material_id'],
                    'name': material['material__name'],
                    'sku': material['material__sku'],
                    'unit': material['material__unit']
                },
                'metrics': {
                    'total_quantity_sold': material['total_quantity_sold'],
                    'total_revenue': material['total_revenue'],
                    'total_profit': material['total_profit'],
                    'profit_margin': round(material['avg_profit_margin'] or 0, 2),
                    'number_of_transactions': material['number_of_transactions'],
                    'number_of_unique_customers': material['number_of_customers'],
                    'average_quantity_per_sale': material['avg_quantity_per_sale']
                }
            })
        
        return Response({
            'ranking_type': ranking_type,
            'year': year,
            'session': session,
            'total_materials_ranked': len(formatted_ranking),
            'ranking': formatted_ranking
        })

class CustomerAnalyticsViewSet(viewsets.ViewSet):
    """ViewSet for customer analytics"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def customer_summary(self, request):
        """Get summary for all customers with their purchase details"""
        customers = Customer.objects.all()
        
        customer_data = []
        for customer in customers:
            # Get all sales for this customer
            sales = Sale.objects.filter(customer=customer)
            
            # Calculate totals
            total_sales_count = sales.count()
            total_quantity = sales.aggregate(total=Sum('total_quantity'))['total'] or 0
            total_revenue = sales.aggregate(total=Sum('total_amount'))['total'] or 0
            total_cost = sales.aggregate(total=Sum('total_cost'))['total'] or 0
            total_profit = sales.aggregate(total=Sum('total_profit'))['total'] or 0
            total_vat = sales.aggregate(total=Sum('total_vat'))['total'] or 0
            
            # Calculate profit margin
            profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0
            
            # Get session breakdown
            session_breakdown = sales.values('session', 'year').annotate(
                revenue=Sum('total_amount'),
                profit=Sum('total_profit'),
                vat=Sum('total_vat')
            ).order_by('-year', 'session')
            
            # Get last purchase
            last_purchase = sales.order_by('-sale_date').first()
            
            # Get top purchased materials
            top_materials = SaleItem.objects.filter(
                sale__customer=customer
            ).values(
                'material__name',
                'material__sku'
            ).annotate(
                total_quantity=Sum('quantity'),
                total_revenue=Sum('total_amount'),
                total_profit=Sum('profit'),
                purchase_count=Count('sale_id', distinct=True)
            ).order_by('-total_quantity')[:5]
            
            customer_data.append({
                'customer': CustomerSerializer(customer).data,
                'total_sales_count': total_sales_count,
                'total_quantity_purchased': total_quantity,
                'total_revenue': total_revenue,
                'total_cost': total_cost,
                'total_profit': total_profit,
                'total_vat': total_vat,
                'profit_margin': round(profit_margin, 2),
                'average_order_value': (total_revenue / total_sales_count) if total_sales_count > 0 else 0,
                'average_profit_per_sale': (total_profit / total_sales_count) if total_sales_count > 0 else 0,
                'last_purchase_date': last_purchase.sale_date if last_purchase else None,
                'last_purchase_receipt': last_purchase.receipt_number if last_purchase else None,
                'last_purchase_amount': last_purchase.total_amount if last_purchase else 0,
                'session_breakdown': session_breakdown,
                'top_materials': top_materials
            })
        
        # Sort by total revenue (or you can sort by any criteria)
        sort_by = request.query_params.get('sort_by', 'total_revenue')
        reverse = request.query_params.get('reverse', 'false').lower() == 'true'
        
        if sort_by in ['total_revenue', 'total_profit', 'total_sales_count', 'total_quantity_purchased']:
            customer_data.sort(key=lambda x: x[sort_by], reverse=not reverse)
        
        return Response(customer_data)
    
    @action(detail=False, methods=['get'])
    def top_customers(self, request):
        """Get top customers based on different criteria"""
        customers = Customer.objects.all()
        
        limit = int(request.query_params.get('limit', 10))
        criteria = request.query_params.get('criteria', 'total_revenue')
        
        # Allowed criteria
        criteria_map = {
            'total_revenue': ('total_revenue', True),
            'total_profit': ('total_profit', True),
            'total_quantity': ('total_quantity_purchased', True),
            'total_sales': ('total_sales_count', True),
            'profit_margin': ('profit_margin', True),
            'average_order_value': ('average_order_value', True)
        }
        
        customer_data = []
        for customer in customers:
            sales = Sale.objects.filter(customer=customer)
            
            total_sales_count = sales.count()
            total_quantity = sales.aggregate(total=Sum('total_quantity'))['total'] or 0
            total_revenue = sales.aggregate(total=Sum('total_amount'))['total'] or 0
            total_profit = sales.aggregate(total=Sum('total_profit'))['total'] or 0
            
            profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0
            average_order_value = (total_revenue / total_sales_count) if total_sales_count > 0 else 0
            
            customer_data.append({
                'customer': {
                    'id': customer.id,
                    'name': customer.name,
                    'phone_number': customer.phone_number,
                    'tin': customer.tin
                },
                'total_sales_count': total_sales_count,
                'total_quantity_purchased': total_quantity,
                'total_revenue': total_revenue,
                'total_profit': total_profit,
                'profit_margin': round(profit_margin, 2),
                'average_order_value': average_order_value
            })
        
        # Sort based on criteria
        if criteria in criteria_map:
            sort_field, reverse_order = criteria_map[criteria]
            customer_data.sort(key=lambda x: x[sort_field], reverse=reverse_order)
        
        return Response(customer_data[:limit])
    
    @action(detail=True, methods=['get'])
    def detailed_analytics(self, request, pk=None):
        """Get detailed analytics for a specific customer"""
        from django.db.models import Sum, Count
        from django.db.models.functions import ExtractMonth, TruncMonth
        
        try:
            customer = Customer.objects.get(pk=pk)
        except Customer.DoesNotExist:
            return Response(
                {'error': 'Customer not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        sales = Sale.objects.filter(customer=customer)
        
        # Time period filters
        year = request.query_params.get('year', None)
        session = request.query_params.get('session', None)
        
        if year:
            sales = sales.filter(year=year)
        if session:
            sales = sales.filter(session=session)
        
        # Calculate metrics
        total_sales = sales.count()
        total_quantity = sales.aggregate(total=Sum('total_quantity'))['total'] or 0
        total_revenue = sales.aggregate(total=Sum('total_amount'))['total'] or 0
        total_cost = sales.aggregate(total=Sum('total_cost'))['total'] or 0
        total_profit = sales.aggregate(total=Sum('total_profit'))['total'] or 0
        total_vat = sales.aggregate(total=Sum('total_vat'))['total'] or 0
        
        # Monthly breakdown - FIXED: Use imported functions directly
        monthly_breakdown = sales.annotate(
            month=ExtractMonth('sale_date'),
            year_month=TruncMonth('sale_date')
        ).values('year_month', 'month', 'year').annotate(
            revenue=Sum('total_amount'),
            profit=Sum('total_profit'),
            vat=Sum('total_vat'),
            sales_count=Count('id')
        ).order_by('year_month')
        
        # Material purchase breakdown
        material_purchases = SaleItem.objects.filter(
            sale__customer=customer
        ).values(
            'material__name',
            'material__sku',
            'material__unit'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('total_amount'),
            total_profit=Sum('profit'),
            total_vat=Sum('vat_amount'),
            purchase_count=Count('sale_id', distinct=True)
        ).order_by('-total_quantity')
        
        # Calculate customer lifetime value (CLV)
        avg_order_value = total_revenue / total_sales if total_sales > 0 else 0
        purchase_frequency = total_sales / (timezone.now().year - customer.created_at.year + 1) if customer.created_at else 0
        customer_lifetime = (timezone.now() - customer.created_at).days / 365 if customer.created_at else 1
        
        # Loyalty metrics
        sales_by_year = sales.values('year').annotate(
            revenue=Sum('total_amount'),
            profit=Sum('total_profit'),
            count=Count('id')
        ).order_by('-year')
        
        # Get purchase pattern (session preferences)
        session_preference = sales.values('session').annotate(
            count=Count('id'),
            revenue=Sum('total_amount')
        ).order_by('-count')
        
        data = {
            'customer': CustomerSerializer(customer).data,
            'summary': {
                'total_sales_count': total_sales,
                'total_quantity_purchased': total_quantity,
                'total_revenue': total_revenue,
                'total_cost': total_cost,
                'total_profit': total_profit,
                'total_vat': total_vat,
                'profit_margin': (total_profit / total_revenue * 100) if total_revenue > 0 else 0,
                'average_order_value': avg_order_value,
                'average_profit_per_sale': total_profit / total_sales if total_sales > 0 else 0
            },
            'lifetime_metrics': {
                'customer_lifetime_years': round(customer_lifetime, 2),
                'lifetime_value': total_revenue,
                'lifetime_profit': total_profit,
                'purchase_frequency_per_year': round(purchase_frequency, 2),
                'years_active': sales_by_year.count()
            },
            'monthly_breakdown': monthly_breakdown,
            'material_purchases': material_purchases,
            'yearly_performance': sales_by_year,
            'session_preference': session_preference,
            'recent_purchases': SaleListSerializer(
                sales.order_by('-sale_date')[:10],
                many=True
            ).data
        }
        
        return Response(data)
    


class SupplierOrderViewSet(viewsets.ModelViewSet):
    """ViewSet for managing supplier orders"""
    queryset = SupplierOrder.objects.select_related('supplier', 'created_by').prefetch_related('items').all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return SupplierOrderListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return SupplierOrderCreateUpdateSerializer
        return SupplierOrderDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by supplier
        supplier = self.request.query_params.get('supplier', None)
        if supplier:
            queryset = queryset.filter(supplier_id=supplier)

        # Filter by status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status.upper())

        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date:
            queryset = queryset.filter(order_date__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(order_date__date__lte=end_date)

        # Filter by overdue
        overdue = self.request.query_params.get('overdue', None)
        if overdue and overdue.lower() == 'true':
            queryset = queryset.filter(
                status__in=['PENDING', 'RECEIVED', 'ACCEPTED'],
                expected_delivery_date__lt=timezone.now().date()
            )

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        """Mark items in the order as received"""
        order = self.get_object()
        if order.status == 'DELIVERED':
            return Response(
                {'error': 'Order is already marked as delivered'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update order status
        order.status = 'DELIVERED'
        order.actual_delivery_date = timezone.now().date()
        order.save()

        # Update stock for each item
        for item in order.items.all():
            material = item.material
            material.current_stock += item.quantity
            material.save()

        serializer = self.get_serializer(order)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def items(self, request, pk=None):
        """Get all items for a specific order"""
        order = self.get_object()
        items = order.items.all()
        serializer = SupplierOrderItemSerializer(items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get summary of supplier orders"""
        from django.db.models import Sum, Count

        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)

        queryset = self.get_queryset()
        if start_date:
            queryset = queryset.filter(order_date__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(order_date__date__lte=end_date)

        total_orders = queryset.count()
        total_value = queryset.aggregate(total=Sum('total_cost'))['total'] or 0
        pending_orders = queryset.filter(status='PENDING').count()
        delivered_orders = queryset.filter(status='DELIVERED').count()
        overdue_orders = queryset.filter(
            status__in=['PENDING', 'RECEIVED', 'ACCEPTED'],
            expected_delivery_date__lt=timezone.now().date()
        ).count()

        data = {
            'total_orders': total_orders,
            'total_value': total_value,
            'pending_orders': pending_orders,
            'delivered_orders': delivered_orders,
            'overdue_orders': overdue_orders
        }

        return Response(data)


    @action(detail=False, methods=['get'], url_path='by-supplier/(?P<supplier_id>\d+)')
    def get_orders_by_supplier(self, request, supplier_id=None):
        """
        Get all supplier orders for a specific supplier.
        """
        try:
            orders = self.get_queryset().filter(supplier_id=supplier_id)
            serializer = self.get_serializer(orders, many=True)
            return Response(serializer.data)
        except Exception as e:  
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        """
        Update the status of a supplier order.
        Supports: RECEIVED, ACCEPTED, CANCELLED
        """
        order = self.get_object()
        new_status = request.data.get('status')
        confirmation_message = request.data.get('confirmation_message', '')
        rejection_reason = request.data.get('rejection_reason', '')

        if not new_status:
            return Response(
                {'error': 'Status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_status not in ['RECEIVED', 'ACCEPTED', 'CANCELLED']:
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_status == 'CANCELLED' and not rejection_reason:
            return Response(
                {'error': 'Rejection reason is required for cancellation'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = new_status
        if new_status == 'RECEIVED':
            order.notes = confirmation_message
        elif new_status == 'CANCELLED':
            order.notes = f"Rejected: {rejection_reason}"

        order.save()

        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

# views.py
from django.db.models import Sum, Count, Avg, F
from django.db.models.functions import TruncDate
from datetime import timedelta
from django.db.models.functions import TruncMonth


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    """Get a comprehensive dashboard summary with all key metrics"""
    today = timezone.now().date()
    start_of_month = today.replace(day=1)
    start_of_year = today.replace(month=1, day=1)
    last_month = start_of_month - timedelta(days=1)
    start_of_last_month = last_month.replace(day=1)

    # 1. Inventory Summary
    materials = Material.objects.filter(is_active=True)
    inventory_cost = materials.aggregate(total=Sum(F('current_stock') * F('buying_price')))['total'] or 0
    inventory_value = materials.aggregate(total=Sum(F('current_stock') * F('selling_price')))['total'] or 0
    potential_profit = inventory_value - inventory_cost
    low_stock_count = materials.filter(current_stock__lte=F('reorder_level')).count()
    overstock_count = materials.filter(current_stock__gte=F('maximum_stock')).count()

    # 2. Sales Summary
    sales = Sale.objects.filter(sale_date__date__gte=start_of_month)
    total_sales = sales.count()
    total_revenue = sales.aggregate(total=Sum('total_amount'))['total'] or 0
    total_profit = sales.aggregate(total=Sum('total_profit'))['total'] or 0
    avg_profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0

    # 3. Alerts Summary
    active_alerts = Alert.objects.filter(is_resolved=False).count()

    # 4. Stock Movements Summary
    stock_movements = StockMovement.objects.filter(created_at__date__gte=start_of_month)
    total_in = stock_movements.filter(movement_type='IN').aggregate(total=Sum('quantity'))['total'] or 0
    total_out = stock_movements.filter(movement_type='OUT').aggregate(total=Sum('quantity'))['total'] or 0

    # 5. Top Selling Materials
    top_materials = SaleItem.objects.filter(
        sale__sale_date__date__gte=start_of_month
    ).values(
        'material__name', 'material__sku'
    ).annotate(
        total_quantity=Sum('quantity'),
        total_revenue=Sum('total_amount')
    ).order_by('-total_quantity')[:5]

    # 6. Top Customers
    top_customers = Sale.objects.filter(
        sale_date__date__gte=start_of_month
    ).values(
        'customer__name', 'customer__phone_number'
    ).annotate(
        total_revenue=Sum('total_amount'),
        total_sales=Count('id')
    ).order_by('-total_revenue')[:5]

    # 7. Supplier Orders Summary
    supplier_orders = SupplierOrder.objects.filter(order_date__date__gte=start_of_month)
    pending_orders = supplier_orders.filter(status='PENDING').count()
    delivered_orders = supplier_orders.filter(status='DELIVERED').count()

   
    # 8. Monthly Sales Trend
    monthly_sales_trend = Sale.objects.filter(
        sale_date__date__gte=start_of_year
    ).annotate(
        month=TruncMonth('sale_date')  # Use TruncMonth if available
    ).values('month').annotate(
        total_revenue=Sum('total_amount'),
        total_profit=Sum('total_profit')
    ).order_by('month')
    # 9. Stock Value Trend
    stock_value_trend = StockMovement.objects.filter(
        created_at__date__gte=start_of_month
    ).annotate(
        day=TruncDate('created_at')
    ).values('day').annotate(
        stock_in=Sum('quantity', filter=Q(movement_type='IN')),
        stock_out=Sum('quantity', filter=Q(movement_type='OUT'))
    ).order_by('day')

    # Prepare the response
    data = {
        'inventory': {
            'total_materials': materials.count(),
            'inventory_cost': inventory_cost,
            'inventory_value': inventory_value,
            'potential_profit': potential_profit,
            'low_stock_count': low_stock_count,
            'overstock_count': overstock_count,
        },
        'sales': {
            'total_sales': total_sales,
            'total_revenue': total_revenue,
            'total_profit': total_profit,
            'avg_profit_margin': round(avg_profit_margin, 2),
        },
        'alerts': {
            'active_alerts': active_alerts,
        },
        'stock_movements': {
            'total_in': total_in,
            'total_out': total_out,
        },
        'top_materials': top_materials,
        'top_customers': top_customers,
        'supplier_orders': {
            'pending_orders': pending_orders,
            'delivered_orders': delivered_orders,
        },
        'monthly_sales_trend': monthly_sales_trend,
        'stock_value_trend': stock_value_trend,
    }

    serializer = DashboardSummarySerializer(data)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def top_selling_materials(request):
    """Get the most bought products based on quantity sold"""
    limit = int(request.query_params.get('limit', 5))
    start_date = request.query_params.get('start_date', None)
    end_date = request.query_params.get('end_date', None)

    items = SaleItem.objects.all()

    if start_date:
        items = items.filter(sale__sale_date__date__gte=start_date)
    if end_date:
        items = items.filter(sale__sale_date__date__lte=end_date)

    top_materials = items.values(
        'material__id',
        'material__name',
        'material__sku'
    ).annotate(
        total_quantity=Sum('quantity')
    ).order_by('-total_quantity')[:limit]

    return Response(top_materials)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def material_movement_analysis(request):
    """Get products categorized by movement (poor, medium, good)"""
    from django.db.models import Case, When, Value, CharField

    poor_threshold = 10  
    medium_threshold = 50  

    items = SaleItem.objects.values(
        'material__id',
        'material__name',
        'material__sku'
    ).annotate(
        total_quantity=Sum('quantity')
    )

    categorized_materials = items.annotate(
        movement_category=Case(
            When(total_quantity__lt=poor_threshold, then=Value('POOR')),
            When(total_quantity__lt=medium_threshold, then=Value('MEDIUM')),
            default=Value('GOOD'),
            output_field=CharField() 
        )
    )

    return Response(categorized_materials)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def system_recommendations(request):
    """Get system recommendations for inventory management"""
    from django.db.models import F, ExpressionWrapper, DecimalField

    # Get low stock materials
    low_stock_materials = Material.objects.filter(
        current_stock__lte=F('reorder_level'),
        is_active=True
    ).values(
        'id', 'name', 'sku', 'current_stock', 'reorder_level'
    )

    # Get overstock materials
    overstock_materials = Material.objects.filter(
        current_stock__gte=F('maximum_stock'),
        is_active=True
    ).values(
        'id', 'name', 'sku', 'current_stock', 'maximum_stock'
    )

    # Get materials with high profit margin but low sales
    high_margin_low_sales = SaleItem.objects.values(
        'material__id',
        'material__name',
        'material__sku'
    ).annotate(
        total_quantity=Sum('quantity'),
        profit_margin=ExpressionWrapper(
            (F('selling_price') - F('buying_price')) / F('selling_price') * 100,
            output_field=DecimalField()
        )
    ).filter(
        profit_margin__gte=30,  # High margin threshold
        total_quantity__lt=10   # Low sales threshold
    )

    recommendations = {
        'low_stock': low_stock_materials,
        'overstock': overstock_materials,
        'high_margin_low_sales': high_margin_low_sales
    }

    return Response(recommendations)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def expired_products_notification(request):
    """Get notifications about expired or soon-to-expire products"""
    from django.utils import timezone

    # Get products that are expired
    expired_products = Material.objects.filter(
        expiry_date__lt=timezone.now().date(),
        is_active=True
    ).values(
        'id', 'name', 'sku', 'expiry_date'
    )

    # Get products that will expire in the next month
    soon_to_expire_products = Material.objects.filter(
        expiry_date__gte=timezone.now().date(),
        expiry_date__lte=timezone.now().date() + timedelta(days=30),
        is_active=True
    ).values(
        'id', 'name', 'sku', 'expiry_date'
    )

    notifications = {
        'expired_products': expired_products,
        'soon_to_expire_products': soon_to_expire_products
    }

    return Response(notifications)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def top_customers(request):
    """Get top customers based on total revenue or other criteria"""
    limit = int(request.query_params.get('limit', 10))
    criteria = request.query_params.get('criteria', 'total_revenue')

    customers = Customer.objects.all()

    customer_data = []
    for customer in customers:
        sales = Sale.objects.filter(customer=customer)
        total_sales_count = sales.count()
        total_revenue = sales.aggregate(total=Sum('total_amount'))['total'] or 0
        total_profit = sales.aggregate(total=Sum('total_profit'))['total'] or 0

        customer_data.append({
            'customer': {
                'id': customer.id,
                'name': customer.name,
                'phone_number': customer.phone_number,
                'tin': customer.tin
            },
            'total_sales_count': total_sales_count,
            'total_revenue': total_revenue,
            'total_profit': total_profit,
        })

    # Sort based on criteria
    if criteria == 'total_revenue':
        customer_data.sort(key=lambda x: x['total_revenue'], reverse=True)
    elif criteria == 'total_profit':
        customer_data.sort(key=lambda x: x['total_profit'], reverse=True)
    elif criteria == 'total_sales_count':
        customer_data.sort(key=lambda x: x['total_sales_count'], reverse=True)

    return Response(customer_data[:limit])

