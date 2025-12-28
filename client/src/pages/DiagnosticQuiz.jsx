import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Timer, BrainCircuit, Sparkles, Crosshair } from 'lucide-react';
import { motion } from 'framer-motion';

const Target = ({ option, index, onSelect, position }) => {
    return (
        <motion.button
            animate={{
                x: position.x,
                y: position.y
            }}
            transition={{
                type: "tween",
                duration: 0.05,
                ease: "linear"
            }}
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(238, 242, 255, 1)' }}
            whileTap={{ scale: 0.95, backgroundColor: 'rgba(79, 70, 229, 1)', color: '#fff' }}
            onClick={() => onSelect(index)}
            className="absolute p-6 rounded-full border-4 border-white shadow-2xl bg-white text-slate-800 font-bold text-center flex flex-col items-center justify-center w-40 h-40 group z-0 hover:cursor-crosshair"
            style={{ left: 0, top: 0 }}
        >
            <div className="text-xs text-indigo-500 mb-1 uppercase tracking-tighter opacity-50">Target {String.fromCharCode(65 + index)}</div>
            <div className="text-sm md:text-base leading-tight px-2 font-bold">{option}</div>
            <Crosshair className="mt-2 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
        </motion.button>
    );
};

const DiagnosticQuiz = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { year, stream, board } = location.state || { year: '2nd Year', stream: 'MPC', board: 'TS (Telangana)' };

    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]);
    const [timeLeft, setTimeLeft] = useState(60);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [gameKey, setGameKey] = useState(0);
    const [containerDimensions, setContainerDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [bubblePositions, setBubblePositions] = useState([]);

    const arenaRef = useRef(null);
    const bubblesRef = useRef([]);
    const animationFrameRef = useRef();
    const directionChangeTimerRef = useRef([]);

    // Physics constants
    const BUBBLE_SIZE = 160;
    const MARGIN = 20;
    const QUESTION_AREA_HEIGHT = 400;
    const SPEED = 0.8; // Low to medium speed
    const BOUNCE_DAMPING = 0.7; // Soft bounce
    const DIRECTION_CHANGE_INTERVAL = 3000; // Change direction every 3 seconds

    // Initialize bubbles in horizontal layout
    const initializeBubbles = (containerWidth, containerHeight) => {
        const minX = MARGIN;
        const maxX = containerWidth - BUBBLE_SIZE - MARGIN;
        const minY = QUESTION_AREA_HEIGHT + MARGIN;
        const maxY = containerHeight - BUBBLE_SIZE - MARGIN;

        const availableWidth = maxX - minX;
        const availableHeight = maxY - minY;
        const centerY = minY + availableHeight / 2 - BUBBLE_SIZE / 2;

        // Horizontal spacing for 4 bubbles
        const spacing = availableWidth / 5;

        const bubbles = [];
        for (let i = 0; i < 4; i++) {
            const x = minX + spacing * (i + 1) - BUBBLE_SIZE / 2;
            const angle = Math.random() * Math.PI * 2;
            bubbles.push({
                x,
                y: centerY,
                vx: Math.cos(angle) * SPEED,
                vy: Math.sin(angle) * SPEED
            });
        }

        return bubbles;
    };

    // Check collision between two bubbles
    const checkCollision = (bubble1, bubble2) => {
        const dx = bubble2.x - bubble1.x;
        const dy = bubble2.y - bubble1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = BUBBLE_SIZE;

        return distance < minDistance ? { dx, dy, distance } : null;
    };

    // Resolve collision between two bubbles
    const resolveCollision = (bubble1, bubble2, collision) => {
        const { dx, dy, distance } = collision;
        const overlap = BUBBLE_SIZE - distance;

        if (distance === 0) return; // Prevent division by zero

        const nx = dx / distance;
        const ny = dy / distance;

        // Separate bubbles
        const separationX = (overlap / 2) * nx;
        const separationY = (overlap / 2) * ny;

        bubble1.x -= separationX;
        bubble1.y -= separationY;
        bubble2.x += separationX;
        bubble2.y += separationY;

        // Bounce velocities
        const relativeVx = bubble2.vx - bubble1.vx;
        const relativeVy = bubble2.vy - bubble1.vy;
        const dotProduct = relativeVx * nx + relativeVy * ny;

        if (dotProduct < 0) {
            const bounce = dotProduct * BOUNCE_DAMPING;
            bubble1.vx += bounce * nx;
            bubble1.vy += bounce * ny;
            bubble2.vx -= bounce * nx;
            bubble2.vy -= bounce * ny;
        }
    };

    // Random direction change
    const changeDirection = (bubble) => {
        const angle = Math.random() * Math.PI * 2;
        bubble.vx = Math.cos(angle) * SPEED;
        bubble.vy = Math.sin(angle) * SPEED;
    };

    // Physics update loop
    const updatePhysics = () => {
        if (!arenaRef.current || bubblesRef.current.length === 0) {
            animationFrameRef.current = requestAnimationFrame(updatePhysics);
            return;
        }

        const minX = MARGIN;
        const maxX = containerDimensions.width - BUBBLE_SIZE - MARGIN;
        const minY = QUESTION_AREA_HEIGHT + MARGIN;
        const maxY = containerDimensions.height - BUBBLE_SIZE - MARGIN;

        // Update each bubble
        bubblesRef.current.forEach((bubble) => {
            // Update position
            bubble.x += bubble.vx;
            bubble.y += bubble.vy;

            // Boundary collision (bounce off walls)
            if (bubble.x <= minX) {
                bubble.x = minX;
                bubble.vx = Math.abs(bubble.vx) * BOUNCE_DAMPING;
            } else if (bubble.x >= maxX) {
                bubble.x = maxX;
                bubble.vx = -Math.abs(bubble.vx) * BOUNCE_DAMPING;
            }

            if (bubble.y <= minY) {
                bubble.y = minY;
                bubble.vy = Math.abs(bubble.vy) * BOUNCE_DAMPING;
            } else if (bubble.y >= maxY) {
                bubble.y = maxY;
                bubble.vy = -Math.abs(bubble.vy) * BOUNCE_DAMPING;
            }
        });

        // Check and resolve bubble-to-bubble collisions
        for (let i = 0; i < bubblesRef.current.length; i++) {
            for (let j = i + 1; j < bubblesRef.current.length; j++) {
                const collision = checkCollision(bubblesRef.current[i], bubblesRef.current[j]);
                if (collision) {
                    resolveCollision(bubblesRef.current[i], bubblesRef.current[j], collision);
                }
            }
        }

        // Update state for rendering
        setBubblePositions([...bubblesRef.current.map(b => ({ x: b.x, y: b.y }))]);

        animationFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    // Initialize physics when question changes
    useEffect(() => {
        if (containerDimensions.width && containerDimensions.height && questions.length > 0) {
            bubblesRef.current = initializeBubbles(containerDimensions.width, containerDimensions.height);
            setBubblePositions([...bubblesRef.current.map(b => ({ x: b.x, y: b.y }))]);

            // Clear old timers
            directionChangeTimerRef.current.forEach(timer => clearInterval(timer));
            directionChangeTimerRef.current = [];

            // Set up random direction changes for each bubble
            bubblesRef.current.forEach((bubble, i) => {
                const timer = setInterval(() => {
                    if (bubblesRef.current[i]) {
                        changeDirection(bubblesRef.current[i]);
                    }
                }, DIRECTION_CHANGE_INTERVAL + Math.random() * 2000); // Stagger changes
                directionChangeTimerRef.current.push(timer);
            });

            // Start physics loop
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            animationFrameRef.current = requestAnimationFrame(updatePhysics);
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            directionChangeTimerRef.current.forEach(timer => clearInterval(timer));
        };
    }, [currentIndex, gameKey, containerDimensions.width, containerDimensions.height, questions.length]);

    useEffect(() => {
        const handleResize = () => {
            if (arenaRef.current) {
                setContainerDimensions({
                    width: arenaRef.current.offsetWidth,
                    height: arenaRef.current.offsetHeight
                });
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');

                const response = await fetch('/api/quiz/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stream, year, history })
                });
                const data = await response.json();
                if (data.questions) {
                    setQuestions(data.questions);
                } else {
                    throw new Error("Empty questions");
                }
            } catch (err) {
                console.error("Quiz Error:", err);
                setQuestions([{
                    subject: 'System', topic: 'Retry', question: 'Error loading questions. Please go back and try again.', options: ['Back to Dashboard', 'Retry Later', 'Support', 'Go Home']
                }]);
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [stream, year]);

    useEffect(() => {
        if (loading || submitting || questions.length === 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleOptionSelect(-1);
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentIndex, loading, submitting, questions]);

    const handleOptionSelect = (optionIndex) => {
        if (submitting) return;

        const currentQ = questions[currentIndex];
        const newAnswer = {
            question: currentQ.question,
            options: currentQ.options,
            selectedOption: optionIndex,
            subject: currentQ.subject,
            topic: currentQ.topic,
            timeSpent: 60 - timeLeft
        };

        const updatedAnswers = [...userAnswers, newAnswer];
        setUserAnswers(updatedAnswers);

        const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
        if (!history.includes(currentQ.topic)) {
            history.push(currentQ.topic);
            if (history.length > 50) history.shift();
            localStorage.setItem('quizHistory', JSON.stringify(history));
        }

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setTimeLeft(60);
            setGameKey(prev => prev + 1);
        } else {
            finishQuiz(updatedAnswers);
        }
    };

    const finishQuiz = async (finalAnswers) => {
        setSubmitting(true);
        try {
            const response = await fetch('/api/quiz/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: finalAnswers })
            });
            const analysis = await response.json();

            navigate('/quiz-results', {
                state: {
                    results: analysis,
                    userProfile: { year, stream, board }
                }
            });
        } catch (err) {
            console.error("Analysis Error:", err);
            navigate('/dashboard');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center p-6">
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-24 h-24 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-8"
                    />
                    <h2 className="text-3xl font-black mb-2 animate-pulse">Initializing Arena...</h2>
                    <p className="text-slate-400">Loading {year} MPC High-Yield Syllabus Questions.</p>
                </div>
            </div>
        );
    }

    if (submitting) {
        return (
            <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-6">
                <div className="text-center text-white">
                    <Sparkles className="w-20 h-20 text-yellow-400 mx-auto mb-8 animate-bounce" />
                    <h2 className="text-4xl font-black mb-4">Challenge Complete!</h2>
                    <p className="text-indigo-200 text-lg mb-10">AI Professor is analyzing your hits and calculating your EAMCET readiness...</p>
                    <div className="w-full max-w-md bg-indigo-800 h-3 rounded-full mx-auto overflow-hidden text-left">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 3 }}
                            className="h-full bg-yellow-400"
                        />
                    </div>
                </div>
            </div>
        );
    }

    const q = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
        <div className="min-h-screen bg-slate-900 overflow-hidden relative font-sans select-none">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

            <div className="relative z-50 p-6 flex flex-col gap-6">
                <div className="flex justify-between items-center bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.5)]">
                            <Crosshair className="text-white" size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Current Sector</p>
                            <div className="flex items-center gap-2">
                                <span className="bg-white/10 px-3 py-1 rounded-lg text-xs font-bold text-white uppercase">{q.subject}</span>
                                <span className="text-white/40 text-xs">/</span>
                                <span className="text-white text-sm font-medium">{q.topic}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="text-right hidden md:block">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Target Counter</p>
                            <p className="text-2xl font-black text-white">{currentIndex + 1} <span className="text-slate-600 font-normal">/ {questions.length}</span></p>
                        </div>

                        <div className="relative w-16 h-16 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" />
                                <motion.circle
                                    cx="32" cy="32" r="28"
                                    stroke={timeLeft < 15 ? "#ef4444" : "#4f46e5"}
                                    strokeWidth="6"
                                    fill="transparent"
                                    strokeDasharray={175.9}
                                    animate={{ strokeDashoffset: 175.9 - (175.9 * timeLeft / 60) }}
                                    transition={{ duration: 1 }}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className={`absolute text-xl font-mono font-black ${timeLeft < 15 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-md p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.5)]"></div>
                    <div className="w-full text-left">
                        <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-4 drop-shadow-lg">
                            {q.question}
                        </h2>
                    </div>
                </div>
            </div>

            <div ref={arenaRef} className="absolute inset-0 z-0 pt-[400px]">
                {q.options.map((opt, i) => (
                    bubblePositions[i] && (
                        <Target
                            key={`${gameKey}-${i}`}
                            option={opt}
                            index={i}
                            onSelect={handleOptionSelect}
                            position={bubblePositions[i]}
                        />
                    )
                ))}
            </div>

            <div className="absolute bottom-10 left-0 right-0 z-50 px-10">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2 text-white/40 text-xs font-black uppercase tracking-[0.2em]">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                        Arena Status: Intercept Target to Select
                    </div>
                    <div className="text-white/40 text-xs font-black uppercase tracking-[0.2em]">
                        Syllabus Progress: {Math.round(progress)}%
                    </div>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 shadow-inner text-left">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 shadow-[0_0_20px_rgba(79,70,229,0.8)]"
                    />
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                body { overflow: hidden; }
                * { user-select: none; }
            `}} />
        </div>
    );
};

export default DiagnosticQuiz;
