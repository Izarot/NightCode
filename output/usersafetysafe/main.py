from weather_service import get_mock_weather_data
from utils import format_weather_entry
from config import REPORT_HEADER

def main():
    print(REPORT_HEADER)
    print("Fetching latest data...\n")
    
    try:
        weather_data = get_mock_weather_data()
        for entry in weather_data:
            formatted_line = format_weather_entry(entry)
            print(formatted_line)
    except Exception as e:
        print(f"An error occurred while generating the report: {e}")
    
    print("\n--- End of Report ---")

if __name__ == "__main__":
    main()