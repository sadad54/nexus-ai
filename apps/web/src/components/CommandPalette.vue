<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useMagicKeys, whenever, onClickOutside } from '@vueuse/core'
import { useInboxStore } from '../stores/inboxStore'
import { 
  Command, Sparkles, Send, User, 
  CheckCircle2, ArrowRight, Search, 
  Zap, PenTool 
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const store = useInboxStore()
const router = useRouter()

// State
const isOpen = ref(false)
const search = ref('')
const selectedIndex = ref(0)
const commandInput = ref<HTMLInputElement | null>(null)
const container = ref(null)

// 🎹 Keyboard Magic: Cmd+K to Toggle
const { Meta_K, Ctrl_K } = useMagicKeys()
whenever(() => Meta_K?.value || Ctrl_K?.value, () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
      nextTick(() => commandInput.value?.focus())
      search.value = ''
      selectedIndex.value = 0
  }
})

// Close on outside click
onClickOutside(container, () => isOpen.value = false)

// 🧠 The "Brain" of the Palette
const groups = computed(() => {
  const q = search.value.toLowerCase()
  const activeMsg = store.activeMessage
  
  const allCommands = [
    {
      group: 'AI Assistance',
      items: [
        { 
            id: 'ai-prof', 
            label: 'Draft Professional Reply', 
            icon: Sparkles, 
            action: () => activeMsg && store.analyzeTicket(activeMsg, 'Professional'),
            shortcut: 'A P',
            color: 'text-blue-400',
            disabled: false,
            meta: ''
        },
        { 
            id: 'ai-friend', 
            label: 'Draft Friendly Reply', 
            icon: Sparkles, 
            action: () => activeMsg && store.analyzeTicket(activeMsg, 'Friendly'),
            shortcut: 'A F',
            color: 'text-green-400',
            disabled: false,
            meta: ''
        },
        { 
            id: 'ai-urgent', 
            label: 'Draft Urgent Reply', 
            icon: Zap, 
            action: () => activeMsg && store.analyzeTicket(activeMsg, 'Urgent'),
            shortcut: 'A U',
            color: 'text-red-400',
            disabled: false,
            meta: ''
        },
      ]
    },
    {
      group: 'Workflow',
      items: [
        { 
            id: 'send', 
            label: 'Send Reply', 
            icon: Send, 
            action: () => activeMsg?.reply && store.sendMessage(activeMsg.id),
            disabled: !activeMsg?.reply,
            shortcut: '⌘ ↵',
            meta: activeMsg?.reply ? 'Ready to send' : 'No draft yet',
            color: 'text-purple-400'
        },
        { 
            id: 'status', 
            label: 'Mark as Resolved', 
            icon: CheckCircle2, 
            action: () => console.log('Resolve'), // Placeholder
            shortcut: 'E',
            disabled: false,
            color: 'text-green-400',
            meta: ''
        },
      ]
    },
        {
        group: 'Navigation',
        items: [
             { id: 'nav-inbox', label: 'Go to Inbox', icon: ArrowRight, action: () => router.push('/'), disabled: false, color: 'text-slate-400', meta: '', shortcut: '' },
             { id: 'nav-profile', label: 'My Profile', icon: User, action: () => console.log('Settings'), disabled: false, color: 'text-slate-400', meta: '', shortcut: '' }
        ]
    }
  ]

  if (!q) return allCommands
  
  return allCommands.map(g => ({
    ...g,
    items: g.items.filter(i => i.label.toLowerCase().includes(q))
  })).filter(g => g.items.length > 0)
})

const flatItems = computed(() => groups.value.flatMap(g => g.items))

// Execution
const execute = (item: any) => {
    if (item.disabled) return
    item.action()
    isOpen.value = false
}

// Navigation Logic
const onKeydown = (e: KeyboardEvent) => {
    if (!isOpen.value) return

    if (e.key === 'ArrowDown') {
        e.preventDefault()
        selectedIndex.value = (selectedIndex.value + 1) % flatItems.value.length
    } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        selectedIndex.value = (selectedIndex.value - 1 + flatItems.value.length) % flatItems.value.length
    } else if (e.key === 'Enter') {
        e.preventDefault()
        execute(flatItems.value[selectedIndex.value])
    }
}

watch(search, () => selectedIndex.value = 0)
</script>

<template>
  <Transition 
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 font-sans">
      <div class="fixed inset-0 bg-nexus-950/60 backdrop-blur-sm transition-opacity" @click="isOpen = false"></div>

      <div 
        ref="container"
        class="w-full max-w-2xl bg-nexus-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative ring-1 ring-white/10"
        @keydown="onKeydown"
      >
        <div class="flex items-center px-5 py-5 border-b border-white/5 gap-4">
            <Command class="w-5 h-5 text-nexus-500 animate-pulse-slow" />
            <input 
                ref="commandInput"
                v-model="search"
                class="flex-1 bg-transparent text-lg text-white placeholder:text-slate-500 focus:outline-none font-light"
                placeholder="What would you like to do?"
            />
            <div class="flex gap-2">
                 <span class="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-500 font-mono border border-white/5">ESC</span>
            </div>
        </div>

        <div class="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
            <div v-if="flatItems.length === 0" class="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                <Search class="w-8 h-8 opacity-20" />
                <p class="text-sm">No commands found matching "{{ search }}"</p>
            </div>

            <div v-for="group in groups" :key="group.group" class="mb-2">
                <div class="px-3 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest pl-4">
                    {{ group.group }}
                </div>
                <div class="space-y-1">
                    <button
                        v-for="(item, idx) in group.items"
                        :key="item.id"
                        @click="execute(item)"
                        @mouseenter="selectedIndex = flatItems.indexOf(item)"
                        class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm transition-all duration-150 group relative overflow-hidden"
                        :class="[
                            flatItems[selectedIndex] === item 
                                ? 'bg-nexus-500 text-white shadow-glow' 
                                : 'text-slate-300 hover:bg-white/5',
                            item.disabled ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer'
                        ]"
                    >
                        <div v-if="flatItems[selectedIndex] === item" class="absolute left-0 top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white]"></div>

                        <div class="flex items-center gap-4">
                            <div 
                                class="w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 bg-white/5 group-hover:bg-white/10 transition-colors"
                                :class="flatItems[selectedIndex] === item ? 'bg-white/20 border-white/20' : ''"
                            >
                                <component :is="item.icon" class="w-4 h-4" :class="item.color || 'text-slate-400'" />
                            </div>
                            <div class="flex flex-col items-start">
                                <span class="font-medium">{{ item.label }}</span>
                                <span v-if="item.meta" class="text-[10px] opacity-60">{{ item.meta }}</span>
                            </div>
                        </div>
                        
                        <div class="flex items-center gap-3">
                            <span v-if="item.shortcut" class="font-mono text-[10px] opacity-50 px-2 py-1 bg-black/20 rounded border border-white/5">
                                {{ item.shortcut }}
                            </span>
                            <ArrowRight v-if="flatItems[selectedIndex] === item" class="w-4 h-4 opacity-50 -ml-2" />
                        </div>
                    </button>
                </div>
            </div>
        </div>
        
        <div class="px-5 py-3 bg-nexus-950/50 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
             <div class="flex gap-4">
                 <span class="flex items-center gap-1.5"><strong class="text-slate-400">↑↓</strong> Navigate</span>
                 <span class="flex items-center gap-1.5"><strong class="text-slate-400">↵</strong> Select</span>
             </div>
             <div>
                Nexus AI <span class="text-nexus-500">v2.0.26</span>
             </div>
        </div>
      </div>
    </div>
  </Transition>
</template>