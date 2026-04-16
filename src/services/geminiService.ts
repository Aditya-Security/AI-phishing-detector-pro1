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
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailContent }),
  });

  if (!response.ok) throw new Error("Analysis failed");

  return response.json();
}
