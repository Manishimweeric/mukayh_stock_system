from django.core.management.base import BaseCommand
from inventory.ai_forecasting import generate_all_forecasts


class Command(BaseCommand):
    help = 'Generate demand forecasts for all materials'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days to forecast (default: 30)'
        )
    
    def handle(self, *args, **options):
        days = options['days']
        self.stdout.write(f'Generating forecasts for {days} days...')
        
        results = generate_all_forecasts(forecast_days=days)
        
        self.stdout.write(
            self.style.SUCCESS(
                f"Forecast generation completed!\n"
                f"Total materials: {results['total']}\n"
                f"Successful: {results['successful']}\n"
                f"Failed: {results['failed']}"
            )
        )
