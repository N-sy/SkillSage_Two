import { Injectable } from '@angular/core';
import { GoogleGenAI, Type, Schema } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private ai: GoogleGenAI;
  // NOTE: In a real app, strict handling of API key is needed.
  // Here we assume process.env.API_KEY is available via the Applet environment.
  private apiKey = process.env['API_KEY'] || '';

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  async generateSuggestions(history: string): Promise<string[]> {
    const model = 'gemini-2.5-flash';
    const schema: Schema = {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    };

    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: `Based on this learning history: "${history}". Suggest 6 new distinct skills I might like to learn. Return only a JSON array of strings.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema
        }
      });
      return JSON.parse(response.text || '[]');
    } catch (e) {
      console.error('Error generating suggestions', e);
      return ['Photography', 'Cooking', 'Meditation', 'Spanish', 'Coding', 'Gardening'];
    }
  }

  async assessSkill(context: any, input: string, image?: string): Promise<string> {
    const model = 'gemini-2.5-flash';
    const parts: any[] = [];
    
    if (image) {
      parts.push({
        inlineData: { mimeType: 'image/jpeg', data: image } // Assuming JPEG for simplicity
      });
    }
    parts.push({ text: input });

    const response = await this.ai.models.generateContent({
      model,
      contents: { role: 'user', parts: parts },
      config: {
        systemInstruction: "You are a friendly skill assessor. Analyze the user's input (and optional image) to determine their current skill level (Beginner, Intermediate, Advanced). Ask a follow-up question if needed, or provide a brief summary of their level to start the plan."
      }
    });

    return response.text || "I couldn't quite catch that. Could you try again?";
  }

  async generatePlan(skill: string, config: any, assessmentSummary: string): Promise<any> {
    const model = 'gemini-2.5-flash'; // Using flash with thinking for plan gen
    
    const prompt = `
      Create a learning plan for "${skill}".
      Configuration: ${JSON.stringify(config)}.
      User Level/Assessment: ${assessmentSummary}.
      
      Generate a structured curriculum. 
      If framework is DiSSS, ensure it follows Deconstruction, Selection, Sequencing, Stakes.
      Ensure tasks are actionable.
      Provide 4 weeks of content.
    `;

    const taskSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        completed: { type: Type.BOOLEAN },
        resources: { 
          type: Type.ARRAY, 
          items: { 
            type: Type.OBJECT, 
            properties: { title: {type: Type.STRING}, url: {type: Type.STRING} } 
          } 
        }
      }
    };

    const moduleSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        week: { type: Type.INTEGER },
        description: { type: Type.STRING },
        tasks: { type: Type.ARRAY, items: taskSchema }
      }
    };

    const planSchema: Schema = {
      type: Type.ARRAY,
      items: moduleSchema
    };

    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: planSchema,
          // thinkingConfig: { thinkingBudget: 100 } // Optional: enable for better logic
        }
      });
      return JSON.parse(response.text || '[]');
    } catch (e) {
      console.error('Plan generation failed', e);
      throw e;
    }
  }

  async generateQuiz(topic: string): Promise<any[]> {
    const model = 'gemini-2.5-flash';
    const schema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctIndex: { type: Type.INTEGER }
        }
      }
    };

    const response = await this.ai.models.generateContent({
      model,
      contents: `Generate 3 multiple choice questions about "${topic}".`,
      config: { responseMimeType: 'application/json', responseSchema: schema }
    });
    
    return JSON.parse(response.text || '[]');
  }

  getChatModel(systemInstruction: string) {
    return this.ai.chats.create({
      model: 'gemini-2.5-flash',
      config: { systemInstruction }
    });
  }
}
