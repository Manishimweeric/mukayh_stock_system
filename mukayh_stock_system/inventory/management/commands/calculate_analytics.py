from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Sum, Count, F
from decimal import Decimal
from inventory.models import Material, StockMovement, StockAnalytics


class Command(BaseCommand):
    help = 'Calculate and store daily analytics'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            help='Date to calculate analytics for (YYYY-MM-DD)'
        )
    
    def handle(self, *args, **options):
        if options['date']:
            date = timezone.datetime.strptime(options['date'], '%Y-%m-%d').date()
        else:
            date = timezone.now().date()
        
        self.stdout.write(f'Calculating analytics for {date}...')
        
        # Calculate metrics
        total_materials = Material.objects.filter(is_active=True).count()
        
        total_stock_value = Material.objects.filter(is_active=True).aggregate(
            total=Sum(F('current_stock') * F('unit_price'))
        )['total'] or Decimal('0')
        
        low_stock_items = Material.objects.filter(
            is_active=True,
            current_stock__lte=F('reorder_level')
        ).count()
        
        overstock_items = Material.objects.filter(
            is_active=True,
            current_stock__gte=F('maximum_stock')
        ).count()
        
        stock_in = StockMovement.objects.filter(
            created_at__date=date,
            movement_type='IN'
        ).aggregate(total=Sum('quantity'))['total'] or Decimal('0')
        
        stock_out = StockMovement.objects.filter(
            created_at__date=date,
            movement_type='OUT'
        ).aggregate(total=Sum('quantity'))['total'] or Decimal('0')
        
        # Calculate turnover rate (simplified)
        if total_stock_value > 0:
            turnover_rate = (stock_out / float(total_stock_value)) * 100
        else:
            turnover_rate = Decimal('0')
        
        # Create or update analytics
        analytics, created = StockAnalytics.objects.update_or_create(
            date=date,
            defaults={
                'total_stock_value': total_stock_value,
                'total_materials': total_materials,
                'low_stock_items': low_stock_items,
                'overstock_items': overstock_items,
                'stock_in_quantity': stock_in,
                'stock_out_quantity': stock_out,
                'stock_turnover_rate': turnover_rate
            }
        )
        
        action = 'Created' if created else 'Updated'
        self.stdout.write(
            self.style.SUCCESS(f'{action} analytics for {date}')
        )
