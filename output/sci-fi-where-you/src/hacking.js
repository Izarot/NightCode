// Hacking system module for NEXUS INFILTRATOR
export function initHacking() {
  const miniGames = {
    circuitConnection: {
      active: false,
      difficulty: 1,
      nodes: [],
      connections: [],
      timeLimit: 10
    },
    systemOverride: {
      active: false,
      chargeLevel: 0,
      requiredCharge: 100,
      timeLimit: 5
    },
    codeInjection: {
      active: false,
      sequence: [],
      playerInput: [],
      currentIndex: 0,
      timeLimit: 8
    }
  };

  return {
    miniGames,
    startCircuitGame: (difficulty) => {
      miniGames.circuitConnection.active = true;
      miniGames.circuitConnection.difficulty = difficulty;
      miniGames.circuitConnection.timeLimit = 15 - difficulty * 2;
      // Generate nodes based on difficulty
      const nodeCount = 4 + difficulty * 2;
      miniGames.circuitConnection.nodes = [];
      for (let i = 0; i < nodeCount; i++) {
        miniGames.circuitConnection.nodes.push({
          x: Math.random() * 0.8 + 0.1,
          y: Math.random() * 0.8 + 0.1,
          connected: false
        });
      }
    },
    startOverrideGame: (difficulty) => {
      miniGames.systemOverride.active = true;
      miniGames.systemOverride.chargeLevel = 0;
      miniGames.systemOverride.requiredCharge = 80 + difficulty * 20;
      miniGames.systemOverride.timeLimit = 8 - difficulty;
    },
    startCodeInjection: (difficulty) => {
      miniGames.codeInjection.active = true;
      miniGames.codeInjection.sequence = [];
      const seqLength = 5 + difficulty * 3;
      for (let i = 0; i < seqLength; i++) {
        miniGames.codeInjection.sequence.push(Math.floor(Math.random() * 4));
      }
      miniGames.codeInjection.playerInput = [];
      miniGames.codeInjection.currentIndex = 0;
      miniGames.codeInjection.timeLimit = 10 + difficulty * 2;
    },
    update: (delta) => {
      // Update active mini-games
      if (miniGames.circuitConnection.active) {
        miniGames.circuitConnection.timeLimit -= delta;
        if (miniGames.circuitConnection.timeLimit <= 0) {
          miniGames.circuitConnection.active = false;
        }
      }
      if (miniGames.systemOverride.active) {
        miniGames.systemOverride.timeLimit -= delta;
        if (miniGames.systemOverride.timeLimit <= 0) {
          miniGames.systemOverride.active = false;
        }
      }
      if (miniGames.codeInjection.active) {
        miniGames.codeInjection.timeLimit -= delta;
        if (miniGames.codeInjection.timeLimit <= 0) {
          miniGames.codeInjection.active = false;
        }
      }
    }
  };
}
