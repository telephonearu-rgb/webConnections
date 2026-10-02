import { useState, useCallback, useEffect, useRef, createContext, useContext } from 'react';

// ============ TRANSLATIONS ============
type Lang = 'en' | 'ru';

const translations = {
  en: {
    title: 'Connections',
    subtitle: 'Create four groups of four!',
    shuffle: 'Shuffle',
    deselectAll: 'Deselect All',
    submit: 'Submit',
    mistakesRemaining: 'Mistakes remaining:',
    oneAway: 'One away!',
    nextTime: 'Next time!',
    groupsLeft: (n: number) => `You had ${n} group${n !== 1 ? 's' : ''} left to find.`,
    brilliant: 'Brilliant!',
    foundAll: 'You found all connections!',
    perfect: 'Perfect — no mistakes!',
    mistakes: (n: number) => `${n} mistake${n !== 1 ? 's' : ''}`,
    playAgain: 'Play Again',
    leaveReview: 'Leave a Review',
    viewReviews: 'View Reviews',
    reviewsTitle: 'Reviews',
    noReviews: 'No reviews yet.',
    beFirst: 'Be the first to leave a review!',
    close: 'Close',
    openForm: 'Open in New Tab',
    reviewNote: 'Your review will be sent via Google Forms',
    viewNote: 'Reviews are collected via Google Forms. Click below to see all submitted reviews.',
    viewResponses: 'View All Responses',
    poweredBy: 'Powered by Google Forms',
  },
  ru: {
    title: 'Связи',
    subtitle: 'Создайте четыре группы по четыре!',
    shuffle: 'Перемешать',
    deselectAll: 'Снять выбор',
    submit: 'Отправить',
    mistakesRemaining: 'Осталось ошибок:',
    oneAway: 'Почти!',
    nextTime: 'В следующий раз!',
    groupsLeft: (n: number) => `Осталось найти ${n} ${n === 1 ? 'группу' : n < 5 ? 'группы' : 'групп'}.`,
    brilliant: 'Отлично!',
    foundAll: 'Вы нашли все связи!',
    perfect: 'Идеально — без ошибок!',
    mistakes: (n: number) => `${n} ${n === 1 ? 'ошибка' : n < 5 ? 'ошибки' : 'ошибок'}`,
    playAgain: 'Играть снова',
    leaveReview: 'Оставить отзыв',
    viewReviews: 'Смотреть отзывы',
    reviewsTitle: 'Отзывы',
    noReviews: 'Пока нет отзывов.',
    beFirst: 'Оставьте первый отзыв!',
    close: 'Закрыть',
    openForm: 'Открыть в новой вкладке',
    reviewNote: 'Ваш отзыв будет отправлен через Google Формы',
    viewNote: 'Отзывы собираются через Google Формы. Нажмите ниже, чтобы увидеть все отправленные отзывы.',
    viewResponses: 'Посмотреть все ответы',
    poweredBy: 'Работает на Google Формы',
  },
} as const;

interface TranslationShape {
  title: string;
  subtitle: string;
  shuffle: string;
  deselectAll: string;
  submit: string;
  mistakesRemaining: string;
  oneAway: string;
  nextTime: string;
  groupsLeft: (n: number) => string;
  brilliant: string;
  foundAll: string;
  perfect: string;
  mistakes: (n: number) => string;
  playAgain: string;
  leaveReview: string;
  viewReviews: string;
  reviewsTitle: string;
  noReviews: string;
  beFirst: string;
  close: string;
  openForm: string;
  reviewNote: string;
  viewNote: string;
  viewResponses: string;
  poweredBy: string;
}

const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: TranslationShape;
}>({
  lang: 'en',
  setLang: () => {},
  t: translations.en as TranslationShape,
});

function useLang() {
  return useContext(LangContext);
}

// ============ GOOGLE FORM ============
const GOOGLE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSftra5aBoeRjT_RFEm5kz-L7wVGLsOpTCp8RGCWr4hP-hSxYg/viewform';
const GOOGLE_FORM_EMBEDDED = GOOGLE_FORM_URL + '?embedded=true';
const GOOGLE_FORM_RESPONSES =
  'https://docs.google.com/forms/d/e/1FAIpQLSftra5aBoeRjT_RFEm5kz-L7wVGLsOpTCp8RGCWr4hP-hSxYg/viewanalytics';

// ============ GAME DATA ============
const GROUPS = [
  {
    category: 'BREAKFAST FOODS',
    categoryRu: 'ЕДА НА ЗАВТРАК',
    words: ['WAFFLE', 'TOAST', 'CEREAL', 'YOGURT'],
    color: '#f9df6d',
    textColor: '#5c4b00',
    difficulty: 1,
  },
  {
    category: 'THINGS YOU WEAR ON YOUR HEAD',
    categoryRu: 'НОСЯТ НА ГОЛОВЕ',
    words: ['CROWN', 'HELMET', 'TURBAN', 'BERET'],
    color: '#a0c35a',
    textColor: '#2d4a0a',
    difficulty: 2,
  },
  {
    category: "WORDS MEANING 'FAST'",
    categoryRu: 'СИНОНИМЫ «БЫСТРЫЙ»',
    words: ['RAPID', 'SWIFT', 'FLEET', 'HASTY'],
    color: '#b0c4ef',
    textColor: '#1a2f5c',
    difficulty: 3,
  },
  {
    category: '___ PAPER',
    categoryRu: '___ БУМАГА',
    words: ['WRAPPING', 'SAND', 'TRACING', 'BUTCHER'],
    color: '#ba81c5',
    textColor: '#3d1a47',
    difficulty: 4,
  },
];

const INITIAL_WORDS = [
  'WAFFLE', 'CROWN', 'RAPID', 'SAND',
  'TOAST', 'HELMET', 'SWIFT', 'TRACING',
  'CEREAL', 'TURBAN', 'FLEET', 'WRAPPING',
  'YOGURT', 'BERET', 'HASTY', 'BUTCHER',
];

function getGroupForWord(word: string) {
  for (const group of GROUPS) {
    if (group.words.includes(word)) return group;
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

function getCategoryName(group: typeof GROUPS[0], lang: Lang) {
  return lang === 'ru' ? group.categoryRu : group.category;
}

// ============ MAIN APP ============
function App() {
  const [lang, setLang] = useState<Lang>('en');
  const t = translations[lang] as TranslationShape;

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      <GameContent />
    </LangContext.Provider>
  );
}

function GameContent() {
  const { lang, setLang, t } = useLang();

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

  const handleWordClick = useCallback(
    (word: string) => {
      if (gameOver || gameWon) return;
      if (solvedGroups.some((g) => g.words.includes(word))) return;
      setSelected((prev) => {
        if (prev.includes(word)) return prev.filter((w) => w !== word);
        if (prev.length >= 4) return prev;
        return [...prev, word];
      });
      setShowOneAway(false);
    },
    [gameOver, gameWon, solvedGroups]
  );

  const handleShuffle = useCallback(() => {
    const active = words.filter((w) => !solvedGroups.some((g) => g.words.includes(w)));
    const solved = words.filter((w) => solvedGroups.some((g) => g.words.includes(w)));
    setWords([...shuffleArray(active), ...solved]);
  }, [words, solvedGroups]);

  const handleSubmit = useCallback(() => {
    if (selected.length !== 4) return;
    const groups = selected.map(getGroupForWord);
    const allSame = groups.every((g) => g !== null && g.category === groups[0]?.category);

    if (allSame && groups[0]) {
      const sg = groups[0];
      setCelebrateGroup(sg.category);
      setTimeout(() => {
        setSolvedGroups((prev) => [...prev, sg]);
        setSelected([]);
        setCelebrateGroup(null);
        if (solvedGroups.length + 1 === 4) {
          setGameWon(true);
          setShowConfetti(true);
        }
      }, 1000);
    } else {
      const counts: Record<string, number> = {};
      groups.forEach((g) => { if (g) counts[g.category] = (counts[g.category] || 0) + 1; });
      const max = Math.max(...Object.values(counts));
      if (max === 3) {
        setShowOneAway(true);
        setTimeout(() => setShowOneAway(false), 2000);
      }
      setShakeWords([...selected]);
      setTimeout(() => setShakeWords([]), 600);
      setMistakes((prev) => {
        const n = prev + 1;
        if (n >= 4) setTimeout(() => setGameOver(true), 800);
        return n;
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
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && selected.length === 4) handleSubmit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSubmit, selected.length]);

  const mistakesLeft = 4 - mistakes;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-4 px-4 sm:py-8">
      {showConfetti && <Confetti />}

      <div className="w-full max-w-[480px]">
        {/* Header with language switcher */}
        <div className="flex items-center justify-between mb-2">
          <div className="w-20" /> {/* spacer */}
          <h1
            className="text-[28px] sm:text-[32px] font-black text-gray-900 tracking-tight"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            {t.title}
          </h1>
          <LangSwitcher />
        </div>

        <div className="border-b border-gray-200 pb-3 mb-6" />

        <p className="text-center text-gray-700 text-[15px] mb-5 font-medium">
          {t.subtitle}
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
                {getCategoryName(group, lang)}
              </div>
              <div className="text-[13px] mt-1 opacity-75" style={{ color: group.textColor }}>
                {group.words.join(', ')}
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
              const isCelebrating =
                celebrateGroup && getGroupForWord(word)?.category === celebrateGroup;
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

        {/* Mistakes */}
        {!gameOver && !gameWon && (
          <div className="flex items-center justify-center gap-1.5 mb-5">
            <span className="text-[13px] text-gray-500 mr-1">{t.mistakesRemaining}</span>
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

        {/* One away */}
        {showOneAway && (
          <div className="text-center mb-3 animate-fade-in">
            <span className="inline-block bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-1.5 rounded-full text-[13px] font-semibold">
              {t.oneAway}
            </span>
          </div>
        )}

        {/* Action buttons */}
        {!gameOver && !gameWon && (
          <div className="flex gap-2 justify-center mb-3 flex-wrap">
            <button onClick={handleShuffle} className="game-btn-outline">
              {t.shuffle}
            </button>
            <button onClick={handleDeselectAll} className="game-btn-outline">
              {t.deselectAll}
            </button>
            <button
              onClick={handleSubmit}
              disabled={selected.length !== 4}
              className={`game-btn-submit ${
                selected.length === 4 ? 'game-btn-submit-active' : 'game-btn-submit-disabled'
              }`}
            >
              {t.submit}
            </button>
          </div>
        )}

        {/* Review buttons */}
        <div className="flex gap-3 justify-center mb-8 mt-2">
          <button onClick={() => setShowReviewModal(true)} className="review-btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            {t.leaveReview}
          </button>
          <button onClick={() => setShowReviewsList(true)} className="review-btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {t.viewReviews}
          </button>
        </div>

        {/* Game Over */}
        {gameOver && (
          <div className="text-center py-6 animate-fade-in">
            <div className="text-5xl mb-4">😔</div>
            <h2 className="text-2xl font-black text-gray-900 mb-2" style={{ fontFamily: "'Georgia', serif" }}>
              {t.nextTime}
            </h2>
            <p className="text-gray-500 mb-6 text-[14px]">
              {t.groupsLeft(4 - solvedGroups.length)}
            </p>
            <div className="space-y-2 mb-8">
              {GROUPS.filter((g) => !solvedGroups.some((s) => s.category === g.category)).map(
                (group) => (
                  <div key={group.category} className="rounded-xl px-4 py-3 text-center" style={{ backgroundColor: group.color }}>
                    <div className="font-bold text-[13px] tracking-wide" style={{ color: group.textColor }}>
                      {getCategoryName(group, lang)}
                    </div>
                    <div className="text-[13px] mt-1 opacity-75" style={{ color: group.textColor }}>
                      {group.words.join(', ')}
                    </div>
                  </div>
                )
              )}
            </div>
            <button onClick={handleRestart} className="game-btn-dark">{t.playAgain}</button>
          </div>
        )}

        {/* Game Won */}
        {gameWon && (
          <div className="text-center py-6 animate-fade-in">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-black text-gray-900 mb-2" style={{ fontFamily: "'Georgia', serif" }}>
              {t.brilliant}
            </h2>
            <p className="text-gray-500 mb-1 text-[14px]">{t.foundAll}</p>
            <p className="text-gray-400 text-[13px] mb-8">
              {mistakes === 0 ? t.perfect : t.mistakes(mistakes)}
            </p>
            <button onClick={handleRestart} className="game-btn-dark">{t.playAgain}</button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showReviewModal && <ReviewModal onClose={() => setShowReviewModal(false)} />}
      {showReviewsList && <ReviewsModal onClose={() => setShowReviewsList(false)} />}
    </div>
  );
}

// ============ LANGUAGE SWITCHER ============
function LangSwitcher() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex items-center bg-gray-100 rounded-full p-0.5 w-20">
      <button
        onClick={() => setLang('en')}
        className={`flex-1 text-[12px] font-bold py-1.5 rounded-full transition-all ${
          lang === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLang('ru')}
        className={`flex-1 text-[12px] font-bold py-1.5 rounded-full transition-all ${
          lang === 'ru' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        RU
      </button>
    </div>
  );
}

// ============ REVIEW MODAL (Google Forms embed) ============
function ReviewModal({ onClose }: { onClose: () => void }) {
  const { t } = useLang();
  const [iframeLoaded, setIframeLoaded] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh', height: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-purple-600 px-5 py-4 border-t-4 border-purple-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-base font-bold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              {t.leaveReview}
            </h2>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p className="text-purple-100 text-[12px] mt-1">{t.reviewNote}</p>
        </div>

        {/* Google Form iframe */}
        <div className="flex-1 relative bg-gray-50">
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-400 text-[13px]">Loading form...</p>
              </div>
            </div>
          )}
          <iframe
            src={GOOGLE_FORM_EMBEDDED}
            className="w-full h-full border-0"
            onLoad={() => setIframeLoaded(true)}
            title="Review Form"
          />
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-3 flex-shrink-0 flex items-center justify-between">
          <span className="text-gray-400 text-[11px] flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
            </svg>
            {t.poweredBy}
          </span>
          <a
            href={GOOGLE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 text-[12px] font-semibold hover:text-purple-700 flex items-center gap-1"
          >
            {t.openForm}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

// ============ REVIEWS LIST MODAL ============
function ReviewsModal({ onClose }: { onClose: () => void }) {
  const { t } = useLang();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-purple-600 px-6 py-5 border-t-4 border-purple-800">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-lg font-bold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {t.reviewsTitle}
            </h2>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <p className="text-gray-600 text-[14px] mb-2 leading-relaxed">
              {t.viewNote}
            </p>
            <p className="text-gray-400 text-[12px] flex items-center justify-center gap-1 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
              </svg>
              {t.poweredBy}
            </p>
          </div>

          <div className="space-y-3">
            <a
              href={GOOGLE_FORM_RESPONSES}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-purple-600 text-white rounded-full font-bold text-[13px] hover:bg-purple-700 transition-colors shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {t.viewResponses}
            </a>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-full font-bold text-[13px] hover:bg-gray-50 transition-colors"
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ CONFETTI ============
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
