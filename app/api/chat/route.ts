import { NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, Message as AIMessage } from 'ai';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  compatibility: 'strict',
});

export async function POST(request: Request) {
  try {
    const { messages, context } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      });
    }
    
    const systemMessage = `You are a helpful assistant for a customer churn prediction application. 
    The current user is viewing information about ${context || 'churn analysis'}.
    
    IMPORTANT FACTS ABOUT THIS APPLICATION:
    - The churn prediction algorithm uses a weighted factor model, NOT traditional machine learning algorithms like logistic regression, random forests, or neural networks.
    - The model calculates churn probability based on four key factors:
      1. Subscription Plan Type: Free plans add +0.25 to churn probability, Basic plans add +0.12, Premium plans add only +0.04
      2. Activity Recency: >30 days since activity adds +0.4 to probability, >14 days adds +0.25, >7 days adds +0.08
      3. Engagement Level: >100 events subtracts -0.3, >50 events subtracts -0.2, >10 events subtracts -0.1
      4. Revenue Contribution: >$200 subtracts -0.25, >$50 subtracts -0.15, >$0 subtracts -0.05
    - Users are classified as Low Risk (<0.3 probability), Medium Risk (0.3-0.8), or High Risk (>0.8)
    
    - The application also offers personalized retention strategies based on user data analysis, which include:
      1. Personalized Onboarding: Helps new users see value faster through tailored onboarding flows
      2. Proactive Customer Success: Early intervention for users showing disengagement signs
      3. Value-Driven Feature Updates: Developing features based on user feedback to improve stickiness
      4. Loyalty Programs: Rewarding long-term customers with exclusive benefits
      5. Enhanced Customer Education: Developing better knowledge resources to increase product mastery
      6. Win-Back Campaigns: Targeted campaigns to recover recently churned customers
    - Each strategy is assigned a relevance score based on current customer data patterns
    
    If asked about the algorithm, machine learning, or prediction methods, ALWAYS provide the accurate information above.
    If asked about retention strategies or how to reduce churn, explain the personalized strategy system.
    
    Keep your responses brief, informative, and focused on helping the user understand churn analytics, 
    predictions, and retention strategies. Don't make up specific data about the user's company 
    unless explicitly provided in their question.`;
    
    const formattedMessages: ChatMessage[] = [
      { role: 'system', content: systemMessage },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];
    
    const { text } = await generateText({
      model: openai('gpt-3.5-turbo'),
      messages: formattedMessages,
      temperature: 0.7,
      maxTokens: 300,
    });
    
    return new Response(JSON.stringify({ message: text }), {
      headers: {
        'content-type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat request' }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
      },
    });
  }
} 