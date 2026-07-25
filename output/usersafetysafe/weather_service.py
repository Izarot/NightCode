import random
from config import CITIES

def get_mock_weather_data():
    """
    Simulates fetching weather data from an API.
    Returns a list of dictionaries containing city weather info.
    """
    conditions = ['Sunny', 'Cloudy', 'Rainy', 'Stormy', 'Partly Cloudy']
    weather_reports = []
    
    for city in CITIES:
        weather_reports.append({
            'city': city,
            'temperature': random.randint(-10, 35),
            'condition': random.choice(conditions),
            'humidity': random.randint(30, 90)
        })
    
    return weather_reports