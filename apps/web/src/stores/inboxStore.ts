import { defineStore } from 'pinia';
import axios from 'axios';
import { ref, computed } from 'vue'

export interface Message {
  id: number;
  customer: string;
  platform: 'Email' | 'WhatsApp' | 'Messenger';
  text: string;
  sentiment?: 'Positive' | 'Neutral' | 'Negative';
  reply?: string; // The AI Draft
  priority?: 'High' | 'Medium' | 'Low';
  status: 'open' | 'closed';
  isGenerating?: boolean; // UI State
  isSending?: boolean;    // UI State
  timestamp?: string;
}

export const useInboxStore = defineStore('inbox', () => {
  const messages = ref<Message[]>([])
  const activeMsgId = ref<number | null>(null)
  
  // Global loading state for the AI button
  const loadingAI = ref(false)

  // Computed helper to get the currently selected message object safely
  const activeMessage = computed(() => messages.value.find(m => m.id === activeMsgId.value))

  // Fetch from our Hono Backend
  const fetchMessages = async () => {
    try {
      const res = await axios.get('http://localhost:3000/messages')
      messages.value = res.data
      
      // Auto-select first if none selected
      if (messages.value.length > 0 && !activeMsgId.value) {
        const firstMessage = messages.value[0]
        if (firstMessage) {
          activeMsgId.value = firstMessage.id
        }
      }
    } catch (e) { console.error(e) }
  }

  // 🧠 Action: Generate AI Draft
  const analyzeTicket = async (msg: Message, tone: string) => {
    loadingAI.value = true
    
    // 1. Optimistic UI: Mark this specific message as "generating"
    const index = messages.value.findIndex(m => m.id === msg.id)
    const target = messages.value[index]
    if (index === -1 || !target) {
      loadingAI.value = false
      return
    }
    // safe to mutate target or replace messages.value[index]
    messages.value[index] = { ...target, isGenerating: true }

    try {
      const res = await axios.post('http://localhost:3000/analyze-ticket', {
        id: msg.id,
        text: msg.text,
        tone: tone
      })
      
      // 2. Update state with AI results
      const current = messages.value[index]
      if (current) {
        messages.value[index] = { 
          ...current, 
          ...res.data,
          isGenerating: false 
        }
      }
    } catch (e) { 
      console.error(e)
      // Error recovery
      const current = messages.value[index]
      if (current) messages.value[index] = { ...current, isGenerating: false }
    } finally { 
      loadingAI.value = false 
    }
  }

  // 🚀 Action: Send Reply (Optimistic Update)
  const sendMessage = async (id: number) => {
    const index = messages.value.findIndex(m => m.id === id)
    if (index === -1) return

    const target = messages.value[index]
    if (!target) return

    // 1. Create a Snapshot of the previous state (for rollback)
    const previousState = { ...target }

    // 2. Optimistic Update: Instantly clear reply and mark as "closed" or "sending"
    messages.value[index] = { ...target, reply: undefined, isSending: true }
    // Optional: messages.value[index].status = 'closed' (if you want to hide it immediately)

    try {
      // 3. Simulate Backend Call (Since we don't have a /send endpoint yet)
      // In production: await axios.post('/send', { id, reply: previousState.reply })
      await new Promise(resolve => setTimeout(resolve, 600)) // Fake network delay
      
      // 4. Finalize success state
      const current = messages.value[index]
      messages.value[index] = { ...current, isSending: false, status: 'closed' }
      
      // Auto-select next message for speed workflow
      const nextMsg = messages.value.find(m => m.status === 'open' && m.id !== id)
      if (nextMsg) activeMsgId.value = nextMsg.id

    } catch (e) {
      // 5. Rollback on Error! (The "Magic" of Optimistic UI)
      console.error("Send failed, rolling back UI")
      messages.value[index] = previousState
      // Trigger a toast error here in a real app
    }
  }

  return { 
    messages, 
    activeMsgId, 
    activeMessage, 
    loadingAI, 
    fetchMessages, 
    analyzeTicket, 
    sendMessage 
  }
})