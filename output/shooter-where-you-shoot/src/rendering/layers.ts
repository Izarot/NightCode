export class LayeredRenderer {
    private canvases: HTMLCanvasElement[] = [];
    private contexts: CanvasRenderingContext2D[] = [];
    
    constructor(private width: number, private height: number, private layerCount: number) {
        for (let i = 0; i < layerCount; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            this.canvases.push(canvas);
            const ctx = canvas.getContext('2d')!;
            this.contexts.push(ctx);
        }
    }
    
    getCanvas(index: number): HTMLCanvasElement {
        return this.canvases[index];
    }
    
    getContext(index: number): CanvasRenderingContext2D {
        return this.contexts[index];
    }
    
    clear(index: number) {
        const ctx = this.contexts[index];
        ctx.clearRect(0, 0, this.width, this.height);
    }
    
    appendTo(parent: HTMLElement) {
        for (const canvas of this.canvases) {
            parent.appendChild(canvas);
        }
    }
}