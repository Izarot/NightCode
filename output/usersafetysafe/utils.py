from config import TEMPERATURE_UNITS

def format_weather_entry(data):
    """
    Formats a single weather data dictionary into a readable string.
    """
    return f"{data['city']}: {data['temperature']}°{TEMPERATURE_UNITS[0]}, {data['condition']} (Humidity: {data['humidity']}%)"