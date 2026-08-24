// Main HUD Controller
const MainHUD = {
    init() {
        this.updateResources();
        this.updateTimer();
        this.updateHealth();
    },
    
    updateResources() {
        const el = document.getElementById('hud-top-left');
        if (el) {
            const nutrients = typeof ResourceManager !== 'undefined' ? ResourceManager.nutrients : 0;
            const mutagen = typeof ResourceManager !== 'undefined' ? ResourceManager.mutagen : 0;
            const mp = typeof GameState !== 'undefined' ? GameState.mp : 0;
            const maxMp = typeof GameState !== 'undefined' ? GameState.maxMp : 100;
            el.innerHTML = '<div>Nutrients: ' + nutrients + '</div>' +
                '<div>Mutagen: ' + mutagen + '</div>' +
                '<div>MP: ' + mp + '/' + maxMp + '</div>';
        }
    },
    
    updateTimer() {
        const el = document.getElementById('hud-top-center');
        if (el) {
            const time = typeof GameState !== 'undefined' ? GameState.time : 0;
            const round = typeof GameState !== 'undefined' ? GameState.round : 1;
            el.innerHTML = '<div>Time: ' + time + '</div><div>Round: ' + round + '</div>';
        }
    },
    
    updateHealth() {
        const el = document.getElementById('hud-top-right');
        if (el) {
            el.innerHTML = '<div>Colony Health: 100%</div>';
        }
    },
    
    updateAll() {
        this.updateResources();
        this.updateTimer();
        this.updateHealth();
    }
};

window.addEventListener('load', function() {
    if (typeof SFX !== 'undefined') {
        SFX.init();
    }
    if (typeof GameState !== 'undefined') {
        GameState.init();
    }
    if (typeof MainHUD !== 'undefined') {
        MainHUD.init();
    }
});
