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

from .models import (
    Category, Supplier, Material, StockMovement,
    DemandForecast, Alert, StockAnalytics, User, Customer, Sale, SaleItem
)
from .serializers import (
    CategorySerializer, SupplierSerializer,
    MaterialListSerializer, MaterialDetailSerializer,
    MaterialCreateUpdateSerializer, StockMovementSerializer,
    DemandForecastSerializer, AlertSerializer,
    StockAnalyticsSerializer, UserSerializer,
    UserRegistrationSerializer, UserLoginSerializer,
    DashboardStatsSerializer, CustomerSerializer, CustomerCreateUpdateSerializer,
    SaleListSerializer, SaleDetailSerializer, SaleCreateUpdateSerializer,
    SaleItemSerializer, SaleSummarySerializer, TopSellingMaterialSerializer,
    ProfitAnalysisSerializer, StockTrendSerializer
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
            average_margin=Avg(F('profit') / F('total_amount') * 100),
            number_of_sales=Count('sale_id', distinct=True)
        ).order_by('-total_quantity_sold')[:limit]
        
        serializer = TopSellingMaterialSerializer(top_materials, many=True)
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