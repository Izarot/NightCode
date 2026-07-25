#!/usr/bin/env python3
"""
Mock Weather API Module
Provides simulated weather data for testing purposes.
"""
import random
from datetime import datetime, timedelta
from typing import Dict, List


def fetch_weather_data(city: str) -> Dict:
    """
    Fetch mock weather data for a given city.
    
    Args:
        city: Name of the city to fetch weather for
        
    Returns:
        Dictionary containing weather information
    """
    # Simulate API delay
    import time
    time.sleep(0.1)
    
    # Mock weather conditions
    conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Heavy Rain", "Snow", "Fog"]
    
    current_temp = random.randint(-10, 35)
    humidity = random.randint(30, 90)
    wind_speed = random.randint(0, 25)
    condition = random.choice(conditions)
    
    # Generate forecast for next 5 days
    forecast = []
    for i in range(5):
        date = datetime.now() + timedelta(days=i)
        forecast.append({
            "date": date.strftime("%Y-%m-%d"),
            "day": date.strftime("%A"),
            "high": current_temp + random.randint(-5, 5),
            "low": current_temp + random.randint(-10, 0),
            "condition": random.choice(conditions),
            "precipitation_chance": random.randint(0, 100)
        })
    
    return {
        "city": city,
        "timestamp": datetime.now().isoformat(),
        "current": {
            "temperature": current_temp,
            "feels_like": current_temp + random.randint(-3, 3),
            "humidity": humidity,
            "wind_speed": wind_speed,
            "wind_direction": random.choice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]),
            "condition": condition,
            "pressure": random.randint(990, 1030)
        },
        "forecast": forecast,
        "alerts": [] if random.random() > 0.3 else ["Weather advisory in effect"]
    }


def get_available_cities() -> List[str]:
    """Return list of cities with mock data available."""
    return ["New York", "London", "Tokyo", "Paris", "Sydney", "Berlin", "Toronto"]
