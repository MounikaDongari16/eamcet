import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Target, ChevronRight, BarChart2, Calendar } from 'lucide-react';

const PracticeTests = () => {
    const navigate = useNavigate();
    const [plan, setPlan] = useState(null);
    const [topics, setTopics] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('All');

    useEffect(() => {
        // Load plan from localStorage
        try {
            const storedPlan = localStorage.getItem('userPlan');
            if (storedPlan) {
                const parsedPlan = JSON.parse(storedPlan);
                setPlan(parsedPlan);
                extractTopics(parsedPlan);
            }
        } catch (error) {
            console.error('Error loading plan:', error);
        }
    }, []);

    const extractTopics = (planData) => {
        const topicSet = new Set();
        const topicList = [];

        // Extract topics from monthly plan
        if (planData?.monthly_plan) {
            Object.values(planData.monthly_plan).forEach(month => {
                month.weeks?.forEach(week => {
                    week.days?.forEach(day => {
                        day.tasks?.forEach(task => {
                            const key = `${task.subject}-${task.topic}`;
                            if (!topicSet.has(key)) {
                                topicSet.add(key);
                                topicList.push({
                                    subject: task.subject,
                                    topic: task.topic,
                                    type: task.type || 'Learning'
                                });
                            }
                        });
                    });
                });
            });
        }

        setTopics(topicList);
    };

    const filteredTopics = selectedSubject === 'All'
        ? topics
        : topics.filter(t => t.subject === selectedSubject);

    const subjectColors = {
        Mathematics: 'bg-blue-50 border-blue-200 text-blue-700',
        Physics: 'bg-purple-50 border-purple-200 text-purple-700',
        Chemistry: 'bg-orange-50 border-orange-200 text-orange-700'
    };

    const handleStartTest = (topic) => {
        // Navigate to practice quiz with the topic
        navigate('/practice-quiz', {
            state: {
                topic: topic.topic,
                subject: topic.subject
            }
        });
    };

    return (
        <div className="min-h-screen bg-pastel-bg flex text-gray-800 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col p-6 fixed h-full z-10">
                <div className="text-2xl font-bold text-pastel-primary mb-10">EAMCET<span className="text-pastel-secondary">AI</span></div>
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
                            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition ${item.name === 'Practice Tests'
                                ? 'bg-pastel-lavender text-pastel-primary'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {item.name}
                        </button>
                    ))}
                </nav>
                <div className="mt-auto bg-pastel-mint/30 p-4 rounded-xl">
                    <h4 className="font-semibold text-pastel-secondary mb-1">EAMCET 2025</h4>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-6 md:p-10">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Practice Tests 📝</h1>
                    <p className="text-gray-500">Practice questions for all topics in your 60-day plan - 10 questions per topic</p>
                </header>

                {/* Subject Filter */}
                <div className="mb-6 flex gap-3 flex-wrap">
                    {['All', 'Mathematics', 'Physics', 'Chemistry'].map(subject => (
                        <button
                            key={subject}
                            onClick={() => setSelectedSubject(subject)}
                            className={`px-4 py-2 rounded-xl font-medium transition ${selectedSubject === subject
                                ? 'bg-pastel-primary text-white shadow-md'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-pastel-primary'
                                }`}
                        >
                            {subject}
                        </button>
                    ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-3">
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                            <BookOpen size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-semibold">Total Topics</p>
                            <p className="text-2xl font-bold text-gray-800">{topics.length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-3">
                        <div className="p-3 bg-green-50 rounded-lg text-green-600">
                            <Target size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-semibold">Tests Available</p>
                            <p className="text-2xl font-bold text-gray-800">{filteredTopics.length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-3">
                        <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-semibold">Avg. Duration</p>
                            <p className="text-2xl font-bold text-gray-800">10 mins</p>
                        </div>
                    </div>
                </div>

                {/* Topics Grid */}
                {filteredTopics.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTopics.map((topic, index) => (
                            <div
                                key={index}
                                className={`p-5 rounded-2xl border-2 ${subjectColors[topic.subject] || 'bg-gray-50 border-gray-200'} hover:shadow-lg transition cursor-pointer group`}
                                onClick={() => handleStartTest(topic)}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                                        {topic.subject}
                                    </span>
                                    <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition" />
                                </div>
                                <h3 className="font-bold text-gray-800 mb-2 line-clamp-2">{topic.topic}</h3>
                                <div className="flex items-center gap-2 text-xs opacity-70">
                                    <Clock size={12} />
                                    <span>10 Questions • 10 mins</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">No Topics Found</h3>
                        <p className="text-gray-500 mb-6">Complete the diagnostic quiz to generate your personalized plan.</p>
                        <button
                            onClick={() => navigate('/diagnostic-quiz')}
                            className="px-6 py-3 bg-pastel-primary text-white rounded-xl font-semibold hover:bg-violet-600 transition"
                        >
                            Take Diagnostic Quiz
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PracticeTests;
