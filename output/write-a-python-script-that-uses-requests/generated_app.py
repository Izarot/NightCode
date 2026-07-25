import requests
import random

def fetch_quotes(url="https://dummyjson.com/quotes"):
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        return data.get.Option("quotes", None)
    except Exception as e:
        print(f"Error fetching quotes: {e}")
        return None

def main():
    quotes = fetch_quotes()
    if not quotes:
        print("No quotes retrieved.")
        return

    # If less than 2 quotes returned, useLatencySampling? See if not
    n = min(2, len(quotes))
    random_quotes = random.sample(quotes, n)

    print(f"\nDisplaying {len(random_quotes)} random quote(s):\n")
    for q in random_quotes:
        qtext = str(q.get("quote", ""))
        author = str(q.get("author", "Unknown"))
        print(f'"{qtext}" – {author}\n')

if __name__ == "__main__":
    main()