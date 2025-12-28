const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const { generateDiagnosticQuiz, generateTopicQuiz, generateLearningPlan, chatWithTutor, generateTopicContent, analyzeQuizResults, generateFullStudyPlan, generateFoundationalPlan } = require('../services/groq');

// POST /api/quiz/generate
router.post('/quiz/generate', async (req, res) => {
    const { stream, year, history } = req.body;
    if (!stream || !year) return res.status(400).json({ error: 'Stream and Year required' });

    const questions = await generateDiagnosticQuiz(stream, year, history);
    if (!questions || questions.length === 0) return res.status(500).json({ error: 'Failed to generate quiz' });
    res.json({ questions });
});

// POST /api/quiz/analyze (New)
router.post('/quiz/analyze', async (req, res) => {
    const { answers } = req.body;
    if (!answers) return res.status(400).json({ error: 'Answers required' });

    const analysis = await analyzeQuizResults(answers);
    if (!analysis) return res.status(500).json({ error: 'Analysis failed' });
    res.json(analysis);
});

// POST /api/quiz/topic (New)
router.post('/quiz/topic', async (req, res) => {
    const { topic, standard } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic required' });

    const questions = await generateTopicQuiz(topic, standard || '2nd');
    res.json({ questions });
});

// POST /api/plan/generate
router.post('/plan/generate', async (req, res) => {
    const { userProfile, quizResults, userId } = req.body;

    if (!userProfile) return res.status(400).json({ error: 'User profile required' });

    try {
        let plan;
        if (userProfile.startType === 'foundation') {
            console.log(`Starting foundational plan generation for ${userProfile.year} (Groq)...`);
            plan = await generateFoundationalPlan(userProfile);
        } else {
            console.log(`Starting personalized plan generation for ${userProfile.year}...`);
            plan = await generateLearningPlan(userProfile, quizResults);
        }

        // Even in recovery mode, we should save and return the structure
        if (supabase && plan) {
            try {
                await supabase.from('learning_plans').insert({
                    user_id: userId || 'anon',
                    selected_year: userProfile.year,
                    syllabus_version: userProfile.board,
                    test_results: quizResults || { type: 'foundation' },
                    generated_plan: plan,
                    created_at: new Date()
                });
            } catch (dbError) {
                console.error("DB Save Failed (Non-fatal):", dbError);
            }
        }

        res.json({ plan });
    } catch (error) {
        console.error("Critical Plan Route Error:", error);
        // Absolute last resort fallback
        res.json({
            plan: {
                student_type: userProfile.year,
                plan_duration: "60 Days",
                monthly_plan: { month_1: { weeks: [] }, month_2: { weeks: [] } },
                status: 'emergency_fallback'
            }
        });
    }
});

// POST /api/plan/finalize (Full 60-Day Plan)
router.post('/plan/finalize', async (req, res) => {
    const { userProfile, quizResults, userId } = req.body;

    if (!userProfile) return res.status(400).json({ error: 'User profile required' });

    try {
        console.log("Finalizing Full 60-Day Plan...");
        const plan = await generateFullStudyPlan(userProfile, quizResults);

        if (supabase && plan) {
            try {
                await supabase.from('learning_plans').insert({
                    user_id: userId || 'anon',
                    selected_year: userProfile.year,
                    syllabus_version: userProfile.board,
                    test_results: quizResults,
                    generated_plan: plan,
                    status: 'COMPLETED',
                    created_at: new Date()
                });
            } catch (dbError) {
                console.error("DB Save Failed:", dbError);
            }
        }
        res.json({ plan });
    } catch (error) {
        console.error("Finalize Plan Error:", error);
        res.status(500).json({ error: "Failed to generate full plan" });
    }
});

// POST /api/plan/foundation (New for No-Idea flow)
router.post('/plan/foundation', async (req, res) => {
    const { userProfile, userId } = req.body;

    if (!userProfile) return res.status(400).json({ error: 'User profile required' });

    try {
        const plan = await generateLearningPlan(userProfile);

        if (!plan) throw new Error("Failed to generate foundation plan");

        // Database Agent: Save to Supabase
        // Database Agent: Save to Supabase
        if (supabase) {
            try {
                await supabase.from('learning_plans').insert({
                    user_id: userId || 'anon',
                    test_results: { type: 'no_knowledge' },
                    generated_plan: plan,
                    created_at: new Date()
                });
            } catch (dbError) {
                console.error("DB Save Failed (Non-fatal):", dbError);
            }
        }

        res.json({ plan });
    } catch (error) {
        console.error("Foundation Plan Route Error:", error);
        res.status(500).json({ error: 'Failed to generate plan' });
    }
});

// POST /api/chat
router.post('/chat', async (req, res) => {
    const { history, message } = req.body;
    const reply = await chatWithTutor(history || [], message);
    res.json({ reply });
});

// POST /api/learn/topic
router.post('/learn/topic', async (req, res) => {
    const { topic, subject, year } = req.body;
    const content = await generateTopicContent(topic, subject || 'General', year || '2nd Year');
    res.json({ content });
});

// POST /api/practice/questions (New - for Practice Tests)
router.post('/practice/questions', async (req, res) => {
    const { topic, subject, count } = req.body;
    console.log(`[PracticeQuiz] Generating questions for: ${subject} - ${topic} (Count: ${count || 10})`);

    if (!topic || !subject) {
        console.error('[PracticeQuiz] Missing topic or subject');
        return res.status(400).json({ error: 'Topic and subject required' });
    }

    try {
        const questions = await generateTopicQuiz(topic, subject, count || 10);
        console.log(`[PracticeQuiz] Successfully generated ${questions?.length || 0} questions.`);
        res.json({ questions: questions || [] });
    } catch (error) {
        console.error('[PracticeQuiz] Generation failed:', error.message);
        res.status(500).json({ error: 'Failed to generate practice questions' });
    }
});

module.exports = router;
