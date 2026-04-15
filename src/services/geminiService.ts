import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface PhishingAnalysis {
  riskScore: number;
  verdict: "Safe" | "Suspicious" | "High Risk";
  attackType: string;
  threatIndicators: string[];
  socialEngineeringTechniques: string[];
  technicalAnalysis: string;
  languageToneAnalysis: string;
  extractedUrls: string[];
  extractedEmails: string[];
  analystSummary: string;
  recommendedAction: string;
  userRecommendations: string[];
}

export async function analyzeEmail(emailContent: string): Promise<PhishingAnalysis> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following email artifact for phishing indicators and provide a detailed SOC report.
    
    Email Content:
    """
    ${emailContent}
    """`,
    config: {
      systemInstruction: `You are an advanced SOC (Security Operations Center) analyst powering "AI Phishing Detector Pro".
      Your job is to deeply analyze emails like a real-world threat analyst.
      
      Instructions:
      1. Assign a Phishing Risk Score (0–100).
      2. Provide a Verdict: Safe, Suspicious, or High Risk.
      3. Identify the "Attack Type": (e.g., "Phishing", "Credential Harvesting", "Spoofing Attempt", "Malware Delivery", "Business Email Compromise", or "None" if safe).
      4. Break down the analysis into structured sections:
         - Threat Indicators: Specific red flags.
         - Social Engineering Techniques: (e.g., urgency, fear, authority impersonation).
         - Technical Analysis: Analyze links, spoofed domains, sender behavior.
         - Language & Tone Analysis: Evaluate grammar, tone, and intent.
      5. Extract and display all URLs and email addresses found.
      6. Provide a Final Analyst Summary: A short professional conclusion like a SOC report.
      7. Provide a Recommended Action: Clear, decisive instruction for a security professional.
      8. Provide a list of 3-5 "User Recommendations": Simple, non-technical, actionable steps for a regular user to stay safe.
      
      Scoring Guidelines (STRICT):
      - 0–30 (Safe): No suspicious links, no urgency, no request for sensitive data, clear legitimate tone.
      - 31–69 (Suspicious): Mild red flags such as generic greetings (e.g., "Dear Customer"), slight pressure, unclear sender identity, indirect mention of account/security without urgency, or links without strong pressure.
      - 70–100 (High Risk): Strong phishing indicators such as urgent/threatening language, direct request for passwords/OTPs/sensitive data, suspicious or mismatched URLs, impersonation of banks/authorities, or fear-based tactics.
      
      Rules:
      - Be precise and analytical in the SOC sections.
      - Be simple and clear in the "User Recommendations" section.
      - Think like a cybersecurity professional, not a chatbot.
      - Do NOT hallucinate technical details—only analyze what is present.
      - CRITICAL: Do NOT overestimate risk. If only 1–2 weak indicators are present, classify as Suspicious (not High Risk). Only classify as High Risk when multiple strong indicators exist.
      
      Return the analysis in JSON format.`,
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
          "riskScore", "verdict", "attackType", "threatIndicators", "socialEngineeringTechniques", 
          "technicalAnalysis", "languageToneAnalysis", "extractedUrls", 
          "extractedEmails", "analystSummary", "recommendedAction", "userRecommendations"
        ],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Failed to get analysis from AI.");
  }

  return JSON.parse(text) as PhishingAnalysis;
}
