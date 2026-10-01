class Platform {
    public x: number;
    public y: number;
    public width: number;
    public height: number;
    public color: string;
    public type: string;

    constructor(data: any) {
        this.x = data.pos ? data.pos[0] : 0;
        this.y = data.pos ? data.pos[1] : 0;
        this.width = data.w || 100;
        this.height = data.h || 30;
        this.color = data.visuals?.tint || '#6C757D';
        this.type = data.type || 'Static';
    }

    public update(dt: number) {
        // Update platform logic (moving platforms, etc.)
    }
}

export { Platform };