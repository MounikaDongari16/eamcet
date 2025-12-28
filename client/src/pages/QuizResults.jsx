import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Trophy, Target, Clock, Zap, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { saveUserState, saveUserPlan } from '../utils/userState';
import { fetchApi } from '../services/api';

const QuizResults = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { results, userProfile } = location.state || {};

    const [generating, setGenerating] = useState(false);
    const [genLoading, setGenLoading] = useState(false); // For finalize button
    const [plan, setPlan] = useState(null);

    useEffect(() => {
        if (!results) {
            navigate('/dashboard');
            return;
        }

        const timer = setTimeout(() => {
            if (!plan && !generating) {
                generatePlan();
            }
        }, 3000); // Reduce delay to 3s for faster feedback

        return () => clearTimeout(timer);
    }, [results]);

    const generatePlan = async () => {
        setGenerating(true);
        try {
            const data = await fetchApi('/api/plan/generate', {
                method: 'POST',
                body: JSON.stringify({
                    userProfile: userProfile || { year: '2nd Year', stream: 'MPC' },
                    quizResults: results
                })
            });
            if (data.plan) {
                setPlan(data.plan);
                localStorage.setItem('userPlan', JSON.stringify(data.plan));
            }
        } catch (error) {
            console.error("Plan Gen Error:", error);
        } finally {
            setGenerating(false);
        }
    };

    if (!results) return null;

    const subjectColors = {
        Mathematics: 'text-blue-500',
        Physics: 'text-purple-500',
        Chemistry: 'text-teal-500'
    };

    const AccuracyRing = ({ subject, accuracy, score, total }) => {
        const val = parseInt(accuracy) || 0;
        const radius = 35;
        const circ = 2 * Math.PI * radius;
        const offset = circ - (val / 100) * circ;

        return (
            <div className="flex flex-col items-center gap-2">
                <div className="relative w-24 h-24">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-100" />
                        <motion.circle
                            initial={{ strokeDashoffset: circ }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="6" strokeDasharray={circ} fill="transparent" strokeLinecap="round"
                            className={subjectColors[subject] || 'text-pastel-primary'}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-gray-800 tracking-tighter text-lg flex-col leading-none">
                        {score !== undefined ? (
                            <>
                                <span className="text-2xl">{score}</span>
                                <span className="text-xs text-gray-400">/{total}</span>
                            </>
                        ) : (
                            `${val}%`
                        )}
                    </div>
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase">{subject}</span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Overall Score Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="md:col-span-1 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5"><Zap size={100} /></div>
                        <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-500 mb-4">
                            <Trophy size={40} />
                        </div>
                        <div className="text-5xl font-black text-gray-900 mb-1">{results.score}<span className="text-xl text-gray-400 font-medium">/15</span></div>
                        <p className="text-gray-500 font-medium tracking-tight uppercase text-xs">Diagnostic Score</p>
                        <div className="mt-4 opacity-0 h-0"></div>
                    </motion.div>

                    {/* Subject Accuracy Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="md:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
                    >
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Subject Performance</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {Object.entries(results.subjectStats || {}).map(([sub, stats]) => (
                                <AccuracyRing key={sub} subject={sub} accuracy={stats.accuracy} score={stats.score} total={stats.total} />
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Topics Analysis Zone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Weak Topics */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-red-50/50 p-6 rounded-3xl border border-red-100"
                    >
                        <div className="flex items-center gap-2 text-red-600 mb-4">
                            <Target size={20} />
                            <h3 className="font-bold uppercase tracking-tight text-sm">Focus Required</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {results.weakTopics?.map((t, i) => (
                                <span key={i} className="px-3 py-1 bg-white border border-red-100 text-red-700 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2">
                                    <AlertCircle size={14} /> {t.topic} <span className="text-xs text-red-400">({t.subject})</span>
                                </span>
                            ))}
                        </div>
                    </motion.div>

                    {/* Strong Topics */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-teal-50/50 p-6 rounded-3xl border border-teal-100"
                    >
                        <div className="flex items-center gap-2 text-teal-600 mb-4">
                            <CheckCircle2 size={20} />
                            <h3 className="font-bold uppercase tracking-tight text-sm">Strong Foundation</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {results.strongTopics?.map((t, i) => (
                                <span key={i} className="px-3 py-1 bg-white border border-teal-100 text-teal-700 rounded-lg text-sm font-medium shadow-sm flex items-center gap-3">
                                    <Zap size={14} className="text-teal-400" /> {t.topic}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Plan Generation Section */}
                {!plan ? (
                    <motion.div
                        initial={{ opacity: 0, filter: "blur(10px)" }}
                        animate={{ opacity: 1, filter: "blur(0px)" }}
                        className="bg-[#0f172a] text-white p-10 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center text-center"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-teal-500/20 opacity-30"></div>

                        <div className="relative z-10 text-center">
                            <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-2xl shadow-violet-500/50"></div>
                            <h2 className="text-3xl font-black mb-1">Crafting Your Roadmap 🚀</h2>
                            <p className="text-gray-400 italic animate-pulse">
                                {generating ? "AI is analyzing your performance..." : "Preparing your 60-day strategy..."}
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Sample Plan Dashboard */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                                        <Clock className="text-indigo-600" /> Your Personalized Plan
                                    </h2>
                                    <p className="text-slate-500">Based on your score of {results.score}/15</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        setGenLoading(true);
                                        try {
                                            const data = await fetchApi('/api/plan/finalize', {
                                                method: 'POST',
                                                body: JSON.stringify({
                                                    userProfile: userProfile || { year: '2nd Year', stream: 'MPC' },
                                                    quizResults: results
                                                })
                                            });
                                            if (data.plan) {
                                                saveUserState({ study_plan_exists: true, diagnostic_completed: true });
                                                saveUserPlan(data.plan);
                                                navigate('/plan');
                                            }
                                        } catch (e) {
                                            console.error("Finalize Error", e);
                                            // Fallback to minimal plan
                                            saveUserState({ study_plan_exists: true, diagnostic_completed: true });
                                            navigate('/plan');
                                        }
                                    }}
                                    disabled={genLoading}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                                >
                                    {genLoading ? 'Preparing your personalized study plan...' : <>View Full Study Plan <ArrowRight size={18} /></>}
                                </button>
                            </div>

                            {/* Plan Highlights */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                                    <h4 className="text-indigo-900 font-bold mb-2">Priority Focus</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {plan.priority_topics?.map(t => (
                                            <span key={t} className="text-xs font-bold bg-white text-indigo-700 px-2 py-1 rounded shadow-sm">{t}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                                    <h4 className="text-emerald-900 font-bold mb-2">Expected Growth</h4>
                                    <p className="text-emerald-700 text-sm font-medium">{plan.expected_improvement}</p>
                                </div>
                                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                                    <h4 className="text-amber-900 font-bold mb-2">Revision Strategy</h4>
                                    <p className="text-amber-800 text-sm font-medium">{plan.revision_strategy}</p>
                                </div>
                            </div>

                            {/* Sample Schedule removed per user request to keep results page clean */}
                        </div>
                    </motion.div>
                )}

            </div>
        </div>
    );
};

export default QuizResults;
