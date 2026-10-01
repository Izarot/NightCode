const LEVELS = [
  // Level 1: Tutorial
  {
    id: 1,
    name: "First Balance",
    availableWeights: ['light', 'light', 'medium'],
    lockedSlots: [],
    targetTorque: null, // auto-calc
    timeLimit: 0,
    hint: "Place the medium weight on the left, light on right."
  },
  // Level 2
  {
    id: 2,
    name: "Opposite Sides",
    availableWeights: ['light', 'medium', 'medium'],
    lockedSlots: [],
    timeLimit: 0,
    hint: "Two mediums on one side, light on the other?"
  },
  // Level 3
  {
    id: 3,
    name: "Three Weights",
    availableWeights: ['light', 'light', 'medium', 'heavy'],
    lockedSlots: [],
    timeLimit: 0,
    hint: "Heavy on one side, two lights + medium on other."
  },
  // Level 4: Locked slot
  {
    id: 4,
    name: "Locked Slot",
    availableWeights: ['light', 'medium', 'heavy'],
    lockedSlots: [{ side: 1, index: 0 }], // rightmost slot locked
    timeLimit: 0,
    hint: "Rightmost slot locked. Use other slots."
  },
  // Level 5: Time limit
  {
    id: 5,
    name: "Speed Balance",
    availableWeights: ['light', 'light', 'medium', 'medium', 'heavy'],
    lockedSlots: [],
    timeLimit: 30,
    hint: "Balance within 30 seconds!"
  },
  // Level 6
  {
    id: 6,
    name: "Asymmetric",
    availableWeights: ['light', 'light', 'light', 'medium', 'heavy'],
    lockedSlots: [],
    timeLimit: 0,
    hint: "Fulcrum centered but weights differ."
  },
  // Level 7
  {
    id: 7,
    name: "Heavy Duty",
    availableWeights: ['heavy', 'heavy', 'medium', 'medium', 'light'],
    lockedSlots: [],
    timeLimit: 0,
    hint: "Two heavies need careful placement."
  },
  // Level 8
  {
    id: 8,
    name: "Limited Weights",
    availableWeights: ['light', 'medium'],
    lockedSlots: [],
    timeLimit: 0,
    hint: "Only two weights. Use distance."
  },
  // Level 9
  {
    id: 9,
    name: "Four Slots",
    availableWeights: ['light', 'light', 'light', 'light', 'medium'],
    lockedSlots: [],
    timeLimit: 0,
    hint: "Four lights and a medium."
  },
  // Level 10
  {
    id: 10,
    name: "Precision",
    availableWeights: ['light', 'medium', 'heavy'],
    lockedSlots: [],
    timeLimit: 0,
    hint: "Exact balance required."
  },
  // Level 11
  {
    id: 11,
    name: "Wind Gusts",
    availableWeights: ['light', 'light', 'medium', 'medium', 'heavy'],
    lockedSlots: [],
    timeLimit: 0,
    hint: "Wind applies random torque. (Not implemented in demo)"
  },
  // Level 12
  {
    id: 12,
    name: "Moving Fulcrum",
    availableWeights: ['light', 'medium', 'heavy', 'heavy'],
    lockedSlots: [],
    timeLimit: 0,
    hint: "Fulcrum shifts slightly. (Not implemented in demo)"
  },
  // Level 13
  {
    id: 13,
    name: "Complex Puzzle",
    availableWeights: ['light', 'light', 'medium', 'medium', 'heavy', 'heavy'],
    lockedSlots: [{ side: -1, index: 1 }, { side: 1, index: 2 }],
    timeLimit: 60,
    hint: "Two slots locked, 60 seconds."
  },
  // Level 14
  {
    id: 14,
    name: "Master Balance",
    availableWeights: ['light', 'light', 'light', 'medium', 'medium', 'heavy'],
    lockedSlots: [],
    timeLimit: 0,
    hint: "Final test of skill."
  },
  // Level 15
  {
    id: 15,
    name: "Perfection",
    availableWeights: ['light', 'medium', 'heavy', 'heavy', 'heavy'],
    lockedSlots: [],
    timeLimit: 45,
    hint: "Three heavies! 45 seconds."
  }
];
