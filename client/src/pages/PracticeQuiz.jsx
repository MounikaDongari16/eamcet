import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, ArrowRight, RotateCcw, TrendingUp, Target } from 'lucide-react';
import { fetchApi } from '../services/api';

const PracticeQuiz = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { topic, subject } = location.state || {};

    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [answers, setAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

    useEffect(() => {
        if (!topic || !subject) {
            navigate('/mock-tests');
            return;
        }
        fetchPracticeQuestions();
    }, [topic, subject]);

    // Timer
    useEffect(() => {
        if (loading || showResults) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [loading, showResults]);

    const fetchPracticeQuestions = async () => {
        setLoading(true);
        try {
            const data = await fetchApi('/api/practice/questions', {
                method: 'POST',
                body: JSON.stringify({ topic, subject, count: 10 })
            });
            setQuestions(data.questions || []);
        } catch (error) {
            console.error('Failed to fetch practice questions:', error);
            // Fallback to empty array
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelect = (optionIndex) => {
        setSelectedAnswer(optionIndex);
    };

    const handleNext = () => {
        if (selectedAnswer !== null) {
            setAnswers({ ...answers, [currentQuestion]: selectedAnswer });
            setSelectedAnswer(null);

            if (currentQuestion < questions.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
            } else {
                handleSubmit();
            }
        }
    };

    const handleSubmit = () => {
        const finalAnswers = { ...answers };
        if (selectedAnswer !== null) {
            finalAnswers[currentQuestion] = selectedAnswer;
        }
        setAnswers(finalAnswers);

        // Save to Performance History
        let correctCount = 0;
        questions.forEach((q, idx) => {
            if (finalAnswers[idx] === q.correctAnswer) {
                correctCount++;
            }
        });

        const result = {
            id: Date.now(),
            topic,
            subject,
            score: correctCount,
            total: questions.length,
            accuracy: Math.round((correctCount / questions.length) * 100),
            timeTaken: 600 - timeLeft,
            date: new Date().toISOString()
        };

        const history = JSON.parse(localStorage.getItem('practiceHistory') || '[]');
        localStorage.setItem('practiceHistory', JSON.stringify([result, ...history]));

        setShowResults(true);
    };

    const calculateScore = () => {
        let correct = 0;
        questions.forEach((q, idx) => {
            if (answers[idx] === q.correctAnswer) {
                correct++;
            }
        });
        return correct;
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-pastel-bg">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-pastel-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading practice questions...</p>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-pastel-bg p-6">
                <div className="bg-white p-10 rounded-2xl shadow-lg text-center max-w-md">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">No Questions Available</h2>
                    <p className="text-gray-600 mb-6">We couldn't generate practice questions for this topic.</p>
                    <button
                        onClick={() => navigate('/mock-tests')}
                        className="px-6 py-3 bg-pastel-primary text-white rounded-xl font-semibold hover:bg-violet-600 transition"
                    >
                        Back to Practice Tests
                    </button>
                </div>
            </div>
        );
    }

    if (showResults) {
        const score = calculateScore();
        const percentage = Math.round((score / questions.length) * 100);

        return (
            <div className="min-h-screen bg-pastel-bg p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Practice Test Results</h1>
                        <p className="text-gray-600 mb-6">{subject} - {topic}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                                <p className="text-xs text-blue-600 font-bold uppercase mb-1">Score</p>
                                <p className="text-4xl font-black text-blue-700">{score}/{questions.length}</p>
                            </div>
                            <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                                <p className="text-xs text-green-600 font-bold uppercase mb-1">Accuracy</p>
                                <p className="text-4xl font-black text-green-700">{percentage}%</p>
                            </div>
                            <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                                <p className="text-xs text-purple-600 font-bold uppercase mb-1">Time Taken</p>
                                <p className="text-4xl font-black text-purple-700">{formatTime(600 - timeLeft)}</p>
                            </div>
                        </div>

                        {percentage < 50 && (
                            <div className="mb-8 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-4 animate-pulse">
                                <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                                    <Target size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-red-800">Practice Required! 🎯</h3>
                                    <p className="text-sm text-red-600">You scored below 50%. We recommend practicing this topic again to strengthen your concepts.</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {questions.map((q, idx) => {
                                const userAnswer = answers[idx];
                                const isCorrect = userAnswer === q.correctAnswer;

                                return (
                                    <div key={idx} className={`p-6 rounded-xl border-2 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                        <div className="flex items-start gap-3 mb-3">
                                            {isCorrect ? (
                                                <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                                            ) : (
                                                <XCircle className="text-red-600 flex-shrink-0" size={24} />
                                            )}
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-800 mb-2">Q{idx + 1}. {q.question}</p>
                                                <div className="space-y-2">
                                                    {q.options.map((opt, optIdx) => (
                                                        <div
                                                            key={optIdx}
                                                            className={`p-3 rounded-lg ${optIdx === q.correctAnswer
                                                                ? 'bg-green-200 border-2 border-green-400 font-semibold'
                                                                : optIdx === userAnswer && !isCorrect
                                                                    ? 'bg-red-200 border-2 border-red-400'
                                                                    : 'bg-white border border-gray-200'
                                                                }`}
                                                        >
                                                            {opt}
                                                            {optIdx === q.correctAnswer && <span className="ml-2 text-green-700">✓ Correct</span>}
                                                            {optIdx === userAnswer && !isCorrect && <span className="ml-2 text-red-700">✗ Your Answer</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                                {q.explanation && (
                                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                        <p className="text-sm text-blue-900"><strong>Explanation:</strong> {q.explanation}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 mt-8">
                            <button
                                onClick={() => {
                                    setCurrentQuestion(0);
                                    setAnswers({});
                                    setSelectedAnswer(null);
                                    setShowResults(false);
                                    setTimeLeft(600);
                                    fetchPracticeQuestions();
                                }}
                                className="flex-1 px-6 py-3 bg-pastel-primary text-white rounded-xl font-semibold hover:bg-violet-600 transition flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={20} />
                                Retry
                            </button>
                            <button
                                onClick={() => navigate('/performance')}
                                className="flex-1 px-6 py-3 bg-pastel-lavender text-pastel-primary rounded-xl font-semibold hover:bg-indigo-100 transition flex items-center justify-center gap-2"
                            >
                                <TrendingUp size={20} />
                                View Performance
                            </button>
                            <button
                                onClick={() => navigate('/mock-tests')}
                                className="flex-1 px-6 py-3 bg-gray-100 text-gray-800 rounded-xl font-semibold hover:bg-gray-200 transition"
                            >
                                Back to Practice
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    return (
        <div className="min-h-screen bg-pastel-bg p-6">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{subject}</h1>
                            <p className="text-gray-600">{topic}</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-pastel-primary/10 rounded-xl">
                            <Clock size={20} className="text-pastel-primary" />
                            <span className="font-bold text-pastel-primary">{formatTime(timeLeft)}</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Question {currentQuestion + 1} of {questions.length}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-pastel-primary to-pastel-secondary transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Question Card */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">{currentQ.question}</h2>

                    <div className="space-y-3 mb-8">
                        {currentQ.options.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswerSelect(idx)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition ${selectedAnswer === idx
                                    ? 'border-pastel-primary bg-pastel-lavender/30'
                                    : 'border-gray-200 hover:border-pastel-primary/50 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedAnswer === idx
                                        ? 'border-pastel-primary bg-pastel-primary'
                                        : 'border-gray-300'
                                        }`}>
                                        {selectedAnswer === idx && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <span className="font-medium text-gray-800">{option}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        {currentQuestion > 0 && (
                            <button
                                onClick={() => setCurrentQuestion(currentQuestion - 1)}
                                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition"
                            >
                                Previous
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            disabled={selectedAnswer === null}
                            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${selectedAnswer === null
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-pastel-primary text-white hover:bg-violet-600'
                                }`}
                        >
                            {currentQuestion === questions.length - 1 ? 'Submit' : 'Next'}
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PracticeQuiz;
