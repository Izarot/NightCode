export const Levels = {
  levels: [
    {
      id: 1,
      nodes: [
        {x:1, y:1, type:'source', id:1},
        {x:9, y:9, type:'consumer', id:2}
      ],
      walls: []
    },
    {
      id: 2,
      nodes: [
        {x:2, y:2, type:'source', id:1},
        {x:8, y:2, type:'consumer', id:2},
        {x:5, y:5, type:'transformer', id:3}
      ],
      walls: [
        {x:4, y:4},
        {x:6, y:6}
      ]
    }
  ]
}
