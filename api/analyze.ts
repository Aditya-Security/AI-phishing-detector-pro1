export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).end();

  const { emailContent } = req.body;
  if (!emailContent) return res.status(400).json({ error: "No email content" });

  const apiKey = process.env.VITE_GEMINI_API_KEY;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze this email for phishing. Return ONLY valid JSON with these exact fields: riskScore (number 0-100), verdict (exactly "Safe" or "Suspicious" or "High Risk"), attackType (string), threatIndicators (array of strings), socialEngineeringTechniques (array of strings), technicalAnalysis (string), languageToneAnalysis (string), extractedUrls (array of strings), extractedEmails (array of strings), analystSummary (string), recommendedAction (string), userRecommendations (array of 3-5 strings).

Scoring rules: 0-30 = Safe, 31-69 = Suspicious, 70-100 = High Risk.

Email to analyze:
"""
${emailContent}
"""`
            }]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await geminiRes.json();
    
    if (!geminiRes.ok) {
      console.error("Gemini error:", JSON.stringify(data));
      return res.status(500).json({ error: "Gemini API error", details: data });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: "Empty response from Gemini" });

    const parsed = JSON.parse(text);
    res.status(200).json(parsed);

  } catch (error: any) {
    console.error("Handler error:", error);
    res.status(500).json({ error: error.message });
  }
}
