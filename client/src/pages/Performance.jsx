import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart2,
    Calendar,
    Clock,
    Target,
    Trophy,
    TrendingUp,
    BookOpen,
    CheckCircle,
    ChevronRight,
    Search,
    Filter,
    Settings as SettingsIcon
} from 'lucide-react';

const Performance = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({
        totalTests: 0,
        avgAccuracy: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        topSubject: 'N/A'
    });

    useEffect(() => {
        const storedHistory = JSON.parse(localStorage.getItem('practiceHistory') || '[]');
        setHistory(storedHistory);
        calculateStats(storedHistory);
    }, []);

    const calculateStats = (data) => {
        if (data.length === 0) return;

        const totalTests = data.length;
        const avgAccuracy = Math.round(data.reduce((acc, curr) => acc + curr.accuracy, 0) / totalTests);

        // Most recent test stats
        const latestTest = data[0];
        const lastQuestions = latestTest.total;
        const lastCorrect = latestTest.score;

        const subjectCounts = data.reduce((acc, curr) => {
            acc[curr.subject] = (acc[curr.subject] || 0) + 1;
            return acc;
        }, {});
        const topSubject = Object.keys(subjectCounts).reduce((a, b) => subjectCounts[a] > subjectCounts[b] ? a : b);

        setStats({
            totalTests,
            avgAccuracy,
            totalQuestions: lastQuestions,
            totalCorrect: lastCorrect,
            topSubject
        });
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-pastel-bg flex text-gray-800 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col p-6 fixed h-full z-10">
                <div className="text-2xl font-bold text-pastel-primary mb-10">EAMCET<span className="text-pastel-secondary">AI</span></div>
                <nav className="space-y-2">
                    {[
                        { name: 'Dashboard', path: '/dashboard', icon: BarChart2 },
                        { name: 'My Plan', path: '/my-plan', icon: Calendar },
                        { name: 'Practice Tests', path: '/mock-tests', icon: BookOpen },
                        { name: 'Performance', path: '/performance', icon: TrendingUp },
                        { name: 'Settings', path: '/settings', icon: SettingsIcon },
                    ].map((item) => (
                        <button
                            key={item.name}
                            onClick={() => navigate(item.path)}
                            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition flex items-center gap-3 ${item.name === 'Performance'
                                ? 'bg-pastel-lavender text-pastel-primary'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <item.icon size={18} />
                            {item.name}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-6 md:p-10">
                <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Performance Analytics 📈</h1>
                        <p className="text-gray-500 font-medium">Tracking your journey to success</p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('/mock-tests')}
                            className="px-6 py-2.5 bg-pastel-primary text-white rounded-xl font-bold shadow-soft hover:shadow-lg transition-all"
                        >
                            Take New Test
                        </button>
                    </div>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
                    <div className="bg-white p-5 rounded-3xl border border-white shadow-soft hover:shadow-lg transition-all group">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-3 group-hover:scale-110 transition-transform">
                            <Trophy size={20} />
                        </div>
                        <p className="text-xs font-semibold text-gray-400 mb-1">Avg. Accuracy</p>
                        <h3 className="text-2xl font-bold text-gray-800">{stats.avgAccuracy}%</h3>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-white shadow-soft hover:shadow-lg transition-all group">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl w-fit mb-3 group-hover:scale-110 transition-transform">
                            <Target size={20} />
                        </div>
                        <p className="text-xs font-semibold text-gray-400 mb-1">Total Tests</p>
                        <h3 className="text-2xl font-bold text-gray-800">{stats.totalTests}</h3>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-white shadow-soft hover:shadow-lg transition-all group">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mb-3 group-hover:scale-110 transition-transform">
                            <Clock size={20} />
                        </div>
                        <p className="text-xs font-semibold text-gray-400 mb-1">Last Attempted</p>
                        <h3 className="text-2xl font-bold text-gray-800">{stats.totalQuestions}</h3>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-white shadow-soft hover:shadow-lg transition-all group">
                        <div className="p-3 bg-green-50 text-green-600 rounded-2xl w-fit mb-3 group-hover:scale-110 transition-transform">
                            <CheckCircle size={20} />
                        </div>
                        <p className="text-xs font-semibold text-gray-400 mb-1">Last Correct</p>
                        <h3 className="text-2xl font-bold text-gray-800">{stats.totalCorrect}</h3>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-white shadow-soft hover:shadow-lg transition-all group">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl w-fit mb-3 group-hover:scale-110 transition-transform">
                            <BookOpen size={20} />
                        </div>
                        <p className="text-xs font-semibold text-gray-400 mb-1">Focus</p>
                        <h3 className="text-lg font-bold text-gray-800 truncate">{stats.topSubject}</h3>
                    </div>
                </div>

                {/* History Table */}
                <div className="bg-white rounded-[32px] border border-white shadow-soft overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800">Recent Practice History</h2>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search topic..."
                                    className="pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm w-48 focus:ring-2 focus:ring-pastel-primary transition-all outline-none"
                                />
                            </div>
                            <button className="p-2 border border-gray-100 rounded-xl text-gray-500 hover:bg-gray-50 transition">
                                <Filter size={18} />
                            </button>
                        </div>
                    </div>

                    {history.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Topic & Status</th>
                                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date Attempted</th>
                                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Correct / Total</th>
                                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Accuracy</th>
                                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Time</th>
                                        <th className="px-8 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {history.map((test) => (
                                        <tr key={test.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <p className="font-bold text-gray-800 text-sm mb-1">{test.topic}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${test.subject === 'Mathematics' ? 'bg-blue-100 text-blue-600' :
                                                        test.subject === 'Physics' ? 'bg-purple-100 text-purple-600' :
                                                            'bg-orange-100 text-orange-600'
                                                        }`}>
                                                        {test.subject}
                                                    </span>
                                                    {test.accuracy < 50 && (
                                                        <span className="text-[10px] font-bold uppercase py-0.5 px-2 bg-red-100 text-red-600 rounded-full flex items-center gap-1">
                                                            <Target size={10} /> Practice Required
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-sm text-gray-500 font-medium">
                                                {formatDate(test.date)}
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-bold text-gray-800 text-sm bg-gray-100 px-3 py-1 rounded-full">{test.score} / {test.total}</span>
                                                    <span className="text-[10px] text-gray-400 uppercase font-semibold mt-1">Solved</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className={`font-bold text-sm ${test.accuracy >= 80 ? 'text-green-600' :
                                                        test.accuracy >= 50 ? 'text-orange-500' :
                                                            'text-red-500'
                                                        }`}>{test.accuracy}%</span>
                                                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-1000 ${test.accuracy >= 80 ? 'bg-green-500' :
                                                                test.accuracy >= 50 ? 'bg-orange-500' :
                                                                    'bg-red-500'
                                                                }`}
                                                            style={{ width: `${test.accuracy}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-sm text-gray-500 font-medium">
                                                <div className="flex items-center gap-1.5 capitalize">
                                                    <Clock size={14} />
                                                    {formatTime(test.timeTaken)}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="p-2 text-gray-300 hover:text-pastel-primary transition">
                                                    <ChevronRight size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <TrendingUp size={32} className="text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-700 mb-2">No data yet</h3>
                            <p className="text-gray-500 mb-8">Take your first practice test to see your performance analytics here!</p>
                            <button
                                onClick={() => navigate('/mock-tests')}
                                className="px-8 py-3 bg-pastel-primary text-white rounded-2xl font-bold shadow-soft hover:shadow-lg hover:-translate-y-0.5 transition-all outline-none"
                            >
                                Start Practice
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Global UI Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .bg-pastel-bg { background-color: #f8f9ff; }
                .text-pastel-primary { color: #6366f1; }
                .bg-pastel-primary { background-color: #6366f1; }
                .bg-pastel-lavender { background-color: #eeeffe; }
                .shadow-soft { box-shadow: 0 10px 30px -5px rgba(0,0,0,0.03); }
            ` }} />
        </div>
    );
};

export default Performance;
