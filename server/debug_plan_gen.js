require('dotenv').config();
const { generateLearningPlan } = require('./services/groq');

async function debug() {
    const userProfile = { year: '1st Year', stream: 'MPC', board: 'TS (Telangana)' };
    const quizResults = {
        score: 10,
        total: 15,
        subjectStats: {
            Mathematics: { accuracy: '80%' },
            Physics: { accuracy: '60%' },
            Chemistry: { accuracy: '60%' }
        },
        weakTopics: ['Calculus', 'Organic Chemistry'],
        strongTopics: ['Algebra', 'Mechanics'],
        overallReadiness: 'Good'
    };

    console.log("Starting debug plan generation...");
    try {
        const plan = await generateLearningPlan(userProfile, quizResults);
        console.log("Generated Plan Status:", plan.status || 'Success');
        console.log("Plan Duration:", plan.plan_duration);
        console.log("Month 1 Weeks:", plan.monthly_plan.month_1.weeks.length);
        if (plan.monthly_plan.month_1.weeks.length > 0) {
            console.log("Day 1 Tasks:", JSON.stringify(plan.monthly_plan.month_1.weeks[0].days[0], null, 2));
        } else {
            console.log("CRITICAL: Month 1 is empty!");
        }
    } catch (err) {
        console.error("Debug failed:", err);
    }
}

debug();
