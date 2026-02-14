import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Stars, Text, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';
import { GameState, MazeData, Difficulty, Theme, MarbleColor } from './types';
import { DIFFICULTY_CONFIG, MAX_TILT, DEADZONE, TILT_SPEED, INTRO_DURATION } from './constants';
import { generateMaze, getRandomStartPosition, findPathToCenter } from './services/mazeGenerator';
import { Board } from './components/Board';
import { Marble } from './components/Marble';
import { UI } from './components/UI';
import { JazzyMusic } from './components/JazzyMusic';
import { VictorySounds } from './components/VictorySounds';
import { FireworksEffect } from './components/Fireworks';

const Scene: React.FC<{
  maze: MazeData;
  gameState: GameState;
  onVictory: () => void;
  tilt: { x: number, z: number };
  setTilt: (t: { x: number, z: number }) => void;
  difficulty: Difficulty;
  theme: Theme;
  marbleColor: MarbleColor;
  marbleStart: THREE.Vector3;
  isDemoMode: boolean;
  demoPath: { x: number, y: number }[];
}> = ({ maze, gameState, onVictory, tilt, setTilt, difficulty, theme, marbleColor, marbleStart, isDemoMode, demoPath }) => {
  const { camera } = useThree();
  const introStartTime = useRef<number | null>(null);
  const victoryTextRef = useRef<THREE.Group>(null);
  const victoryOrbitAngle = useRef(0);

  // Dynamic zoom: based on maze width to ensure everything is visible
  const mazeWidth = maze?.width || 13;
  const targetDistance = Math.max(14, mazeWidth * 1.1);
  const targetHeight = Math.max(16, mazeWidth * 1.3);

  // Reset intro timer when game starts/resets
  useEffect(() => {
    if (gameState === GameState.INTRO) {
      introStartTime.current = null;
    }
  }, [gameState, maze]);

  useFrame((state, delta) => {
    try {
      if (gameState === GameState.INTRO) {
        if (introStartTime.current === null) introStartTime.current = state.clock.elapsedTime;
        const elapsed = (state.clock.elapsedTime - introStartTime.current) * 1000;
        const progress = Math.min(elapsed / INTRO_DURATION, 1);
        
        // 2 full circuits = 4 * PI
        const angle = progress * Math.PI * 4;
        const radius = 30 + mazeWidth * 0.5 - progress * (15 + mazeWidth * 0.5);
        const height = 20 + mazeWidth * 0.5 - progress * (6 + mazeWidth * 0.5);
        
        camera.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
        camera.lookAt(0, 0, 0);
      } 
      else if (gameState === GameState.VICTORY) {
        // Smooth orbital camera during victory
        victoryOrbitAngle.current += delta * 0.25;
        const orbitRadius = targetDistance * 1.6;
        camera.position.set(
          Math.cos(victoryOrbitAngle.current) * orbitRadius,
          targetHeight * 0.8,
          Math.sin(victoryOrbitAngle.current) * orbitRadius
        );
        camera.lookAt(0, 0, 0);

        // Spin the 3D text in the scene
        if (victoryTextRef.current) {
          victoryTextRef.current.rotation.y += delta * 2;
        }
      }
      else {
        // Normal smooth gameplay camera
        const targetPos = new THREE.Vector3(0, targetHeight, targetDistance);
        camera.position.lerp(targetPos, 0.05);
        camera.lookAt(0, 0, 0);
      }
    } catch (e) {
      // Silently catch r3f frame errors
    }
  });

  return (
    <>
      <color attach="background" args={['#020202']} />
      <PerspectiveCamera makeDefault fov={50} position={[0, 40, 40]} />
      <ambientLight intensity={0.5} />
      {/* Key point light for strong specular highlights */}
      <pointLight position={[30, 60, 30]} intensity={12} castShadow shadow-mapSize={[2048, 2048]} />
      {/* Fill light to bring out maze definition */}
      <pointLight position={[-30, 40, -10]} intensity={4} color="#5577ff" />
      <Environment preset="apartment" />
      <Stars radius={150} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <group rotation={[tilt.x, 0, tilt.z]}>
        <Board maze={maze} tilt={{ x: 0, z: 0 }} theme={theme} />
        <Marble 
          position={marbleStart} 
          tilt={tilt} 
          maze={maze} 
          gameState={gameState} 
          onVictory={onVictory}
          gravity={DIFFICULTY_CONFIG[difficulty].gravity}
          friction={DIFFICULTY_CONFIG[difficulty].friction}
          isDemoMode={isDemoMode}
          demoPath={demoPath}
          setTilt={setTilt}
          marbleColor={marbleColor}
        />
      </group>

      {gameState === GameState.VICTORY && (
        <group position={[0, 6, 0]}>
          <FireworksEffect />
          <Suspense fallback={null}>
            <Float speed={3} rotationIntensity={0.5} floatIntensity={1.5}>
              <group ref={victoryTextRef}>
                <Text
                  fontSize={2.5}
                  font="https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nVivM.woff"
                  anchorX="center"
                  anchorY="middle"
                >
                  VICTORY!
                  <meshStandardMaterial 
                    color="#ffd700" 
                    metalness={1.0} 
                    roughness={0.05} 
                    emissive="#b45309" 
                    emissiveIntensity={0.6}
                  />
                </Text>
              </group>
            </Float>
          </Suspense>
        </group>
      )}
    </>
  );
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START_MENU);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [theme, setTheme] = useState<Theme>(Theme.WOOD);
  const [marbleColor, setMarbleColor] = useState<MarbleColor>(MarbleColor.BLUE);
  const [maze, setMaze] = useState<MazeData>(generateMaze(DIFFICULTY_CONFIG[Difficulty.MEDIUM].gridSize));
  const [marbleStart, setMarbleStart] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const [tilt, setTilt] = useState({ x: 0, z: 0 });
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoPath, setDemoPath] = useState<{ x: number, y: number }[]>([]);
  const keys = useRef<{ [key: string]: boolean }>({});

  const initGame = useCallback((diff: Difficulty) => {
    const config = DIFFICULTY_CONFIG[diff];
    // Generate COMPLETELY NEW maze and start pos on every call (including Reset)
    const newMaze = generateMaze(config.gridSize, config.mazeComplexity);
    const startPos = getRandomStartPosition(newMaze);
    const halfW = (newMaze.width - 1) / 2;
    const halfH = (newMaze.height - 1) / 2;
    
    setMaze(newMaze);
    setMarbleStart(new THREE.Vector3(startPos.x - halfW, 0, startPos.y - halfH));
    setTilt({ x: 0, z: 0 });
    setGameState(GameState.INTRO);
    setIsDemoMode(false);
    setDemoPath([]);
    
    const tid = setTimeout(() => setGameState(GameState.PLAYING), INTRO_DURATION);
    return () => clearTimeout(tid);
  }, []);

  const handleReset = useCallback(() => {
    initGame(difficulty);
  }, [difficulty, initGame]);

  const handleTogglePause = useCallback(() => {
    setGameState(prev => {
      if (prev === GameState.PLAYING) return GameState.PAUSED;
      if (prev === GameState.PAUSED) return GameState.PLAYING;
      return prev;
    });
  }, []);

  const triggerDemo = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    const halfW = (maze.width - 1) / 2;
    const halfH = (maze.height - 1) / 2;
    const currentGridX = Math.round(marbleStart.x + halfW);
    const currentGridY = Math.round(marbleStart.z + halfH);
    const path = findPathToCenter(maze, { x: currentGridX, y: currentGridY });
    if (path.length > 0) {
      setDemoPath(path);
      setIsDemoMode(true);
    }
  }, [gameState, maze, marbleStart]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keys.current[k] = true;
      if (k === 'r') handleReset();
      if (k === 'p') handleTogglePause();
      if (k === 'd') triggerDemo();
    };
    const handleKeyUp = (e: KeyboardEvent) => keys.current[e.key.toLowerCase()] = false;
    const handleMouseMove = (e: MouseEvent) => {
      if (gameState !== GameState.PLAYING || isDemoMode) return;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      const tx = Math.abs(ny) < DEADZONE ? 0 : ny * MAX_TILT;
      const tz = Math.abs(nx) < DEADZONE ? 0 : -nx * MAX_TILT;
      setTilt({ x: tx, z: tz });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gameState, isDemoMode, handleReset, handleTogglePause, triggerDemo]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (gameState === GameState.VICTORY) {
        setTilt(prev => ({ x: prev.x * 0.9, z: prev.z * 0.9 }));
        return;
      }
      if (gameState !== GameState.PLAYING || isDemoMode) return;
      const w = keys.current['w'], s = keys.current['s'], a = keys.current['a'], d = keys.current['d'];
      if (w || s || a || d) {
        setTilt(prev => {
          let nx = prev.x, nz = prev.z;
          if (w) nx = Math.max(nx - TILT_SPEED, -MAX_TILT);
          if (s) nx = Math.min(nx + TILT_SPEED, MAX_TILT);
          if (a) nz = Math.max(nz - TILT_SPEED, -MAX_TILT);
          if (d) nz = Math.min(nz + TILT_SPEED, MAX_TILT);
          if (!w && !s) nx *= 0.88;
          if (!a && !d) nz *= 0.88;
          return { x: nx, z: nz };
        });
      }
    }, 16);
    return () => clearInterval(interval);
  }, [gameState, isDemoMode]);

  return (
    <div className="w-full h-screen bg-[#050505] overflow-hidden select-none relative">
      <JazzyMusic isPlaying={gameState === GameState.PLAYING} />
      <VictorySounds trigger={gameState === GameState.VICTORY} />
      
      <Canvas shadows gl={{ antialias: true, alpha: false }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <Scene 
            // Unique key to force a clean Scene re-mount on every new maze generation
            key={`${maze.width}-${marbleStart.x}-${marbleStart.z}`} 
            maze={maze} 
            gameState={gameState} 
            onVictory={() => { setGameState(GameState.VICTORY); setIsDemoMode(false); }} 
            tilt={tilt}
            setTilt={setTilt}
            difficulty={difficulty}
            theme={theme}
            marbleColor={marbleColor}
            marbleStart={marbleStart}
            isDemoMode={isDemoMode}
            demoPath={demoPath}
          />
        </Suspense>
      </Canvas>

      <UI 
        gameState={gameState} 
        difficulty={difficulty}
        theme={theme}
        marbleColor={marbleColor}
        setMarbleColor={setMarbleColor}
        tilt={tilt} 
        onReset={handleReset} 
        onTogglePause={handleTogglePause}
        onSelectDifficulty={(d) => { setDifficulty(d); initGame(d); }}
        onToggleTheme={() => setTheme(t => t === Theme.WOOD ? Theme.METAL : Theme.WOOD)}
        onChangeDifficulty={() => setGameState(GameState.START_MENU)}
      />

      {/* Triumphant "YOU WON!" Overlay */}
      {gameState === GameState.VICTORY && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-[100] animate-in fade-in zoom-in duration-1000">
           <div className="bg-black/40 backdrop-blur-md px-16 py-8 rounded-[4rem] border-8 border-amber-400/50 shadow-[0_0_100px_rgba(251,191,36,0.3)]">
             <h2 className="text-7xl md:text-9xl font-black text-amber-400 drop-shadow-[0_0_40px_rgba(251,191,36,0.6)] animate-bounce italic tracking-tighter">
               YOU WON!
             </h2>
             <div className="text-white/60 text-xl font-bold tracking-[1em] text-center mt-4 uppercase">Challenge Complete</div>
           </div>
           
           <button 
              onClick={handleReset}
              className="mt-12 pointer-events-auto bg-amber-500 hover:bg-amber-400 text-black px-12 py-4 rounded-full font-black text-2xl shadow-2xl transition-all active:scale-95 hover:scale-110 tracking-widest"
           >
              PLAY AGAIN (R)
           </button>
        </div>
      )}

      {isDemoMode && gameState === GameState.PLAYING && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
          <div className="bg-amber-500 text-black px-12 py-5 rounded-full font-black animate-pulse border-4 border-amber-300 shadow-2xl tracking-widest text-2xl">
            AUTOPILOT
          </div>
        </div>
      )}
    </div>
  );
};

export default App;