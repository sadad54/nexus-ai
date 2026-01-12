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
  { id: 1, customer: "Alice", platform: "Email", text: "My order #999 is broken. I want a refund NOW!", sentiment: "unknown", status: "open" },
  { id: 2, customer: "Bob", platform: "WhatsApp", text: "Hi, do you support Mac OS?", sentiment: "unknown", status: "open" }
];

// 🧠 AI Analysis Endpoint
app.post('/analyze-ticket', async (c) => {
      const { text, id, tone = 'Professional' } = await c.req.json(); // Default to Professional
      
      const prompt = `
        Analyze this customer message: "${text}".
        1. Detect Sentiment (Positive, Neutral, Negative).
        2. Draft a reply in a ${tone} tone (under 50 words).
        3. Suggest a priority level.
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
    return c.json({ error: "AI Busy" }, 500);
  }
})

app.get('/messages', (c) => c.json(messages))

const port = 3000
console.log(`Nexus Core running on port ${port}`)

serve({ fetch: app.fetch, port })