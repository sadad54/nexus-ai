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

<section class="w-80 lg:w-96 bg-nexus-900/60 backdrop-blur-xl border-r border-white/5 z-10 flex flex-col">
  
  <div class="p-5 border-b border-white/5">
    <h2 class="text-white font-bold text-lg mb-4 flex items-center gap-3 tracking-tight">
      Inbox 
      <span class="text-[10px] bg-nexus-500/10 text-nexus-400 px-2 py-0.5 rounded-full border border-nexus-500/20 shadow-sm">Live</span>
    </h2>
    
    <div class="relative group">
      <Search class="absolute left-3 top-2.5 w-4 h-4 text-slate-500 group-focus-within:text-nexus-400 transition-colors" />
      <input 
        v-model="searchQuery"
        type="text" 
        placeholder="Filter tickets..." 
        class="w-full bg-nexus-950/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 
               focus:outline-none focus:border-nexus-500/50 focus:ring-1 focus:ring-nexus-500/50 focus:shadow-glow
               placeholder:text-slate-600 transition-all duration-300"
      >
    </div>
  </div>

  <div class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
    <div 
      v-for="msg in filteredMessages" 
      :key="msg.id"
      @click="setActive(msg.id)"
      class="p-4 rounded-xl cursor-pointer transition-all duration-200 border relative overflow-hidden group"
      :class="store.activeMsgId === msg.id 
        ? 'bg-white/[0.04] border-white/10 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]' 
        : 'bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/5'"
    >
      <div v-if="store.activeMsgId === msg.id" class="absolute left-0 top-3 bottom-3 w-1 bg-nexus-500 rounded-r-full shadow-glow"></div>

      <div class="flex justify-between items-start mb-1 pl-2">
        <h4 class="font-semibold text-sm transition-colors" :class="store.activeMsgId === msg.id ? 'text-white' : 'text-slate-300'">
          {{ msg.customer }}
        </h4>
        <span class="text-[10px] text-slate-600 font-mono">10:42 AM</span>
      </div>
      <p class="text-xs text-slate-400 line-clamp-2 pl-2 mb-3 leading-relaxed group-hover:text-slate-300 transition-colors">
        {{ msg.text }}
      </p>
      
      <div class="pl-2 flex gap-2">
        <span class="px-2 py-0.5 rounded text-[10px] border font-medium" :class="getPriorityColor(msg.priority)">{{ msg.priority || 'Low' }}</span>
        <span class="text-[10px] text-slate-500 border border-white/5 px-2 py-0.5 rounded bg-nexus-950/30">
           {{ msg.platform }}
        </span>
      </div>
    </div>
  </div>
</section>

    <main class="flex-1 flex flex-col relative bg-nexus-950 bg-subtle-grid">
  
  <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
     <div class="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-nexus-500/10 rounded-full blur-[100px]"></div>
     <div class="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-nexus-accent/5 rounded-full blur-[100px]"></div>
  </div>

  <header class="h-16 px-6 border-b border-white/5 flex items-center justify-between bg-nexus-900/40 backdrop-blur-md z-20">
      </header>

  <div class="flex-1 overflow-y-auto p-8 space-y-8 z-10 scroll-smooth custom-scrollbar">
    
    <div v-if="activeMessage" class="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <img :src="`https://api.dicebear.com/7.x/initials/svg?seed=${activeMessage.customer}`" class="w-10 h-10 rounded-full border border-white/10 shadow-lg" />
      
      <div class="max-w-2xl">
         <div class="flex items-baseline gap-2 mb-1">
           <span class="text-sm font-semibold text-slate-200">{{ activeMessage.customer }}</span>
         </div>
         <div class="bg-nexus-800 border border-white/5 p-5 rounded-2xl rounded-tl-none text-slate-200 leading-relaxed shadow-lg relative group">
           {{ activeMessage.text }}
           <div class="absolute -right-2 -top-3 opacity-0 group-hover:opacity-100 transition-opacity bg-nexus-900 border border-white/10 px-2 py-1 rounded-full text-[10px] shadow-xl flex items-center gap-1 cursor-help">
              <div class="w-2 h-2 rounded-full" :class="activeMessage.sentiment === 'Negative' ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-green-500'"></div>
              {{ activeMessage.sentiment || 'Analyzing...' }}
           </div>
         </div>
      </div>
    </div>

    <div v-if="activeMessage && activeMessage.reply" class="flex flex-row-reverse gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div class="w-10 h-10 rounded-full bg-gradient-to-br from-nexus-500 to-nexus-600 flex items-center justify-center shrink-0 shadow-glow text-white">
         <Sparkles class="w-5 h-5 animate-pulse-slow" />
       </div>
       <div class="max-w-2xl w-full">
          <div class="flex items-baseline gap-2 mb-1 justify-end">
            <span class="text-xs text-nexus-400 font-medium tracking-wide uppercase">AI Draft • {{ selectedTone }}</span>
          </div>
          
          <div class="relative group">
            <div class="absolute -inset-0.5 bg-gradient-to-r from-nexus-500 to-nexus-accent opacity-30 rounded-2xl blur group-hover:opacity-60 transition duration-500"></div>
            <div class="relative bg-nexus-900 border border-white/10 p-1 rounded-2xl">
              <textarea 
                v-model="activeMessage.reply"
                class="w-full bg-nexus-950/50 text-slate-200 px-5 py-4 rounded-xl min-h-[120px] focus:outline-none resize-none leading-relaxed selection:bg-nexus-500/30 font-light border-0"
              ></textarea>
              <div class="flex justify-between items-center px-4 py-2 border-t border-white/5">
                 <div class="text-[10px] text-slate-500 flex gap-3">
                    <button class="hover:text-nexus-400 transition-colors flex items-center gap-1"><span class="text-lg">⟳</span> Regenerate</button>
                 </div>
                 <div class="flex gap-2">
                    <button @click="activeMessage.reply = undefined" class="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors">Discard</button>
                    <button @click="handleSend" class="bg-nexus-500 hover:bg-nexus-400 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-glow transition-all flex items-center gap-2 transform active:scale-95">
                      Approve <Send class="w-3 h-3" />
                    </button>
                 </div>
              </div>
            </div>
          </div>
       </div>
    </div>
  </div>

  <div class="p-6 pt-0 z-20">
    <div class="bg-nexus-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 shadow-2xl relative">
       
       <div class="absolute bottom-full left-4 mb-3 flex gap-2">
          <button 
             v-for="tone in tones" :key="tone" 
             @click="selectedTone = tone"
             class="px-3 py-1 rounded-full text-xs border transition-all duration-300"
             :class="selectedTone === tone ? 'bg-nexus-500/20 border-nexus-500 text-nexus-300 shadow-glow' : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'"
          >
            {{ tone }}
          </button>
       </div>

       <div class="flex gap-3 items-end">
         <button class="p-3 text-slate-400 hover:text-nexus-400 hover:bg-white/5 rounded-xl transition-colors">
            <InboxIcon class="w-5 h-5 rotate-45" /> 
         </button>
         <textarea 
            placeholder="Type a message or press '/' for AI commands..." 
            class="flex-1 bg-transparent text-slate-200 p-3 max-h-32 focus:outline-none placeholder:text-slate-600 resize-none font-light"
            rows="1"
         ></textarea>
         
         <button 
            @click="handleAnalyze" 
            :disabled="store.loadingAI"
            class="p-3 rounded-xl transition-all duration-300 group overflow-hidden relative"
            :class="store.loadingAI ? 'bg-nexus-900 cursor-wait' : 'bg-gradient-to-r from-nexus-500 to-indigo-600 hover:brightness-110 text-white shadow-glow'"
         >
            <span v-if="!store.loadingAI" class="flex items-center gap-2">
               <Sparkles class="w-5 h-5" />
               <span class="text-xs font-bold pr-1 hidden group-hover:inline-block animate-in fade-in slide-in-from-right-1">AI Draft</span>
            </span>
            <span v-else class="flex items-center justify-center">
               <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            </span>
         </button>
       </div>
    </div>
  </div>
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