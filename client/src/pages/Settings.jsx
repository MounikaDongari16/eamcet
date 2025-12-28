import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings as SettingsIcon, RotateCcw, Shield, Bell, User, ChevronRight, AlertTriangle } from 'lucide-react';
import { resetUserState, getUserState } from '../utils/userState';
import AttendanceHeatmap from '../components/AttendanceHeatmap';

const Settings = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userState, setUserState] = useState(null);
    const [activeTab, setActiveTab] = useState(location.state?.tab || 'profile');

    useEffect(() => {
        setUserState(getUserState());
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
        }
    }, [location.state]);

    const handleReset = () => {
        if (window.confirm("⚠️ ATTENTION: This will permanently delete your current Study Plan, Learning Progress, and Diagnostic results. You will be redirected to the start. Proceed?")) {
            resetUserState();
            window.location.href = '/onboarding';
        }
    };

    return (
        <div className="min-h-screen bg-pastel-bg flex font-sans text-gray-800">
            {/* Sidebar Placeholder */}
            <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col p-6 fixed h-full z-10">
                <div className="text-2xl font-bold text-pastel-primary mb-10">EAMCET<span className="text-pastel-secondary">AI</span></div>
                <nav className="space-y-2">
                    {[
                        { name: 'Dashboard', path: '/dashboard', icon: Shield },
                        { name: 'My Plan', path: '/my-plan', icon: User },
                        { name: 'Practice Tests', path: '/mock-tests', icon: User },
                        { name: 'Performance', path: '/performance', icon: User },
                        { name: 'Settings', path: '/settings', icon: SettingsIcon }
                    ].map((item) => (
                        <button
                            key={item.name}
                            onClick={() => navigate(item.path)}
                            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition ${item.name === 'Settings' ? 'bg-pastel-lavender text-pastel-primary' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            {item.name}
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 md:ml-64 p-6 md:p-10">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <SettingsIcon className="text-pastel-primary" size={32} />
                        Account Settings
                    </h1>
                    <p className="text-gray-500 mt-1">Manage your study cycle and platform preferences.</p>
                </header>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 bg-white p-2 rounded-2xl border border-gray-100 w-fit">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'profile' ? 'bg-pastel-primary text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                        Your Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'attendance' ? 'bg-pastel-primary text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                        Attendance
                    </button>
                </div>

                <div className="max-w-4xl space-y-6">
                    {activeTab === 'profile' ? (
                        <>
                            {/* User Info Section */}
                            <div className="bg-white rounded-3xl p-8 border border-white shadow-soft">
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <User size={20} className="text-blue-500" /> Current Profile
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-gray-50 rounded-2xl">
                                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Year</p>
                                        <p className="font-semibold text-gray-700">{userState?.selected_year || 'Not Set'}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl">
                                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Stream</p>
                                        <p className="font-semibold text-gray-700">{userState?.selected_stream || 'Not Set'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="bg-white rounded-3xl p-8 border-2 border-red-50 shadow-soft">
                                <h2 className="text-xl font-bold text-red-600 mb-6 flex items-center gap-2">
                                    <AlertTriangle size={20} /> Danger Zone
                                </h2>
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                    <div>
                                        <h4 className="font-bold text-gray-800">Reset Study Cycle</h4>
                                        <p className="text-sm text-gray-500 mt-1">Clears your Study Plan and resets the Diagnostic Quiz. Use this at the start of a new preparation phase.</p>
                                    </div>
                                    <button
                                        onClick={handleReset}
                                        className="px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-600 hover:text-white transition flex items-center gap-2 whitespace-nowrap"
                                    >
                                        <RotateCcw size={18} />
                                        Reset & Retake
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <AttendanceHeatmap />
                    )}
                </div>
            </main>
        </div>
    );
};

export default Settings;
