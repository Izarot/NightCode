#!/usr/bin/env python3
"""
Weather Reporting Tool - Main Entry Point
Fetches mock weather data and outputs a formatted report.
"""

from weather_api import fetch_weather_data
from formatter import format_weather_report
from config import DEFAULT_CITY, REPORT_FORMAT


def main():
    """Main function to generate and display weather report."""
    print(f"Fetching weather data for {DEFAULT_CITY}...")
    
    # Fetch mock weather data
    weather_data = fetch_weather_data(DEFAULT_CITY)
    
    # Format the report
    report = format_weather_report(weather_data, REPORT_FORMAT)
    
    # Output the report
    print(report)


if __name__ == "__main__":
    main()
