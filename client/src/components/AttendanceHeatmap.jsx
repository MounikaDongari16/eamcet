import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Book, Info, X, Calendar as CalendarIcon, Target } from 'lucide-react';
import { getAttendanceData } from '../utils/attendance';

const AttendanceHeatmap = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [attendance, setAttendance] = useState({});
    const [selectedDate, setSelectedDate] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        setAttendance(getAttendanceData());
    }, []);

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const getMonthData = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const totalDays = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);

        const days = [];
        // Fill empty slots for previous month
        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }

        for (let i = 1; i <= totalDays; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({
                day: i,
                date: dateStr,
                data: attendance[dateStr] || null
            });
        }

        return days;
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        if (next <= new Date()) {
            setCurrentDate(next);
        }
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'green': return 'bg-emerald-500 shadow-emerald-100 hover:bg-emerald-600';
            case 'yellow': return 'bg-amber-400 shadow-amber-100 hover:bg-amber-500';
            case 'red': return 'bg-red-400 shadow-red-100 hover:bg-red-500';
            default: return 'bg-gray-100 hover:bg-gray-200';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'green': return 'Studied (Goal Met)';
            case 'yellow': return 'Partial Study';
            case 'red': return 'Absent';
            default: return 'No Activity';
        }
    };

    const openDetails = (dayData) => {
        if (dayData && dayData.data) {
            setSelectedDate(dayData);
            setShowModal(true);
        }
    };

    const formatTime = (minutes) => {
        if (!minutes) return '0m';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    return (
        <div className="bg-white rounded-3xl p-8 border border-white shadow-soft animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <CalendarIcon size={22} className="text-pastel-primary" />
                        Study Attendance
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Consistency is the key to EAMCET success.</p>
                </div>

                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                    <button
                        onClick={handlePrevMonth}
                        className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="font-bold text-gray-700 min-w-[140px] text-center">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <button
                        onClick={handleNextMonth}
                        disabled={currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear()}
                        className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Heatmap Grid */}
            <div className="grid grid-cols-7 gap-3 mb-10">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                        {day}
                    </div>
                ))}

                {getMonthData().map((item, idx) => (
                    <div key={idx} className="aspect-square relative group">
                        {item ? (
                            <button
                                onClick={() => openDetails(item)}
                                className={`w-full h-full rounded-lg transition-all transform hover:scale-110 shadow-sm border-2 border-white ${getStatusColor(item.data?.status)}`}
                            >
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xl">
                                    {item.day} {monthNames[currentDate.getMonth()]}: {getStatusText(item.data?.status)}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                                </div>
                            </button>
                        ) : (
                            <div className="w-full h-full rounded-lg bg-transparent"></div>
                        )}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 border-t border-gray-50">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-emerald-500"></div>
                    <span className="text-xs font-semibold text-gray-500">Studied (Goal)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-amber-400"></div>
                    <span className="text-xs font-semibold text-gray-500">Partial</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-400"></div>
                    <span className="text-xs font-semibold text-gray-500">Absent</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-100"></div>
                    <span className="text-xs font-semibold text-gray-500">No Activity</span>
                </div>
            </div>

            {/* Detail Modal */}
            {showModal && selectedDate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden relative border border-white">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={24} className="text-gray-400" />
                        </button>

                        <div className="p-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className={`p-4 rounded-3xl ${getStatusColor(selectedDate.data?.status)} text-white shadow-lg`}>
                                    <CalendarIcon size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-800">
                                        {selectedDate.day} {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                                    </h3>
                                    <p className={`font-bold uppercase tracking-widest text-xs mt-1 
                                        ${selectedDate.data?.status === 'green' ? 'text-emerald-500' :
                                            selectedDate.data?.status === 'yellow' ? 'text-amber-500' : 'text-red-500'}`}>
                                        Status: {getStatusText(selectedDate.data?.status)}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                                        <Clock size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Total Time</span>
                                    </div>
                                    <p className="text-2xl font-black text-gray-800">{formatTime(selectedDate.data?.total_study_time)}</p>
                                </div>
                                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                                        <Target size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Topics Done</span>
                                    </div>
                                    <p className="text-2xl font-black text-gray-800">{selectedDate.data?.topics_completed?.length || 0}</p>
                                </div>
                            </div>

                            {selectedDate.data?.activities?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Book size={16} /> Detailed Log
                                    </h4>
                                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                        {selectedDate.data.activities.map((act, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 bg-pastel-primary rounded-full"></div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-700">{act.topic}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{act.subject}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold bg-pastel-lavender/40 text-pastel-primary px-3 py-1 rounded-lg">
                                                    {formatTime(act.time)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(!selectedDate.data || selectedDate.data.activities?.length === 0) && (
                                <div className="text-center py-10 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                    <Info className="mx-auto text-gray-300 mb-2" size={32} />
                                    <p className="text-gray-400 font-medium">No detailed study logs for this day.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceHeatmap;
