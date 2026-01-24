/*const { GoogleGenerativeAI } = require('@google/generative-ai');
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

const cleanAndParseJSON = (text) => {
  try {
    // 1. First try: Direct parse
    return JSON.parse(text);
  } catch (e) {
    // 2. Second try: Extract everything between the first '{' and last '}'
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in AI response');
    }
    
    // 3. Clean common markdown syntax
    let cleanText = jsonMatch[0]
      .replace(/```json/g, '')
      .replace(/```/g, '');

    // 4. Try parsing again
    try {
      return JSON.parse(cleanText);
    } catch (finalErr) {
        console.error("Failed JSON Text:", cleanText);
        throw new Error('JSON Parsing failed even after cleanup.');
    }
  }
};

/**
 * Accepts EITHER a text string OR a Gemini File URI
 */ /*
exports.generateContentBundle = async (input, features) => {
  try {
    // Default to Flash if not specified, but higher tiers might use Pro
    const modelName = features.model || 'gemini-2.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });
    
    console.log(`🤖 Generating Content Bundle with ${modelName} | Tone: ${features.options.tone}`);

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
            { text: `TRANSCRIPT:\n${input.substring(0, 50000)}...` }
        ];
    }

    // 2. The System Prompt (Instructions)
    const promptInstructions = `
      You are an elite expert content writer. 
      
      CONTEXT:
      - Video Title: "${features.videoTitle}"
      - Video Description: "${features.videoDescription ? features.videoDescription.substring(0, 300) : ''}"
      
      Your goal: Repurpose this video into a high-value content bundle.
      Strictly follow the user's Video Title context to avoid hallucinating unrelated topics.

      CONFIGURATION:
      - Tone: ${features.options.tone} (Apply this strictly)
      - Perspective: ${features.options.perspective} Person POV
      - Length: ${features.options.length}
      
      OUTPUT REQUIREMENTS:
      
      1. VIRAL HOOKS: Generate 10 clickbait/viral titles.
      
      2. BLOG POST:
         - Write a ${features.options.length} blog post in Markdown.
         - Use H1, H2, H3 headers.
         - If ${features.seoOptimization} is TRUE: Optimize for high-traffic keywords related to the Title.
         - Style: ${features.options.tone}.
      
      3. LINKEDIN & FACEBOOK POST:
         - A single long-form, storytelling post suitable for both platforms.
         - Use standard spacing (no massive gaps).
         - Focus on value and professional insights.
      
      4. TWITTER THREAD:
         - 5-8 Tweets.
         - Separate each tweet with "---" (triple dash).
         - First tweet must be a hook. Last tweet must be a CTA.
      
      5. NEWSLETTER:
         - Subject line included.
         - Personal, "Letter to a friend" style.

      OUTPUT FORMAT (Strict JSON):
      {
        "viralHooks": ["Title 1", "Title 2", ...],
        "blogPost": "# Title...",
        "linkedinPost": "Text...",
        "twitterThread": "Tweet 1 --- Tweet 2...",
        "newsletter": "Subject: ... \n\n Hi there, ..."
      }
    `;

    // 3. Generate
    const result = await model.generateContent([
        { text: promptInstructions },
        ...userContent
    ]);

    const response = await result.response;
    let text = response.text();

    return cleanAndParseJSON(text);

  } catch (err) {
    console.error('❌ AI Generation Error:', err.message);
    throw new AppError('AI Failed to generate content. Please try again.', 500);
  }
};




const { GoogleGenerativeAI } = require('@google/generative-ai');
const AppError = require('../utils/AppError');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🛠️ ROBUST JSON CLEANER (Fixes the newline bug)
const cleanAndParseJSON = (text) => {
  try {
    // 1. First try: Direct parse (Best case)
    return JSON.parse(text);
  } catch (e) {
    // 2. Extract JSON object (find first '{' and last '}')
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object found in response');
    
    let cleanText = match[0];

    // 3. REMOVE MARKDOWN (```json ... ```)
    cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '');

    // 4. FIX BAD NEWLINES (The Magic Fix 🪄)
    // This Regex looks for newlines that are NOT properly escaped inside quotes
    // It's complex, so we use a simpler strategy: 
    // "If parsing fails, replace all actual newlines with space or \n literal"
    
    // Strategy: Sanitize control characters that break JSON
    cleanText = cleanText.replace(/[\x00-\x1F\x7F-\x9F]/g, (char) => {
      // Allow valid JSON control chars if they are escaped, but here we are dealing with raw text
      // We essentially want to crush real newlines into escaped newlines
      if (char === '\n') return '\\n';
      if (char === '\r') return '';
      if (char === '\t') return '\\t';
      return '';
    });

    try {
      return JSON.parse(cleanText);
    } catch (finalErr) {
        // Final Hail Mary: Attempt to just grab the raw fields using Regex if JSON fails
        // (Useful as a fallback for really broken JSON)
        console.warn("JSON Parse failed, attempting Regex fallback...");
        return fallbackRegexExtraction(text);
    }
  }
};

// 🛡️ Fallback: If JSON is totally broken, extract fields manually
const fallbackRegexExtraction = (text) => {
  const extract = (key) => {
    const regex = new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`, 'i'); // Simple capture
    // Note: This is weak for multiline strings, but better than crashing
    const match = text.match(new RegExp(`"${key}"\\s*:\\s*"(.*?)"`, 's')); 
    return match ? match[1] : `(Failed to generate ${key})`;
  };

  return {
    viralHooks: ["Check the generated content for hooks"], // Hard to regex arrays reliably
    blogPost: extract('blogPost'),
    linkedinPost: extract('linkedinPost'),
    twitterThread: extract('twitterThread'),
    newsletter: extract('newsletter')
  };
};

exports.generateContentBundle = async (input, config) => {
  try {
    const modelName = config.model || 'gemini-2.5-flash';
    const model = genAI.getGenerativeModel({ 
        model: modelName,
        // 🆕 Force JSON mode if available (Gemini 2.5 supports this better)
        generationConfig: { responseMimeType: "application/json" } 
    });
    
    // ... (Keep your existing Prompt and Logic the same) ...
    // Fallback defaults if options are missing
    const tone = config.options?.tone || 'professional';
    const perspective = config.options?.perspective || 'first';
    const length = config.options?.length || 'medium';
    
    console.log(`🤖 Generating with ${modelName} | Tone: ${tone}`);

    // 1. Prepare Input
    let userContent;
    if (input.startsWith('https://generativelanguage.googleapis.com')) {
        userContent = [
            { fileData: { mimeType: "audio/mp4", fileUri: input } },
            { text: "Listen to this audio and repurpose it." }
        ];
    } else {
        userContent = [{ text: `TRANSCRIPT:\n${input.substring(0, 50000)}...` }];
    }

    // 2. The Prompt (Keep your existing prompt)
    const promptInstructions = `
      You are an elite expert content writer. 
      CONTEXT: Video Title: "${config.videoTitle || 'Unknown'}"
      CONFIGURATION: Tone: ${tone}, Perspective: ${perspective}, Length: ${length}
      
      OUTPUT REQUIREMENTS (Strict JSON):
      1. viralHooks (Array of strings)
      2. blogPost (Markdown string)
      3. linkedinPost (String)
      4. twitterThread (String, separate tweets with '---')
      5. newsletter (String)

      IMPORTANT: 
      - Return ONLY raw JSON. 
      - Do NOT use actual line breaks inside the string values. Use \\n for newlines.
      - Escape all double quotes inside strings with \\".
    `;

    // 3. Generate
    const result = await model.generateContent([
        { text: promptInstructions },
        ...userContent
    ]);

    const response = await result.response;
    const text = response.text();

    // 4. Use the Robust Parser
    return cleanAndParseJSON(text);

  } catch (err) {
    console.error('❌ AI Generation Error:', err.message);
    throw new AppError('AI Failed to generate content. Please try again.', 500);
  }
};

*/

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

// 🛡️ Fallback: If JSON is totally broken, extract fields manually
const fallbackRegexExtraction = (text) => {
  const extract = (key) => {
    // Regex to find "key": "value" patterns, handling newlines loosely
    const match = text.match(new RegExp(`"${key}"\\s*:\\s*"(.*?)"`, 's')); 
    return match ? match[1] : `(Failed to generate ${key})`;
  };

  return {
    viralHooks: ["Check generated content"], // Arrays are hard to regex, skip for safety
    blogPost: extract('blogPost'),
    linkedinPost: extract('linkedinPost'),
    twitterThread: extract('twitterThread'),
    newsletter: extract('newsletter')
  };
};

const cleanAndParseJSON = (text) => {
  try {
    // 1. First try: Direct parse
    return JSON.parse(text);
  } catch (e) {
    // 2. Second try: Extract everything between the first '{' and last '}'
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in AI response');
    }
    
    let cleanText = jsonMatch[0];

    // 3. Clean common markdown syntax
    cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '');

    // 4. FIX BAD NEWLINES (The Magic Fix 🪄)
    // This replaces actual line breaks (which break JSON) with escaped \n
    cleanText = cleanText.replace(/[\x00-\x1F\x7F-\x9F]/g, (char) => {
      if (char === '\n') return '\\n';
      if (char === '\r') return '';
      if (char === '\t') return '\\t';
      return '';
    });

    // 5. Try parsing again
    try {
      return JSON.parse(cleanText);
    } catch (finalErr) {
        console.warn("JSON Parse failed, attempting Regex fallback...");
        return fallbackRegexExtraction(text);
    }
  }
};

/**
 * Accepts EITHER a text string OR a Gemini File URI
 */ 
exports.generateContentBundle = async (input, features) => {
  try {
    // Default to Flash if not specified, but higher tiers might use Pro
    const modelName = features.model || 'gemini-2.5-flash';
    
    // ⚡ FIX: Force JSON mode configuration
    const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { responseMimeType: "application/json" }
    });
    
    console.log(`🤖 Generating Content Bundle with ${modelName} | Tone: ${features.options.tone}`);

    let userContent;

    // 1. Check if input is Text or Audio URI
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
            { text: `TRANSCRIPT:\n${input.substring(0, 50000)}...` }
        ];
    }

    // 2. The System Prompt (Instructions)
    const promptInstructions = `
      You are an elite expert content writer. 
      
      CONTEXT:
      - Video Title: "${features.videoTitle || 'Unknown'}"
      - Video Description: "${features.videoDescription ? features.videoDescription.substring(0, 300) : ''}"
      
      Your goal: Repurpose this video into a high-value content bundle.
      Strictly follow the user's Video Title context to avoid hallucinating unrelated topics.

      CONFIGURATION:
      - Tone: ${features.options.tone} (Apply this strictly)
      - Perspective: ${features.options.perspective} Person POV
      - Length: ${features.options.length}
      
      OUTPUT REQUIREMENTS:
      
      1. VIRAL HOOKS: Generate 10 clickbait/viral titles.
      
      2. BLOG POST:
         - Write a ${features.options.length} blog post in Markdown.
         - Use H1, H2, H3 headers.
         - If ${features.seoOptimization} is TRUE: Optimize for high-traffic keywords related to the Title.
         - Style: ${features.options.tone}.
      
      3. LINKEDIN & FACEBOOK POST:
         - A single short and precise, storytelling post suitable for both platforms.
         - Use standard spacing (no massive gaps).
         - Focus on value and professional insights.
      
      4. TWITTER THREAD:
         - 5-8 Tweets.
         - Separate each tweet with "---" (triple dash).
         - First tweet must be a hook. Last tweet must be a CTA.
      
      5. NEWSLETTER:
         - Subject line included.
         - Be precise and short if possible
         - Personal, "Letter to a friend" style.

      OUTPUT FORMAT (Strict JSON):
      IMPORTANT: Return ONLY raw JSON. Do NOT use actual line breaks inside the string values. Use \\n for newlines.
      {
        "viralHooks": ["Title 1", "Title 2", ...],
        "blogPost": "# Title...",
        "linkedinPost": "Text...",
        "twitterThread": "Tweet 1 --- Tweet 2...",
        "newsletter": "Subject: ... \n\n Hi there, ..."
      }
    `;

    // 3. Generate
    const result = await model.generateContent([
        { text: promptInstructions },
        ...userContent
    ]);

    const response = await result.response;
    let text = response.text();

    return cleanAndParseJSON(text);

  } catch (err) {
    console.error('❌ AI Generation Error:', err.message);
    throw new AppError('AI Failed to generate content. Please try again.', 500);
  }
};