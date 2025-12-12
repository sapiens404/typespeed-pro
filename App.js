import { useState, useEffect, useRef } from "react";
import Confetti from "react-confetti";

export default function App() {
  const normalText = "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump!";

  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle");
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedTime, setSelectedTime] = useState(60);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [startTime, setStartTime] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [tab, setTab] = useState("test");
  const [result, setResult] = useState(null);
  const [quote, setQuote] = useState("");

  // Balloon Game
  const [balloons, setBalloons] = useState([]);
  const [currentLetter, setCurrentLetter] = useState("?");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameRunning, setGameRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameTimer, setGameTimer] = useState(60);

  // Streak
  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem("typingStreak");
    if (!saved) return 0;
    const { count, date } = JSON.parse(saved);
    return date === new Date().toDateString() ? count : 0;
  });

  const updateStreak = () => {
    const today = new Date().toDateString();
    const saved = localStorage.getItem("typingStreak");
    let newCount = 1;
    if (saved) {
      const { count, date } = JSON.parse(saved);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (date === yesterday.toDateString()) newCount = count + 1;
    }
    localStorage.setItem("typingStreak", JSON.stringify({ count: newCount, date: today }));
    setStreak(newCount);
  };

  const inputRef = useRef(null);

  const quotes = [
    "Keep practicing — you are getting faster every day!",
    "Accuracy first, speed will follow.",
    "Great job! You're improving!",
    "Never give up — champions keep typing!",
    "Success is the sum of small efforts repeated day in and day out."
  ];

  // Typing Test Timer - FIXED
  useEffect(() => {
    if (status === "running" && timeLeft > 0) {
      const id = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            finishTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(id);
    }
  }, [status, timeLeft]);

  const startTest = () => {
    setInput("");
    setStatus("running");
    setStartTime(Date.now());
    setTimeLeft(selectedTime);
    setWpm(0);
    setAccuracy(100);
    setResult(null);
    inputRef.current?.focus();
  };

  const finishTest = () => {
    setStatus("finished");
    const timeTaken = (Date.now() - startTime) / 60000;
    const words = input.trim().split(/\s+/).length;
    const finalWpm = Math.round(words / timeTaken) || 0;

    let errors = 0;
    for (let i = 0; i < input.length; i++) {
      if (input[i] !== normalText[i]) errors++;
    }
    const finalAcc = input.length ? Math.round(((input.length - errors) / input.length) * 100) : 100;

    setWpm(finalWpm);
    setAccuracy(finalAcc);
    updateStreak();

    const badge = finalWpm >= 80 ? "TYPING GOD" : finalWpm >= 60 ? "SPEED DEMON" : finalWpm >= 40 ? "PRO" : "KEEP GOING";
    const task = finalWpm < 50 ? "Practice Home Row daily" : finalAcc < 90 ? "Focus on accuracy" : "Try 30s mode!";

    setResult({ wpm: finalWpm, accuracy: finalAcc, badge, task });
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 8000);
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  };

  const handleInput = (e) => {
    const value = e.target.value;
    if (value.length > normalText.length) return;
    setInput(value);
    if (status === "idle" && value) startTest();

    let correct = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === normalText[i]) correct++;
    }
    setAccuracy(value.length ? Math.round((correct / value.length) * 100) : 100);

    if (startTime) {
      const elapsed = (Date.now() - startTime) / 60000;
      setWpm(Math.round((value.length / 5) / elapsed));
    }

    if (value === normalText) finishTest();
  };

  // Balloon Game - OPTIMIZED & STABLE
  useEffect(() => {
    if (!gameRunning || gameOver) return;

    const spawn = setInterval(() => {
      setBalloons(prev => [...prev, {
        letter: String.fromCharCode(65 + Math.floor(Math.random() * 26)),
        y: 0,
        id: Math.random()
      }]);
      setCurrentLetter(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
    }, 2000);

    const move = setInterval(() => {
      setBalloons(prev => {
        const updated = prev.map(b => ({ ...b, y: b.y + 2 }));
        const escaped = updated.filter(b => b.y >= 98);
        if (escaped.length > 0) {
          setLives(l => {
            if (l <= 1) {
              setGameOver(true);
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 4000);
              return 0;
            }
            return l - 1;
          });
        }
        return updated.filter(b => b.y < 98);
      });
    }, 40);

    const timer = setInterval(() => {
      setGameTimer(t => t <= 1 ? (setGameOver(true), 0) : t - 1);
    }, 1000);

    return () => {
      clearInterval(spawn);
      clearInterval(move);
      clearInterval(timer);
    };
  }, [gameRunning, gameOver]);

  const startBalloonGame = () => {
    setBalloons([]);
    setCurrentLetter("?");
    setScore(0);
    setLives(3);
    setGameRunning(true);
    setGameOver(false);
    setGameTimer(60);
  };

  const handleKeyPress = (e) => {
    if (gameRunning && !gameOver && e.key.toUpperCase() === currentLetter) {
      setScore(s => s + 10);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 600);
      setCurrentLetter(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
    }
  };

  useEffect(() => {
    if (gameRunning) {
      document.addEventListener("keydown", handleKeyPress);
      return () => document.removeEventListener("keydown", handleKeyPress);
    }
  }, [gameRunning, currentLetter]);

  return (
    <>
      <script src="https://cdn.tailwindcss.com"></script>
      {showConfetti && <Confetti />}

      <div className={`min-h-screen flex flex-col ${darkMode ? "dark bg-gray-900 text-white" : "bg-gradient-to-br from-purple-100 via-pink-100 to-indigo-100"}`}>
        {/* Funky Header */}
        <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-2xl p-8">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="text-8xl animate-spin">✨</div>
              <h1 className="text-7xl font-extrabold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent animate-pulse">
                TypeSpeed Pro
              </h1>
            </div>
            <div className="flex items-center gap-10">
              <div className="text-5xl font-bold text-yellow-300">
                Streak: {streak} {streak > 0 && "🔥"}
              </div>
              <button onClick={() => setDarkMode(d => !d)} className="px-8 py-4 bg-white text-black rounded-full font-bold text-xl">
                {darkMode ? "☀️ Light" : "🌙 Dark"}
              </button>
            </div>
          </div>
        </header>

        <nav className="bg-white dark:bg-gray-800 border-b">
          <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-6 py-6">
            {["test","games","basics","articles","jobs","contact"].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-10 py-4 rounded-full font-bold text-xl ${tab===t?"bg-gradient-to-r from-indigo-600 to-purple-600 text-white":"bg-gray-200 dark:bg-gray-700"}`}>
                {t==="test"?"Test":t.charAt(0).toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>
        </nav>

        <main className="flex-1 max-w-7xl mx-auto p-8">
          {/* TEST TAB */}
          {tab === "test" && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <button onClick={() => setSelectedTime(30)} className={`mx-4 px-12 py-5 rounded-2xl text-2xl font-bold ${selectedTime===30?"bg-indigo-600 text-white":"bg-gray-300"}`}>30s</button>
                <button onClick={() => setSelectedTime(60)} className={`mx-4 px-12 py-5 rounded-2xl text-2xl font-bold ${selectedTime===60?"bg-indigo-600 text-white":"bg-gray-300"}`}>60s</button>
              </div>

              <div className="grid grid-cols-3 gap-10 mb-12 text-center">
                <div className="bg-white dark:bg-gray-800 p-12 rounded-3xl shadow-2xl"><div className="text-8xl font-bold">{wpm}</div><p className="text-2xl">WPM</p></div>
                <div className="bg-white dark:bg-gray-800 p-12 rounded-3xl shadow-2xl"><div className="text-8xl font-bold text-green-500">{accuracy}%</div><p className="text-2xl">Accuracy</p></div>
                <div className="bg-white dark:bg-gray-800 p-12 rounded-3xl shadow-2xl"><div className="text-8xl font-bold text-red-500">{timeLeft}</div><p className="text-2xl">Time</p></div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-16 rounded-3xl shadow-2xl">
                <div className="text-3xl font-mono mb-12 leading-loose select-none">
                  {normalText.split("").map((c,i) => (
                    <span key={i} className={i<input.length?(input[i]===c?"text-green-600":"text-red-600 bg-red-100"):i===input.length?"bg-yellow-300":""}>{c}</span>
                  ))}
                </div>
                <textarea ref={inputRef} value={input} onChange={handleInput} disabled={status==="finished"}
                  className="w-full p-8 text-2xl font-mono border-4 rounded-2xl focus:border-indigo-600 resize-none" rows="6" placeholder="Start typing..." />
              </div>

              <div className="text-center mt-12">
                <button onClick={status==="finished"?startTest:()=>inputRef.current?.focus()}
                  className="px-32 py-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-5xl font-bold rounded-full shadow-2xl hover:scale-110 transition">
                  {status==="finished"?"Try Again":"Start"}
                </button>
              </div>

              {result && (
                <div className="text-center mt-20 p-16 bg-gradient-to-br from-yellow-400 to-red-500 text-white rounded-3xl shadow-2xl">
                  <h2 className="text-8xl font-bold mb-8">{result.badge}</h2>
                  <p className="text-5xl mb-6">WPM: {result.wpm} • Accuracy: {result.accuracy}%</p>
                  <p className="text-4xl font-bold">Next Challenge:</p>
                  <p className="text-3xl italic mt-4">{result.task}</p>
                  <p className="text-6xl mt-12 font-bold">Streak: {streak} 🔥</p>
                </div>
              )}
            </div>
          )}

          {/* GAMES TAB - BALLOON SHOOTER */}
          {tab === "games" && (
            <div className="text-center py-20">
              <h2 className="text-7xl font-bold mb-12 bg-gradient-to-r from-pink-500 to-yellow-500 bg-clip-text text-transparent">Balloon Shooter</h2>
              <p className="text-4xl mb-10">Press the letter key to pop the balloon! Timer: {gameTimer}s</p>
              <div className="relative h-96 border-8 border-purple-600 rounded-3xl overflow-hidden mx-auto max-w-5xl bg-gradient-to-b from-sky-200 to-green-100">
                {balloons.map((b) => (
                  <div key={b.id} className="absolute transition-all duration-75" style={{ left: `${b.x}%`, top: `${b.y}%` }}>
                    <div className="w-28 h-28 bg-gradient-to-br from-pink-400 to-red-500 rounded-full flex items-center justify-center text-5xl font-bold text-white shadow-2xl animate-wiggle">
                      {b.letter}
                    </div>
                  </div>
                ))}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-9xl font-bold text-purple-700 animate-bounce">
                  {currentLetter}
                </div>
              </div>
              <div className="mt-12 space-y-6">
                <p className="text-6xl font-bold">Score: {score}</p>
                <p className="text-6xl font-bold text-red-600">Lives: {lives}</p>
                <button onClick={gameOver ? startBalloonGame : () => setGameRunning(!gameRunning)}
                  className="px-16 py-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-4xl font-bold rounded-full shadow-2xl hover:scale-110 transition">
                  {gameOver ? "Play Again" : gameRunning ? "Stop" : "Start Game"}
                </button>
              </div>
              {gameOver && <p className="mt-8 text-5xl font-bold text-green-600">Game Over! Score: {score}</p>}
            </div>
          )}

          {/* BASICS TAB - KEYBOARD + HANDS */}
          {tab === "basics" && (
            <div className="text-center py-20">
              <h2 className="text-7xl font-bold mb-16 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Finger Placement Guide
              </h2>
              <div className="bg-gray-900 p-12 rounded-3xl shadow-2xl inline-block">
                <div className="grid grid-cols-14 gap-3 text-2xl font-bold mb-10">
                  {["`","1","2","3","4","5","6","7","8","9","0","-","=","Backspace","Tab","Q","W","E","R","T","Y","U","I","O","P","[","]","\\","Caps","A","S","D","F","G","H","J","K","L",";","'","Enter","Shift","Z","X","C","V","B","N","M",",",".","/","Shift"].map((k,i) => (
                    <div key={i} className={`p-5 rounded-lg text-white font-bold ${["A","S","D","F","J","K","L",";"].includes(k) ? "bg-pink-600 animate-pulse" : "bg-gray-700"}`}>
                      {k === "Backspace" ? "Backspace" : k === "Tab" ? "Tab" : k === "Caps" ? "Caps" : k === "Enter" ? "Enter" : k}
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-32 text-6xl mt-16">
                  <div className="text-center">
                    <p className="text-pink-500 text-4xl font-bold mb-4">Left Hand</p>
                    <div className="text-9xl">Left Hand</div>
                  </div>
                  <div className="text-center">
                    <p className="text-pink-500 text-4xl font-bold mb-4">Right Hand</p>
                    <div className="text-9xl">Right Hand</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ARTICLES TAB */}
          {tab === "articles" && (
            <div className="text-center py-32">
              <h2 className="text-7xl font-bold mb-16">Helpful Articles</h2>
              <a href="https://www.ratatype.com/learn/" target="_blank" className="block p-12 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl text-4xl font-bold mb-8 hover:scale-105 transition">How to Type Faster</a>
              <a href="https://www.typingclub.com/blog/how-to-type-faster/" target="_blank" className="block p-12 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl text-4xl font-bold hover:scale-105 transition">10 Tips to Type Faster</a>
            </div>
          )}

          {/* JOBS TAB */}
          {tab === "jobs" && (
            <div className="text-center py-32">
              <h2 className="text-7xl font-bold mb-16">Jobs for Fast Typists</h2>
              <div className="space-y-8">
                <a href="https://in.indeed.com/q-data-entry-jobs.html" target="_blank" className="block p-16 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-3xl text-5xl font-bold hover:scale-105 transition">Data Entry Jobs</a>
                <a href="https://in.indeed.com/q-transcription-jobs.html" target="_blank" className="block p-16 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-3xl text-5xl font-bold hover:scale-105 transition">Medical Transcription</a>
                <a href="https://in.indeed.com/q-freelance-typing-jobs.html" target="_blank" className="block p-16 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-3xl text-5xl font-bold hover:scale-105 transition">Freelance Typing</a>
              </div>
            </div>
          )}

          {/* CONTACT TAB */}
          {tab === "contact" && (
            <div className="text-center py-32">
              <h2 className="text-7xl font-bold mb-16">Contact Us</h2>
              <p className="text-5xl mb-6">Ritu Raj</p>
              <p className="text-4xl">primates4000@gmail.com</p>
              <p className="text-4xl">9473074602</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}