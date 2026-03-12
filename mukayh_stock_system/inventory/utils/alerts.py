from django.utils import timezone
from decimal import Decimal
from django.core.mail import send_mail
from django.conf import settings
from ..models import Material, Alert


def send_low_stock_email(material, priority):
    """
    Send email notification when low stock alert is created
    """
    subject = f"[{priority}] Low Stock Alert - {material.name}"

    message = f"""
LOW STOCK ALERT

Material Name: {material.name}
Current Stock: {material.current_stock} {material.unit}
Reorder Level: {material.reorder_level} {material.unit}
Priority: {priority}

Action Required:
Please reorder this material immediately to avoid stock-out.
"""
    recipient_list = [
        "manishimweeric54@gmail.com",
    ]

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipient_list,
        fail_silently=False,
    )


def check_and_create_low_stock_alert(material):
    """
    Check if material stock is low and create alert if needed.
    Returns True if alert was created, False otherwise.
    """
    if not material.is_active:
        return False

    if material.current_stock <= material.reorder_level:
        existing_alert = Alert.objects.filter(
            material=material,
            alert_type='LOW_STOCK',
            is_resolved=False
        ).first()

        if not existing_alert:
            reorder_level_decimal = Decimal(str(material.reorder_level))
            current_stock_decimal = Decimal(str(material.current_stock))

            if current_stock_decimal <= Decimal('0'):
                priority = 'CRITICAL'
            elif current_stock_decimal <= (reorder_level_decimal * Decimal('0.3')):
                priority = 'HIGH'
            elif current_stock_decimal <= (reorder_level_decimal * Decimal('0.6')):
                priority = 'MEDIUM'
            else:
                priority = 'LOW'
            Alert.objects.create(
                alert_type='LOW_STOCK',
                priority=priority,
                material=material,
                title=f'Low Stock Alert: {material.name}',
                message=(
                    f'Stock level ({material.current_stock} {material.unit}) '
                    f'is below reorder level ({material.reorder_level} {material.unit}). '
                    f'Please reorder.'
                ),
                is_resolved=False
            )

            send_low_stock_email(material, priority)

            return True

    return False


def check_and_resolve_low_stock_alert(material):
    """
    Resolve low stock alerts when stock is replenished.
    Returns True if alerts were resolved, False otherwise.
    """
    if material.current_stock > material.reorder_level:
        unresolved_alerts = Alert.objects.filter(
            material=material,
            alert_type='LOW_STOCK',
            is_resolved=False
        )

        if unresolved_alerts.exists():
            for alert in unresolved_alerts:
                alert.is_resolved = True
                alert.resolved_at = timezone.now()
                alert.save()
            return True

    return False


def check_all_materials_for_low_stock():
    """
    Check all active materials and create low stock alerts.
    Returns count of alerts created.
    """
    alerts_created = 0
    active_materials = Material.objects.filter(is_active=True)

    for material in active_materials:
        if check_and_create_low_stock_alert(material):
            alerts_created += 1

    return alerts_created
