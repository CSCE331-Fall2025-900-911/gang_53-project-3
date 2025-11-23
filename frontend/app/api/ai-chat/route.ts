import { NextResponse } from 'next/server';

// product database for context 
const PRODUCTS = [
  { id: 4, name: 'Classic Milk Tea', price: 4.50, type: 'product', vegan: false },
  { id: 9, name: 'Oolong Milk Tea', price: 4.80, type: 'product', vegan: false },
  { id: 10, name: 'Jasmine Green Milk Tea', price: 4.70, type: 'product', vegan: false },
  { id: 7, name: 'Thai Tea', price: 4.75, type: 'product', vegan: false },
  { id: 8, name: 'Brown Sugar Milk Tea', price: 5.25, type: 'product', vegan: false },
  { id: 12, name: 'Strawberry Milk Tea', price: 5.00, type: 'product', vegan: false },
  { id: 13, name: 'Mango Milk Tea', price: 5.20, type: 'product', vegan: false },
  { id: 14, name: 'Chocolate Milk Tea', price: 5.00, type: 'product', vegan: false },
  { id: 15, name: 'Coffee Milk Tea', price: 5.25, type: 'product', vegan: false },
  { id: 6, name: 'Matcha Latte', price: 5.50, type: 'product', vegan: false },
  { id: 5, name: 'Taro Milk Tea', price: 5.00, type: 'product', vegan: true },
  { id: 16, name: 'Rose Milk Tea', price: 5.30, type: 'product', vegan: false },
  { id: 18, name: 'Passionfruit Green Tea', price: 4.85, type: 'product', vegan: false },
  { id: 19, name: 'Coconut Milk Tea', price: 5.10, type: 'product', vegan: false },
  { id: 11, name: 'Honeydew Milk Tea', price: 5.10, type: 'product', vegan: false },
  { id: 17, name: 'Lychee Green Tea', price: 4.90, type: 'product', vegan: false },
];

const TOPPINGS = [
  { id: 20, name: 'Tapioca Pearls', price: 0.75, type: 'topping' },
  { id: 21, name: 'Grass Jelly', price: 0.60, type: 'topping' },
  { id: 22, name: 'Red Bean', price: 0.80, type: 'topping' },
  { id: 23, name: 'Aloe Vera', price: 0.70, type: 'topping' },
  { id: 24, name: 'Pudding', price: 0.85, type: 'topping' },
  { id: 25, name: 'Oreo Crumbs', price: 0.90, type: 'topping' },
  { id: 26, name: 'Cheese Foam', price: 1.00, type: 'topping' },
  { id: 27, name: 'Rainbow Jelly', price: 0.95, type: 'topping' },
];

// create product context for AI
const productContext = `You are a brief and helpful customer service assistant for Bobalicious. Keep your responses SHORT and to the point - no more than 1-2 sentences unless asked for more details.

=== DRINKS ===
${PRODUCTS.map((p) => `${p.name}${p.vegan ? ' *VEGAN*' : ''} - $${p.price.toFixed(2)}`).join('\n')}

=== AVAILABLE TOPPINGS ===
${TOPPINGS.map((t) => `${t.name} - $${t.price.toFixed(2)}`).join('\n')}

IMPORTANT RULES:
1. Keep answers SHORT and direct
2. Answer the question immediately, don't over-explain
3. Only provide what was asked for
4. If asked about a drink: mention name and price only (unless they ask for more)
5. If asked for recommendations: suggest 1-2 items only
6. Keep it casual and friendly but brief`;

export async function POST(request: Request) {
  try {
    const { question } = await request.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Gemini API key is not configured. Please set GOOGLE_GEMINI_API_KEY in environment variables.' },
        { status: 500 }
      );
    }

    console.log('Sending request to Google Gemini with question:', question);

    // call Google Gemini API 
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${productContext}\n\nUser question: ${question}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Google Gemini API error:', error);
      return NextResponse.json(
        { error: `Failed to get response from Gemini: ${error.error?.message || 'Unknown error'}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Gemini API response:', JSON.stringify(data, null, 2));
    
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
    
    if (!answer || answer === 'No response generated') {
      console.error('Empty response from Gemini. Full response:', data);
    }

    return NextResponse.json({
      question,
      answer,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in AI API route:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
