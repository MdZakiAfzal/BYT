const { GoogleGenerativeAI } = require('@google/generative-ai');
const AppError = require('../utils/AppError');

// Access API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ⚡ THE SECRET SAUCE: Anti-Robot Instructions
const STYLE_GUIDE = `
STYLE INSTRUCTIONS:
- Tone: Human, expert, slightly opinionated.
- NO fluff words: Avoid "unleash", "unlock", "delve", "game-changer", "in this digital landscape".
- Sentences: Short and punchy.
- Formatting: Use standard Markdown (# H1, ## H2, - Bullets).
`;

exports.generateContentBundle = async (transcript, features) => {
  try {
    const modelName = features.model || 'gemini-1.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });
    
    console.log(`🤖 Generating Content Bundle with ${modelName}...`);

    // 1. The Prompt
    // We ask for JSON output so we can separate the blog from the tweets easily.
    const prompt = `
      You are an elite expert content writer. 
      Your task is to repurpose this YouTube transcript into a complete content bundle.

      ${STYLE_GUIDE}

      INPUT CONFIG:
      - Blog Length: ${features.blogLength}
      - SEO Mode: ${features.seoOptimization ? 'ON (Include Meta Description & H1/H2 tags)' : 'OFF'}

      OUTPUT FORMAT (Strict JSON):
      You must return a valid JSON object with these exact keys:
      {
        "blogPost": "The full markdown blog post...",
        "linkedinPost": "A professional, hook-driven LinkedIn post...",
        "twitterThread": "A viral thread (5-7 tweets) separated by '---'...",
        "newsletter": "A personal email summary..."
      }

      TRANSCRIPT:
      ${transcript.substring(0, 30000)}... (Truncated for safety)
    `;

    // 2. Generate
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // 3. Clean & Parse JSON
    // AI sometimes wraps JSON in \`\`\`json ... \`\`\`. We remove that.
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const content = JSON.parse(text);

    return content;

  } catch (err) {
    console.error('❌ AI Generation Error:', err.message);
    throw new AppError('AI Failed to generate content. Please try again.', 500);
  }
};