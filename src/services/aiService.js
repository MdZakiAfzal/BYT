const { GoogleGenerativeAI } = require('@google/generative-ai');
const AppError = require('../utils/AppError');

// Access API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const STYLE_GUIDE = `
STYLE INSTRUCTIONS:
- Tone: Human, expert, slightly opinionated.
- NO fluff words: Avoid "unleash", "unlock", "delve", "game-changer".
- Sentences: Short and punchy.
- Formatting: Use standard Markdown (# H1, ## H2, - Bullets).
`;

/**
 * Accepts EITHER a text string OR a Gemini File URI
 */
exports.generateContentBundle = async (input, features) => {
  try {
    // Default to Flash if not specified, but higher tiers might use Pro
    const modelName = features.model || 'gemini-2.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });
    
    console.log(`🤖 Generating Content Bundle with ${modelName}...`);

    let userContent;

    // 1. Check if input is Text or Audio URI
    // Gemini URIs usually look like: https://generativelanguage.googleapis.com/...
    if (input.startsWith('https://generativelanguage.googleapis.com')) {
        console.log('🎤 Using Audio Mode (Multimodal)');
        userContent = [
            { 
              fileData: { 
                mimeType: "audio/mp4", 
                fileUri: input 
              } 
            },
            { text: "Listen to this audio and repurpose it into a content bundle." }
        ];
    } else {
        console.log('📝 Using Text Mode (Transcript)');
        userContent = [
            { text: `TRANSCRIPT:\n${input.substring(0, 30000)}...` }
        ];
    }

    // 2. The System Prompt (Instructions)
    const promptInstructions = `
      You are an elite expert content writer. 
      Your task is to repurpose the provided input (audio or text) into a complete content bundle.

      ${STYLE_GUIDE}

      INPUT CONFIG:
      - Blog Length: ${features.blogLength}
      - SEO Mode: ${features.seoOptimization ? 'ON' : 'OFF'}

      OUTPUT FORMAT (Strict JSON):
      You must return a valid JSON object with these exact keys:
      {
        "blogPost": "The full markdown blog post...",
        "linkedinPost": "A professional, hook-driven LinkedIn post...",
        "twitterThread": "A viral thread (5-7 tweets) separated by '---'...",
        "newsletter": "A personal email summary..."
      }
    `;

    // 3. Generate
    const result = await model.generateContent([
        { text: promptInstructions },
        ...userContent
    ]);

    const response = await result.response;
    let text = response.text();

    // 4. Clean & Parse JSON
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const content = JSON.parse(text);

    return content;

  } catch (err) {
    console.error('❌ AI Generation Error:', err.message);
    throw new AppError('AI Failed to generate content. Please try again.', 500);
  }
};