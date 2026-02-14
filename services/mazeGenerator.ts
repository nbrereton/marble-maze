import { MazeData } from '../types.ts';

export const generateMaze = (size: number, shortcutChance: number = 0): MazeData => {
  const actualSize = size % 2 === 0 ? size + 1 : size;
  const grid = Array(actualSize).fill(0).map(() => Array(actualSize).fill(1));

  const carve = (x: number, y: number) => {
    const directions = [
      [0, -2], [0, 2], [-2, 0], [2, 0]
    ].sort(() => Math.random() - 0.5);

    grid[y][x] = 0;

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx > 0 && nx < actualSize - 1 && ny > 0 && ny < actualSize - 1 && grid[ny][nx] === 1) {
        grid[y + dy / 2][x + dx / 2] = 0;
        carve(nx, ny);
      }
    }
  };

  carve(1, 1);

  if (shortcutChance > 0) {
    for (let y = 1; y < actualSize - 1; y++) {
      for (let x = 1; x < actualSize - 1; x++) {
        if (grid[y][x] === 1 && Math.random() < shortcutChance) {
          const neighbors = [grid[y-1][x], grid[y+1][x], grid[y][x-1], grid[y][x+1]];
          const pathCount = neighbors.filter(v => v === 0).length;
          if (pathCount >= 2) {
             grid[y][x] = 0;
          }
        }
      }
    }
  }

  const center = Math.floor(actualSize / 2);
  grid[center][center] = 0;
  
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      grid[center + dy][center + dx] = 0;
    }
  }

  return { grid, width: actualSize, height: actualSize };
};

export const getRandomStartPosition = (maze: MazeData): { x: number, y: number } => {
  const center = Math.floor(maze.width / 2);
  let x = 1, y = 1;
  let attempts = 0;
  const maxAttempts = 500;

  const possibleCoords: number[] = [];
  for (let i = 1; i < maze.width - 1; i += 2) {
    possibleCoords.push(i);
  }

  const minDistance = maze.width * 0.4;

  do {
    x = possibleCoords[Math.floor(Math.random() * possibleCoords.length)];
    y = possibleCoords[Math.floor(Math.random() * possibleCoords.length)];
    attempts++;
    
    const isWall = maze.grid[y][x] === 1;
    const distToCenter = Math.sqrt(Math.pow(x - center, 2) + Math.pow(y - center, 2));
    
    if (!isWall && distToCenter >= minDistance) {
      return { x, y };
    }
  } while (attempts < maxAttempts);

  let furthest = { x: 1, y: 1, dist: 0 };
  for (let r = 1; r < maze.height - 1; r++) {
    for (let c = 1; c < maze.width - 1; c++) {
      if (maze.grid[r][c] === 0) {
        const d = Math.sqrt(Math.pow(c - center, 2) + Math.pow(r - center, 2));
        if (d > furthest.dist) {
          furthest = { x: c, y: r, dist: d };
        }
      }
    }
  }
  
  return { x: furthest.x, y: furthest.y };
};

export const findPathToCenter = (maze: MazeData, start: { x: number, y: number }): { x: number, y: number }[] => {
  const center = Math.floor(maze.width / 2);
  const queue: { x: number, y: number, path: { x: number, y: number }[] }[] = [{ x: start.x, y: start.y, path: [] }];
  const visited = new Set<string>();
  visited.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const { x, y, path } = queue.shift()!;
    if (x === center && y === center) return path;

    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (nx >= 0 && nx < maze.width && ny >= 0 && ny < maze.height && maze.grid[ny][nx] === 0 && !visited.has(key)) {
        visited.add(key);
        queue.push({ x: nx, y: ny, path: [...path, { x: nx, y: ny }] });
      }
    }
  }
  return [];
};