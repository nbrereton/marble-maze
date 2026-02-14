import React from 'react';
import { GameState, Difficulty, Theme, MarbleColor } from '../types.ts';
import { MAX_TILT } from '../constants.ts';

interface UIProps {
  gameState: GameState;
  difficulty: Difficulty;
  theme: Theme;
  marbleColor: MarbleColor;
  setMarbleColor: (c: MarbleColor) => void;
  tilt: { x: number, z: number };
  onReset: () => void;
  onTogglePause: () => void;
  onSelectDifficulty: (d: Difficulty) => void;
  onToggleTheme: () => void;
  onChangeDifficulty: () => void;
}

const MARBLE_COLORS = [
  { id: MarbleColor.RED, hex: '#ef4444' },
  { id: MarbleColor.GREEN, hex: '#22c55e' },
  { id: MarbleColor.YELLOW, hex: '#facc15' },
  { id: MarbleColor.BLUE, hex: '#3b82f6' },
];

export const UI: React.FC<UIProps> = ({ 
  gameState, 
  difficulty, 
  theme,
  marbleColor,
  setMarbleColor,
  tilt, 
  onReset, 
  onTogglePause, 
  onSelectDifficulty,
  onToggleTheme,
  onChangeDifficulty 
}) => {
  // Corrected orientation mapping:
  // tilt.z is roll (around Z). In App.tsx, mouse RIGHT results in negative tilt.z.
  // We want indicator RIGHT (normX > 0) when tilt.z is negative.
  const normX = -tilt.z / MAX_TILT; 
  // tilt.x is pitch (around X). In App.tsx, mouse DOWN results in positive tilt.x.
  // We want indicator DOWN (normY > 0) when tilt.x is positive.
  const normY = tilt.x / MAX_TILT;

  if (gameState === GameState.START_MENU) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md text-white pointer-events-auto">
        <div className="max-w-md w-full p-8 bg-zinc-900 rounded-3xl border border-white/10 shadow-2xl text-center">
          <h1 className="text-4xl font-black mb-2 tracking-tighter text-blue-500">MARBLE MAZE</h1>
          <p className="text-zinc-400 mb-6 font-medium italic">Customize your experience</p>
          
          <div className="flex flex-col gap-4 mb-8">
            <button 
              onClick={() => onSelectDifficulty(Difficulty.EASY)}
              className="w-full py-4 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 rounded-2xl transition-all group text-left px-6"
            >
              <div className="font-bold text-xl text-emerald-400">EASY</div>
              <div className="text-xs text-emerald-400/60 uppercase tracking-widest">Small maze &middot; Relaxed speed</div>
            </button>
            <button 
              onClick={() => onSelectDifficulty(Difficulty.MEDIUM)}
              className="w-full py-4 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-2xl transition-all text-left px-6"
            >
              <div className="font-bold text-xl text-blue-400">MEDIUM</div>
              <div className="text-xs text-blue-400/60 uppercase tracking-widest">The classic experience</div>
            </button>
            <button 
              onClick={() => onSelectDifficulty(Difficulty.HARD)}
              className="w-full py-4 bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/30 rounded-2xl transition-all text-left px-6"
            >
              <div className="font-bold text-xl text-rose-400">HARD</div>
              <div className="text-xs text-rose-400/60 uppercase tracking-widest">Massive maze &middot; High momentum</div>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 pt-6 border-t border-white/5">
             <div className="flex flex-col items-center gap-3">
               <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Board Style</span>
               <button 
                  onClick={onToggleTheme}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2"
               >
                  <div className={`w-3 h-3 rounded-full ${theme === Theme.WOOD ? 'bg-amber-700' : 'bg-zinc-400'}`} />
                  <span className="font-bold text-xs uppercase">{theme}</span>
               </button>
             </div>

             <div className="flex flex-col items-center gap-3">
               <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Marble Color</span>
               <div className="flex gap-2">
                 {MARBLE_COLORS.map(c => (
                   <button
                     key={c.id}
                     onClick={() => setMarbleColor(c.id)}
                     className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${marbleColor === c.id ? 'border-white scale-125' : 'border-transparent'}`}
                     style={{ backgroundColor: c.hex }}
                   />
                 ))}
               </div>
             </div>
          </div>

          <div className="mt-8 text-zinc-500 text-[10px] flex justify-center gap-4 uppercase tracking-widest font-bold">
            <div><span className="text-white bg-white/5 px-2 py-0.5 rounded mr-1">IJKL</span> TILT</div>
            <div><span className="text-white bg-white/5 px-2 py-0.5 rounded mr-1">DRAG</span> BOARD</div>
            <div><span className="text-white bg-white/5 px-2 py-0.5 rounded mr-1">D</span> SOLVE</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 text-white select-none">
      <div className="flex justify-between items-start">
        <div className="bg-black/50 p-4 rounded-xl backdrop-blur-md border border-white/20">
          <h1 className="text-2xl font-bold tracking-tight">MARBLE MAZE PRO</h1>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              difficulty === Difficulty.EASY ? 'bg-emerald-500 text-emerald-950' :
              difficulty === Difficulty.MEDIUM ? 'bg-blue-500 text-blue-950' :
              'bg-rose-500 text-rose-950'
            }`}>
              {difficulty}
            </span>
            <span className="text-xs opacity-50 uppercase">{theme} STYLE</span>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MARBLE_COLORS.find(c => c.id === marbleColor)?.hex }} />
          </div>
        </div>
        
        <div className="flex gap-4 pointer-events-auto">
          <button 
            onClick={onToggleTheme}
            className="bg-white/5 hover:bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/10 transition-all text-xs font-bold"
          >
            THEME
          </button>
          <button 
            onClick={onChangeDifficulty}
            className="bg-white/5 hover:bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/10 transition-all text-xs font-bold"
          >
            MENU
          </button>
          <button 
            onClick={onReset}
            className="bg-white/10 hover:bg-white/20 p-4 rounded-xl backdrop-blur-md border border-white/20 transition-all active:scale-95"
          >
            Reset (R)
          </button>
          <button 
            onClick={onTogglePause}
            className="bg-white/10 hover:bg-white/20 p-4 rounded-xl backdrop-blur-md border border-white/20 transition-all active:scale-95"
          >
            {gameState === GameState.PAUSED ? 'Resume' : 'Pause'} (P)
          </button>
        </div>
      </div>

      {gameState === GameState.INTRO && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="text-center animate-pulse">
            <h2 className="text-4xl font-black mb-2 italic">SCANNING BOARD...</h2>
            <p className="text-lg opacity-80 uppercase tracking-widest">{difficulty} CHALLENGE LOADED</p>
          </div>
        </div>
      )}

      {gameState === GameState.PAUSED && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
          <div className="bg-zinc-900 p-8 rounded-2xl border border-white/10 text-center shadow-2xl">
            <h2 className="text-4xl font-bold mb-6">GAME PAUSED</h2>
            <div className="flex flex-col gap-4">
              <button 
                onClick={onTogglePause}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg"
              >
                RESUME GAME
              </button>
              <button 
                onClick={onChangeDifficulty}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                QUIT TO MENU
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end items-end">
        <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest opacity-50">TILT ORIENTATION</span>
            <div className="relative w-24 h-24 rounded-full border-2 border-white/30 bg-white/5 backdrop-blur-sm">
                <div 
                    className="absolute w-4 h-4 rounded-full shadow-lg transition-transform duration-75"
                    style={{
                        backgroundColor: MARBLE_COLORS.find(c => c.id === marbleColor)?.hex,
                        left: '50%',
                        top: '50%',
                        transform: `translate(calc(-50% + ${normX * 40}px), calc(-50% + ${normY * 40}px))`
                    }}
                />
                <div className="absolute inset-0 border border-white/10 rounded-full scale-50" />
            </div>
        </div>
      </div>
    </div>
  );
};