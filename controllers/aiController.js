const Groq = require("groq-sdk");
const {
  conceptExplainPrompt,
  questionAnswerPrompt,
} = require("../utils/prompts");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Helper to safely parse AI response (handles markdown fences)
const parseAIResponse = (rawText) => {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  return JSON.parse(cleaned);
};

// ================================
// Generate interview questions
// ================================
const generateInterviewQuestions = async (req, res) => {
  try {
    const {
      role,
      experience,
      topicsToFocus,
      numberOfQuestions = 10,
    } = req.body;

    if (!role || !experience || !topicsToFocus) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const prompt = questionAnswerPrompt(
      role,
      experience,
      topicsToFocus,
      numberOfQuestions,
    );

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are an API. Return ONLY valid JSON. Do not add any extra text.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    });

    const rawText = completion.choices[0].message.content;

    let data;
    try {
      data = parseAIResponse(rawText);
    } catch (parseError) {
      return res.status(500).json({ message: "Invalid AI response format" });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to generate questions" });
  }
};

// ================================
// Generate concept explanation
// ================================
const generateConceptExplanation = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const prompt = conceptExplainPrompt(question);

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are an API. Return ONLY valid JSON. Do not add any extra text.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    });

    const rawText = completion.choices[0].message.content;

    let data;
    try {
      data = parseAIResponse(rawText);
    } catch (parseError) {
      return res.status(500).json({ message: "Invalid AI response format" });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to generate explanation" });
  }
};

module.exports = { generateInterviewQuestions, generateConceptExplanation };
