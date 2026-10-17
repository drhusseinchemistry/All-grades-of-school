import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generatePowerPointHtml, PresentationData } from './slide-template-engine.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_FILE = path.join(__dirname, 'ai-template.json');

function getAiTemplateConfig() {
  try {
    if (fs.existsSync(TEMPLATE_FILE)) {
      return JSON.parse(fs.readFileSync(TEMPLATE_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to read ai-template.json:', e);
  }
  return {
    version: 1,
    themeName: 'Royal Dark Presentation',
    primaryColor: '#00b4d8',
    accentColor: '#7209b7',
    backgroundColor: '#0a0f1d',
    slideBackground: '#131b2e',
    textColor: '#f8fafc',
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    brandingText: 'ماڵپەرێ فەرمی یێ مامۆستایان - وانە و پوختەیا پاوەرپۆینت',
    systemPromptInstructions: 'تۆ مامۆستایەکی شارەزای پرۆگرامی پەروەردەی هەرێمی کوردستانی. وانەکان بە شێوازی سلایدی پاوەرپۆینتی پێشکەوتوو بە زمانی کوردی بە ڕوونی، خاڵبەندی جوان، پێناسە، یاسا و نموونە ئامادە بکە.'
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize Gemini AI SDK
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', server: 'fullstack-express-vite' });
  });

  // =========================================================================
  // ADMIN TEMPLATE ENDPOINTS
  // =========================================================================
  app.get('/api/admin/template', (req, res) => {
    res.json(getAiTemplateConfig());
  });

  app.post('/api/admin/template', (req, res) => {
    try {
      const newConfig = { ...getAiTemplateConfig(), ...req.body, updatedAt: Date.now() };
      fs.writeFileSync(TEMPLATE_FILE, JSON.stringify(newConfig, null, 2), 'utf-8');
      res.json({ success: true, config: newConfig });
    } catch (e: any) {
      console.error('Error saving template config:', e);
      res.status(500).json({ error: e.message || 'Failed to save template configuration' });
    }
  });

  // =========================================================================
  // GEMINI TEACHER CONTENT GENERATION ENDPOINT
  // =========================================================================
  app.post('/api/gemini/generate-teacher-content', async (req, res) => {
    try {
      const {
        subject = 'کیمیا',
        grade = '12',
        chapter = 'بەشی ١',
        title = '',
        lang = 'ku_ba', // ku_ba, ku_so, ar, en
        questionsCount = 5,
        teacherIdeas = '',
        sourceText = '',
        fileData = '',
        fileType = '',
        teacherName = 'م. حسێن ئەکرەم زێباری'
      } = req.body;

      const templateConfig = getAiTemplateConfig();
      const numQuestions = Math.min(Math.max(Number(questionsCount) || 5, 1), 20);

      const dialectName = lang === 'ku_so' ? 'Kurdish Sorani' : (lang === 'ar' ? 'Arabic' : (lang === 'en' ? 'English' : 'Kurdish Badini (بادینی / بهديني)'));

      const promptParts: any[] = [];

      // If user uploaded an image, provide image inline data
      if (fileData && fileType && fileType.startsWith('image/')) {
        const cleanBase64 = fileData.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '');
        promptParts.push({
          inlineData: {
            mimeType: fileType,
            data: cleanBase64
          }
        });
      }

      // Build comprehensive prompt
      const promptText = `
You are an expert curriculum educator and master presentation designer for Kurdistan schools (KRG Ministry of Education).
Generate educational content for the following context:

- Subject: ${subject}
- Grade: Grade ${grade} (پۆلی ${grade})
- Chapter / Topic: ${chapter || 'بابەتی سەرەکی'}
- Title: ${title || `${subject} - وانە و پوختە`}
- Teacher Name: ${teacherName}
- Target Language: ${dialectName} (Please use authentic educational terminology in ${dialectName})
- Number of Multiple-Choice Questions: ${numQuestions}

${teacherIdeas ? `Teacher's specific ideas & directions: "${teacherIdeas}"` : 'Teacher requests automatic curriculum-aligned presentation and high-yield questions.'}
${sourceText ? `Provided study text / notes / document content:\n"""\n${sourceText}\n"""` : ''}

Admin System Guidelines:
${templateConfig.systemPromptInstructions}

Requirements:
1. Create a 5 to 7 slide PowerPoint-style presentation structure.
   - Slide 1 must be the Title/Intro slide with layout "intro".
   - Following slides must cover: Core definitions, Key laws or scientific principles, Practical examples or formulas, and Key Summary & Review.
   - Each slide must have a clear title, a badge tag (e.g., پێناسە, یاسا, نموونە, گرنگ), a short summary banner, and 3-4 bullet points.
   - If applicable to the subject, include "formulaBox" with mathematical/chemical equation (e.g. C = n/V, F = m*a, etc.).
   - Include a golden tip / key takeaway in "keyTakeaway".
   - Suggest a FontAwesome icon name (e.g. "fa-flask", "fa-atom", "fa-calculator", "fa-dna", "fa-lightbulb", "fa-graduation-cap").

2. Create exactly ${numQuestions} modern interactive multiple-choice questions (پرسیارێن هەڵبژارتن) in ${dialectName}:
   - 4 choices per question (A, B, C, D).
   - "correctIndex" (0, 1, 2, or 3).
   - Detailed "explanation" clarifying why that answer is correct and reinforcing the learning point.
   - "difficulty" level: "ئاسان" | "ناوەند" | "پێشکەوتوو".

Return STRICT JSON complying with the requested schema. No markdown formatting outside of JSON.
`;

      promptParts.push({ text: promptText });

      // Call Gemini 3.8 Flash model
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptParts,
        config: {
          systemInstruction: 'You are an educational AI assistant generating structured Kurdish curriculum PowerPoint slides and multiple choice questions.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              presentationTitle: { type: Type.STRING },
              presentationSubtitle: { type: Type.STRING },
              chapter: { type: Type.STRING },
              slides: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    badge: { type: Type.STRING },
                    layout: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    bullets: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    formulaBox: { type: Type.STRING },
                    keyTakeaway: { type: Type.STRING },
                    icon: { type: Type.STRING }
                  },
                  required: ['id', 'title', 'bullets']
                }
              },
              quizzes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    correctIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                    chapter: { type: Type.STRING },
                    difficulty: { type: Type.STRING }
                  },
                  required: ['question', 'options', 'correctIndex', 'explanation']
                }
              }
            },
            required: ['presentationTitle', 'slides', 'quizzes']
          }
        }
      });

      const rawText = response.text || '{}';
      let parsedData: any = {};
      try {
        parsedData = JSON.parse(rawText);
      } catch (parseErr) {
        console.error('Failed to parse Gemini JSON output:', parseErr, rawText);
        throw new Error('Gemini output could not be parsed as JSON');
      }

      // Compile the PowerPoint-style HTML presentation using Admin template config
      const presentationPayload: PresentationData = {
        presentationTitle: parsedData.presentationTitle || title || `${subject} - وانە و پوختە`,
        presentationSubtitle: parsedData.presentationSubtitle || chapter,
        grade: String(grade),
        subject,
        teacherName,
        chapter: parsedData.chapter || chapter,
        themeConfig: templateConfig,
        slides: parsedData.slides || []
      };

      const fullHtmlPresentation = generatePowerPointHtml(presentationPayload);

      res.json({
        success: true,
        presentationTitle: presentationPayload.presentationTitle,
        presentationSubtitle: presentationPayload.presentationSubtitle,
        chapter: presentationPayload.chapter,
        slides: presentationPayload.slides,
        quizzes: parsedData.quizzes || [],
        htmlContent: fullHtmlPresentation,
        templateConfig
      });
    } catch (err: any) {
      console.error('Error generating teacher content with Gemini:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Error occurred while contacting Gemini API'
      });
    }
  });

  // =========================================================================
  // VITE DEV MIDDLEWARE OR STATIC SERVING
  // =========================================================================
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Server failed to start:', err);
});
