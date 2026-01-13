import { Injectable, signal } from '@angular/core';

export interface Plan {
  id: string;
  skill: string;
  config: any;
  modules: any[];
  progress: number; // 0-100
  logs: Log[];
  createdAt: number;
}

export interface Log {
  id: string;
  date: string;
  text: string;
  media?: string; // base64 or url
  mediaType?: 'image' | 'video' | 'audio';
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly STORAGE_KEY = 'skill_sage_plans';
  private readonly SCHEDULE_KEY = 'skill_sage_schedule';
  
  plans = signal<Plan[]>([]);
  schedule = signal<any>({ wake: '07:00', sleep: '23:00', workStart: '09:00', workEnd: '17:00' });
  
  // Google Drive Config (Placeholders)
  isAuthenticated = signal(false);
  userProfile = signal<any>(null);
  
  constructor() {
    this.loadLocal();
  }

  private loadLocal() {
    const p = localStorage.getItem(this.STORAGE_KEY);
    if (p) this.plans.set(JSON.parse(p));
    
    const s = localStorage.getItem(this.SCHEDULE_KEY);
    if (s) this.schedule.set(JSON.parse(s));
  }

  savePlan(plan: Plan) {
    this.plans.update(current => {
      const idx = current.findIndex(p => p.id === plan.id);
      let newPlans;
      if (idx >= 0) {
        newPlans = [...current];
        newPlans[idx] = plan;
      } else {
        newPlans = [...current, plan];
      }
      this.persist(newPlans);
      return newPlans;
    });
  }

  deletePlan(id: string) {
    this.plans.update(current => {
      const newPlans = current.filter(p => p.id !== id);
      this.persist(newPlans);
      return newPlans;
    });
  }

  saveSchedule(sched: any) {
    this.schedule.set(sched);
    localStorage.setItem(this.SCHEDULE_KEY, JSON.stringify(sched));
  }

  private persist(plans: Plan[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(plans));
    // If authenticated, would verify queue sync to Drive here
  }

  // --- Mock/Shell for Drive Auth ---
  // In a real applet, we need a valid Client ID. 
  // Since we cannot ask the user for one in code generation securely, 
  // we provide the logic but it requires setup.
  
  async loginToGoogle() {
    // Placeholder for actual OAuth flow
    // requestToken() -> set isAuthenticated -> loadDriveFile()
    console.log('Google Auth initialized (Requires valid Client ID configuration)');
    alert('To enable Google Sync, the developer must configure a valid Google Cloud Client ID in the code.');
    // Simulating login for UI demonstration
    this.isAuthenticated.set(true);
    this.userProfile.set({ name: 'User', picture: 'https://ui-avatars.com/api/?name=User' });
  }

  logout() {
    this.isAuthenticated.set(false);
    this.userProfile.set(null);
  }
}
