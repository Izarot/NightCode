import { state } from '../state.js';
import mapConfig from '../data/mapConfig.json';

export function loadMap() {
  state.startNode = { ...mapConfig.startNode };
  state.coreNode = { ...mapConfig.coreNode };
  state.buildZones = mapConfig.buildZones.map(z => ({ ...z }));
  state.highways = [];
  // Generate procedural highways
  generateHighways();
}

function generateHighways() {
  // Create a few winding paths from start to core
  const paths = [
    [
      { x: 100, y: 540 }, { x: 250, y: 540 }, { x: 400, y: 450 }, { x: 600, y: 450 },
      { x: 800, y: 540 }, { x: 1000, y: 600 }, { x: 1200, y: 540 }, { x: 1400, y: 450 },
      { x: 1600, y: 540 }, { x: 1820, y: 540 }
    ],
    [
      { x: 100, y: 540 }, { x: 300, y: 620 }, { x: 500, y: 700 }, { x: 750, y: 680 },
      { x: 950, y: 720 }, { x: 1150, y: 700 }, { x: 1350, y: 680 }, { x: 1550, y: 620 },
      { x: 1820, y: 540 }
    ],
    [
      { x: 100, y: 540 }, { x: 280, y: 420 }, { x: 480, y: 380 }, { x: 700, y: 420 },
      { x: 900, y: 380 }, { x: 1100, y: 420 }, { x: 1300, y: 380 }, { x: 1500, y: 420 },
      { x: 1700, y: 480 }, { x: 1820, y: 540 }
    ]
  ];
  paths.forEach((nodes, idx) => {
    state.highways.push({ id: idx, nodes });
  });
}
