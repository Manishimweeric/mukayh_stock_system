from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from inventory.models import Category, Supplier, Material
from decimal import Decimal

User = get_user_model()


class Command(BaseCommand):
    help = 'Populate database with sample data'
    
    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')
        
        # Create admin user
        admin, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@mukayh.com',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'ADMIN'
            }
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(f'Created admin user: admin/admin123')
        
        # Create categories
        categories_data = [
            {'name': 'Cement & Concrete', 'description': 'Cement, concrete mix, mortar'},
            {'name': 'Steel & Metal', 'description': 'Rebar, steel beams, metal sheets'},
            {'name': 'Wood & Timber', 'description': 'Lumber, plywood, timber'},
            {'name': 'Electrical', 'description': 'Wires, cables, switches'},
            {'name': 'Plumbing', 'description': 'Pipes, fittings, valves'},
        ]
        
        for cat_data in categories_data:
            Category.objects.get_or_create(**cat_data)
        
        self.stdout.write(f'Created {len(categories_data)} categories')
        
        # Create suppliers
        suppliers_data = [
            {
                'name': 'BuildMaster Supplies',
                'contact_person': 'John Doe',
                'email': 'john@buildmaster.com',
                'phone': '+250788123456',
                'address': 'Kigali, Rwanda'
            },
            {
                'name': 'Steel Solutions Ltd',
                'contact_person': 'Jane Smith',
                'email': 'jane@steelsolutions.com',
                'phone': '+250788234567',
                'address': 'Kigali, Rwanda'
            },
        ]
        
        for supp_data in suppliers_data:
            Supplier.objects.get_or_create(
                email=supp_data['email'],
                defaults=supp_data
            )
        
        self.stdout.write(f'Created {len(suppliers_data)} suppliers')
        
        # Create sample materials
        cement_cat = Category.objects.get(name='Cement & Concrete')
        steel_cat = Category.objects.get(name='Steel & Metal')
        supplier = Supplier.objects.first()
        
        materials_data = [
            {
                'name': 'Portland Cement 50kg',
                'sku': 'CEM-001',
                'category': cement_cat,
                'supplier': supplier,
                'unit': 'BAG',
                'unit_price': Decimal('15000'),
                'current_stock': Decimal('150'),
                'reorder_level': Decimal('50'),
                'maximum_stock': Decimal('500'),
            },
            {
                'name': 'Steel Rebar 12mm',
                'sku': 'STL-001',
                'category': steel_cat,
                'supplier': supplier,
                'unit': 'PCS',
                'unit_price': Decimal('8500'),
                'current_stock': Decimal('200'),
                'reorder_level': Decimal('100'),
                'maximum_stock': Decimal('1000'),
            },
        ]
        
        for mat_data in materials_data:
            Material.objects.get_or_create(
                sku=mat_data['sku'],
                defaults=mat_data
            )
        
        self.stdout.write(
            self.style.SUCCESS('Sample data created successfully!')
        )