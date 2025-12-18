const https = require('https');
require('dotenv').config();

const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (!key) {
    console.error("❌ No API KEY found in .env");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

console.log(`📡 Connecting to Google API...`);

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.error(`\n❌ API Error (${res.statusCode}):`);
            console.error(data); // Print the FULL error message
            return;
        }

        const response = JSON.parse(data);
        console.log("\n✅ SUCCESS! Here are the valid models for your key:");
        console.log("------------------------------------------------");
        
        // Filter for "generateContent" models only
        const usefulModels = response.models.filter(m => 
            m.supportedGenerationMethods.includes("generateContent")
        );

        usefulModels.forEach(m => {
            // Clean up the name "models/gemini-pro" -> "gemini-pro"
            const simpleName = m.name.replace('models/', '');
            console.log(`🔹 ${simpleName}`);
        });
        console.log("------------------------------------------------");
        console.log("👉 Please update 'src/config/plans.js' with one of the names above.");
    });

}).on("error", (err) => {
    console.error("Error: " + err.message);
});