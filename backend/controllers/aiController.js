const { GoogleGenAI } = require('@google/genai');
const Item = require('../models/Item');

// Initialize Gemini
let ai;
try {
  // Uses process.env.GEMINI_API_KEY by default
  ai = new GoogleGenAI({});
} catch (error) {
  console.warn("Failed to initialize Google GenAI. Check your GEMINI_API_KEY environment variable.");
}

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (!ai) {
      // Try initializing again in case the env var was added after startup
      try {
        ai = new GoogleGenAI({});
      } catch (err) {
        return res.status(500).json({ 
          message: 'AI Assistant is not configured properly. Missing GEMINI_API_KEY.',
          reply: 'Please ask your administrator to configure the Gemini API key.'
        });
      }
    }

    // Fetch all inventory items to provide context to the AI
    const items = await Item.find();
    
    // Calculate some basic stats for the prompt context
    const totalItems = items.length;
    const totalValue = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const lowStockItems = items.filter(item => item.quantity < 10).map(item => `${item.name} (${item.quantity} left)`).join(', ');

    // System prompt setting the persona and providing context
    const systemPrompt = `You are an intelligent, helpful Inventory Management Assistant.
You are helping the user manage their inventory.
Here is the current state of the inventory:
- Total unique items: ${totalItems}
- Total inventory value: $${totalValue.toFixed(2)}
- Items running low on stock (less than 10): ${lowStockItems || 'None'}

Here is the full inventory data in JSON format:
${JSON.stringify(items.map(i => ({ name: i.name, category: i.category, quantity: i.quantity, price: i.price, supplier: i.supplier })), null, 2)}

Be concise, helpful, and professional. Do not expose the raw JSON in your response, just use it to answer the user's questions accurately. If asked about something not in the inventory data, politely explain that you can only assist with inventory-related questions.`;

    // Call the Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2, // Low temperature for more factual responses
      }
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error('Error in AI chat endpoint:', error);
    res.status(500).json({ 
      message: 'Server Error', 
      error: error.message,
      reply: 'Sorry, I encountered an error while processing your request. Please try again later.'
    });
  }
};

exports.magicFill = async (req, res) => {
  try {
    const { itemName } = req.body;

    if (!itemName) {
      return res.status(400).json({ message: 'Item name is required' });
    }

    if (!ai) {
      try {
        ai = new GoogleGenAI({});
      } catch (err) {
        return res.status(500).json({ message: 'AI Assistant is not configured properly.' });
      }
    }

    const systemPrompt = `You are an AI assistant helping a user fill out an inventory form. 
The user has entered the product name: "${itemName}".
Generate a realistic and plausible category, price, supplier, and a short compelling description for this item.
Respond ONLY with a valid JSON object exactly matching this schema, with no markdown formatting or backticks:
{
  "category": "string",
  "price": number,
  "supplier": "string",
  "description": "string"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Fill details for: " + itemName,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
      }
    });

    let jsonString = response.text.trim();
    // Strip markdown formatting if the model accidentally included it
    if (jsonString.startsWith('\`\`\`json')) {
      jsonString = jsonString.slice(7, -3);
    } else if (jsonString.startsWith('\`\`\`')) {
      jsonString = jsonString.slice(3, -3);
    }

    const itemDetails = JSON.parse(jsonString.trim());
    res.json(itemDetails);

  } catch (error) {
    console.error('Error in AI magic fill endpoint:', error);
    res.status(500).json({ message: 'Server Error generating details', error: error.message });
  }
};
