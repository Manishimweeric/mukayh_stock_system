# permissions.py
from rest_framework import permissions


class IsAdminOnly(permissions.BasePermission):
    """
    Permission class that allows only administrators
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'


class IsAdminOrManager(permissions.BasePermission):
    """
    Permission class that allows administrators and managers
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['ADMIN', 'MANAGER']


class IsWarehouseStaff(permissions.BasePermission):
    """
    Permission class for warehouse staff
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['ADMIN', 'MANAGER', 'WAREHOUSE']


class ReadOnly(permissions.BasePermission):
    """
    Read-only permission for all authenticated users
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.method in permissions.SAFE_METHODS