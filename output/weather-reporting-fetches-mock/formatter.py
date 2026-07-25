#!/usr/bin/env python3
"""
Weather Report Formatter
Formats weather data into human-readable reports.
"""
from typing import Dict, Any


def format_weather_report(data: Dict[str, Any], format_type: str = "detailed") -> str:
    """
    Format weather data into a report string.
    
    Args:
        data: Weather data dictionary
        format_type: Type of report ('detailed', 'summary', 'compact')
        
    Returns:
        Formatted report string
    """
    if format_type == "summary":
        return _format_summary(data)
    elif format_type == "compact":
        return _format_compact(data)
    else:
        return _format_detailed(data)


def _format_detailed(data: Dict[str, Any]) -> str:
    """Format detailed weather report."""
    current = data["current"]
    forecast = data["forecast"]
    
    lines = [
        "=" * 50,
        f"WEATHER REPORT FOR {data['city'].upper()}",
        "=" * 50,
        f"Generated: {data['timestamp'][:19].replace('T', ' ')}",
        "",
        "CURRENT CONDITIONS:",
        "-" * 30,
        f"Temperature:     {current['temperature']}C (feels like {current['feels_like']}C)",
        f"Condition:       {current['condition']}",
        f"Humidity:        {current['humidity']}%",
        f"Wind:            {current['wind_speed']} km/h {current['wind_direction']}",
        f"Pressure:        {current['pressure']} hPa",
        "",
        "5-DAY FORECAST:",
        "-" * 30,
    ]
    
    for day in forecast:
        lines.append(
            f"{day['day'][:3]} {day['date']}: {day['condition']:12} |"
            f"High: {day['high']:3}C | Low: {day['low']:3}C |"
            f"Rain: {day['precipitation_chance']}%"
        )
    
    if data["alerts"]:
        lines.extend(["", "ALERTS:", "-" * 30])
        for alert in data["alerts"]:
            lines.append(f"  ! {alert}")
    
    lines.append("=" * 50)
    return "\n".join(lines)


def _format_summary(data: Dict[str, Any]) -> str:
    """Format summary weather report."""
    current = data["current"]
    today = data["forecast"][0]
    
    return (
        f"{data['city']}: {current['temperature']}C, {current['condition']}"
        f"\nToday: High {today['high']}C / Low {today['low']}C, {today['precipitation_chance']}% rain"
    )


def _format_compact(data: Dict[str, Any]) -> str:
    """Format compact one-line weather report."""
    current = data["current"]
    return f"{data['city']} | {current['temperature']}C | {current['condition']} | Humidity: {current['humidity']}% | Wind: {current['wind_speed']}km/h"
