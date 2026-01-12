<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useInboxStore, type Message } from '../stores/inboxStore' // Imported Message type
import { useMagicKeys, whenever } from '@vueuse/core'
import { 
  Sparkles, Send, Search, 
  Inbox as InboxIcon, Archive, Trash2, 
  MoreHorizontal, Clock, AlertCircle, CheckCircle2 
} from 'lucide-vue-next'
import { toast, Toaster } from 'vue-sonner'

const store = useInboxStore()
const selectedTone = ref('Professional')
const tones = ['Professional', 'Friendly', 'Empathetic', 'Urgent']
const searchQuery = ref('')

// Initialize
onMounted(async () => {
  await store.fetchMessages()
  // Auto-select first if available
  if (store.messages.length > 0 && !store.activeMsgId) {
    const firstMessage = store.messages[0] // 👈 Assign to variable first
    if (firstMessage) {                    // 👈 Check if variable exists
       store.activeMsgId = firstMessage.id
    }
  }
})

// Computed
const filteredMessages = computed(() => {
  return store.messages.filter(m => 
    m.customer.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    m.text.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const activeMessage = computed(() => store.messages.find(m => m.id === store.activeMsgId))

// Actions
const setActive = (id: number) => { store.activeMsgId = id }

const handleAnalyze = () => {
  if (!activeMessage.value) return
  toast.promise(store.analyzeTicket(activeMessage.value, selectedTone.value), {
    loading: 'AI is thinking...',
    success: 'Draft generated!',
    error: 'Failed to generate draft'
  })
}

const handleSend = () => {
  toast.success('Reply sent to customer!')
  if(activeMessage.value) activeMessage.value.reply = undefined
}

// Shortcuts
const { Meta_Enter, Ctrl_Enter } = useMagicKeys()
whenever(() => Meta_Enter?.value || Ctrl_Enter?.value, () => {
  if (activeMessage.value?.reply) handleSend()
})

// Helper for badges
const getPriorityColor = (p?: string) => {
  switch(p) {
    case 'High': return 'text-red-400 bg-red-400/10 border-red-400/20'
    case 'Medium': return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
    case 'Low': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
  }
}
</script>

<template>
  <div class="flex h-screen w-full bg-nexus-950 text-slate-300 font-sans overflow-hidden selection:bg-nexus-500/30">
    <Toaster position="bottom-right" theme="dark" :richColors="true" />

    <aside class="w-16 md:w-20 bg-nexus-900 border-r border-white/5 flex flex-col items-center py-6 gap-6 z-20">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-glow mb-4">
        <Sparkles class="w-5 h-5 text-white fill-white" />
      </div>
      <nav class="flex flex-col gap-4 w-full px-2">
        <button class="p-3 rounded-xl bg-white/10 text-white transition-all"><InboxIcon class="w-5 h-5" /></button>
        <button class="p-3 rounded-xl text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-all"><Archive class="w-5 h-5" /></button>
        <button class="p-3 rounded-xl text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-all"><Trash2 class="w-5 h-5" /></button>
      </nav>
      <div class="mt-auto">
        <div class="w-8 h-8 rounded-full bg-slate-700 ring-2 ring-nexus-950"></div>
      </div>
    </aside>

    <section class="w-80 lg:w-96 bg-nexus-900/50 backdrop-blur-md flex flex-col border-r border-white/5 z-10">
      <div class="p-4 border-b border-white/5">
        <h2 class="text-white font-semibold text-lg mb-4 flex items-center gap-2">
          Inbox <span class="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{{ store.messages.length }}</span>
        </h2>
        <div class="relative">
          <Search class="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search tickets..." 
            class="w-full bg-nexus-950/50 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
          >
        </div>
      </div>
      
      <div class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        <div 
          v-for="msg in filteredMessages" 
          :key="msg.id"
          @click="setActive(msg.id)"
          class="p-4 rounded-xl cursor-pointer transition-all border border-transparent hover:border-white/5 group relative"
          :class="store.activeMsgId === msg.id ? 'bg-white/5 border-white/10 shadow-lg' : 'hover:bg-white/[0.02]'"
        >
          <div class="flex justify-between items-start mb-1">
            <h4 class="font-medium text-white truncate pr-2" :class="store.activeMsgId === msg.id ? 'text-blue-400' : ''">
              {{ msg.customer }}
            </h4>
            <span class="text-[10px] text-slate-500 whitespace-nowrap">2m ago</span>
          </div>
          <p class="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
            {{ msg.text }}
          </p>
          <div class="flex items-center gap-2">
            <span 
              class="text-[10px] px-2 py-0.5 rounded border"
              :class="getPriorityColor(msg.priority || 'Low')"
            >
              {{ msg.priority || 'Low' }}
            </span>
            <span v-if="msg.platform" class="text-[10px] text-slate-500 border border-white/5 px-2 py-0.5 rounded">
              {{ msg.platform }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <main class="flex-1 flex flex-col relative bg-gradient-to-tr from-nexus-950 via-nexus-900 to-nexus-950">
      
      <div v-if="!activeMessage" class="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
        <div class="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
          <InboxIcon class="w-8 h-8 opacity-50" />
        </div>
        <p>Select a ticket to start working</p>
      </div>

      <template v-else>
        <header class="h-16 px-6 border-b border-white/5 flex items-center justify-between bg-nexus-900/50 backdrop-blur-sm">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
              {{ activeMessage.customer.charAt(0) }}
            </div>
            <div>
              <h1 class="text-white font-medium text-sm">{{ activeMessage.customer }}</h1>
              <p class="text-xs text-slate-500 flex items-center gap-1">
                via {{ activeMessage.platform }} • <span class="flex items-center gap-1 text-green-400"><Clock class="w-3 h-3"/> Open</span>
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
             <button class="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"><MoreHorizontal class="w-4 h-4"/></button>
             <button class="bg-white/5 hover:bg-white/10 border border-white/10 text-xs px-3 py-1.5 rounded-lg text-white transition-all">Resolve</button>
          </div>
        </header>

        <div class="flex-1 overflow-y-auto p-6 lg:p-10 scroll-smooth">
          <div class="flex gap-4 mb-8 group">
            <div class="w-10 h-10 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center shrink-0">
              <span class="text-lg">👤</span>
            </div>
            <div class="max-w-3xl">
               <div class="bg-slate-800/50 border border-white/5 p-6 rounded-2xl rounded-tl-none text-slate-200 leading-7 shadow-sm">
                 {{ activeMessage.text }}
               </div>
               <div class="mt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                  <span class="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Detected Tone:</span>
                  <span class="text-[10px] text-blue-400">{{ activeMessage.sentiment || 'Analyzing...' }}</span>
               </div>
            </div>
          </div>

          <div v-if="activeMessage.reply" class="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div class="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
               <Sparkles class="w-5 h-5 text-blue-400" />
             </div>
             <div class="w-full max-w-3xl space-y-3">
                <div class="relative group">
                  <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                  <div class="relative bg-nexus-900 border border-white/10 p-1 rounded-2xl">
                    <div class="flex items-center justify-between px-4 py-2 border-b border-white/5 mb-2">
                       <span class="text-xs font-medium text-blue-400 flex items-center gap-1.5">
                         <Sparkles class="w-3 h-3" /> AI Suggestion
                       </span>
                       <span class="text-[10px] text-slate-500 uppercase tracking-wider">{{ selectedTone }} Tone</span>
                    </div>
                    <textarea 
                      v-model="activeMessage.reply"
                      class="w-full bg-transparent text-slate-200 px-4 py-2 min-h-[120px] focus:outline-none resize-none leading-relaxed"
                    ></textarea>
                    
                    <div class="flex justify-end p-2 gap-2">
                       <button @click="activeMessage.reply = undefined" class="text-xs text-slate-400 hover:text-white px-3 py-1.5 transition-colors">Discard</button>
                       <button 
                         @click="handleSend"
                         class="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-1.5 rounded-lg flex items-center gap-2 transition-all shadow-glow"
                       >
                         Send Reply <span class="opacity-50 text-[10px] ml-1">⌘↵</span>
                       </button>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>

        <div class="p-6 border-t border-white/5 bg-nexus-900/30 backdrop-blur-xl z-20">
          <div class="max-w-4xl mx-auto relative">
             
             <div v-if="!activeMessage.reply" class="absolute bottom-full left-0 mb-4 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
               <div class="flex items-center bg-nexus-800/80 backdrop-blur border border-white/10 rounded-lg p-1">
                 <button 
                   v-for="tone in tones" :key="tone"
                   @click="selectedTone = tone"
                   class="px-3 py-1.5 text-xs rounded-md transition-all"
                   :class="selectedTone === tone ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'"
                 >
                   {{ tone }}
                 </button>
               </div>
               <button 
                 @click="handleAnalyze"
                 :disabled="store.loadingAI"
                 class="bg-white text-nexus-950 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all disabled:opacity-50"
               >
                 <Sparkles class="w-3 h-3 text-indigo-600" />
                 {{ store.loadingAI ? 'Drafting...' : 'Generate Draft' }}
               </button>
             </div>

             <div class="relative">
               <textarea 
                 class="w-full bg-nexus-950 border border-white/10 rounded-xl p-4 pl-4 pr-12 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all shadow-inner h-14 resize-none pt-4"
                 placeholder="Type a manual reply..."
               ></textarea>
               <button class="absolute right-2 top-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                 <Send class="w-4 h-4" />
               </button>
             </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
/* Custom Scrollbar for the sleek look */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
</style>