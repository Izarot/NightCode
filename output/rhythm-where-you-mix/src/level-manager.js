// Level progression and generation
(function() {
    const Levels = {
        1: {
            obstacles: [{ x: 400, y: 350 }, { x: 800, y: 250 }],
            speed: 2,
            bpm: 120
        },
        2: {
            obstacles: [{ x: 300, y: 200 }, { x: 600, y: 150 }, { x: 900, y: 100 }],
            speed: 3,
            bpm: 130
        },
        3: {
            obstacles: [{ x: 200, y: 300 }, { x: 500, y: 200 }, { x: 800, y: 150 }, { x: 1100, y: 100 }],
            speed: 4,
            bpm: 140
        },
        4: {
            obstacles: [{ x: 150, y: 250 }, { x: 400, y: 180 }, { x: 650, y: 120 }, { x: 900, y: 80 }, { x: 1150, y: 60 }],
            speed: 5,
            bpm: 150
        },
        5: {
            obstacles: [{ x: 100, y: 200 }, { x: 300, y: 150 }, { x: 500, y: 100 }, { x: 700, y: 80 }, { x: 900, y: 60 }, { x: 1100, y: 50 }],
            speed: 6,
            bpm: 160
        }
    };

    function getNextLevel() {
        var next = state.level + 1;
        if (next > 5) {
            // Game complete - loop back or show victory
            return 1;
        }
        state.level = next;
        HUD.setLevel(state.level);
        return next;
    }

    function getLevelData(levelNum) {
        return Levels[levelNum] || Levels[1];
    }

    function getCurrentBPM() {
        var levelData = getLevelData(state.level);
        return levelData.bpm || 120;
    }

    window.getNextLevel = getNextLevel;
    window.getLevelData = getLevelData;
    window.getCurrentBPM = getCurrentBPM;
})();
