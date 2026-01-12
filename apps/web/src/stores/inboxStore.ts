import {defineStore} from 'pinia';
import axios from 'axios';
import { ref } from 'vue'

export interface Message {
  id: number;
  customer: string;
  platform: 'Email' | 'WhatsApp' | 'Messenger';
  text: string;
  sentiment?: 'Positive' | 'Neutral' | 'Negative';
  reply?: string; // The AI Draft
  priority?: 'High' | 'Medium' | 'Low';
  status: 'open' | 'closed';
}

export const useInboxStore = defineStore('inbox', () => {
  const messages = ref<Message[]>([])
  const activeMsgId = ref<number | null>(null)
  const loadingAI = ref(false)

  // Fetch from our Hono Backend
const fetchMessages = async () => {
    try {
      const res = await axios.get('http://localhost:3000/messages')
      messages.value = res.data
      
      // 👇 Fixed: We assign to a variable first to satisfy TypeScript
      if (messages.value.length > 0 && !activeMsgId.value) {
        const firstMessage = messages.value[0]
        if (firstMessage) {
           activeMsgId.value = firstMessage.id
        }
      }
    } catch (e) { console.error(e) }
  }
  

  // 🧠 The "Magic" AI Button Action
  const analyzeTicket = async (msg: Message, tone: string) => {
    loadingAI.value = true
    try {
      const res = await axios.post('http://localhost:3000/analyze-ticket', {
        id: msg.id,
        text: msg.text,
        tone:tone
      })
      
      // Update local state immediately with AI results
      const index = messages.value.findIndex(m => m.id === msg.id)
      if (index !== -1) {
        messages.value[index] = { ...messages.value[index], ...res.data }
      }
    } catch (e) { console.error(e) }
    finally { loadingAI.value = false }
  }

  return { messages, activeMsgId, loadingAI, fetchMessages, analyzeTicket }
})