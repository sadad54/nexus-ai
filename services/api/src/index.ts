import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import Groq from 'groq-sdk'
import 'dotenv/config'

const app = new Hono()
app.use('*', cors())

const groq = new Groq ({apiKey: process.env.GROQ_API_KEY || ''});

// Mock Database of Messages
let messages = [
  { 
    id: 1, 
    customer: "Alice Chen", 
    platform: "Email", 
    text: "URGENT: My enterprise dashboard is throwing a 500 error during the demo. I need this fixed within the hour or we lose the contract.", 
    sentiment: "Negative", 
    priority: "High",
    status: "open",
    timestamp: "10 min ago"
  },
  { 
    id: 2, 
    customer: "Bob Smith", 
    platform: "WhatsApp", 
    text: "Hey! Just checking if the API supports streaming responses yet? Integrating it into our app now.", 
    sentiment: "Neutral", 
    priority: "Medium",
    status: "open",
    timestamp: "24 min ago"
  },
  { 
    id: 3, 
    customer: "Sarah Jones", 
    platform: "Messenger", 
    text: "I just wanted to say that the new dark mode is absolutely stunning! Great job team! 💜", 
    sentiment: "Positive", 
    priority: "Low",
    status: "open",
    timestamp: "1 hour ago"
  },
  { 
    id: 4, 
    customer: "TechCorp Support", 
    platform: "Slack", 
    text: "Integration Alert: Webhook #442 failed 5 times in the last minute. Payload size exceeded limit.", 
    sentiment: "Negative", 
    priority: "High",
    status: "open",
    timestamp: "2 hours ago"
  },
  { 
    id: 5, 
    customer: "Michael Brown", 
    platform: "Email", 
    text: "Requesting a refund for order #29291. It arrived damaged.", 
    sentiment: "Negative", 
    priority: "Medium",
    status: "open",
    timestamp: "3 hours ago"
  },
  { 
    id: 6, 
    customer: "David Lee", 
    platform: "WhatsApp", 
    text: "Can I upgrade my plan mid-month?", 
    sentiment: "Neutral", 
    priority: "Low",
    status: "open",
    timestamp: "5 hours ago"
  },
  { 
    id: 7, 
    customer: "Emma Wilson", 
    platform: "Messenger", 
    text: "Is there a discount for non-profits?", 
    sentiment: "Neutral", 
    priority: "Low",
    status: "open",
    timestamp: "1 day ago"
  }
];

// 🧠 AI Analysis Endpoint
app.post('/analyze-ticket', async (c) => {
  const { text, id, tone = 'Professional' } = await c.req.json();
  
  const prompt = `
    Analyze this customer message: "${text}".
    1. Detect Sentiment (Positive, Neutral, Negative).
    2. Draft a reply in a ${tone} tone (under 50 words).
    3. Suggest a priority level (High, Medium, Low).
    Return ONLY JSON: { "sentiment": "...", "reply": "...", "priority": "..." }
  `;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
    });

    const aiData = JSON.parse(completion.choices[0]?.message?.content || '{}');

    // Update our "Database"
    const msgIndex = messages.findIndex(m => m.id === id);
    if (msgIndex >= 0) {
      messages[msgIndex] = { ...messages[msgIndex], ...aiData };
    }

    return c.json(aiData);
  } catch (e) {
    console.error(e);
    return c.json({ error: "AI Busy" }, 500);
  }
})

app.get('/messages', (c) => c.json(messages))

const port = 3000
console.log(`Nexus Core running on port ${port}`)

serve({ fetch: app.fetch, port })