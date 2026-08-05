# Architecture

- Core ECS framework in `src/core/ecs.ts`.
- Fixed timestep physics in `src/core/physics.ts`.
- Dual-layer level data in JSON format.
- Rendering pipeline uses Canvas 2D with HiDPI scaling.
- UI built with minimal DOM‑less approach.

## Systems

- **InputSystem** – buffers key states, provides deterministic `InputFrame`.
- **PhysicsSystem** – swept AABB resolver, kinematic integration, collision.
- **CameraSystem** – virtual camera, split‑screen when characters separate.
- **RenderSystem** – draws entities, particles, UI layers.
- **MechanicsSystem** – implements Desync mechanics (Phase Shift, Gravity Inversion, etc.).

## Data Flow

1. Input is polled each frame into a shared `InputFrame`.
2. `FixedUpdate` steps physics for all entities using the same input.
3. Collision results modify velocity and state.
4. Render system draws based on current transform and layer order.
5. UI reads game state (distance, death count) to update HUD.

## Determinism

All physics uses fixed timestep (1/60 s) and deterministic collision resolution, ensuring reproducible outcomes across browsers.
