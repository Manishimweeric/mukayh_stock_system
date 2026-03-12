from celery import Celery
from celery.schedules import crontab
from django.utils import timezone
from inventory.utils.alerts import check_all_materials_for_low_stock

app = Celery('inventory')

@app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # Runs every 5 minutes
    sender.add_periodic_task(
        300.0,  # 300 seconds = 5 minutes
        check_low_stock.s(),
        name='Check low stock every 5 minutes'
    )

@app.task
def check_low_stock():
    alerts_created = check_all_materials_for_low_stock()
    return f'Created {alerts_created} alerts at {timezone.now()}'