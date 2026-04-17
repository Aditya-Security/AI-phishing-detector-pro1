import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).end();

  const { emailContent } = req.body;
  if (!emailContent) return res.status(400).json({ error: "No email content" });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Analyze the following email artifact for phishing indicators and provide a detailed SOC report.
      
      Email Content:
      """
      ${emailContent}
      """`,
      config: {
        systemInstruction: `You are an advanced SOC analyst powering "AI Phishing Detector Pro".
        
        Instructions:
        1. Assign a Phishing Risk Score (0-100).
        2. Provide a Verdict: Safe, Suspicious, or High Risk.
        3. Identify the Attack Type.
        4. Break down: Threat Indicators, Social Engineering Techniques, Technical Analysis, Language & Tone Analysis.
        5. Extract all URLs and email addresses found.
        6. Provide a Final Analyst Summary.
        7. Provide a Recommended Action.
        8. Provide 3-5 User Recommendations for a regular user.
        
        Scoring: 0-30 Safe, 31-69 Suspicious, 70-100 High Risk.
        Return JSON only.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.NUMBER },
            verdict: { type: Type.STRING, enum: ["Safe", "Suspicious", "High Risk"] },
            attackType: { type: Type.STRING },
            threatIndicators: { type: Type.ARRAY, items: { type: Type.STRING } },
            socialEngineeringTechniques: { type: Type.ARRAY, items: { type: Type.STRING } },
            technicalAnalysis: { type: Type.STRING },
            languageToneAnalysis: { type: Type.STRING },
            extractedUrls: { type: Type.ARRAY, items: { type: Type.STRING } },
            extractedEmails: { type: Type.ARRAY, items: { type: Type.STRING } },
            analystSummary: { type: Type.STRING },
            recommendedAction: { type: Type.STRING },
            userRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            "riskScore", "verdict", "attackType", "threatIndicators",
            "socialEngineeringTechniques", "technicalAnalysis", "languageToneAnalysis",
            "extractedUrls", "extractedEmails", "analystSummary",
            "recommendedAction", "userRecommendations"
          ],
        },
      },
    });

    const text = response.text();
    res.status(200).json(JSON.parse(text));
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Analysis failed" });
  }
}
