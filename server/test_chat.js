const fetch = require('node-fetch'); // You might need to install this or use built-in fetch if node 18+

async function testChat() {
    try {
        const response = await fetch('http://localhost:5001/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                history: [],
                message: "Hello, can you help me with EAMCET Physics?"
            })
        });

        const data = await response.json();
        console.log("Chat Response:", data);
    } catch (error) {
        console.error("Chat Test Failed:", error);
    }
}

testChat();
