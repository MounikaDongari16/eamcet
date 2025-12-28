import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Book, ChevronRight, CheckCircle, BarChart2, RotateCcw, Target, BookOpen, TrendingUp, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { resetUserState } from '../utils/userState';
import { logStudyActivity } from '../utils/attendance';

const MyPlan = () => {
    const navigate = useNavigate();
    const [plan, setPlan] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);

    // New State for Content Modal
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [contentLoading, setContentLoading] = useState(false);
    const [topicContent, setTopicContent] = useState(null);
    const [modalStartTime, setModalStartTime] = useState(null);

    useEffect(() => {
        // ... (Existing useEffect code same as before) ...
        try {
            const storedPlan = localStorage.getItem('userPlan');
            const storedAnalysis = localStorage.getItem('quizAnalysis');

            if (storedPlan) setPlan(JSON.parse(storedPlan));
            if (storedAnalysis) setAnalysis(JSON.parse(storedAnalysis));

            const fetchPlan = async () => {
                if (!storedPlan) {
                    setLoading(true);
                    try {
                        const defaultProfile = { year: '2nd Year', stream: 'MPC', board: 'TS (Telangana)' };
                        const response = await fetch('/api/plan/generate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userProfile: defaultProfile })
                        });
                        const data = await response.json();
                        if (data.plan) {
                            setPlan(data.plan);
                            localStorage.setItem('userPlan', JSON.stringify(data.plan));
                        }
                    } catch (err) {
                        console.error("Auto-fetch plan failed", err);
                    } finally {
                        setLoading(false);
                    }
                }
            };
            fetchPlan();
        } catch (error) {
            console.error('Error loading plan in MyPlan:', error);
            setPlan(null);
        }
    }, []);

    // Function to handle topic click
    const handleTopicClick = async (topic, subject) => {
        setSelectedTopic({ topic, subject });
        setTopicContent(null);
        setContentLoading(true);
        setModalStartTime(Date.now()); // Start timer

        try {
            const response = await fetch('/api/learn/topic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic,
                    subject,
                    year: plan?.student_type || '2nd Year'
                })
            });
            const data = await response.json();
            setTopicContent(data.content);
        } catch (error) {
            console.error("Failed to fetch content", error);
            setTopicContent("Sorry, failed to load content. Please try again.");
        } finally {
            setContentLoading(false);
        }
    };

    // Close Modal
    const closeModal = () => {
        if (modalStartTime && selectedTopic) {
            // Log partial study time if they just read
            const durationMins = Math.round((Date.now() - modalStartTime) / 60000);
            if (durationMins > 0) {
                logStudyActivity({
                    timeSpent: durationMins,
                    topic: selectedTopic.topic,
                    subject: selectedTopic.subject
                });
            }
        }
        setSelectedTopic(null);
        setTopicContent(null);
        setModalStartTime(null);
    }

    // Mark task as done
    const markAsDone = () => {
        if (!selectedTopic || !plan) return;

        // Log completion
        const durationMins = Math.round((Date.now() - modalStartTime) / 60000);
        logStudyActivity({
            timeSpent: Math.max(1, durationMins), // Ensure at least 1 min if marked done
            topic: selectedTopic.topic,
            subject: selectedTopic.subject
        });

        // Deep clone the plan to avoid mutation
        const updatedPlan = JSON.parse(JSON.stringify(plan));

        // Find and update the task status
        let taskFound = false;
        Object.values(updatedPlan.monthly_plan || {}).forEach(month => {
            month.weeks?.forEach(week => {
                week.days?.forEach(day => {
                    day.tasks?.forEach(task => {
                        if (task.topic === selectedTopic.topic && task.subject === selectedTopic.subject) {
                            task.status = 'completed';
                            taskFound = true;
                        }
                    });
                });
            });
        });

        if (taskFound) {
            // Save to localStorage
            localStorage.setItem('userPlan', JSON.stringify(updatedPlan));
            // Update local state
            setPlan(updatedPlan);
            // Close modal
            closeModal();
            // Show success feedback
            alert('✅ Great job! Task marked as complete.');
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-pastel-bg">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-pastel-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h2 className="text-xl font-bold text-gray-700">Generating your 3-Month Plan...</h2>
                    <p className="text-gray-500">Curating the best strategy for you.</p>
                </div>
            </div>
        );
    }

    if (!plan && !loading) {
        return (
            <div className="min-h-screen bg-pastel-bg p-10 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-700 mb-4">No Plan Found</h2>
                    <button onClick={() => navigate('/onboarding')} className="px-6 py-3 bg-pastel-primary text-white rounded-xl shadow-lg">
                        Create a Plan
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-pastel-bg p-6 font-sans text-gray-800 flex relative">
            {/* Sidebar Placeholder */}
            <aside className="w-64 bg-white rounded-2xl shadow-sm p-6 mr-6 hidden md:block">
                <div className="text-2xl font-bold text-pastel-primary mb-10 tracking-tight">EAMCET<span className="text-pastel-secondary">AI</span></div>
                <nav className="space-y-4">
                    <button onClick={() => navigate('/dashboard')} className="w-full text-left px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 flex items-center gap-3 transition">
                        <div className="p-2 bg-gray-100 rounded-lg"><BarChart2 size={18} /></div>
                        Dashboard
                    </button>
                    <button className="w-full text-left px-4 py-3 rounded-xl bg-pastel-mint text-pastel-secondary font-semibold shadow-sm flex items-center gap-3 transition">
                        <div className="p-2 bg-white rounded-lg"><Calendar size={18} /></div>
                        My Plan
                    </button>
                    <button onClick={() => navigate('/mock-tests')} className="w-full text-left px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 flex items-center gap-3 transition">
                        <div className="p-2 bg-gray-100 rounded-lg"><BookOpen size={18} /></div>
                        Practice Tests
                    </button>
                    <button onClick={() => navigate('/performance')} className="w-full text-left px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 flex items-center gap-3 transition">
                        <div className="p-2 bg-gray-100 rounded-lg"><TrendingUp size={18} /></div>
                        Performance
                    </button>
                    <button onClick={() => navigate('/settings')} className="w-full text-left px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 flex items-center gap-3 transition">
                        <div className="p-2 bg-gray-100 rounded-lg"><SettingsIcon size={18} /></div>
                        Settings
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
                <header className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Your Learning Path 🚀</h1>
                        <p className="text-pastel-primary font-bold mt-1">
                            {typeof plan.label === 'object' ? JSON.stringify(plan.label) : (plan.label || (plan.student_type ? `${typeof plan.student_type === 'object' ? JSON.stringify(plan.student_type) : plan.student_type} Aligned Strategy` : 'Tailored for Success'))}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            if (window.confirm("Are you sure? This will clear your current plan and progress.")) {
                                resetUserState();
                                window.location.href = '/onboarding';
                            }
                        }}
                        className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-100 transition border border-red-100 flex items-center gap-2"
                    >
                        <span>Reset Plan</span>
                    </button>
                </header>

                <div className="mb-6"></div>

                <div className="space-y-8">
                    {/* Mentor Insights Section */}
                    {(plan.performance_summary || plan.priority_topics) && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-fadeIn">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-pastel-lavender text-pastel-primary rounded-lg"><Target size={20} /></div>
                                    Mentor's Analysis
                                </h2>
                                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                    {typeof plan.performance_summary === 'object'
                                        ? JSON.stringify(plan.performance_summary)
                                        : plan.performance_summary}
                                </p>
                                <div className="p-4 bg-pastel-primary/5 rounded-xl border border-pastel-primary/10">
                                    <h4 className="text-xs font-bold text-pastel-primary uppercase tracking-wider mb-2">Revision Strategy</h4>
                                    <p className="text-gray-700 text-sm italic">"{typeof plan.revision_strategy === 'object' ? JSON.stringify(plan.revision_strategy) : (plan.revision_strategy || 'Consolidate weak areas during weekends.')}"</p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-fadeIn">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><Clock size={20} /></div>
                                    Priority Focus
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Top Priority Chapters</h4>
                                        <div className="flex gap-2 flex-wrap">
                                            {plan.priority_topics?.map((topic, i) => (
                                                <span key={i} className="px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-medium border border-gray-100" title={typeof topic !== 'string' ? topic.subject : ''}>
                                                    🔥 {typeof topic === 'string' ? topic : topic.topic}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-gray-50">
                                        <p className="text-sm font-semibold text-pastel-primary flex items-center gap-2">
                                            <span>🚀 Expected Outcome:</span>
                                            <span className="text-gray-600 font-normal">
                                                {typeof plan.expected_improvement === 'object'
                                                    ? JSON.stringify(plan.expected_improvement)
                                                    : plan.expected_improvement}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Monthly Plans */}
                    {plan.monthly_plan && Object.entries(plan.monthly_plan).length > 0 ? (
                        Object.entries(plan.monthly_plan).map(([monthKey, monthData], mIdx) => (
                            <div key={mIdx} className="space-y-4">
                                <h3 className="text-2xl font-bold text-gray-800 capitalize flex items-center gap-2">
                                    <span className="w-8 h-8 bg-pastel-primary text-white rounded-lg flex items-center justify-center text-sm">{mIdx + 1}</span>
                                    {monthKey.replace('_', ' ')} <span className="text-sm font-normal text-gray-400 ml-2">({monthData.theme})</span>
                                </h3>

                                {monthData.weeks?.map((week, wIdx) => (
                                    <div key={wIdx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
                                            <h4 className="font-semibold text-gray-700">Week {week.week}</h4>
                                        </div>
                                        <div className="divide-y divide-gray-50">
                                            {week.days?.map((day, dIdx) => (
                                                <div key={dIdx} className="p-6 border-b border-gray-50 last:border-0">
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <div className="bg-pastel-primary text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                                            Day {day.day}
                                                        </div>
                                                        <div className="h-[1px] flex-1 bg-gray-100"></div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        {(day.tasks || [day]).map((task, tIdx) => {
                                                            const isMath = task.subject?.includes('Math');
                                                            const isPhy = task.subject?.includes('Phy');
                                                            const isChem = task.subject?.includes('Chem');
                                                            const isRevision = task.type === 'revision';
                                                            const isExamReady = task.type === 'exam_readiness';

                                                            return (
                                                                <div
                                                                    key={tIdx}
                                                                    className={`flex items-start gap-4 p-4 rounded-2xl border transition cursor-pointer group ${isRevision ? 'bg-yellow-50 border-yellow-100 hover:bg-yellow-100' :
                                                                        isExamReady ? 'bg-green-50 border-green-100 hover:bg-green-100' :
                                                                            'bg-white border-gray-100 hover:border-pastel-primary/30 hover:bg-pastel-lavender/10'
                                                                        }`}
                                                                    onClick={() => handleTopicClick(task.topic, task.subject)}
                                                                >
                                                                    <div className={`p-2.5 rounded-xl text-white shadow-sm ${isRevision ? 'bg-yellow-500' :
                                                                        isExamReady ? 'bg-green-600' :
                                                                            isMath ? 'bg-blue-500' :
                                                                                isPhy ? 'bg-violet-500' :
                                                                                    'bg-orange-500'
                                                                        }`}>
                                                                        {isRevision ? <RotateCcw size={18} /> :
                                                                            isExamReady ? <Target size={18} /> :
                                                                                <Book size={18} />}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 truncate ${isRevision ? 'text-yellow-600' :
                                                                            isExamReady ? 'text-green-600' :
                                                                                'text-gray-400'
                                                                            }`}>
                                                                            {task.subject} {isRevision && '• Revision'}
                                                                        </div>
                                                                        <div className="font-bold text-gray-800 group-hover:text-pastel-primary transition text-sm leading-tight line-clamp-2">
                                                                            {task.topic}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-500 font-medium">
                                                                            <span className="flex items-center gap-1"><Clock size={12} /> {task.duration || '1h'}</span>
                                                                            <span>•</span>
                                                                            <span className={`px-2 py-0.5 rounded text-[10px] capitalize ${isRevision ? 'bg-yellow-200 text-yellow-800' :
                                                                                isExamReady ? 'bg-green-200 text-green-800' :
                                                                                    'bg-gray-100 text-gray-600'
                                                                                }`}>{task.type}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))
                    ) : (
                        <div className="bg-white p-10 rounded-2xl border border-gray-100 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar size={32} className="text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-700 mb-2">Plan Not Available</h3>
                            <p className="text-gray-500 mb-6">Your 60-day plan is being generated or needs to be regenerated.</p>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('userPlan');
                                    navigate('/diagnostic-quiz');
                                }}
                                className="px-6 py-3 bg-pastel-primary text-white rounded-xl font-semibold hover:bg-violet-600 transition"
                            >
                                Retake Diagnostic Quiz
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Content Modal */}
            {selectedTopic && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={closeModal}>
                    <div className="bg-white w-full max-w-3xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fadeIn" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-pastel-lavender to-white p-6 border-b border-gray-100 flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">{selectedTopic.topic}</h3>
                                <p className="text-pastel-primary font-medium">{selectedTopic.subject}</p>
                            </div>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition">
                                <span className="text-2xl">×</span>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 overflow-y-auto">
                            {contentLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <div className="w-12 h-12 border-4 border-pastel-primary border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-gray-500 font-medium animate-pulse">Designing your lesson...</p>
                                </div>
                            ) : (
                                <article className="prose prose-slate max-w-none">
                                    {/* Simple Markdown Rendering since we don't have react-markdown yet */}
                                    <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed bg-transparent p-0 border-0">
                                        {topicContent}
                                    </pre>
                                </article>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button onClick={markAsDone} className="px-6 py-2 bg-pastel-primary text-white rounded-xl hover:bg-violet-600 transition shadow-sm font-medium">
                                Mark as Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyPlan;
