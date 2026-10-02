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

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

const STORAGE_KEY = 'connections_reviews';

function getReviews(): Review[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveReview(review: Review) {
  const reviews = getReviews();
  reviews.unshift(review);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReviewsList, setShowReviewsList] = useState(false);
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
          {solvedGroups.map((group) => (
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
          <div ref={gridRef} className="grid grid-cols-4 gap-[6px] mb-4">
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
                  style={{ letterSpacing: '0.02em' }}
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
          <div className="flex gap-2 justify-center mb-3 flex-wrap">
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

        {/* Review buttons */}
        <div className="flex gap-3 justify-center mb-8 mt-2">
          <button
            onClick={() => setShowReviewModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-full font-bold text-[13px] hover:bg-purple-700 transition-colors shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Leave a Review
          </button>
          <button
            onClick={() => setShowReviewsList(true)}
            className="flex items-center gap-2 px-5 py-2.5 border-2 border-purple-600 text-purple-600 rounded-full font-bold text-[13px] hover:bg-purple-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            View Reviews
          </button>
        </div>

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

      {/* Review Form Modal */}
      {showReviewModal && (
        <ReviewFormModal onClose={() => setShowReviewModal(false)} />
      )}

      {/* Reviews List Modal */}
      {showReviewsList && (
        <ReviewsListModal onClose={() => setShowReviewsList(false)} />
      )}
    </div>
  );
}

// Review Form Modal (Google Forms style)
function ReviewFormModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    if (!comment.trim()) {
      setError('Please write a comment');
      return;
    }
    setError('');

    const review: Review = {
      id: Date.now().toString(),
      name: name.trim(),
      rating,
      comment: comment.trim(),
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    };

    saveReview(review);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Thank you!</h3>
          <p className="text-gray-500 text-[14px] mb-6">Your review has been submitted successfully.</p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-purple-600 text-white rounded-full font-bold text-[13px] hover:bg-purple-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Google Forms style header */}
        <div className="bg-purple-600 px-6 py-5 border-t-4 border-purple-800 rounded-t-2xl">
          <h2 className="text-white text-lg font-bold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Connections — Review
          </h2>
          <p className="text-purple-100 text-[13px] mt-1">Share your experience with the game</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name field */}
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-1.5">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2.5 border-b-2 border-gray-300 focus:border-purple-500 outline-none text-[14px] transition-colors bg-transparent"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-1.5">
              Your Review <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you think about the game..."
              rows={4}
              className="w-full px-4 py-2.5 border-b-2 border-gray-300 focus:border-purple-500 outline-none text-[14px] transition-colors resize-none bg-transparent"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-[13px] bg-red-50 px-3 py-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-purple-600 text-white rounded-full font-bold text-[13px] hover:bg-purple-700 transition-colors shadow-md"
            >
              Submit Review
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border-2 border-gray-300 text-gray-600 rounded-full font-bold text-[13px] hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Reviews List Modal
function ReviewsListModal({ onClose }: { onClose: () => void }) {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    setReviews(getReviews());
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-purple-600 px-6 py-5 border-t-4 border-purple-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-lg font-bold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Reviews ({reviews.length})
            </h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Reviews list */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {reviews.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-gray-500 text-[14px]">No reviews yet.</p>
              <p className="text-gray-400 text-[13px] mt-1">Be the first to leave a review!</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div
                key={review.id}
                className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-700 font-bold text-[12px]">
                        {review.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-800 text-[14px]">
                      {review.name}
                    </span>
                  </div>
                  <span className="text-gray-400 text-[11px]">{review.date}</span>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-4 h-4 ${
                        star <= review.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-200'
                      }`}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 text-[13px] leading-relaxed">
                  {review.comment}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-6 py-2.5 bg-purple-600 text-white rounded-full font-bold text-[13px] hover:bg-purple-700 transition-colors"
          >
            Close
          </button>
        </div>
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
