def process_input(user_input):
    if isinstance(user_input, str):
        import re
        words = re.findall(r'\b\w+\b', user_input)
        word_count = len(words)
        capitalized = user_input.upper()
        return {
            'original': user_input,
            'word_count': word_count,
            'uppercase': capitalized
        }
    else:
        total = sum(user_input)
        avg = total / len(user_input) if user_input else 0
        return {
            'original': user_input,
            'sum': total,
            'average': avg
        }

if __name__ == "__main__":
    input_str = input("Enter a string or a comma‑separated list of numbers: ").strip()
    numbers = []
    try:
        numbers = [float(x) for x in input_str.split(',')]
        result = process_input(numbers) if numbers else process_input(input_str)
    except ValueError:
        result = process_input(input_str)

    if 'word_count' in result:
        print(f"Original text: {result['original']}")
        print(f"Word count: {result['word_count']}")
        print(f"Uppercase: {result['uppercase']}")
    else:
        print(f"Original list: {result['original']}")
        print(f"Sum: {result['sum']}")
        print(f"Average: {result['average']}")