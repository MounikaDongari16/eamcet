
const cleanPlainText = (text) => {
    if (!text) return "";
    return text
        // 1. Strip common markdown symbols including bold markers, italics, headings, backticks, etc.
        .replace(/[#*_~`<>|•]/g, '')
        // 2. Remove markdown bullet points at start of lines (preserve numbered lists)
        .replace(/^[ \t]*[-+*][ \t]+/gm, '')
        // 3. Specifically strip any remaining double asterisks that might have survived
        .replace(/\*\*/g, '')
        .trim();
};

const input = "**Linear Equations**\n\nA linear equation in one variable is of the form ax + b = 0, where 'a' and 'b' are constants, and 'a' is not equal to zero.\n\nExample: 2x + 3 = 0";

console.log("INPUT:");
console.log(input);
console.log("\nOUTPUT:");
const output = cleanPlainText(input);
console.log(output);

if (output.includes('*')) {
    console.log("\nFAILED: Output still contains asterisks!");
} else {
    console.log("\nSUCCESS: No asterisks found.");
}
