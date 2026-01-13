import { Component, computed, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService, Plan } from '../services/storage.service';
import { AiService } from '../services/ai.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  template: `
    <div class="space-y-8 animate-fade-in pb-20">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Home</h1>
          <p class="text-gray-500 dark:text-gray-400">Welcome back, Scholar.</p>
        </div>
        @if (storage.isAuthenticated()) {
          <img [src]="storage.userProfile().picture" class="w-10 h-10 rounded-full border border-gray-200" alt="Profile" (click)="storage.logout()">
        } @else {
          <button (click)="storage.loginToGoogle()" class="text-sm text-blue-600 font-medium hover:underline">
            Sync with Drive
          </button>
        }
      </div>

      <!-- Current Plans -->
      <section>
        <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Active Plans</h2>
        @if (storage.plans().length === 0) {
          <div class="p-8 text-center border-2 border-dashed border-gray-300 rounded-3xl text-gray-500">
            No active plans. Start learning something new!
          </div>
        }
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (plan of storage.plans(); track plan.id) {
            <div (click)="selectPlan.emit(plan)" class="group cursor-pointer bg-white dark:bg-[#1c1c1e] p-6 rounded-3xl shadow-sm hover:shadow-md transition-all border border-transparent hover:border-blue-500/20 relative">
              <div class="flex justify-between items-start mb-4">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ plan.skill }}</h3>
                <span class="text-xs font-mono px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {{ plan.progress || 0 }}%
                </span>
              </div>
              
              <!-- Progress Bar -->
              <div class="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 mb-2">
                <div class="bg-blue-600 h-2 rounded-full transition-all duration-500" [style.width.%]="plan.progress"></div>
              </div>
              <p class="text-xs text-gray-400">Next: Continue Module {{ (plan.currentModuleIndex || 0) + 1 }}</p>

              <!-- Delete Action (Hover) -->
              <button (click)="$event.stopPropagation(); deletePlan(plan.id)" class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-50 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          }
          
          <!-- Add New Card -->
          <div (click)="createNew.emit()" class="cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl flex flex-col items-center justify-center p-6 min-h-[160px] hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
            <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
            <span class="font-medium text-gray-600 dark:text-gray-400">New Skill</span>
          </div>
        </div>
      </section>

      <!-- Systems Coach -->
      <section class="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-900/20 p-6 rounded-3xl">
        <div class="flex justify-between items-center mb-4 cursor-pointer" (click)="toggleCoach()">
          <h2 class="text-lg font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5v.01"/><path d="M16 12v.01"/><path d="M12 16v.01"/></svg>
            Systems Coach
          </h2>
          <span class="text-indigo-400">{{ showCoach() ? 'Hide' : 'Open' }}</span>
        </div>
        
        @if (showCoach()) {
          <div class="animate-slide-down space-y-4">
             <div class="bg-white/50 dark:bg-black/20 p-4 rounded-xl text-sm mb-4 max-h-40 overflow-y-auto">
               @for (msg of coachMessages(); track $index) {
                 <div class="mb-2" [class.text-right]="msg.role === 'user'">
                   <span class="inline-block px-3 py-2 rounded-lg" [class.bg-indigo-100]="msg.role === 'user'" [class.bg-white]="msg.role === 'model'" [class.dark:bg-indigo-900]="msg.role === 'user'" [class.dark:bg-gray-800]="msg.role === 'model'">
                     {{ msg.text }}
                   </span>
                 </div>
               }
             </div>
             <div class="flex gap-2">
               <input #coachInput type="text" placeholder="Ask about habits..." (keyup.enter)="askCoach(coachInput.value); coachInput.value=''" class="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
               <button (click)="askCoach(coachInput.value); coachInput.value=''" class="bg-indigo-600 text-white p-2 rounded-xl">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
               </button>
             </div>
          </div>
        }
      </section>

      <!-- AI Suggestions -->
      <section>
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Suggested for You</h2>
          <button (click)="refreshSuggestions()" class="text-blue-500 text-sm">Refresh</button>
        </div>
        <div class="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          @for (skill of suggestions(); track $index) {
            <div (click)="startSuggestion(skill)" class="snap-center shrink-0 w-40 h-32 bg-white dark:bg-[#1c1c1e] rounded-2xl p-4 flex flex-col justify-end shadow-sm cursor-pointer hover:scale-105 transition-transform">
              <span class="font-bold text-gray-800 dark:text-white">{{ skill }}</span>
              <span class="text-xs text-gray-400 mt-1">Start now &rarr;</span>
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .animate-slide-down { animation: slideDown 0.3s ease-out; }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class HomeComponent {
  storage = inject(StorageService);
  ai = inject(AiService);
  
  selectPlan = output<Plan>(); 
  createNew = output<void>();
  selectSuggestion = output<string>();
  
  showCoach = signal(false);
  coachMessages = signal<{role: string, text: string}[]>([
    { role: 'model', text: 'Hello! I am your Atomic Habits coach. I can help you build systems to stick to your learning goals. How is your schedule looking?' }
  ]);
  
  suggestions = signal<string[]>(['Public Speaking', 'Watercolor', 'Python', 'Chess', 'Yoga', 'Speed Reading']);

  async askCoach(text: string) {
    if (!text.trim()) return;
    this.coachMessages.update(msgs => [...msgs, { role: 'user', text }]);
    
    // Simple direct chat for now
    try {
      const chat = this.ai.getChatModel('You are an Atomic Habits expert coach. Keep answers short, encouraging, and focused on systems, not goals.');
      const result = await chat.sendMessage({ message: text });
      this.coachMessages.update(msgs => [...msgs, { role: 'model', text: result.text }]);
    } catch (e) {
      this.coachMessages.update(msgs => [...msgs, { role: 'model', text: 'I need a moment to think. Try again?' }]);
    }
  }

  toggleCoach() {
    this.showCoach.set(!this.showCoach());
  }

  startSuggestion(skill: string) {
    this.selectSuggestion.emit(skill);
  }

  deletePlan(id: string) {
    if(confirm('Are you sure you want to delete this plan?')) {
      this.storage.deletePlan(id);
    }
  }

  async refreshSuggestions() {
    this.suggestions.set(['Loading...']);
    const history = this.storage.plans().map(p => p.skill).join(', ');
    const newSug = await this.ai.generateSuggestions(history);
    this.suggestions.set(newSug);
  }
}