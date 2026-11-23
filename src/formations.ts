// The AX mark as polygons, shared by the printed logo and the 3D logo
export const POLYS: [number, number][][] = [
  [[508, 8], [612, 143], [510, 268], [212, 657], [10, 657]],
  [[612, 143], [803, 388], [700, 511], [510, 268]],
  [[890, 355], [988, 470], [836, 657], [629, 657]],
  [[720, 149], [936, 149], [1360, 657], [1145, 657]],
  [[1221, 8], [1442, 8], [1152, 346], [1048, 222]],
]
export const toWorld = (x: number, y: number): [number, number] => [(x - 726) / 235, (332 - y) / 235]
