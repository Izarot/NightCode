// User interface components
(function() {
    const HUD = {
        updateScore: function(score) {
            var el = document.getElementById('scoreDisplay');
            if (el) el.innerText = 'Score: ' + Math.floor(score);
        },
        showCombo: function(combo) {
            var el = document.getElementById('comboIndicator');
            if (el) el.innerText = 'Combo: x' + combo;
        },
        setLevel: function(level) {
            var el = document.getElementById('levelIndicator');
            if (el) el.innerText = 'Level ' + level;
        },
        updateProgress: function(percent) {
            var el = document.getElementById('progressBar');
            if (el) el.style.width = percent + '%';
        }
    };

    window.HUD = HUD;
})();
