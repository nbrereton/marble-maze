
export enum GameState {
  START_MENU = 'START_MENU',
  INTRO = 'INTRO',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  VICTORY = 'VICTORY'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum Theme {
  WOOD = 'WOOD',
  METAL = 'METAL'
}

export enum MarbleColor {
  RED = 'RED',
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  BLUE = 'BLUE'
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface MazeData {
  grid: number[][]; // 1 for wall, 0 for path
  width: number;
  height: number;
}
