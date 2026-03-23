import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in the environment.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function generateContentWithRetry(
  params: GenerateContentParameters,
  maxRetries = 3,
  initialDelay = 1000
): Promise<GenerateContentResponse> {
  const ai = getGeminiClient();
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      lastError = error;
      
      // Check for 429 (Rate Limit) or 503 (Service Unavailable)
      const isRetryable = 
        error?.status === "RESOURCE_EXHAUSTED" || 
        error?.code === 429 ||
        error?.status === "UNAVAILABLE" ||
        error?.code === 503;

      if (isRetryable && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`Gemini API rate limited. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }

  throw lastError;
}
