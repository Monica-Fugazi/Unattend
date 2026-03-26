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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 2000
): Promise<T> {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      
      // Check if it's a 429 error (Resource Exhausted)
      const isRateLimit = error?.status === 429 || 
                          error?.status === 'RESOURCE_EXHAUSTED' ||
                          error?.message?.includes('429') ||
                          error?.message?.includes('quota');
                          
      if (isRateLimit && attempt < maxRetries) {
        const waitTime = baseDelayMs * Math.pow(2, attempt - 1);
        console.warn(`Rate limit hit. Retrying in ${waitTime}ms (Attempt ${attempt} of ${maxRetries})...`);
        await delay(waitTime);
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries exceeded");
}

export async function generateContentWithRetry(
  params: GenerateContentParameters,
  maxRetries: number = 3,
  baseDelayMs: number = 2000
): Promise<GenerateContentResponse> {
  const ai = getGeminiClient();
  return withRetry(() => ai.models.generateContent(params), maxRetries, baseDelayMs);
}
