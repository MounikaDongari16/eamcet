const fetch = require('node-fetch');

async function testTopic() {
    console.log("Testing Topic Generation...");
    try {
        const response = await fetch('http://localhost:5001/api/learn/topic', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic: "Introduction to Numbers",
                subject: "Maths"
            })
        });

        const data = await response.json();
        console.log("Topic Content:", data);
    } catch (error) {
        console.error("Topic Test Failed:", error);
    }
}

testTopic();
