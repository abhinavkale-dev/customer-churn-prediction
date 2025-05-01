import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  compatibility: 'strict',
});

export async function generateChurnExplanation(userData: {
  plan: string;
  daysSinceActivity: number;
  eventsLast30: number;
  revenueLast30: number;
  probability: number;
}) {
  try {
    const { text } = await generateText({
      model: openai('gpt-3.5-turbo'),
      prompt: `
      You are a helpful customer success assistant analyzing churn risk. 
      
      User data:
      - Plan: ${userData.plan}
      - Days since last activity: ${userData.daysSinceActivity}
      - Events in last 30 days: ${userData.eventsLast30}
      - Revenue in last 30 days: $${userData.revenueLast30}
      - Calculated churn probability: ${(userData.probability * 100).toFixed(1)}%
      
      Based on this data, provide a brief explanation (maximum 3 sentences) for why this user might be at risk of churning. 
      Focus on the most relevant factors from the data. Be concise and clear.
      `,
      maxTokens: 150,
    });
    
    return { explanation: text };
  } catch (error) {
    console.error('Error generating churn explanation:', error);
    return { 
      explanation: 'Unable to generate explanation at this time.' 
    };
  }
}

export async function generateRetentionStrategies(userData: {
  plan: string;
  daysSinceActivity: number;
  eventsLast30: number;
  revenueLast30: number;
  probability: number;
}) {
  try {
    const { text } = await generateText({
      model: openai('gpt-3.5-turbo'),
      prompt: `
      You are a customer success specialist helping to prevent churn.
      
      User data:
      - Plan: ${userData.plan}
      - Days since last activity: ${userData.daysSinceActivity}
      - Events in last 30 days: ${userData.eventsLast30}
      - Revenue in last 30 days: $${userData.revenueLast30}
      - Calculated churn probability: ${(userData.probability * 100).toFixed(1)}%
      
      Provide 3 specific, actionable retention strategies to prevent this customer from churning.
      Each strategy should be brief (1-2 sentences) and specifically tailored to this user's data.
      Format as a bulleted list.
      `,
      maxTokens: 250,
    });
    
    return { strategies: text };
  } catch (error) {
    console.error('Error generating retention strategies:', error);
    return { 
      strategies: 'Unable to generate retention strategies at this time.' 
    };
  }
} 