export class Canvas {
    constructor(id) {
        this.canvas = document.getElementById(id);
        this.ctx = this.canvas.getContext('2d');
        this.internalWidth = 800;
        this.internalHeight = 600;
        this.scaleX = 1;
        this.scaleY = 1;
        this.resize();
    }
    
    get width() { return this.internalWidth; }
    get height() { return this.internalHeight; }
    get context() { return this.ctx; }
    
    resize() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        this.scaleX = windowWidth / this.internalWidth;
        this.scaleY = windowHeight / this.internalHeight;
        
        this.canvas.style.width = this.internalWidth + 'px';
        this.canvas.style.height = this.internalHeight + 'px';
        this.canvas.width = this.internalWidth;
        this.canvas.height = this.internalHeight;
    }
}