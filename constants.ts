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
export const WALL_HEIGHT = 0.375; // 75% of marble diameter (0.5)
export const MARBLE_RADIUS = 0.25;
export const MAX_TILT = 30 * (Math.PI / 180); // Increased to 30 degrees for more responsiveness
export const DEADZONE = 0.012; // Even tighter deadzone for precision
export const INTRO_DURATION = 8000;
export const TILT_SPEED = 0.045; // Faster tilt accumulation for snappier keys
export const DRAG_SENSITIVITY = 90; // Higher sensitivity for touch/drag
