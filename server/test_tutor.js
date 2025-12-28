
require('dotenv').config();
const { chatWithTutor, generateTopicContent } = require('./services/groq');
const fs = require('fs');

async function test() {
    let output = "";
    output += "--- Testing Chat Tutor ---\n";
    const chatRep = await chatWithTutor([], "Can you explain the key concepts of geometry and give me a question on a square with side 5?");
    output += "CHAT REPLY:\n" + chatRep + "\n";

    output += "\n--- Testing Topic Content ---\n";
    const topicRep = await generateTopicContent("Perimeter and Area", "Mathematics");
    output += "TOPIC REPLY:\n" + topicRep + "\n";

    fs.writeFileSync('final_tutor_verification.txt', output);
    console.log("Results written to final_tutor_verification.txt");
}

test();
