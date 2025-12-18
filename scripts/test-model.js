require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("❌ No API Key found in .env");
    return;
  }
  
  console.log(`🔑 Testing Key: ${key.substring(0, 10)}...`);

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy init

    // Note: The SDK doesn't have a direct 'listModels' helper exposed easily in all versions, 
    // so we will try to run a generation on the most basic model to see if it works.
    
    console.log("---------------");
    console.log("⚡ Trying 'gemini-1.5-flash'...");
    try {
        const m1 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        await m1.generateContent("Hello");
        console.log("✅ gemini-1.5-flash IS WORKING!");
    } catch (e) { console.log("❌ gemini-1.5-flash Failed:", e.message.split('[')[0]); }

    console.log("---------------");
    console.log("⚡ Trying 'gemini-pro'...");
    try {
        const m2 = genAI.getGenerativeModel({ model: "gemini-pro" });
        await m2.generateContent("Hello");
        console.log("✅ gemini-pro IS WORKING!");
    } catch (e) { console.log("❌ gemini-pro Failed:", e.message.split('[')[0]); }
    
    console.log("---------------");

  } catch (error) {
    console.error("💥 Critical Error:", error.message);
  }
}

listModels();