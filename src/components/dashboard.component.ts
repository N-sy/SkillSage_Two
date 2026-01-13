import { Component, inject, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService, Plan, Log } from '../services/storage.service';
import { AiService } from '../services/ai.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  template: `
    <div class="h-full flex flex-col">
      <!-- Top Bar -->
      <div class="flex items-center gap-4 mb-6">
        <button (click)="back.emit()" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ plan().skill }}</h1>
          <div class="flex items-center gap-2 text-sm text-gray-500">
             <div class="h-2 w-24 bg-gray-200 rounded-full dark:bg-gray-700">
                <div class="h-2 bg-green-500 rounded-full" [style.width.%]="plan().progress"></div>
             </div>
             <span>{{ plan().progress }}% Complete</span>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex gap-2 overflow-x-auto pb-2 mb-4 border-b border-gray-200 dark:border-gray-800">
        @for (tab of tabs; track tab) {
          <button (click)="activeTab.set(tab.id)" 
            class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
            [class.bg-black]="activeTab() === tab.id"
            [class.text-white]="activeTab() === tab.id"
            [class.dark:bg-white]="activeTab() === tab.id"
            [class.dark:text-black]="activeTab() === tab.id"
            [class.text-gray-600]="activeTab() !== tab.id"
            [class.dark:text-gray-400]="activeTab() !== tab.id"
            [class.hover:bg-gray-100]="activeTab() !== tab.id"
            [class.dark:hover:bg-gray-800]="activeTab() !== tab.id">
            {{ tab.label }}
          </button>
        }
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto pb-20">
        
        <!-- PLAN VIEW -->
        @if (activeTab() === 'plan') {
          <div class="space-y-6">
            <!-- Week Selector -->
            <div class="flex gap-4 overflow-x-auto py-2">
              @for (module of plan().modules; track $index) {
                <div (click)="currentModuleIdx.set($index)" 
                     class="cursor-pointer min-w-[140px] p-4 rounded-2xl border transition-all"
                     [class]="currentModuleIdx() === $index 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 dark:border-blue-400' 
                        : 'bg-white dark:bg-[#1c1c1e]'">
                  <span class="text-xs text-gray-500 uppercase tracking-wide">Week {{ module.week }}</span>
                  <h3 class="font-bold text-gray-900 dark:text-white truncate">{{ module.title }}</h3>
                </div>
              }
            </div>

            <!-- Current Week Tasks -->
            <div class="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 shadow-sm">
               <div class="flex justify-between items-center mb-4">
                 <h2 class="text-xl font-bold dark:text-white">This Week's Tasks</h2>
                 <button (click)="generateQuiz()" class="text-sm text-blue-600 font-medium hover:underline">
                    Take Quiz
                 </button>
               </div>
               
               <div class="space-y-4">
                 @for (task of currentModule().tasks; track $index) {
                   <div class="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                     <input type="checkbox" [checked]="task.completed" (change)="toggleTask($index)" 
                            class="mt-1 w-5 h-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500">
                     <div class="flex-1">
                       <h4 class="font-medium text-gray-900 dark:text-white" [class.line-through]="task.completed" [class.text-gray-400]="task.completed">
                         {{ task.title }}
                       </h4>
                       <p class="text-sm text-gray-500 mt-1">{{ task.description }}</p>
                       @if (task.resources && task.resources.length > 0) {
                         <div class="flex gap-2 mt-2 flex-wrap">
                           @for (res of task.resources; track $index) {
                             <a [href]="res.url" target="_blank" class="text-xs flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md dark:bg-blue-900 dark:text-blue-300 hover:opacity-80">
                               🔗 {{ res.title }}
                             </a>
                           }
                         </div>
                       }
                     </div>
                   </div>
                 }
               </div>
            </div>
          </div>
        }

        <!-- QUIZ MODAL OVERLAY -->
        @if (showQuiz()) {
          <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div class="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 w-full max-w-md shadow-2xl">
              <div class="flex justify-between mb-4">
                <h2 class="text-xl font-bold dark:text-white">Quick Quiz</h2>
                <button (click)="showQuiz.set(false)" class="text-gray-500">✕</button>
              </div>
              
              @if (quizQuestions().length === 0) {
                <div class="py-8 text-center text-gray-500">Generating questions...</div>
              } @else {
                 @for (q of quizQuestions(); track $index) {
                   <div class="mb-6">
                     <p class="font-medium mb-2 dark:text-white">{{ $index + 1 }}. {{ q.question }}</p>
                     <div class="space-y-2">
                       @for (opt of q.options; track $index) {
                         <div class="p-2 border rounded-xl text-sm dark:border-gray-700 dark:text-gray-300">
                           {{ opt }}
                         </div>
                       }
                     </div>
                   </div>
                 }
                 <button (click)="showQuiz.set(false)" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Done</button>
              }
            </div>
          </div>
        }

        <!-- JOURNAL VIEW -->
        @if (activeTab() === 'log') {
           <div class="space-y-6">
             <div class="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 shadow-sm">
               <textarea #logInput placeholder="What did you learn today?" class="w-full h-32 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"></textarea>
               <div class="flex justify-between mt-4">
                 <button class="text-gray-500 hover:text-blue-600">
                   📷 Add Media
                 </button>
                 <button (click)="addLog(logInput.value); logInput.value=''" class="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full font-medium">
                   Log Entry
                 </button>
               </div>
             </div>

             <div class="space-y-4">
               <h3 class="font-bold text-gray-900 dark:text-white">History</h3>
               @for (log of plan().logs; track log.id) {
                 <div class="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl border-l-4 border-blue-500">
                   <span class="text-xs text-gray-400">{{ log.date }}</span>
                   <p class="mt-1 text-gray-800 dark:text-gray-200">{{ log.text }}</p>
                 </div>
               }
             </div>
           </div>
        }
        
        <!-- SAGE VIEW -->
        @if (activeTab() === 'sage') {
          <div class="bg-white dark:bg-[#1c1c1e] rounded-3xl p-4 shadow-sm h-[500px] flex flex-col">
             <div class="flex-1 overflow-y-auto mb-4 space-y-4">
               @for (msg of sageMessages(); track $index) {
                 <div class="p-3 rounded-2xl max-w-[85%]" [class.ml-auto]="msg.role === 'user'" [class.bg-blue-600]="msg.role === 'user'" [class.text-white]="msg.role === 'user'" [class.bg-gray-100]="msg.role === 'model'" [class.text-gray-800]="msg.role === 'model'">
                   {{ msg.text }}
                 </div>
               }
             </div>
             <div class="flex gap-2">
               <input #sageInput type="text" (keyup.enter)="askSage(sageInput.value); sageInput.value=''" placeholder="Ask about {{plan().skill}}..." class="flex-1 bg-gray-50 dark:bg-gray-900 rounded-xl px-4 py-3 outline-none dark:text-white">
               <button (click)="askSage(sageInput.value); sageInput.value=''" class="bg-blue-600 text-white p-3 rounded-xl">Send</button>
             </div>
          </div>
        }

      </div>
    </div>
  `
})
export class DashboardComponent {
  plan = input.required<Plan>();
  back = output<void>();
  
  storage = inject(StorageService);
  ai = inject(AiService);

  activeTab = signal<'plan' | 'log' | 'resources' | 'sage' | 'adapt'>('plan');
  tabs = [
    { id: 'plan', label: 'Plan' },
    { id: 'log', label: 'Journal' },
    { id: 'sage', label: 'AI Coach' },
    // Simplified for demo length
  ];

  currentModuleIdx = signal(0);
  currentModule = computed(() => this.plan().modules[this.currentModuleIdx()] || { tasks: [] });

  showQuiz = signal(false);
  quizQuestions = signal<any[]>([]);
  sageMessages = signal<{role:string, text:string}[]>([]);

  constructor() {
    // init logic if needed
  }

  toggleTask(taskIdx: number) {
    const p = this.plan();
    const modIdx = this.currentModuleIdx();
    
    // Toggle
    p.modules[modIdx].tasks[taskIdx].completed = !p.modules[modIdx].tasks[taskIdx].completed;
    
    // Recalculate progress
    let total = 0;
    let completed = 0;
    p.modules.forEach(m => m.tasks.forEach((t: any) => {
      total++;
      if (t.completed) completed++;
    }));
    
    p.progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    this.storage.savePlan(p);
  }

  addLog(text: string) {
    if (!text.trim()) return;
    const p = this.plan();
    if (!p.logs) p.logs = [];
    
    p.logs.unshift({
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      text
    });
    this.storage.savePlan(p);
  }

  async generateQuiz() {
    this.showQuiz.set(true);
    this.quizQuestions.set([]); // Clear old
    const topic = this.currentModule().title;
    try {
      const qs = await this.ai.generateQuiz(topic);
      this.quizQuestions.set(qs);
    } catch(e) {
      this.showQuiz.set(false);
      alert('Failed to generate quiz. Try again.');
    }
  }

  async askSage(text: string) {
    if (!text.trim()) return;
    this.sageMessages.update(m => [...m, { role: 'user', text }]);
    
    try {
      const chat = this.ai.getChatModel(`You are an expert tutor for ${this.plan().skill}.`);
      const response = await chat.sendMessage({ message: text });
      this.sageMessages.update(m => [...m, { role: 'model', text: response.text }]);
    } catch (e) {
      // Error handling
    }
  }
}
