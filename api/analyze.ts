import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).end();

  const { emailContent } = req.body;
  if (!emailContent) return res.status(400).json({ error: "No email content" });

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Analyze the following email for phishing: """${emailContent}"""`,
    config: {
      systemInstruction: `You are a SOC analyst. Return JSON only.`,
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
      },
    },
  });

  const text = response.text();
  res.status(200).json(JSON.parse(text));
}
