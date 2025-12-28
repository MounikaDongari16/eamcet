import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, Book, TrendingUp, AlertTriangle, MessageCircle, Play, X, Shield, User, ChevronRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import ChatWindow from '../components/ChatWindow';
import { getAttendanceData, seedDummyData, logStudyActivity } from '../utils/attendance';

const Dashboard = () => {
    const [showChat, setShowChat] = useState(false);
    const [aiPlan, setAiPlan] = useState(null);
    const [attendance, setAttendance] = useState({});
    const location = useLocation();
    const navigate = useNavigate();
    const currentUserEmail = localStorage.getItem('eamcet_current_user') || 'Student';
    const shortName = currentUserEmail.split('@')[0];

    // Tracking time spent in app
    useEffect(() => {
        const timer = setInterval(() => {
            logStudyActivity({ timeSpent: 1 }); // Log 1 minute
            setAttendance(getAttendanceData()); // Refresh state to update UI
        }, 60000); // Every minute

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let data = getAttendanceData();
        setAttendance(data);
    }, []);

    // Load plan from localStorage or location state
    useEffect(() => {
        try {
            const storedPlan = localStorage.getItem('userPlan');
            const loadedPlan = location.state?.plan || (storedPlan ? JSON.parse(storedPlan) : null);

            if (!loadedPlan) {
                console.warn('Dashboard: No plan found in localStorage or state.');
                // If we are on dashboard but have no plan, something is wrong with state
                // Redirecting to onboarding to reset/fix state
                const timer = setTimeout(() => {
                    navigate('/onboarding');
                }, 1500);
                return () => clearTimeout(timer);
            }

            setAiPlan(loadedPlan);
        } catch (error) {
            console.error('Error loading plan:', error);
            setAiPlan(null);
            navigate('/onboarding');
        }
    }, [location.state, navigate]);


    // Transform AI plan (3-Month Structure) into Dashboard format
    // Extract Month 1, Week 1, Day 1 for "Today's Schedule"
    let todaysPlan = [];

    if (aiPlan && aiPlan.monthly_plan) {
        // New Structure
        const m1 = aiPlan.monthly_plan.month_1 || aiPlan.monthly_plan.Month_1;
        if (m1 && m1.weeks && m1.weeks.length > 0) {
            const w1 = m1.weeks[0];
            // Find Day 1
            const day1 = w1.days.find(d => parseInt(d.day) === 1);
            if (day1 && day1.tasks) {
                todaysPlan = day1.tasks.map((t, i) => ({
                    id: i,
                    subject: t.subject || 'General',
                    topic: t.topic,
                    type: t.type || 'Learn',
                    duration: t.duration || '45 mins',
                    status: t.status || 'pending'
                }));
            }
        }
    } else if (aiPlan && aiPlan.day_wise_plan) {
        // Handle flat day_wise_plan if it exists (fallback)
        const d1 = aiPlan.day_wise_plan.day_1;
        if (d1) {
            const tasks = Array.isArray(d1) ? d1 : [d1];
            todaysPlan = tasks.map((t, i) => ({
                id: i,
                subject: t.subject || 'General',
                topic: t.topic || 'Topic',
                type: t.type || 'Learn',
                duration: t.duration || '45 mins',
                status: 'pending'
            }));
        }
    } else if (aiPlan && Array.isArray(aiPlan)) {
        // Fallback for old structure (just in case)
        todaysPlan = aiPlan[0]?.tasks?.map((t, i) => ({ ...t, id: i, status: 'pending' })) || [];
    }

    // Fallback Mock if parsing failed or plan empty
    if (todaysPlan.length === 0) {
        todaysPlan = [
            { id: 1, subject: 'Maths', topic: 'Matrices & Determinants', type: 'Learn', duration: '45 mins', status: 'pending' },
            { id: 2, subject: 'Physics', topic: 'Kinematics Problems', type: 'Practice', duration: '30 mins', status: 'completed' },
            { id: 3, subject: 'Chemistry', topic: 'Atomic Structure Revision', type: 'Revise', duration: '20 mins', status: 'pending' }
        ];
    }

    const handleStartTask = (task) => {
        // Redirect to plan view to study the topic
        navigate('/my-plan', { state: { highlightTopic: task.topic } });
    };

    // Show loading while plan loads
    if (!aiPlan) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-pastel-bg">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-pastel-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-pastel-bg flex text-gray-800 font-sans">
            {/* Sidebar (Simple Mock) */}
            <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col p-6 fixed h-full z-10">
                <div className="text-2xl font-bold text-pastel-primary mb-10">ExamPilot<span className="text-pastel-secondary">AI</span></div>
                <nav className="space-y-2">
                    {[
                        { name: 'Dashboard', path: '/dashboard' },
                        { name: 'My Plan', path: '/my-plan' },
                        { name: 'Practice Tests', path: '/mock-tests' },
                        { name: 'Performance', path: '/performance' },
                        { name: 'Settings', path: '/settings' }
                    ].map((item) => (
                        <button
                            key={item.name}
                            onClick={() => navigate(item.path)}
                            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition ${item.name === 'Dashboard' ? 'bg-pastel-lavender text-pastel-primary' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            {item.name}
                        </button>
                    ))}
                </nav>
                <div className="mt-auto space-y-4">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-soft hover:shadow-md transition-all group cursor-default">
                        <div className="relative">
                            <div className="w-12 h-12 bg-premium-gradient rounded-full flex items-center justify-center font-black text-white text-lg uppercase shadow-lg border-2 border-white ring-2 ring-pastel-lavender group-hover:scale-110 transition-transform">
                                {shortName[0]}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-extrabold text-sm text-gray-800 truncate">{shortName}</p>
                            <p className="text-[11px] font-medium text-gray-400 truncate">{currentUserEmail}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-6 md:p-10">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold">Welcome back, {shortName}! 👋</h1>
                            <p className="text-gray-500 mt-1">Let's crush today's goals.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100 hover:border-pastel-primary/30 transition-colors">
                                <div className="w-2.5 h-2.5 bg-pastel-secondary rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                <span className="text-sm font-bold text-gray-600">Online</span>
                            </div>
                            <div className="relative group">
                                <div className="w-11 h-11 bg-premium-gradient rounded-full flex items-center justify-center font-black text-white text-lg uppercase shadow-xl border-2 border-white cursor-pointer hover:ring-4 hover:ring-pastel-primary/20 transition-all active:scale-90">
                                    {shortName[0]}
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-pastel-accent text-[8px] text-white font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">1</div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Meter */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fadeIn">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    Today's Progress
                                    <span className="text-xs font-normal text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                        {todaysPlan.filter(t => t.status === 'completed').length}/{todaysPlan.length} Topics
                                    </span>
                                </h3>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-pastel-primary">
                                    {Math.round((todaysPlan.filter(t => t.status === 'completed').length / (todaysPlan.length || 1)) * 100)}%
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-3">
                            <div
                                className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-violet-400 to-green-400"
                                style={{ width: `${(todaysPlan.filter(t => t.status === 'completed').length / (todaysPlan.length || 1)) * 100}%` }}
                            ></div>
                        </div>

                        {/* Motivation Text */}
                        <p className="text-sm font-medium text-gray-500">
                            {(() => {
                                const pct = (todaysPlan.filter(t => t.status === 'completed').length / (todaysPlan.length || 1)) * 100;
                                if (pct === 100) return "Amazing! You completed today’s goals 🎉";
                                if (pct >= 71) return "Almost there! Finish strong 🔥";
                                if (pct >= 31) return "Great progress! Keep going 💪";
                                return "Let’s get started 🚀";
                            })()}
                        </p>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-pastel-lavender rounded-xl text-pastel-primary"><Clock size={24} /></div>
                        <div>
                            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest text-[10px]">Today's Time</p>
                            <p className="text-2xl font-black text-gray-800">
                                {(() => {
                                    const today = new Date().toISOString().split('T')[0];
                                    const mins = attendance[today]?.total_study_time || 0;
                                    const h = Math.floor(mins / 60);
                                    const m = mins % 60;
                                    return h > 0 ? `${h}h ${m}m` : `${m}m`;
                                })()}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-pastel-mint rounded-xl text-pastel-secondary"><CheckCircle size={24} /></div>
                        <div>
                            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest text-[10px]">Tasks Done</p>
                            <p className="text-2xl font-black text-gray-800">
                                {(() => {
                                    let done = 0;
                                    let total = 0;
                                    Object.values(aiPlan?.monthly_plan || {}).forEach(m => {
                                        m.weeks?.forEach(w => {
                                            w.days?.forEach(d => {
                                                d.tasks?.forEach(t => {
                                                    total++;
                                                    if (t.status === 'completed') done++;
                                                });
                                            });
                                        });
                                    });
                                    return `${done}/${total}`;
                                })()}
                            </p>
                        </div>
                    </div>

                    <div
                        onClick={() => navigate('/settings', { state: { tab: 'attendance' } })}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group cursor-pointer hover:border-pastel-primary transition-all overflow-hidden"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-pastel-sunshine rounded-xl text-pastel-accent group-hover:scale-110 transition-transform"><Calendar size={24} /></div>
                            <div>
                                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest text-[10px]">Attendance</p>
                                <div className="flex gap-1 mt-1">
                                    {[...Array(7)].map((_, i) => {
                                        const d = new Date();
                                        d.setDate(d.getDate() - (6 - i));
                                        const dateStr = d.toISOString().split('T')[0];
                                        const status = attendance[dateStr]?.status;
                                        return (
                                            <div
                                                key={i}
                                                className={`w-3 h-3 rounded-sm ${status === 'green' ? 'bg-emerald-500' :
                                                    status === 'yellow' ? 'bg-amber-400' :
                                                        status === 'red' ? 'bg-red-400' : 'bg-gray-100'
                                                    }`}
                                            ></div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-gray-300 group-hover:text-pastel-primary transition-colors" />
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-pastel-rose rounded-xl text-pink-500"><AlertTriangle size={20} /></div>
                            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest text-[10px]">Focus Range</p>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            {(aiPlan?.priority_topics && aiPlan.priority_topics.length > 0) ? (
                                <ul className="space-y-1">
                                    {aiPlan.priority_topics.slice(0, 3).map((t, i) => (
                                        <li key={i} className="text-sm font-semibold text-gray-800 flex items-center gap-2 truncate">
                                            <span className="w-1.5 h-1.5 bg-pink-500 rounded-full flex-shrink-0"></span>
                                            <span className="truncate text-xs" title={typeof t === 'string' ? t : `${t.topic} (${t.subject})`}>
                                                {typeof t === 'string' ? t : t.topic}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm font-bold text-gray-800">All Systems Go</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Today's Plan */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold text-gray-800">Today's Schedule</h2>
                        <div className="space-y-4">
                            {todaysPlan.map((task) => (
                                <div key={task.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                            {task.status === 'completed' ? <CheckCircle size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>}
                                        </div>
                                        <div>
                                            <h4 className={`font-semibold text-lg ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{task.topic}</h4>
                                            <div className="flex gap-2 text-sm text-gray-500 mt-1">
                                                <span className="px-2 py-0.5 bg-gray-50 rounded text-xs uppercase tracking-wide font-medium">{task.subject}</span>
                                                <span className="flex items-center gap-1"><Clock size={12} /> {task.duration}</span>
                                                <span className="flex items-center gap-1"><Book size={12} /> {task.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {task.status !== 'completed' && (
                                        <button
                                            onClick={() => handleStartTask(task)}
                                            className="px-4 py-2 bg-pastel-lavender text-pastel-primary rounded-lg text-sm font-medium hover:bg-pastel-primary hover:text-white transition"
                                        >
                                            Start
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Sidebar Widgets */}
                    <div className="space-y-6">
                        {/* AI Tutor Widget */}
                        <div className="bg-gradient-to-br from-pastel-primary to-violet-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group cursor-pointer hover:shadow-2xl transition">
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                                        <MessageCircle size={20} />
                                    </div>
                                    <h3 className="font-bold text-lg">AI Doubt Solver</h3>
                                </div>
                                <p className="text-white/80 text-sm mb-4">Stuck on a concept? Ask our AI tutor instantly.</p>
                                <button
                                    onClick={() => setShowChat(true)}
                                    className="w-full py-2 bg-white text-pastel-primary font-semibold rounded-lg hover:bg-gray-50 transition"
                                >
                                    Ask a Doubt
                                </button>
                            </div>
                            {/* Decorative */}
                            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full"></div>
                        </div>

                        {/* Next Live Quiz */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-800 mb-4">Complete Week Plan</h3>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-pastel-rose rounded-xl text-center min-w-[60px]">
                                    <span className="block text-xs text-pink-600 font-bold uppercase">{new Date(new Date().setDate(new Date().getDate() + (7 - new Date().getDay()) % 7)).toLocaleString('default', { month: 'short' })}</span>
                                    <span className="block text-xl font-bold text-pink-800">{new Date(new Date().setDate(new Date().getDate() + (7 - new Date().getDay()) % 7)).getDate()}</span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-800">Weekly Assessment</h4>
                                    <p className="text-sm text-gray-500">Physics, Chemistry, Maths</p>
                                    <p className="text-xs text-gray-400 mt-1">Starts at 10:00 AM</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    // Trigger simple attractive toast
                                    const toast = document.createElement('div');
                                    toast.className = 'fixed top-6 left-1/2 transform -translate-x-1/2 bg-white text-gray-800 px-6 py-3 rounded-full shadow-2xl border border-gray-100 flex items-center gap-3 z-50 animate-slideDown';
                                    toast.innerHTML = `
                                        <div class="p-2 bg-rose-100 text-rose-500 rounded-full">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                                        </div>
                                        <div>
                                            <p class="font-bold text-sm">Reminder Set!</p>
                                            <p class="text-xs text-gray-500">We'll notify you at 10:00 AM on Sunday.</p>
                                        </div>
                                    `;
                                    document.body.appendChild(toast);

                                    // Remove after 3 seconds
                                    setTimeout(() => {
                                        toast.style.animation = 'slideUp 0.3s forwards';
                                        setTimeout(() => toast.remove(), 300);
                                    }, 3000);
                                }}
                                className="w-full mt-4 py-2 border border-pastel-primary text-pastel-primary font-medium rounded-lg hover:bg-pastel-lavender transition active:scale-95"
                            >
                                Set Reminder
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Floating Chat Button (Demo) */}
            {showChat && <ChatWindow onClose={() => setShowChat(false)} />}
            <div className="fixed bottom-8 right-8 z-50">
                <button
                    onClick={() => setShowChat(!showChat)}
                    className="p-4 bg-pastel-primary text-white rounded-full shadow-lg hover:bg-violet-700 transition transform hover:scale-110 flex items-center justify-center"
                >
                    {showChat ? <X size={28} /> : <MessageCircle size={28} />}
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
