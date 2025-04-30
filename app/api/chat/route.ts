import { NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, Message as AIMessage } from 'ai';

// Define our message type
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Create OpenAI provider instance with strict mode for the API
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  compatibility: 'strict',
});

export async function POST(request: Request) {
  try {
    const { messages, context } = await request.json();
    
    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }
    
    // Use a system message to provide context and constraints
    const systemMessage = `You are a helpful assistant for a customer churn prediction application. 
    The current user is viewing information about ${context || 'churn analysis'}.
    Keep your responses brief, informative, and focused on helping the user understand churn analytics, 
    predictions, and retention strategies. Don't make up specific data about the user's company 
    unless explicitly provided in their question.`;
    
    // Format messages for the OpenAI API
    const formattedMessages: ChatMessage[] = [
      { role: 'system', content: systemMessage },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];
    
    // Generate response using the cheapest GPT model (gpt-3.5-turbo)
    const { text } = await generateText({
      model: openai('gpt-3.5-turbo'),
      messages: formattedMessages,
      temperature: 0.7,
      maxTokens: 300, // Keep responses concise
    });
    
    return NextResponse.json({ message: text });
    
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
} 