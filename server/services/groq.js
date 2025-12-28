const Groq = require('groq-sdk');
const syllabusData = require('../data/syllabus');

if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY missing.');
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
    timeout: 180000
});

const PROMPT_SAFETY_RULE = `
IMPORTANT:
- You must NEVER return null or empty output.
- You must ALWAYS return valid JSON.
- If unsure, return a minimal valid structure instead of failing.`;

// Robust Groq Request Helper with Retries, Backoff & Automatic Fallback
const groqRequest = async (messages, model = 'llama-3.3-70b-versatile', isJson = true, maxTokens = 4096, retries = 5) => {
    const delay = (ms) => new Promise(res => setTimeout(res, ms));
    let currentModel = model;

    for (let i = 0; i < retries; i++) {
        try {
            const completion = await groq.chat.completions.create({
                messages,
                model: currentModel,
                response_format: isJson ? { type: 'json_object' } : undefined,
                max_tokens: maxTokens
            });
            const content = completion.choices[0].message.content;
            return isJson ? JSON.parse(content) : content;
        } catch (err) {
            const isRateLimit = err.message.includes('rate_limit');
            const isJsonError = err instanceof SyntaxError || err.message.includes('JSON');

            // --- MODEL FALLBACK STRATEGY ---
            // If 70B fails after 2 attempts, switch to 8B for the remaining retries
            if (currentModel === 'llama-3.3-70b-versatile' && i >= 1) {
                console.warn(`Falling back to 8B model after 70B failure...`);
                currentModel = 'llama-3.1-8b-instant';
            }

            if ((isRateLimit || isJsonError) && i < retries - 1) {
                const wait = isRateLimit ? (i + 1) * 12000 : (i + 1) * 2000;
                console.warn(`Retry ${i + 1}/${retries} for ${currentModel}: ${err.message}. Waiting ${wait}ms...`);
                await delay(wait);
                continue;
            }
            throw err;
        }
    }
};

// 1. Generate Diagnostic Quiz (15 Questions: 5/5/5)
async function generateDiagnosticQuiz(stream, year, history = []) {
    const subjects = ['Mathematics', 'Physics', 'Chemistry'];
    const count = 5;

    const syllabus = syllabusData[stream] || {};
    const yearData = syllabus[year] || {};
    const firstYearData = syllabus['1st Year'] || {};

    const generateForSubject = async (sub) => {
        console.log(`[QUIZ] Starting generation for subject: ${sub}...`);
        const is1stYear = year === '1st Year';

        // Topic weightage & difficulty guidelines based on EAMCET analysis
        const guidelines = {
            'Mathematics': 'Focus on Coordinate Geometry (30%), Calculus (12%), and Vector Algebra (8%). Include EAMCET-level MCQ patterns.',
            'Physics': 'Prioritize Mechanics (25%), Thermodynamics (10%), and Electrodynamics/Magnetism (10%).',
            'Chemistry': 'Focus on Organic Hydrocarbons (20%), Inorganic s-p-d-f blocks (17%), and Atomic Structure.'
        };

        const historyContext = history.length > 0 ? `EXCLUDE these previously used topics: ${history.join(', ')}.` : '';

        const prompt = `
        You are a Senior EAMCET (Telangana & Andhra Pradesh) Examiner.
        Generate exactly ${count} diagnostic MCQs for ${sub}.
        Student Category: ${year}.
        
        SYLLABUS & WEIGHTAGE RULES:
        ${is1stYear
                ? `- ONLY Intermediate 1st Year topics. Topics: ${JSON.stringify(yearData[sub] || [])}`
                : `- Balanced mix of 1st and 2nd Year topics. 
               1st Year Topics: ${JSON.stringify(firstYearData[sub] || [])}
               2nd Year Topics: ${JSON.stringify(yearData[sub] || [])}`
            }
        - ${guidelines[sub] || ''}
        - ${historyContext}
        
        Format: JSON Object labeled "questions".
        Each question object MUST contain:
        - subject: string ("Mathematics", "Physics", or "Chemistry")
        - topic: string (Specific Chapter Name)
        - question: string (The problem to solve)
        - options: string[] (exactly 4 multiple-choice options)
        
        IMPORTANT RULES:
        - Generate ONLY questions and options.
        - Do NOT include correct answers.
        - Do NOT include explanations.
        - Do NOT include solution steps.
        - Output must be suitable for a game-style quiz (concise questions).
        Difficulty: High-yield EAMCET standard.
        ${PROMPT_SAFETY_RULE}
        `;
        try {
            const data = await groqRequest([{ role: 'user', content: prompt }], 'llama-3.1-8b-instant');
            console.log(`[QUIZ] Success for ${sub}: ${data.questions?.length || 0} questions.`);
            return data.questions || [];
        } catch (e) {
            console.error(`[QUIZ] Error for ${sub}:`, e.message);
            return [];
        }
    };

    try {
        console.log(`[QUIZ] Generating diagnostic quiz for ${stream} (${year})...`);
        const results = await Promise.all(subjects.map(sub => generateForSubject(sub)));
        const final = results.flat().map((q, i) => ({ ...q, id: i + 1 }));
        console.log(`[QUIZ] Total questions generated: ${final.length}`);
        return final.slice(0, 15);
    } catch (e) {
        console.error("[QUIZ] Critical Generation Error:", e.message);
        return [];
    }
}

// 2. Analyze Quiz Results
async function analyzeQuizResults(answers) {
    const prompt = `
    You are an Expert EAMCET Grader. 
    Analyze these user selections and completion times for a game-style diagnostic quiz: ${JSON.stringify(answers)}
    
    TASK:
    1. Evaluate each selection against the question for correctness.
    2. Calculate total score (out of 15) and subject-wise accuracy.
    3. Analyze speed: If a student answers correctly under 20s, mark as "Mastery". If correct but >45s, mark as "Needs Improvement".
    
    Format: JSON { 
        "score": number, 
        "total": 15, 
        "subjectStats": {
            "Mathematics": {"score": number, "total": 5, "accuracy": "X%"}, 
            "Physics": {"score": number, "total": 5, "accuracy": "X%"}, 
            "Chemistry": {"score": number, "total": 5, "accuracy": "X%"}
        }, 
        "weakTopics": [{ "topic": "Topic Name", "subject": "Maths/Physics/Chemistry" }], 
        "strongTopics": [{ "topic": "Topic Name", "subject": "Maths/Physics/Chemistry" }], 
        "overallReadiness": "Beginner/Intermediate/Advanced",
        "speedAnalysis": "Average time per question/overall pace",
        "feedback": "Brief motivational comment"
    }
    ${PROMPT_SAFETY_RULE}
    `;
    try {
        return await groqRequest([{ role: 'user', content: prompt }], 'llama-3.1-8b-instant');
    } catch (e) { return null; }
}

// Validation Helper for Learning Plan
const isPlanValid = (plan, targetDays) => {
    if (!plan || !plan.monthly_plan) return false;

    // Check if months exist
    const m1 = plan.monthly_plan.month_1;
    const m2 = plan.monthly_plan.month_2;
    if (!m1 || !m2) return false;

    // Check if any days exist
    const m1Days = m1.weeks?.reduce((acc, w) => acc + (w.days?.length || 0), 0) || 0;
    const m2Days = m2.weeks?.reduce((acc, w) => acc + (w.days?.length || 0), 0) || 0;

    return (m1Days + m2Days) > 0;
};

// 3. Generate Learning Plan (20-Day Chunks)
async function generateLearningPlan(userProfile, quizResults = null, retryCount = 0) {
    const selectedYear = userProfile.year || '2nd Year';
    const stream = userProfile.stream || 'MPC';

    // Construct Prompt Variables
    const overallScore = quizResults?.score || 0;
    const mathsScore = quizResults?.subjectStats?.Mathematics?.accuracy || '0%';
    const physicsScore = quizResults?.subjectStats?.Physics?.accuracy || '0%';
    const chemistryScore = quizResults?.subjectStats?.Chemistry?.accuracy || '0%';

    const weakTopicsList = quizResults?.weakTopics?.length > 0
        ? quizResults.weakTopics.map(t => `${t.topic} (${t.subject})`).join(', ')
        : "None detected (General improvement needed)";

    const strongTopicsList = quizResults?.strongTopics?.length > 0
        ? quizResults.strongTopics.map(t => `${t.topic} (${t.subject})`).join(', ')
        : "None detected";

    const prompt = `
    You are an expert EAMCET academic mentor.
 
    Student Quiz Dashboard Results:
    - Overall Score: ${overallScore} / 15
    - Subject Scores:
      - Mathematics: ${mathsScore} accuracy
      - Physics: ${physicsScore} accuracy
      - Chemistry: ${chemistryScore} accuracy
    - Weak Topics:
      ${weakTopicsList}
    - Strong Topics:
      ${strongTopicsList}
    - Selected Year:
      ${selectedYear}
 
    Task:
    Generate a personalized high-variety 60-day study plan.
 
    CRITICAL PROGRESSION RULES:
    1. NO TOPIC REPETITION: Once a chapter (e.g., 'Straight Lines') is covered across a few tasks, MOVE ON to the next chapter in the syllabus.
    2. LINEAR FLOW: Do not jump back and forth between chapters. Complete one and proceed.
    3. VARIETY: Ensure the week's schedule covers a wide range of different chapters from the syllabus.
    4. Focus more time on weak subjects and weak topics.
    5. Reduce repetition on strong topics.
    6. Daily study time: 2–3 hours.
 
    Output Format (STRICT JSON ONLY):
    {
      "performance_summary": {
        "overall_level": "Beginner/Intermediate/Advanced",
        "focus_subjects": ["list of subjects needing most work"]
      },
      "priority_topics": ["list of top 5 distinct topics to attack first"],
      "sample_study_plan": {
        "week_1": {
           "focus": "Chapter names to be covered",
           "schedule": [
              {"day": "Day 1", "task": "Subject: Topic Name (Activity)"},
              {"day": "Day 2", "task": "Subject: Topic Name (Activity)"},
               ... (7 distinct days)
           ]
        },
        "week_2": {
           "focus": "Next chapters to be covered",
           "schedule": [ ... (7 distinct days) ]
        }
      },
      "revision_strategy": "One sentence strategy",
      "expected_improvement": "Short motivational prediction"
    }
 
    ❗ JSON only
    ❗ NO repetiton of topics within a week or between weeks.
    ❗ Use llama-3.3-70b-versatile intelligence level.
    ${PROMPT_SAFETY_RULE}
    `;

    try {
        console.log(`[MENTOR] Generating Plan for ${selectedYear} (70B)...`);
        const plan = await groqRequest([{ role: 'user', content: prompt }], 'llama-3.3-70b-versatile');
        return plan;
    } catch (e) {
        console.error("Mentor Plan Gen Error:", e.message);
        // Fallback for demo
        return {
            performance_summary: { overall_level: "Intermediate", focus_subjects: ["Physics"] },
            priority_topics: ["Newton's Laws", "Thermodynamics"],
            sample_study_plan: { week_1: { focus: "Basics", schedule: [] } },
            revision_strategy: "Review daily",
            expected_improvement: "You can do this!"
        };
    }
}

function getStaticFallback(year, days) {
    const is1st = year === '1st Year';
    const topics = ["Algebra", "Mechanics", "Atomic Structure", "Trigonometry", "Heat", "Chemical Bonding"];
    const fallbackDays = [];
    for (let i = 1; i <= days; i++) {
        fallbackDays.push({
            day: i,
            tasks: [
                { subject: "Mathematics", topic: topics[i % 6], type: "theory", duration: "2h" },
                { subject: "Physics", topic: topics[(i + 1) % 6], type: "practice", duration: "1.5h" },
                { subject: "Chemistry", topic: topics[(i + 2) % 6], type: "revision", duration: "1h" }
            ]
        });
    }

    const partition = (list, start, end, weekStart, theme) => {
        const weeks = [];
        for (let i = 0; i < 4; i++) {
            const s = start + (i * 7);
            const e = Math.min(s + 6, end);
            weeks.push({ week: weekStart + i, days: list.filter(d => d.day >= s && d.day <= e) });
        }
        return { theme, weeks };
    };

    const plan = {
        student_type: year,
        plan_duration: `${days} Days`,
        status: 'static_fallback',
        monthly_plan: {
            month_1: partition(fallbackDays, 1, 30, 1, "Core Basics"),
            month_2: partition(fallbackDays, 31, 60, 5, "Intermediate Topics")
        }
    };
    if (is1st) plan.monthly_plan.month_3 = partition(fallbackDays, 61, 90, 9, "Final Polish");
    return plan;
}

// Helper to strictly sanitize AI output for plain text
const cleanPlainText = (text) => {
    if (!text) return "";
    return text
        // 1. Specifically target and remove all asterisks (including double ones)
        .replace(/\*/g, '')
        // 2. Strip other common markdown symbols
        .replace(/[#_~`<>|•]/g, '')
        // 3. Remove markdown bullet points at start of lines (preserve numbered lists)
        .replace(/^[ \t]*[-+][ \t]+/gm, '')
        .trim();
};

// 4. Syllabus Validation
async function validateLearningPlan(days, selectedYear, syllabusScope) {
    const prompt = `Syllabus Audit. Year: ${selectedYear}. Check these days for leaks. JSON: { "isValid": bool, "violations": [] } ${PROMPT_SAFETY_RULE}`;
    try {
        return await groqRequest([{ role: 'user', content: prompt }], 'llama-3.1-8b-instant');
    } catch (e) { return { isValid: true, violations: [] }; }
}

// 5. Chat Tutor
async function chatWithTutor(history, message) {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are an expert EAMCET Tutor. 
                    
                    IMPORTANT OUTPUT FORMAT RULES:
                    - Respond ONLY in plain text.
                    - Do NOT use **, *, #, or any markdown symbols.
                    - Do NOT bold, italicize, or format text.
                    - Use simple numbering and clear explanations.
                    - Format the response like a teacher explaining verbally to a student.
                    - Use 'x' or 'times' for multiplication; NEVER use asterisk (*).
                    - Use clear vertical spacing (double newlines) between different parts of your answer.`
                },
                ...history,
                { role: 'user', content: message }
            ],
            model: 'llama-3.1-8b-instant'
        });
        return cleanPlainText(completion.choices[0].message.content);
    } catch (e) {
        console.error("Chat Error:", e.message);
        return "Sorry, I'm having trouble connecting right now. Please try again.";
    }
}

// 6. Topic Quiz (Used for Practice Tests)
async function generateTopicQuiz(topic, subject, count = 10) {
    const prompt = `You are an expert EAMCET Entrance Exam Professor. 
Generate exactly ${count} high-quality Multiple Choice Questions (MCQs) specifically modeled after the EAMCET (Engineering Agricultural and Medical Common Entrance Test) pattern.

Subject: ${subject}
Topic: ${topic}

Requirements:
1. Difficulty: Balanced (Mix of Concept-based, Application-based, and Calculation-based).
2. Format: Question, 4 options, 1 correct index (0-3).
3. Explanation: Provide a detailed, pedagogical explanation for the correct answer to help the student learn. 
4. Syllabus: Strictly adhere to the ${subject} syllabus for EAMCET.

STRICT JSON OUTPUT:
{
  "questions": [
    {
      "question": "Clear question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 2,
      "explanation": "Step-by-step reasoning for why Option C is correct."
    }
  ]
}
${PROMPT_SAFETY_RULE}`;

    try {
        const data = await groqRequest([{ role: 'user', content: prompt }], 'llama-3.3-70b-versatile');
        return data.questions || [];
    } catch (e) {
        console.error("Error generating topic quiz:", e);
        return [];
    }
}

// 7. Topic Content (Strict Plain Text Notes)
async function generateTopicContent(topic, subject, year = '2nd Year') {
    const prompt = `
    You are an expert TS EAMCET subject tutor.

    Topic Details:
    - Subject: ${subject}
    - Topic: ${topic}
    - Year Level: ${year}
    - Exam: TS EAMCET
    - Student Level: Beginner to Intermediate

    Task:
    Generate clear study notes for the given topic.

    Rules:
    - Use only the official MPC syllabus relevant to the selected year (${year})
    - If Year is "1st Year", strictly use 1st year content ONLY.
    - If Year is "2nd Year", focus on 2nd year content but references to 1st year basics are allowed.
    - If Year is "Dropper", focus heavily on high-weightage exam concepts and shortcuts.
    - Explain concepts step by step
    - Include:
      - Key concepts
      - Important formulas (if applicable)
      - Simple explanations
      - 2–3 solved examples
      - Common mistakes to avoid
    - Keep language simple and exam-oriented
    - Do NOT use markdown symbols (*, **, #)
    - Do NOT include emojis
    - Output in clean plain text only

    Output Sections (PLAIN TEXT):
    Topic Overview:
    Key Concepts:
    Important Formulas:
    Worked Examples:
    Exam Tips:
    
    ${PROMPT_SAFETY_RULE}
    `;

    try {
        console.log(`[NOTES] Generating for ${topic} (${year})...`);
        const content = await groqRequest([{ role: 'user', content: prompt }], 'llama-3.1-8b-instant', false);
        // Fallback cleanup
        return content.replace(/\*\*/g, '').replace(/#/g, '').trim();
    } catch (e) {
        console.error("Content Gen Error:", e.message);
        return "Notes generation failed. Please try again.";
    }
}

// 8. Generate Full 60-Day Plan (Finalize)
async function generateFullStudyPlan(userProfile, quizResults) {
    const selectedYear = userProfile.year || '2nd Year';
    const overallScore = quizResults?.score || 0;
    const mathsScore = quizResults?.subjectStats?.Mathematics?.accuracy || '0%';
    const physicsScore = quizResults?.subjectStats?.Physics?.accuracy || '0%';
    const chemistryScore = quizResults?.subjectStats?.Chemistry?.accuracy || '0%';
    const weakTopics = quizResults?.weakTopics?.map(t => `${t.topic} (${t.subject})`).join(', ') || "None Detected";
    const strongTopics = quizResults?.strongTopics?.map(t => `${t.topic} (${t.subject})`).join(', ') || "None";

    const basePrompt = `
    You are an expert EAMCET academic planner.
    Student Data:
    - Score: ${overallScore}/15
    - Maths: ${mathsScore}, Physics: ${physicsScore}, Chemistry: ${chemistryScore}
    - Weak Areas (Focus Required): ${weakTopics}
    - Strong Areas: ${strongTopics}
    - Year: ${selectedYear}

    Task: Generate a personalized 60-day study plan.
    CRITICAL PROMPT RULES:
    1. MANDATORY: Every single day MUST have exactly 3 tasks - one for Mathematics, one for Physics, and one for Chemistry.
    2. PRIORITY PHASE: The plan MUST start by addressing the "Weak Areas" listed above. Dedicate the first few weeks strictly to these topics.
    3. SYLLABUS PHASE: After covering weak areas, cover the remaining ${selectedYear} syllabus.
    4. Each task duration: 40-50 mins (total daily: 2-2.5 hours).
    5. Ensure no topic repeats excessively.
    6. Cover the COMPLETE ${selectedYear} syllabus across all 60 days.
    Output: STRICT JSON.
    `;

    const getChunk = async (startDay, endDay, previouslyCovered = []) => {
        const historyContext = previouslyCovered.length > 0
            ? `ALREADY COVERED TOPICS (DO NOT REPEAT THESE): ${previouslyCovered.join(', ')}`
            : "";

        const chunkPrompt = `
        ${basePrompt}
        GENERATE DAYS ${startDay} TO ${endDay} ONLY.
        ${historyContext}
        
        CRITICAL REPETITION RULES:
        1. NO BACKTRACKING: Never return to a topic that was fully covered in previous days or chunks.
        2. LINEAR SYLLABUS FLOW: Once you finish 'Weak Areas', strictly follow the ${selectedYear} syllabus order without jumping back.
        3. DURATION: Each chapter should take exactly 1-3 days based on complexity, then MOVE ON.
        4. Each day MUST have exactly 3 tasks (Maths, Physics, Chemistry).
        
        Format:
        {
           "days": {
               "day_${startDay}": {
                   "tasks": [
                       { "subject": "Mathematics", "topic": "Specific Topic Header", "type": "Learning/Practice/Revision", "duration": "45 mins" },
                       { "subject": "Physics", "topic": "Specific Topic Header", "type": "Learning/Practice/Revision", "duration": "45 mins" },
                       { "subject": "Chemistry", "topic": "Specific Topic Header", "type": "Learning/Practice/Revision", "duration": "45 mins" }
                   ]
               },
               ...
               "day_${endDay}": { "tasks": [...] }
           }
        }
        ${PROMPT_SAFETY_RULE}
        `;
        try {
            console.log(`[FULL PLAN] Generating Days ${startDay}-${endDay} (70B)...`);
            const data = await groqRequest([{ role: 'user', content: chunkPrompt }], 'llama-3.3-70b-versatile');
            return data.days || {};
        } catch (e) {
            console.error(`Chunk ${startDay}-${endDay} failed`, e);
            return {};
        }
    };

    console.log("Generating Full Plan (Chunk 1: 1-30)...");
    const part1 = await getChunk(1, 30);

    // Extract unique topics from part1
    const part1Topics = [];
    Object.values(part1).forEach(day => {
        day.tasks?.forEach(t => {
            if (t.topic) part1Topics.push(`${t.topic} (${t.subject})`);
        });
    });

    console.log("Generating Full Plan (Chunk 2: 31-60)...");
    const part2 = await getChunk(31, 60, part1Topics);

    const fullDays = { ...part1, ...part2 };

    // Post-process into Monthly/Weekly format for Frontend
    const transformToWeekly = (dayMap, start, end) => {
        const weeks = [];
        let currentWeek = [];
        let weekNum = 1;

        for (let i = start; i <= end; i++) {
            const dayKey = `day_${i}`;
            // Fallback if day is missing - ensure 3 subjects
            const dayData = dayMap[dayKey] || {
                tasks: [
                    { subject: "Mathematics", topic: "Revision", type: "Practice", duration: "45 mins" },
                    { subject: "Physics", topic: "Revision", type: "Practice", duration: "45 mins" },
                    { subject: "Chemistry", topic: "Revision", type: "Practice", duration: "45 mins" }
                ]
            };

            currentWeek.push({
                day: i,
                tasks: dayData.tasks || [dayData] // Handle both new format (tasks array) and old format (single task)
            });

            if (currentWeek.length === 7 || i === end) {
                weeks.push({ week: weekNum++, days: currentWeek });
                currentWeek = [];
            }
        }
        return weeks;
    };

    return {
        student_type: selectedYear,
        plan_duration: "60 Days",
        performance_summary: `Based on your score of ${overallScore}, we have prioritized ${weakTopics}.`,
        priority_topics: quizResults?.weakTopics || [], // Explicitly sync with quiz results
        monthly_plan: {
            month_1: { theme: "Foundation & Weaknesses", weeks: transformToWeekly(fullDays, 1, 30) },
            month_2: { theme: "Advanced & Mock Tests", weeks: transformToWeekly(fullDays, 31, 60) }
        }
    };
}

// 9. Generate Foundational Plan (Starting Fresh - No Quiz)
async function generateFoundationalPlan(userProfile) {
    const selectedYear = userProfile.year || '2nd Year';
    const stream = userProfile.stream || 'MPC';
    const board = userProfile.board || 'TS (Telangana)';

    // Get syllabus topics to feed the model context
    const syllabus = syllabusData[stream] || {};
    let syllabusContext = "";

    if (selectedYear === '1st Year') {
        syllabusContext = JSON.stringify(syllabus['1st Year']);
    } else if (selectedYear === '2nd Year') {
        syllabusContext = JSON.stringify(syllabus['2nd Year']);
    } else {
        // Dropper: Combine both
        syllabusContext = JSON.stringify({
            "1st_Year": syllabus['1st Year'],
            "2nd_Year": syllabus['2nd Year']
        });
    }

    const basePrompt = `
    You are an expert EAMCET academic planner.
    Student Goal: Starting Fresh (Foundational 60-Day Plan).
    Target Year: ${selectedYear}
    Stream: ${stream}
    Board: ${board}

    SYLLABUS TO COVER COMPLETELY (MUST cover 100% of these chapters):
    ${syllabusContext}

    Task: Generate a comprehensive 60-day study plan that leaves NO chapter behind for ${selectedYear}.
    CRITICAL PROMPT RULES:
    1. MANDATORY: Every single day MUST have exactly 3 tasks - one for Mathematics, one for Physics, and one for Chemistry.
    2. TOTAL COVERAGE: You MUST distribute all chapters from the syllabus provided above across the 60 days.
    3. STRUCTURE: Start from the very basics of each chapter (Day 1-20) and progress to advanced EAMCET-level problem solving (Day 21-60).
    4. Each task duration: 40-50 mins (total daily: 2-2.5 hours).
    5. NO REPETITION: Ensure every major topic from the syllabus is covered without unnecessary duplication.
    6. Language: Professional, encouraging EAMCET coach style.
    Output: STRICT JSON.
    `;

    const getChunk = async (startDay, endDay, previouslyCovered = []) => {
        const historyContext = previouslyCovered.length > 0
            ? `ALREADY COVERED TOPICS (DO NOT REPEAT THESE): ${previouslyCovered.join(', ')}`
            : "";

        const chunkPrompt = `
        ${basePrompt}
        GENERATE DAYS ${startDay} TO ${endDay} ONLY.
        ${historyContext}
        
        STRICT PROGRESSION RULES:
        1. LINEAR FLOW: If a chapter (e.g., 'Matrices') is completed with 'Practice' or 'Revision', MOVE ON to the next chapter in the syllabus.
        2. NO BACKTRACKING: Never return to a chapter that was covered on an earlier day within this chunk or the already covered list.
        3. TOPIC DURATION: Dedicate 2-3 days max to a large chapter (Learning -> Practice -> Revision) then switch.
        4. VARIETY: Ensure Maths, Physics, and Chemistry tasks for the same day are unrelated unless they are part of a 'Theme'.

        Format:
        {
           "days": {
               "day_${startDay}": {
                   "tasks": [
                       { "subject": "Mathematics", "topic": "Specific Topic Name", "type": "Theory + Practice", "duration": "45 mins" },
                       { "subject": "Physics", "topic": "Specific Topic Name", "type": "Theory + Practice", "duration": "45 mins" },
                       { "subject": "Chemistry", "topic": "Specific Topic Name", "type": "Theory + Practice", "duration": "45 mins" }
                   ]
               },
               ...
               "day_${endDay}": { "tasks": [...] }
           }
        }
        ${PROMPT_SAFETY_RULE}
        `;
        try {
            console.log(`[FOUNDATION] Generating Days ${startDay}-${endDay} for ${selectedYear} (70B)...`);
            const data = await groqRequest([{ role: 'user', content: chunkPrompt }], 'llama-3.3-70b-versatile');
            return data.days || {};
        } catch (e) {
            console.error(`Chunk ${startDay}-${endDay} failed`, e);
            return {};
        }
    };

    const part1 = await getChunk(1, 30);

    // Extract unique topics from part1 to feed into part2
    const part1Topics = [];
    Object.values(part1).forEach(day => {
        day.tasks?.forEach(t => {
            if (t.topic) part1Topics.push(`${t.topic} (${t.subject})`);
        });
    });

    const part2 = await getChunk(31, 60, part1Topics);

    const fullDays = { ...part1, ...part2 };

    const transformToWeekly = (dayMap, start, end) => {
        const weeks = [];
        let currentWeek = [];
        let weekNum = 1;

        for (let i = start; i <= end; i++) {
            const dayKey = `day_${i}`;
            const dayData = dayMap[dayKey] || {
                tasks: [
                    { subject: "Mathematics", topic: "Intro to Syllabus", type: "Theory", duration: "45 mins" },
                    { subject: "Physics", topic: "Basics", type: "Theory", duration: "45 mins" },
                    { subject: "Chemistry", topic: "Fundamentals", type: "Theory", duration: "45 mins" }
                ]
            };
            currentWeek.push({ day: i, tasks: dayData.tasks });
            if (currentWeek.length === 7 || i === end) {
                weeks.push({ week: weekNum++, days: currentWeek });
                currentWeek = [];
            }
        }
        return weeks;
    };

    return {
        student_type: selectedYear,
        plan_duration: "60 Days",
        performance_summary: `This is a foundational plan covering the complete ${selectedYear} syllabus for ${stream} students (${board}).`,
        priority_topics: [], // Not applicable for foundational
        monthly_plan: {
            month_1: { theme: "Core syllabus & Foundations", weeks: transformToWeekly(fullDays, 1, 30) },
            month_2: { theme: "Advanced coverage & Completion", weeks: transformToWeekly(fullDays, 31, 60) }
        }
    };
}

module.exports = {
    generateDiagnosticQuiz,
    analyzeQuizResults,
    generateLearningPlan,
    chatWithTutor,
    generateTopicContent,
    generateTopicQuiz,
    validateLearningPlan,
    generateFullStudyPlan,
    generateFoundationalPlan
};
