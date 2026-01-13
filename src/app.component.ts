import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './components/home.component';
import { AssessmentComponent } from './components/assessment.component';
import { DashboardComponent } from './components/dashboard.component';
import { StorageService, Plan } from './services/storage.service';
import { AiService } from './services/ai.service';
import { FormsModule } from '@angular/forms';

type ViewState = 'HOME' | 'WIZARD' | 'ASSESSMENT' | 'GENERATING' | 'DASHBOARD';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, HomeComponent, AssessmentComponent, DashboardComponent],
  template: `
    <div class="min-h-screen max-w-md mx-auto bg-white dark:bg-black shadow-2xl overflow-hidden relative">
      <div class="h-full p-6 overflow-y-auto scrollbar-hide">
        
        @switch (view()) {
          @case ('HOME') {
            <app-home 
              (selectPlan)="openPlan($event)" 
              (createNew)="startWizard()"
              (selectSuggestion)="suggestionSelected($event)">
            </app-home>
          }
          
          @case ('WIZARD') {
            <div class="animate-fade-in">
              <div class="flex items-center gap-4 mb-6">
                <button (click)="view.set('HOME')" class="text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <h2 class="text-2xl font-bold dark:text-white">What to learn?</h2>
              </div>
              
              <div class="space-y-6">
                <div>
                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skill Name</label>
                   <input type="text" [(ngModel)]="newPlanData.skill" placeholder="e.g. Guitar, Python" class="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                </div>
                
                <div>
                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Goal (Context)</label>
                   <textarea [(ngModel)]="newPlanData.context" placeholder="Why? (e.g., for a job, hobby)" class="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none focus:ring-2 focus:ring-blue-500 dark:text-white h-24"></textarea>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Framework</label>
                  <div class="flex gap-4">
                    <button (click)="newPlanData.framework = 'Standard'" [class.bg-blue-600]="newPlanData.framework === 'Standard'" [class.text-white]="newPlanData.framework === 'Standard'" class="flex-1 p-3 rounded-xl border dark:border-gray-700 text-sm font-medium transition-colors">Standard</button>
                    <button (click)="newPlanData.framework = 'DiSSS'" [class.bg-blue-600]="newPlanData.framework === 'DiSSS'" [class.text-white]="newPlanData.framework === 'DiSSS'" class="flex-1 p-3 rounded-xl border dark:border-gray-700 text-sm font-medium transition-colors">DiSSS</button>
                  </div>
                </div>

                <button (click)="goToAssessment()" [disabled]="!newPlanData.skill" class="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold text-lg disabled:opacity-50">
                  Next: Assessment
                </button>
              </div>
            </div>
          }
          
          @case ('ASSESSMENT') {
            <app-assessment 
              [skill]="newPlanData.skill" 
              (cancel)="view.set('HOME')"
              (complete)="generatePlan($event)">
            </app-assessment>
          }

          @case ('GENERATING') {
            <div class="flex flex-col items-center justify-center h-full text-center space-y-6 animate-pulse">
               <div class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
               <div>
                 <h2 class="text-xl font-bold dark:text-white">Crafting your Curriculum...</h2>
                 <p class="text-gray-500">Using the {{newPlanData.framework}} framework</p>
               </div>
            </div>
          }

          @case ('DASHBOARD') {
            @if (activePlan()) {
              <app-dashboard 
                [plan]="activePlan()!" 
                (back)="view.set('HOME')">
              </app-dashboard>
            }
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AppComponent {
  view = signal<ViewState>('HOME');
  
  storage = inject(StorageService);
  ai = inject(AiService);

  activePlan = signal<Plan | null>(null);
  
  newPlanData = {
    skill: '',
    context: '',
    framework: 'Standard'
  };

  openPlan(plan: Plan) {
    this.activePlan.set(plan);
    this.view.set('DASHBOARD');
  }

  startWizard() {
    this.newPlanData = { skill: '', context: '', framework: 'Standard' };
    this.view.set('WIZARD');
  }

  // Hack for suggestion
  suggestionSelected(skill: any) {
    // The event from home is a CustomEvent in the HTML template but here we get the payload
    // Actually Angular Outputs emit the value directly.
    if (typeof skill === 'string') {
        this.newPlanData = { skill: skill, context: 'Interested from suggestions', framework: 'Standard' };
        this.view.set('WIZARD');
    } else if (skill && skill.detail) {
        // Fallback if it wraps
        this.newPlanData = { skill: skill.detail, context: 'Interested from suggestions', framework: 'Standard' };
        this.view.set('WIZARD');
    }
  }

  goToAssessment() {
    this.view.set('ASSESSMENT');
  }

  async generatePlan(assessmentSummary: string) {
    this.view.set('GENERATING');
    
    try {
      const modules = await this.ai.generatePlan(
        this.newPlanData.skill,
        { 
          context: this.newPlanData.context, 
          framework: this.newPlanData.framework 
        },
        assessmentSummary
      );

      const newPlan: Plan = {
        id: Date.now().toString(),
        skill: this.newPlanData.skill,
        config: this.newPlanData,
        modules: modules,
        progress: 0,
        logs: [],
        createdAt: Date.now()
      };

      this.storage.savePlan(newPlan);
      this.activePlan.set(newPlan);
      this.view.set('DASHBOARD');

    } catch (e) {
      alert('Failed to generate plan. Please try again.');
      this.view.set('HOME');
    }
  }
}
