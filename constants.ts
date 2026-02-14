import { Difficulty } from './types.ts';

export const DIFFICULTY_CONFIG = {
  [Difficulty.EASY]: {
    gridSize: 15,
    gravity: 0.012,
    friction: 0.98,
    mazeComplexity: 0.2
  },
  [Difficulty.MEDIUM]: {
    gridSize: 25,
    gravity: 0.016,
    friction: 0.985,
    mazeComplexity: 0.0
  },
  [Difficulty.HARD]: {
    gridSize: 37,
    gravity: 0.022,
    friction: 0.99,
    mazeComplexity: -0.1
  }
};

export const CELL_SIZE = 1.0;
export const WALL_HEIGHT = 0.8;
export const MARBLE_RADIUS = 0.25;
export const MAX_TILT = 15 * (Math.PI / 180);
export const DEADZONE = 0.05;
export const INTRO_DURATION = 8000;
export const TILT_SPEED = 0.02;
// Drag 150 pixels for max tilt
export const DRAG_SENSITIVITY = 150;