# Weather Reporting Tool

A simple Python tool that fetches mock weather data and generates formatted weather reports.

## Features

- Fetches mock weather data (simulated API)
- Multiple report formats: detailed, summary, compact
- 5-day forecast included
- Weather alerts support
- Configurable default city and format

## Installation

No external dependencies required. Uses only Python standard library.

bash
python3 main.py


## Usage

Run the main script:

bash
python3 main.py


### Configuration

Edit `config.py` to change:
- `DEFAULT_CITY`: City to fetch weather for (default: "New York")
- `REPORT_FORMAT`: Report style - "detailed", "summary", or "compact"

### Available Cities

- New York
- London
- Tokyo
- Paris
- Sydney
- Berlin
- Toronto

## Project Structure


├── main.py           # Entry point
├── weather_api.py    # Mock weather data provider
├── formatter.py      # Report formatting logic
├── config.py         # Configuration settings
└── README.md         # This file


## Example Output


==================================================
WEATHER REPORT FOR NEW YORK
==================================================
Generated: 2024-01-15 14:30:22

CURRENT CONDITIONS:
------------------------------
Temperature:     22C (feels like 24C)
Condition:       Partly Cloudy
Humidity:        65%
Wind:            12 km/h SW
Pressure:        1013 hPa

5-DAY FORECAST:
------------------------------
Mon 2024-01-15: Partly Cloudy  | High:  22C | Low:  15C | Rain: 20%
Tue 2024-01-16: Sunny          | High:  25C | Low:  18C | Rain: 5%
Wed 2024-01-17: Light Rain     | High:  20C | Low:  14C | Rain: 80%
Thu 2024-01-18: Cloudy         | High:  19C | Low:  13C | Rain: 30%
Fri 2024-01-19: Sunny          | High:  23C | Low:  16C | Rain: 10%

==================================================


## Extending

To integrate with a real weather API:

1. Modify `weather_api.py` to make actual HTTP requests
2. Add API key configuration in `config.py`
3. Update `fetch_weather_data()` to parse real API responses

## License

MIT License
