# Python script to take user input, process it, and return formatted output


def greet_user(name):
    """Formats and returns a greeting message."""
    return f"Hello, {name}!"


def calculator():
    """Takes two numbers and returns their sum."""
    num1 = float(input("Enter first number: "))
    num2 = float(input("Enter second number: "))
    return f"The sum is: {num1 + num2}"


def main():
    print("--- User Input Processor ---")
    action = input("Choose an action (1 for greeting, 2 for summing numbers): ")

    if action == "1":
        name = input("Enter your name: ")
        print("Result:", greet_user(name))

    elif action == "2":
        print(calculator())

    else:
        print("Invalid action selected.")


if __name__ == "__main__":
    main()