# Architecture Documentation

This project follows a modular structure to ensure maintainability and scalability.

- **`src/`**: Contains the core application code, including the game loop, rendering engine, input handling, and audio management.
- **`tests/`**: Contains automated unit tests for game mechanics like collision detection and state persistence.
- **`config/`**: Stores non-secret configuration settings such as colors and audio frequencies.
- **`docs/`**: Contains project documentation and architectural overviews.
- **`scripts/`**: Contains build and maintenance automation scripts.

## Responsive Design
The canvas scales dynamically to fit the viewport, ensuring compatibility across mobile and desktop devices.