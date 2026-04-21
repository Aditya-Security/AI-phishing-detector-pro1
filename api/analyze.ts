export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { emailContent } = await req.json();
    if (!emailContent) {
      return new Response(JSON.stringify({ error: 'No email content' }), { status: 400 });
    }

    const apiKey = process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 });
    }

    const prompt = `You are an advanced SOC analyst. Analyze this email for phishing indicators.

Email Content:
"""
${emailContent}
"""

Return ONLY a JSON object with these exact fields:
- riskScore: number between 0-100
- verdict: exactly one of "Safe", "Suspicious", or "High Risk"
- attackType: string describing attack type or "None" if safe
- threatIndicators: array of strings listing red flags found
- socialEngineeringTechniques: array of strings
- technicalAnalysis: string with technical details
- languageToneAnalysis: string analyzing language and tone
- extractedUrls: array of URLs found in email
- extractedEmails: array of email addresses found
- analystSummary: string with professional SOC summary
- recommendedAction: string with clear action to take
- userRecommendations: array of 3-5 simple steps for regular users

Scoring rules:
- 0-30 = Safe: no suspicious links, no urgency, legitimate tone
- 31-69 = Suspicious: mild red flags, generic greetings, unclear sender
- 70-100 = High Risk: urgent language, requests for passwords/OTPs, spoofed domains

Return ONLY the JSON object, no markdown, no explanation.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error('Gemini API error:', JSON.stringify(data));
      return new Response(JSON.stringify({ error: 'Gemini API error', details: data }), { status: 500 });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return new Response(JSON.stringify({ error: 'Empty response from Gemini' }), { status: 500 });
    }

    const parsed = JSON.parse(text);
    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Handler error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
