import { useState, useCallback, useEffect, useRef } from 'react';

// Game data - 4 groups of 4 words each
const GROUPS = [
  {
    category: "BREAKFAST FOODS",
    words: ["WAFFLE", "TOAST", "CEREAL", "YOGURT"],
    color: "#f9df6d",
    textColor: "#5c4b00",
    difficulty: 1,
  },
  {
    category: "THINGS YOU WEAR ON YOUR HEAD",
    words: ["CROWN", "HELMET", "TURBAN", "BERET"],
    color: "#a0c35a",
    textColor: "#2d4a0a",
    difficulty: 2,
  },
  {
    category: "WORDS MEANING 'FAST'",
    words: ["RAPID", "SWIFT", "FLEET", "HASTY"],
    color: "#b0c4ef",
    textColor: "#1a2f5c",
    difficulty: 3,
  },
  {
    category: "___ PAPER",
    words: ["WRAPPING", "SAND", "TRACING", "BUTCHER"],
    color: "#ba81c5",
    textColor: "#3d1a47",
    difficulty: 4,
  },
];

// Initial arrangement - words from same group are NOT in the same row
const INITIAL_WORDS = [
  "WAFFLE", "CROWN", "RAPID", "SAND",
  "TOAST", "HELMET", "SWIFT", "TRACING",
  "CEREAL", "TURBAN", "FLEET", "WRAPPING",
  "YOGURT", "BERET", "HASTY", "BUTCHER",
];

function getGroupForWord(word: string) {
  for (const group of GROUPS) {
    if (group.words.includes(word)) {
      return group;
    }
  }
  return null;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function App() {
  const [words, setWords] = useState<string[]>(INITIAL_WORDS);
  const [selected, setSelected] = useState<string[]>([]);
  const [solvedGroups, setSolvedGroups] = useState<typeof GROUPS>([]);
  const [mistakes, setMistakes] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [shakeWords, setShakeWords] = useState<string[]>([]);
  const [showOneAway, setShowOneAway] = useState(false);
  const [celebrateGroup, setCelebrateGroup] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const remainingWords = words.filter(
    (w) => !solvedGroups.some((g) => g.words.includes(w))
  );

  const handleWordClick = useCallback((word: string) => {
    if (gameOver || gameWon) return;
    if (solvedGroups.some((g) => g.words.includes(word))) return;

    setSelected((prev) => {
      if (prev.includes(word)) {
        return prev.filter((w) => w !== word);
      }
      if (prev.length >= 4) return prev;
      return [...prev, word];
    });
    setShowOneAway(false);
  }, [gameOver, gameWon, solvedGroups]);

  const handleShuffle = useCallback(() => {
    const activeWords = words.filter(
      (w) => !solvedGroups.some((g) => g.words.includes(w))
    );
    const solvedWords = words.filter((w) =>
      solvedGroups.some((g) => g.words.includes(w))
    );
    setWords([...shuffleArray(activeWords), ...solvedWords]);
  }, [words, solvedGroups]);

  const handleSubmit = useCallback(() => {
    if (selected.length !== 4) return;

    const groups = selected.map(getGroupForWord);
    const allSameGroup = groups.every(
      (g) => g !== null && g.category === groups[0]?.category
    );

    if (allSameGroup && groups[0]) {
      const solvedGroup = groups[0];
      setCelebrateGroup(solvedGroup.category);

      setTimeout(() => {
        setSolvedGroups((prev) => [...prev, solvedGroup]);
        setSelected([]);
        setCelebrateGroup(null);

        if (solvedGroups.length + 1 === 4) {
          setGameWon(true);
          setShowConfetti(true);
        }
      }, 1000);
    } else {
      // Check if one away
      const groupCounts: Record<string, number> = {};
      groups.forEach((g) => {
        if (g) {
          groupCounts[g.category] = (groupCounts[g.category] || 0) + 1;
        }
      });
      const maxCount = Math.max(...Object.values(groupCounts));

      if (maxCount === 3) {
        setShowOneAway(true);
        setTimeout(() => setShowOneAway(false), 2000);
      }

      setShakeWords([...selected]);
      setTimeout(() => setShakeWords([]), 600);

      setMistakes((prev) => {
        const newMistakes = prev + 1;
        if (newMistakes >= 4) {
          setTimeout(() => setGameOver(true), 800);
        }
        return newMistakes;
      });
      setSelected([]);
    }
  }, [selected, solvedGroups]);

  const handleDeselectAll = useCallback(() => {
    setSelected([]);
    setShowOneAway(false);
  }, []);

  const handleRestart = useCallback(() => {
    setWords(shuffleArray(INITIAL_WORDS));
    setSelected([]);
    setSolvedGroups([]);
    setMistakes(0);
    setGameOver(false);
    setGameWon(false);
    setShakeWords([]);
    setShowOneAway(false);
    setCelebrateGroup(null);
    setShowConfetti(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && selected.length === 4) {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit, selected.length]);

  const mistakesLeft = 4 - mistakes;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-4 px-4 sm:py-8">
      {/* Confetti effect */}
      {showConfetti && <Confetti />}

      {/* Header */}
      <div className="w-full max-w-[480px]">
        <div className="border-b border-gray-200 pb-3 mb-6">
          <h1 className="text-[32px] font-black text-center text-gray-900 tracking-tight" style={{fontFamily: "'Georgia', serif"}}>
            Connections
          </h1>
        </div>

        <p className="text-center text-gray-700 text-[15px] mb-5 font-medium">
          Create four groups of four!
        </p>

        {/* Solved groups */}
        <div className="space-y-2 mb-2">
          {solvedGroups.map((group, idx) => (
            <div
              key={group.category}
              className="rounded-xl px-4 py-4 text-center animate-fade-in"
              style={{ backgroundColor: group.color }}
            >
              <div className="font-bold text-[13px] tracking-wide" style={{ color: group.textColor }}>
                {group.category}
              </div>
              <div className="text-[13px] mt-1 opacity-75" style={{ color: group.textColor }}>
                {group.words.join(", ")}
              </div>
            </div>
          ))}
        </div>

        {/* Word grid */}
        {!gameOver && !gameWon && (
          <div
            ref={gridRef}
            className="grid grid-cols-4 gap-[6px] mb-4"
          >
            {remainingWords.map((word, index) => {
              const isSelected = selected.includes(word);
              const isShaking = shakeWords.includes(word);
              const isCelebrating = celebrateGroup && getGroupForWord(word)?.category === celebrateGroup;

              return (
                <button
                  key={`${word}-${index}`}
                  onClick={() => handleWordClick(word)}
                  className={`
                    relative rounded-lg font-semibold text-[14px] sm:text-[15px]
                    flex items-center justify-center text-center
                    transition-all duration-150 select-none
                    h-[72px] sm:h-[80px]
                    ${isCelebrating ? 'animate-celebrate' : ''}
                    ${isShaking ? 'animate-shake' : ''}
                    ${
                      isSelected
                        ? 'bg-gray-800 text-white shadow-lg scale-[0.97]'
                        : 'bg-[#efefe6] text-gray-900 hover:bg-[#e5e5db] active:scale-[0.97]'
                    }
                  `}
                  style={{
                    letterSpacing: '0.02em',
                  }}
                >
                  {word}
                </button>
              );
            })}
          </div>
        )}

        {/* Mistakes indicator */}
        {!gameOver && !gameWon && (
          <div className="flex items-center justify-center gap-1.5 mb-5">
            <span className="text-[13px] text-gray-500 mr-1">Mistakes remaining:</span>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`w-[10px] h-[10px] rounded-full transition-all duration-300 ${
                  i < mistakesLeft ? 'bg-gray-800' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        )}

        {/* One away message */}
        {showOneAway && (
          <div className="text-center mb-3 animate-fade-in">
            <span className="inline-block bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-1.5 rounded-full text-[13px] font-semibold">
              One away!
            </span>
          </div>
        )}

        {/* Action buttons */}
        {!gameOver && !gameWon && (
          <div className="flex gap-2 justify-center mb-8 flex-wrap">
            <button
              onClick={handleShuffle}
              className="px-5 py-2.5 border-2 border-gray-800 text-gray-800 rounded-full font-bold text-[13px] hover:bg-gray-50 transition-colors uppercase tracking-wide"
            >
              Shuffle
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-5 py-2.5 border-2 border-gray-800 text-gray-800 rounded-full font-bold text-[13px] hover:bg-gray-50 transition-colors uppercase tracking-wide"
            >
              Deselect All
            </button>
            <button
              onClick={handleSubmit}
              disabled={selected.length !== 4}
              className={`px-5 py-2.5 rounded-full font-bold text-[13px] transition-all uppercase tracking-wide ${
                selected.length === 4
                  ? 'bg-gray-800 text-white hover:bg-gray-700 shadow-md cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Submit
            </button>
          </div>
        )}

        {/* Game Over */}
        {gameOver && (
          <div className="text-center py-6 animate-fade-in">
            <div className="text-5xl mb-4">😔</div>
            <h2 className="text-2xl font-black text-gray-900 mb-2" style={{fontFamily: "'Georgia', serif"}}>
              Next time!
            </h2>
            <p className="text-gray-500 mb-6 text-[14px]">
              You had {4 - solvedGroups.length} group{4 - solvedGroups.length !== 1 ? 's' : ''} left to find.
            </p>
            
            {/* Show remaining groups */}
            <div className="space-y-2 mb-8">
              {GROUPS.filter(
                (g) => !solvedGroups.some((s) => s.category === g.category)
              ).map((group) => (
                <div
                  key={group.category}
                  className="rounded-xl px-4 py-3 text-center"
                  style={{ backgroundColor: group.color }}
                >
                  <div className="font-bold text-[13px] tracking-wide" style={{ color: group.textColor }}>
                    {group.category}
                  </div>
                  <div className="text-[13px] mt-1 opacity-75" style={{ color: group.textColor }}>
                    {group.words.join(", ")}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleRestart}
              className="px-8 py-3 bg-gray-800 text-white rounded-full font-bold text-[14px] hover:bg-gray-700 transition-colors shadow-lg"
            >
              Play Again
            </button>
          </div>
        )}

        {/* Game Won */}
        {gameWon && (
          <div className="text-center py-6 animate-fade-in">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-black text-gray-900 mb-2" style={{fontFamily: "'Georgia', serif"}}>
              Brilliant!
            </h2>
            <p className="text-gray-500 mb-1 text-[14px]">
              You found all connections!
            </p>
            <p className="text-gray-400 text-[13px] mb-8">
              {mistakes === 0 ? 'Perfect — no mistakes!' : `${mistakes} mistake${mistakes !== 1 ? 's' : ''}`}
            </p>
            <button
              onClick={handleRestart}
              className="px-8 py-3 bg-gray-800 text-white rounded-full font-bold text-[14px] hover:bg-gray-700 transition-colors shadow-lg"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple confetti component
function Confetti() {
  const colors = ['#f9df6d', '#a0c35a', '#b0c4ef', '#ba81c5', '#ff6b6b', '#4ecdc4'];
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 1.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 4 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.left}%`,
            top: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export default App;
