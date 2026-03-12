# ai_forecasting.py
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from decimal import Decimal
from django.utils import timezone
from sklearn.linear_model import LinearRegression
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from .models import Material, StockMovement, DemandForecast
from django.db.models import Sum


class DemandForecaster:
    """AI-powered demand forecasting engine"""
    
    def __init__(self, material):
        self.material = material
        self.historical_data = self._get_historical_data()
    
    def _get_historical_data(self, days=90):
        """Get historical stock movement data"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        movements = StockMovement.objects.filter(
            material=self.material,
            movement_type='OUT',
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).order_by('created_at')
        
        # Aggregate by date
        data = {}
        for movement in movements:
            date = movement.created_at.date()
            if date not in data:
                data[date] = 0
            data[date] += float(movement.quantity)
        
        # Create DataFrame
        df = pd.DataFrame(list(data.items()), columns=['date', 'demand'])
        df['date'] = pd.to_datetime(df['date'])
        df = df.set_index('date')
        df = df.sort_index()
        
        # Fill missing dates with 0
        date_range = pd.date_range(start=start_date, end=end_date, freq='D')
        df = df.reindex(date_range, fill_value=0)
        
        return df
    
    def forecast_arima(self, forecast_days=30):
        """ARIMA forecasting model"""
        if len(self.historical_data) < 14:
            return None
        
        try:
            # Fit ARIMA model
            model = ARIMA(self.historical_data['demand'], order=(1, 1, 1))
            fitted_model = model.fit()
            
            # Make predictions
            forecast = fitted_model.forecast(steps=forecast_days)
            
            # Calculate confidence (simplified)
            residuals = fitted_model.resid
            mse = np.mean(residuals ** 2)
            confidence = max(0, min(100, 100 - (mse * 10)))
            
            return {
                'predictions': forecast.tolist(),
                'confidence': round(confidence, 2),
                'algorithm': 'ARIMA'
            }
        except Exception as e:
            print(f"ARIMA forecast failed: {e}")
            return None
    
    def forecast_exponential_smoothing(self, forecast_days=30):
        """Exponential Smoothing forecasting"""
        if len(self.historical_data) < 14:
            return None
        
        try:
            model = ExponentialSmoothing(
                self.historical_data['demand'],
                seasonal_periods=7,
                trend='add',
                seasonal='add'
            )
            fitted_model = model.fit()
            
            forecast = fitted_model.forecast(steps=forecast_days)
            
            # Calculate confidence
            residuals = self.historical_data['demand'] - fitted_model.fittedvalues
            mse = np.mean(residuals ** 2)
            confidence = max(0, min(100, 100 - (mse * 10)))
            
            return {
                'predictions': forecast.tolist(),
                'confidence': round(confidence, 2),
                'algorithm': 'Exponential_Smoothing'
            }
        except Exception as e:
            print(f"Exponential Smoothing forecast failed: {e}")
            return None
    
    def forecast_linear_regression(self, forecast_days=30):
        """Simple Linear Regression forecast"""
        if len(self.historical_data) < 7:
            return None
        
        try:
            # Prepare data
            X = np.arange(len(self.historical_data)).reshape(-1, 1)
            y = self.historical_data['demand'].values
            
            # Fit model
            model = LinearRegression()
            model.fit(X, y)
            
            # Make predictions
            future_X = np.arange(
                len(self.historical_data),
                len(self.historical_data) + forecast_days
            ).reshape(-1, 1)
            forecast = model.predict(future_X)
            
            # Calculate R-squared as confidence
            score = model.score(X, y)
            confidence = max(0, min(100, score * 100))
            
            return {
                'predictions': forecast.tolist(),
                'confidence': round(confidence, 2),
                'algorithm': 'Linear_Regression'
            }
        except Exception as e:
            print(f"Linear Regression forecast failed: {e}")
            return None
    
    def forecast_moving_average(self, forecast_days=30, window=7):
        """Moving Average forecast"""
        if len(self.historical_data) < window:
            return None
        
        try:
            # Calculate moving average
            ma = self.historical_data['demand'].rolling(window=window).mean()
            last_ma = ma.iloc[-1]
            
            # Simple forecast: extend last MA value
            forecast = [last_ma] * forecast_days
            
            # Calculate confidence based on variance
            variance = self.historical_data['demand'].var()
            confidence = max(0, min(100, 100 - (variance / 10)))
            
            return {
                'predictions': forecast,
                'confidence': round(confidence, 2),
                'algorithm': 'Moving_Average'
            }
        except Exception as e:
            print(f"Moving Average forecast failed: {e}")
            return None
    
    def generate_forecast(self, forecast_days=30, method='auto'):
        """Generate forecast using specified or best method"""
        
        if method == 'auto':
            # Try multiple methods and select best
            methods = [
                self.forecast_arima,
                self.forecast_exponential_smoothing,
                self.forecast_linear_regression,
                self.forecast_moving_average
            ]
            
            best_result = None
            best_confidence = 0
            
            for method_func in methods:
                result = method_func(forecast_days)
                if result and result['confidence'] > best_confidence:
                    best_result = result
                    best_confidence = result['confidence']
            
            return best_result
        
        # Use specific method
        method_map = {
            'arima': self.forecast_arima,
            'exponential': self.forecast_exponential_smoothing,
            'linear': self.forecast_linear_regression,
            'moving_average': self.forecast_moving_average
        }
        
        if method in method_map:
            return method_map[method](forecast_days)
        
        return None
    
    def save_forecast(self, forecast_days=30, method='auto'):
        """Generate and save forecast to database"""
        result = self.generate_forecast(forecast_days, method)
        
        if not result:
            return False
        
        today = timezone.now().date()
        forecasts_created = 0
        
        for i, prediction in enumerate(result['predictions']):
            forecast_date = today + timedelta(days=i + 1)
            
            # Ensure prediction is non-negative
            prediction = max(0, prediction)
            
            forecast, created = DemandForecast.objects.update_or_create(
                material=self.material,
                forecast_date=forecast_date,
                defaults={
                    'predicted_demand': Decimal(str(round(prediction, 2))),
                    'confidence_score': Decimal(str(result['confidence'])),
                    'algorithm_used': result['algorithm']
                }
            )
            
            if created:
                forecasts_created += 1
        
        return forecasts_created


def generate_all_forecasts(forecast_days=30):
    """Generate forecasts for all active materials"""
    materials = Material.objects.filter(is_active=True)
    results = {
        'total': materials.count(),
        'successful': 0,
        'failed': 0
    }
    
    for material in materials:
        try:
            forecaster = DemandForecaster(material)
            count = forecaster.save_forecast(forecast_days)
            if count:
                results['successful'] += 1
            else:
                results['failed'] += 1
        except Exception as e:
            print(f"Failed to forecast for {material.name}: {e}")
            results['failed'] += 1
    
    return results


def update_forecast_accuracy():
    """Update forecast accuracy by comparing with actual demand"""
    today = timezone.now().date()
    
    forecasts = DemandForecast.objects.filter(
        forecast_date=today,
        actual_demand__isnull=True
    )
    
    for forecast in forecasts:
        # Get actual demand from stock movements
        actual = StockMovement.objects.filter(
            material=forecast.material,
            movement_type='OUT',
            created_at__date=today
        ).aggregate(total=Sum('quantity'))['total']
        
        if actual:
            forecast.actual_demand = Decimal(str(actual))
            forecast.save()
    
    return forecasts.count()