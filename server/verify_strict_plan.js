require('dotenv').config();
const { generateLearningPlan } = require('./services/groq');

async function verifyStrict1stYearPlan() {
    console.log("Verifying Strict 1st Year Plan Generation...");
    const userProfile = {
        year: '1st Year',
        stream: 'MPC',
        board: 'TS (Telangana)',
        hasKnowledge: 'no'
    };

    try {
        const plan = await generateLearningPlan(userProfile);

        if (!plan) {
            console.error("FAIL: Generation failed.");
            return;
        }

        console.log("Plan Title:", plan.label);
        console.log("Plan Duration:", plan.plan_duration);

        const m1 = plan.monthly_plan.month_1;
        const m2 = plan.monthly_plan.month_2;
        const m3 = plan.monthly_plan.month_3;

        if (!m1 || !m2 || (userProfile.year === '1st Year' && !m3)) {
            console.error("FAIL: Monthly plans missing.");
            console.log("Plan structure exists:", !!plan, "Monthly Plan keys:", Object.keys(plan?.monthly_plan || {}));
            return;
        }

        let found2ndYear = false;
        let foundExamReadiness = false;

        const secondYearClues = [
            "Solid State", "Solutions", "Integration", "Circle", "Wave Optics",
            "Differential Equations", "Current Electricity", "Organic Compounds containing Nitrogen"
        ];

        let totalDays = 0;
        const checkDays = (monthLabel, weeks) => {
            console.log(`Checking ${monthLabel}...`);
            if (!weeks || !Array.isArray(weeks)) {
                console.warn(`WARN: Weeks is not a valid array in ${monthLabel}:`, weeks);
                return;
            }
            weeks.forEach((week, wIdx) => {
                if (!week.days || !Array.isArray(week.days)) {
                    console.warn(`WARN: Days is not a valid array in ${monthLabel} Week ${week.week || wIdx}`);
                    return;
                }
                week.days.forEach(day => {
                    totalDays++;
                    if (!day.tasks || !Array.isArray(day.tasks)) {
                        console.warn(`WARN: Tasks is not a valid array on Day ${day.day}`);
                        return;
                    }
                    day.tasks.forEach(task => {
                        if (secondYearClues.some(clue => task.topic.toLowerCase().includes(clue.toLowerCase()))) {
                            found2ndYear = true;
                            console.log(`[FAIL] 2nd Year Leak detected on Day ${day.day}: "${task.topic}"`);
                        }
                        if (task.type === 'exam_readiness' || task.type === 'revision') {
                            foundExamReadiness = true;
                        }
                    });
                });
            });
        };

        checkDays("Month 1", m1.weeks);
        checkDays("Month 2", m2.weeks);
        if (m3) checkDays("Month 3", m3.weeks);

        console.log(`Total Days Generated: ${totalDays}`);
        const totalDaysTarget = userProfile.year === '1st Year' ? 90 : 60;
        if (totalDays >= totalDaysTarget - 5) {
            console.log(`SUCCESS: Approximately ${totalDaysTarget} days generated.`);
        } else {
            console.error(`FAIL: Only ${totalDays} days generated (Expected ~${totalDaysTarget}).`);
        }

        if (!found2ndYear) {
            console.log("SUCCESS: Zero 2nd Year Leakage detected in 1st Year plan.");
        }

        if (foundExamReadiness) {
            console.log("SUCCESS: Plan contains Exam Readiness / Revision tasks.");
        } else {
            console.warn("NOTE: No Exam Readiness / Revision tasks found. (Maybe syllabus took full 90 days).");
        }

    } catch (err) {
        console.error("Critical test error:", err.message);
        console.error(err.stack);
    }
}

verifyStrict1stYearPlan();
