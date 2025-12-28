require('dotenv').config();
const Groq = require('groq-sdk');

async function testGroq() {
    console.log("Testing Groq connectivity...");
    console.log("API Key present:", !!process.env.GROQ_API_KEY);

    const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
    });

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: 'Say hello' }],
            model: 'llama-3.1-8b-instant'
        });
        console.log("Success! Response:", completion.choices[0].message.content);
    } catch (err) {
        console.error("Groq Test Failed:", err.message);
    }
}

testGroq();
