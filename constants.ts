import { Difficulty } from './types';

export const DIFFICULTY_CONFIG = {
  [Difficulty.EASY]: {
    gridSize: 15,
    gravity: 0.012, // Increased from 0.006
    friction: 0.98,
    mazeComplexity: 0.2 // Chance to remove extra walls for loops
  },
  [Difficulty.MEDIUM]: {
    gridSize: 25,
    gravity: 0.016, // Increased from 0.008
    friction: 0.985,
    mazeComplexity: 0.0
  },
  [Difficulty.HARD]: {
    gridSize: 37,
    gravity: 0.022, // Increased from 0.011
    friction: 0.99,
    mazeComplexity: -0.1 // Potentially denser? (just larger is hard enough)
  }
};

export const CELL_SIZE = 1.0;
export const WALL_HEIGHT = 0.8;
export const MARBLE_RADIUS = 0.25;
export const MAX_TILT = 15 * (Math.PI / 180); // 15 degrees in radians
export const DEADZONE = 0.05; // 5% center deadzone
export const INTRO_DURATION = 8000; // 8 seconds
export const TILT_SPEED = 0.02; // For keyboard controls