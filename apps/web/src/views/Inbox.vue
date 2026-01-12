<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useInboxStore } from '../stores/inboxStore'
import { useMagicKeys, whenever } from '@vueuse/core' // Keyboard hooks
import { Zap, MessageSquare, Inbox, Search, Sparkles, Send, ChevronDown } from 'lucide-vue-next'
import { toast, Toaster } from 'vue-sonner' // Notifications

const store = useInboxStore()
const selectedTone = ref('Professional')
const tones = ['Professional', 'Friendly', 'Empathetic', 'Urgent']

onMounted(() => store.fetchMessages())

const activeMessage = computed(() => store.messages.find(m => m.id === store.activeMsgId))

// ⌨️ Keyboard Shortcut: Cmd + Enter to Send
const { Meta_Enter, Ctrl_Enter } = useMagicKeys()
whenever(() => Meta_Enter?.value || Ctrl_Enter?.value, () => {
  if (activeMessage.value?.reply) handleSend()
})

const handleAnalyze = () => {
  if (!activeMessage.value) return
  toast.info(`Generating ${selectedTone.value} draft...`)
  store.analyzeTicket(activeMessage.value, selectedTone.value)
}

const handleSend = () => {
  toast.success('Reply sent successfully!')
  // In a real app, you'd call an API here
  if(activeMessage.value) activeMessage.value.reply = undefined // Clear draft
}
</script>

<template>
  <div class="flex h-screen w-full bg-nexus-900 text-slate-300 font-sans overflow-hidden">
    <Toaster position="top-center" theme="dark" />

    <main class="flex-1 flex flex-col bg-nexus-800/30 relative">
      <div v-if="activeMessage" class="h-full flex flex-col">
        <header class="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-nexus-900/50 backdrop-blur-md">
           <div class="flex items-center gap-4">
              <h3 class="text-white font-medium">{{ activeMessage.customer }}</h3>
              <span class="text-xs text-slate-500">Press ⌘+Enter to send</span>
           </div>
        </header>

        <div class="flex-1 p-8 overflow-y-auto">
          <div class="flex gap-4 mb-8">
            <div class="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-lg">👤</div>
            <div class="bg-slate-800 p-5 rounded-2xl rounded-tl-none max-w-2xl border border-slate-700 shadow-sm">
              <p class="text-slate-200 leading-relaxed">{{ activeMessage.text }}</p>
            </div>
          </div>

          <div v-if="activeMessage.reply" class="flex gap-4 mb-8 animate-fade-in">
             <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/50">
               <Sparkles class="w-5 h-5 text-white" />
             </div>
             <div class="space-y-3 w-full max-w-2xl">
                <div class="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl rounded-tl-none backdrop-blur-sm">
                  <div class="flex justify-between items-center mb-3">
                    <span class="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                      AI DRAFT • {{ selectedTone.toUpperCase() }}
                    </span>
                  </div>
                  <textarea 
                    v-model="activeMessage.reply"
                    class="w-full bg-transparent text-blue-100/90 leading-relaxed focus:outline-none resize-none"
                    rows="3"
                  ></textarea>
                </div>
                <div class="flex gap-3">
                   <button 
                     @click="handleSend"
                     class="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 hover:scale-105"
                   >
                     <Send class="w-4 h-4" /> Send Reply
                   </button>
                   <button class="text-slate-400 hover:text-white px-4 py-2 text-sm transition-colors">Discard</button>
                </div>
             </div>
          </div>
        </div>

        <div class="p-6 border-t border-slate-800 bg-nexus-900 z-10">
          <div class="relative max-w-4xl mx-auto">
            <div v-if="!activeMessage.reply" class="absolute -top-14 left-0 flex gap-2">
              <div class="relative group">
                <select 
                  v-model="selectedTone"
                  class="appearance-none bg-slate-800 text-white pl-4 pr-10 py-2 rounded-lg border border-slate-700 focus:border-blue-500 cursor-pointer text-sm font-medium"
                >
                  <option v-for="t in tones" :key="t">{{ t }}</option>
                </select>
                <ChevronDown class="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              <button 
                @click="handleAnalyze"
                :disabled="store.loadingAI"
                class="bg-white text-nexus-900 px-5 py-2 rounded-lg font-bold shadow-lg shadow-white/10 hover:bg-gray-100 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles class="w-4 h-4 text-purple-600" />
                {{ store.loadingAI ? 'Thinking...' : 'Generate Draft' }}
              </button>
            </div>

            <textarea 
              class="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all h-24 resize-none shadow-inner"
              placeholder="Type your reply here..."
            ></textarea>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>