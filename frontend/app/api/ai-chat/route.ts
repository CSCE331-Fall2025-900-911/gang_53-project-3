import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { question } = await request.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      );
    }

    // Fetch products from database
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    let inventoryData = [];
    
    try {
      const inventoryRes = await fetch(`${apiUrl}/api/inventory`);
      if (inventoryRes.ok) {
        const responseData = await inventoryRes.json();
        // Backend returns { success: true, data: [...] }
        inventoryData = responseData.data || responseData || [];
        if (!Array.isArray(inventoryData)) {
          inventoryData = [];
        }
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    }

    // Separate products and toppings and special items
    const PRODUCTS = inventoryData.filter((item: any) => item.category === 'product');
    const TOPPINGS = inventoryData.filter((item: any) => item.category === 'topping');
    const SPECIAL_ITEMS = inventoryData.filter((item: any) => item.category === 'product' && (item.seasonal === 'y' || item.seasonal === 'Y'));

    // create product context for AI
    const productContext = `You are a helpful customer service assistant for Bobalicious. Provide clear and informative responses - typically 2-3 sentences unless the question needs more detail.

=== DRINKS ===
${PRODUCTS.map((p: any) => `${p.name} - $${Number(p.price).toFixed(2)}`).join('\n')}

=== AVAILABLE TOPPINGS ===
${TOPPINGS.map((t: any) => `${t.name} - $${Number(t.price).toFixed(2)}`).join('\n')}

=== SEASONAL SPECIALS ===
${SPECIAL_ITEMS.length > 0 ? SPECIAL_ITEMS.map((s: any) => `${s.name} - $${Number(s.price).toFixed(2)}`).join('\n') : 'No seasonal specials available right now'}

IMPORTANT RULES:
1. Keep answers clear and concise - aim for 2-3 sentences
2. If asked about a drink: include name and price with a brief description
3. If asked for recommendations: suggest 2-3 items
4. Keep a casual and friendly tone
5. Don't over-explain unless specifically asked for more details`;

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Gemini API key is not configured. Please set GOOGLE_GEMINI_API_KEY in environment variables.' },
        { status: 500 }
      );
    }

    console.log('Sending request to Google Gemini with question:', question);
    console.log('Product context:', productContext);

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
            maxOutputTokens: 500,
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
    
    let answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!answer || answer.trim() === '') {
      console.error('❌ Empty response from Gemini. Full response:', JSON.stringify(data, null, 2));
      
      // Check if there's a safety rating issue
      if (data.candidates?.[0]?.finishReason === 'SAFETY') {
        answer = 'I can\'t provide a response to that question. Please try asking something else.';
      } else if (data.promptFeedback?.blockReason) {
        answer = 'Your question was blocked by safety filters. Please rephrase and try again.';
      } else {
        answer = 'Sorry, I couldn\'t generate a response. Please try again.';
      }
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
