const getCurrentUser = () => {
    return localStorage.getItem('eamcet_current_user') || 'anonymous_user';
};

export const getAttendanceData = () => {
    const user = getCurrentUser();
    const data = localStorage.getItem(`study_attendance_${user}`);
    return data ? JSON.parse(data) : {};
};

export const saveAttendanceData = (data) => {
    const user = getCurrentUser();
    localStorage.setItem(`study_attendance_${user}`, JSON.stringify(data));
};

export const logStudyActivity = ({ timeSpent = 0, topic = null, subject = null }) => {
    const today = new Date().toISOString().split('T')[0];
    const attendance = getAttendanceData();

    if (!attendance[today]) {
        attendance[today] = {
            date: today,
            total_study_time: 0,
            topics_completed: [],
            activities: []
        };
    }

    const dayRecord = attendance[today];

    if (timeSpent > 0) {
        dayRecord.total_study_time += timeSpent;
        if (topic) {
            dayRecord.activities.push({
                type: 'study',
                topic,
                subject,
                time: timeSpent,
                timestamp: new Date().toISOString()
            });
        }
    }

    if (topic && !dayRecord.topics_completed.includes(topic)) {
        // This is called when a topic is marked as "done"
        dayRecord.topics_completed.push(topic);
    }

    // Auto-calculate status
    // Green -> ≥ 60 mins OR ≥ 1 topic completed
    // Yellow -> 10-59 mins OR active (but not meeting green)
    // Red -> < 10 mins and 0 topics

    if (dayRecord.total_study_time >= 60 || dayRecord.topics_completed.length >= 1) {
        dayRecord.status = 'green';
    } else if (dayRecord.total_study_time >= 10 || dayRecord.activities.length > 0) {
        dayRecord.status = 'yellow';
    } else {
        dayRecord.status = 'red';
    }

    attendance[today] = dayRecord;
    saveAttendanceData(attendance);
};

export const seedDummyData = () => {
    const data = {};
    const today = new Date();

    for (let i = 0; i < 20; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        // Random study status
        const rand = Math.random();
        if (rand > 0.3) {
            const isGreen = rand > 0.6;
            data[dateStr] = {
                date: dateStr,
                total_study_time: isGreen ? 120 : 45,
                topics_completed: isGreen ? ['Differentiation', 'Laws of Motion'] : [],
                status: isGreen ? 'green' : 'yellow',
                activities: isGreen ? [
                    { topic: 'Differentiation', subject: 'Mathematics', time: 75 },
                    { topic: 'Laws of Motion', subject: 'Physics', time: 45 }
                ] : [
                    { topic: 'Atoms', subject: 'Chemistry', time: 45 }
                ]
            };
        } else if (rand > 0.1) {
            data[dateStr] = {
                date: dateStr,
                total_study_time: 0,
                topics_completed: [],
                status: 'red',
                activities: []
            };
        }
    }

    saveAttendanceData(data);
};
