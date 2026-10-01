class PhysicsEngine {
    private bodies: any[] = [];

    constructor() {}

    public addBody(body: any) {
        this.bodies.push(body);
    }

    public update(dt: number) {
        this.bodies.forEach(body => {
            if (body.update) body.update(dt);
        });
    }
}

export { PhysicsEngine };