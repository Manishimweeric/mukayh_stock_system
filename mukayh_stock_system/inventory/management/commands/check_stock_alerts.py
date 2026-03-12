from django.core.management.base import BaseCommand
from django.utils import timezone
from inventory.models import Material, Alert
from django.db.models import F


class Command(BaseCommand):
    help = 'Check stock levels and create alerts'
    
    def handle(self, *args, **options):
        self.stdout.write('Checking stock levels...')
        
        alerts_created = 0
        
        # Check for low stock
        low_stock_materials = Material.objects.filter(
            is_active=True,
            current_stock__lte=F('reorder_level')
        )
        
        for material in low_stock_materials:
            # Check if alert already exists
            existing = Alert.objects.filter(
                material=material,
                alert_type='LOW_STOCK',
                is_resolved=False
            ).exists()
            
            if not existing:
                Alert.objects.create(
                    alert_type='LOW_STOCK',
                    priority='HIGH' if material.current_stock == 0 else 'MEDIUM',
                    material=material,
                    title=f'Low Stock Alert: {material.name}',
                    message=f'{material.name} stock is at {material.current_stock} {material.unit}. Reorder level is {material.reorder_level} {material.unit}.'
                )
                alerts_created += 1
        
        # Check for overstock
        overstock_materials = Material.objects.filter(
            is_active=True,
            current_stock__gte=F('maximum_stock')
        )
        
        for material in overstock_materials:
            existing = Alert.objects.filter(
                material=material,
                alert_type='OVERSTOCK',
                is_resolved=False
            ).exists()
            
            if not existing:
                Alert.objects.create(
                    alert_type='OVERSTOCK',
                    priority='LOW',
                    material=material,
                    title=f'Overstock Warning: {material.name}',
                    message=f'{material.name} stock is at {material.current_stock} {material.unit}. Maximum level is {material.maximum_stock} {material.unit}.'
                )
                alerts_created += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'Created {alerts_created} new alerts')
        )

