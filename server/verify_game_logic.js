require('dotenv').config({ path: './server/.env' });
const { generateDiagnosticQuiz } = require('./services/groq');
const syllabus = require('../server/data/syllabus'); // This might need careful pathing

async function verifySyllabusAwareness() {
    console.log("--- VERIFYING 1ST YEAR (STRICT) ---");
    // Pass high timeout to prevent groq Request timeout during test
    const q1 = await generateDiagnosticQuiz('MPC', '1st Year');
    const q1Topics = q1.map(q => q.topic);
    console.log("1st Year Topics:", q1Topics);

    // Check forLeaks
    const secondYearTopicsMap = syllabus['MPC']['2nd Year'];
    const secondYearTopics = [
        ...secondYearTopicsMap['Physics'],
        ...secondYearTopicsMap['Chemistry'],
        ...secondYearTopicsMap['Mathematics']['Maths IA'] || [], // Fixed potential missing keys
        ...secondYearTopicsMap['Mathematics']['Maths IB'] || [],
        ...secondYearTopicsMap['Mathematics']['Maths IIA'] || [],
        ...secondYearTopicsMap['Mathematics']['Maths IIB'] || []
    ];

    const leaks = q1Topics.filter(t => secondYearTopics.includes(t));
    if (leaks.length > 0) {
        console.error("❌ SYLLABUS LEAK DETECTED:", leaks);
    } else {
        console.log("✅ 1ST YEAR SYLLABUS IS CLEAN");
    }

    console.log("\n--- VERIFYING HISTORY EXCLUSION ---");
    const history = [q1Topics[0], q1Topics[1]];
    console.log("Excluding topics:", history);
    const q2 = await generateDiagnosticQuiz('MPC', '1st Year', history);
    const q2Topics = q2.map(q => q.topic);
    console.log("New Topics:", q2Topics);

    const overlap = q2Topics.filter(t => history.includes(t));
    if (overlap.length > 0) {
        console.error("❌ HISTORY EXCLUSION FAILED:", overlap);
    } else {
        console.log("✅ HISTORY EXCLUSION WORKS");
    }
}

verifySyllabusAwareness().catch(err => {
    console.error("Verification Error:", err);
    process.exit(1);
});
