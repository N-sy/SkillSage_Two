import { Component, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiService } from '../services/ai.service';

@Component({
  selector: 'app-assessment',
  imports: [CommonModule],
  template: `
    <div class="max-w-2xl mx-auto h-full flex flex-col pt-4">
      <!-- Header -->
      <div class="mb-6 text-center">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Assessment: {{ skill() }}</h2>
        <p class="text-gray-500 text-sm">Let's gauge your current level.</p>
      </div>

      <!-- Chat Area -->
      <div class="flex-1 overflow-y-auto space-y-4 p-4 mb-4 rounded-3xl bg-white dark:bg-[#1c1c1e] shadow-sm min-h-[400px]">
        @for (msg of messages(); track $index) {
          <div class="flex" [class.justify-end]="msg.role === 'user'">
            <div class="max-w-[80%] p-4 rounded-2xl" 
              [class.bg-blue-600]="msg.role === 'user'" 
              [class.text-white]="msg.role === 'user'"
              [class.bg-gray-100]="msg.role === 'model'"
              [class.dark:bg-gray-800]="msg.role === 'model'"
              [class.text-gray-800]="msg.role === 'model'"
              [class.dark:text-gray-200]="msg.role === 'model'">
              
              @if (msg.image) {
                <img [src]="msg.image" class="rounded-lg mb-2 max-h-40 w-full object-cover">
              }
              <p>{{ msg.text }}</p>
            </div>
          </div>
        }
        @if (isGenerating()) {
           <div class="flex justify-start">
             <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl flex gap-2 items-center">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
             </div>
           </div>
        }
      </div>

      <!-- Controls -->
      <div class="flex flex-col gap-3">
        <!-- Input Bar -->
        <div class="flex gap-2 items-end">
          <button class="p-3 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 relative overflow-hidden">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <input type="file" accept="image/*" (change)="handleImageUpload($event)" class="absolute inset-0 opacity-0 cursor-pointer">
          </button>
          
          <div class="flex-1 bg-white dark:bg-[#1c1c1e] rounded-2xl flex items-center p-1 border border-gray-200 dark:border-gray-700">
             @if (previewImage()) {
               <img [src]="previewImage()" class="h-10 w-10 rounded-lg ml-2 object-cover border border-gray-300">
             }
             <input #chatInput type="text" placeholder="Type or use voice..." (keyup.enter)="sendMessage(chatInput.value); chatInput.value=''" class="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 outline-none dark:text-white">
             
             <!-- Mic Button -->
             <button (click)="toggleVoice()" [class.text-red-500]="isListening()" class="p-2 mr-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
             </button>
          </div>

          <button (click)="sendMessage(chatInput.value); chatInput.value=''" class="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>

        <!-- Actions -->
        <div class="flex justify-between items-center mt-2 px-2">
           <button (click)="cancel.emit()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400">Cancel</button>
           <button (click)="finishAssessment()" class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium shadow-md transition-transform active:scale-95">
             Generate Plan
           </button>
        </div>
      </div>
    </div>
  `
})
export class AssessmentComponent {
  skill = input.required<string>();
  complete = output<string>(); // Emits summary
  cancel = output<void>();

  ai = inject(AiService);

  messages = signal<{role: 'user' | 'model', text: string, image?: string}[]>([
    { role: 'model', text: 'Hi! Before I build your plan, tell me a bit about your current experience level. Are you a total beginner?' }
  ]);
  
  isGenerating = signal(false);
  previewImage = signal<string | null>(null);
  
  // Voice Logic
  isListening = signal(false);
  recognition: any;

  constructor() {
    if ('webkitSpeechRecognition' in window) {
      // @ts-ignore
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        this.sendMessage(text);
        this.isListening.set(false);
      };
      this.recognition.onerror = () => this.isListening.set(false);
      this.recognition.onend = () => this.isListening.set(false);
    }
  }

  toggleVoice() {
    if (!this.recognition) {
      alert('Voice input not supported in this browser.');
      return;
    }
    if (this.isListening()) {
      this.recognition.stop();
      this.isListening.set(false);
    } else {
      this.recognition.start();
      this.isListening.set(true);
    }
  }

  handleImageUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => this.previewImage.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  async sendMessage(text: string) {
    if ((!text.trim() && !this.previewImage()) || this.isGenerating()) return;
    
    const userMsg = { role: 'user' as const, text, image: this.previewImage() || undefined };
    this.messages.update(m => [...m, userMsg]);
    
    // Clear inputs
    const imgData = this.previewImage() ? this.previewImage()!.split(',')[1] : undefined;
    this.previewImage.set(null);
    
    this.isGenerating.set(true);

    try {
      // Context is the chat history, but for simplicity we send last interaction or a summary in real app
      // Here we assume single turn or simple memory for the demo
      const response = await this.ai.assessSkill(this.skill(), text, imgData);
      this.messages.update(m => [...m, { role: 'model', text: response }]);
    } catch (e) {
      this.messages.update(m => [...m, { role: 'model', text: 'Sorry, I had trouble processing that. Can you try again?' }]);
    } finally {
      this.isGenerating.set(false);
    }
  }

  finishAssessment() {
    // Collect all user messages as summary
    const summary = this.messages()
      .filter(m => m.role === 'user')
      .map(m => m.text)
      .join('. ');
    
    this.complete.emit(summary || 'Beginner');
  }
}
