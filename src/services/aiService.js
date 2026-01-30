const { GoogleGenerativeAI } = require('@google/generative-ai');
const AppError = require('../utils/AppError');

// Access API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🆕 ADDED: Strict Word Count Limits (Prevents 5,000 word hallucinations)
const LENGTH_GUIDELINES = {
  'short': 'approx. 800 words',
  'medium': 'approx. 1,500 words',
  'long': 'approx. 2,500 words',
  'deep-dive': 'approx. 4,000 words'
};

// ✂️ ROBUST DELIMITER PARSER
// This function splits the massive text block by our custom headers.
// It is immune to "bad quotes" or "newlines" inside the content.
const parseDelimiterOutput = (text) => {
  const sections = {
    viralHooks: [],
    blogPost: '',
    linkedinPost: '',
    twitterThread: '',
    newsletter: ''
  };

  // Helper to extract text between two markers
  const extractSection = (marker) => {
    const start = text.indexOf(marker);
    if (start === -1) return '';
    
    // Start reading immediately after the marker
    const contentStart = start + marker.length;
    
    // Find the next marker (search starts from contentStart)
    const nextMarkerIndex = text.indexOf('===', contentStart);
    
    if (nextMarkerIndex === -1) {
      // If no next marker, take everything until the end
      return text.substring(contentStart).trim();
    } else {
      // Take everything up to the next marker
      return text.substring(contentStart, nextMarkerIndex).trim();
    }
  };

  // 1. Viral Hooks (Split by newline)
  const rawHooks = extractSection('===VIRAL_HOOKS===');
  sections.viralHooks = rawHooks
    .split('\n')
    .map(h => h.replace(/^\d+\.\s*|- \s*|"\s*/g, '').replace(/"$/, '').trim()) // Clean "1. ", "-", and quotes
    .filter(h => h.length > 5); // Filter empty lines

  // 2. Blog Post (Markdown)
  sections.blogPost = extractSection('===BLOG_POST===');

  // 3. LinkedIn / Facebook
  sections.linkedinPost = extractSection('===LINKEDIN_POST===');

  // 4. Twitter (Keep the --- separator)
  sections.twitterThread = extractSection('===TWITTER_THREAD===');

  // 5. Newsletter
  sections.newsletter = extractSection('===NEWSLETTER===');

  // Safety Check: If blog is empty, something went wrong
  if (!sections.blogPost || sections.blogPost.length < 50) {
    console.error("❌ [Parser] Failed to extract blog post. Raw text length:", text.length);
    // Fallback: If strict parsing fails, just return the whole text as blog so user sees something
    if (text.length > 100) sections.blogPost = text; 
  }

  return sections;
};

/**
 * Accepts EITHER a text string OR a Gemini File URI
 */ 
exports.generateContentBundle = async (input, features) => {
  try {
    const modelName = features.model || 'gemini-2.5-flash';
    
    // ⚡ NOTE: We do NOT use responseMimeType: "application/json" here.
    // We want raw text so we can use our custom robust separators.
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // Default Fallbacks
    const tone = features.options?.tone || 'professional';
    const perspective = features.options?.perspective || 'first';
    
    // 🆕 UPDATED: Map user choice to concrete guidelines
    const userLengthChoice = features.options?.length || 'medium';
    const lengthInstruction = LENGTH_GUIDELINES[userLengthChoice] || 'approx. 1,500 words';

    console.log(`🤖 [AI Service] Generating with ${modelName} | Tone: ${tone} | Length: ${lengthInstruction}`);

    let userContent;

    if (input.startsWith('https://generativelanguage.googleapis.com')) {
        console.log('🎤 [AI Service] Using Audio Mode');
        userContent = [
            { fileData: { mimeType: "audio/mp4", fileUri: input } },
            { text: "Listen to this audio and repurpose it." }
        ];
    } else {
        console.log('📝 [AI Service] Using Text Mode');
        userContent = [
            { text: `TRANSCRIPT:\n${input.substring(0, 50000)}...` }
        ];
    }

    // 2. The Robust "Delimiter" Prompt
    // We kept your exact requirements but changed the Output Format instruction.
    const promptInstructions = `
      You are an elite expert content writer. 
      
      CONTEXT:
      - Video Title: "${features.videoTitle || 'Unknown'}"
      - Video Description: "${features.videoDescription ? features.videoDescription.substring(0, 300) : ''}"
      
      Your goal: Repurpose this video into a high-value content bundle.
      Strictly follow the user's Video Title context.

      CONFIGURATION:
      - Tone: ${tone} (Apply this strictly)
      - Perspective: ${perspective} Person POV
      - Length: ${lengthInstruction} (Do NOT exceed this significantly)
      
      OUTPUT REQUIREMENTS:

      1. VIRAL HOOKS: 
         - Generate 10 clickbait/viral titles.
      
      2. BLOG POST:
         - Write a ${lengthInstruction} blog post in Markdown.
         - Use H1, H2, H3 headers.
         - If ${features.seoOptimization ? 'TRUE' : 'FALSE'} is TRUE: Optimize for high-traffic keywords related to the Title.
         - Style: ${tone}.

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
         - Be precise and short if possible.
         - Personal, "Letter to a friend" style.

      ⚠️ IMPORTANT FORMATTING RULES:
      - Do NOT output JSON.
      - You MUST use the exact headers below to separate sections.
      - Write the content directly under each header.
      
      --- OUTPUT STRUCTURE ---
      
      ===VIRAL_HOOKS===
      (List hooks here, one per line)
      
      ===BLOG_POST===
      (Write the full markdown blog here)
      
      ===LINKEDIN_POST===
      (Write the LinkedIn post here)
      
      ===TWITTER_THREAD===
      (Write tweets here, separated by ---)
      
      ===NEWSLETTER===
      (Write the newsletter here)
    `;

    // 3. Generate
    console.log('⏳ [AI Service] Sending request to Gemini...');
    const result = await model.generateContent([
        { text: promptInstructions },
        ...userContent
    ]);

    const response = await result.response;
    const text = response.text();
    
    console.log(`📥 [AI Service] Received ${text.length} characters.`);

    // 4. Parse with the Robust Parser
    return parseDelimiterOutput(text);

  } catch (err) {
    console.error('❌ [AI Service] Error:', err.message);
    throw new AppError('AI Failed to generate content. Please try again.', 500);
  }
};

// 🆕 ADDED: CHAT / EDIT FUNCTION (The Co-Pilot)
exports.chatWithContent = async (context, userQuery, selectedText) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `
      You are an expert editor.
      
      CONTEXT OF THE VIDEO:
      - Title: "${context.videoTitle}"
      
      USER INSTRUCTION: "${userQuery}"
      
      CONTENT TO EDIT:
      """
      ${selectedText}
      """
      
      YOUR TASK:
      - Rewrite the "CONTENT TO EDIT" based strictly on the "USER INSTRUCTION".
      - Do NOT output conversational filler like "Here is the rewritten text".
      - Output ONLY the new text.
      - Maintain Markdown formatting.
    `;

    const result = await model.generateContent(prompt);
    return (await result.response.text()).trim();

  } catch (err) {
    console.error('❌ [AI Chat] Error:', err.message);
    throw new AppError('Failed to process edit request', 500);
  }
};