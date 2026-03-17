import { ChangeDetectionStrategy, Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { GoogleGenAI } from '@google/genai';
import { animate } from 'motion';

type Format = 'Post' | 'Reel Script' | 'Carousel' | 'Story';
type Platform = 'Instagram' | 'LinkedIn' | 'X' | 'TikTok';
type Tone = 'Luxury' | 'Professional' | 'Creative' | 'Witty';
type Language = 'en' | 'ar';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  // State
  language = signal<Language>('en');
  format = signal<Format>('Post');
  platform = signal<Platform>('Instagram');
  tone = signal<Tone>('Luxury');
  prompt = signal<string>('');
  output = signal<string>('');
  isGenerating = signal<boolean>(false);
  copySuccess = signal<boolean>(false);

  // Translations
  t = computed(() => {
    const en = {
      title: 'Promptly',
      subtitle: 'Luxury AI Content Generator',
      formatLabel: 'Content Format',
      platformLabel: 'Platform',
      toneLabel: 'Tone',
      inputPlaceholder: 'Describe your content idea...',
      generateBtn: 'Generate Content',
      generating: 'Crafting...',
      copyBtn: 'Copy to Clipboard',
      copied: 'Copied!',
      formats: ['Post', 'Reel Script', 'Carousel', 'Story'],
      platforms: ['Instagram', 'LinkedIn', 'X', 'TikTok'],
      tones: ['Luxury', 'Professional', 'Creative', 'Witty'],
      dir: 'ltr' as const,
    };
    const ar = {
      title: 'برومبتلي',
      subtitle: 'مولد محتوى فاخر بالذكاء الاصطناعي',
      formatLabel: 'تنسيق المحتوى',
      platformLabel: 'المنصة',
      toneLabel: 'النبرة',
      inputPlaceholder: 'صف فكرة المحتوى الخاص بك...',
      generateBtn: 'توليد المحتوى',
      generating: 'جاري الصياغة...',
      copyBtn: 'نسخ إلى الحافظة',
      copied: 'تم النسخ!',
      formats: ['منشور', 'سيناريو ريل', 'كاروسيل', 'ستوري'],
      platforms: ['إنستغرام', 'لينكد إن', 'إكس', 'تيك توك'],
      tones: ['فاخر', 'احترافي', 'إبداعي', 'ذكي'],
      dir: 'rtl' as const,
    };
    return this.language() === 'en' ? en : ar;
  });

  constructor() {
    // Update document direction when language changes
    effect(() => {
      document.documentElement.dir = this.t().dir;
      document.documentElement.lang = this.language();
    });
  }

  toggleLanguage() {
    this.language.update(l => l === 'en' ? 'ar' : 'en');
  }

  async generate() {
    if (!this.prompt().trim() || this.isGenerating()) return;

    this.isGenerating.set(true);
    this.output.set('');

    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const model = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: this.getSystemPrompt(),
        },
        contents: [{ parts: [{ text: this.prompt() }] }],
      });

      const response = await model;
      this.output.set(response.text || '');
      
      // Animate output appearance
      setTimeout(() => {
        const el = document.querySelector('.output-area');
        if (el) {
          animate(el, { opacity: [0, 1], y: [20, 0] }, { duration: 0.5 });
        }
      }, 0);

    } catch (error) {
      console.error('Generation failed:', error);
      this.output.set(this.language() === 'en' ? 'Failed to generate content. Please try again.' : 'فشل توليد المحتوى. يرجى المحاولة مرة أخرى.');
    } finally {
      this.isGenerating.set(false);
    }
  }

  private getSystemPrompt(): string {
    const lang = this.language() === 'en' ? 'English' : 'Arabic';
    const carouselInstruction = this.format() === 'Carousel' 
      ? 'Format the output as "Slide 1, Slide 2, etc." for each slide.' 
      : '';

    return `You are a professional social media content strategist for luxury brands. 
    Your goal is to create high-end, engaging content in ${lang}.
    
    Context:
    - Platform: ${this.platform()}
    - Format: ${this.format()}
    - Tone: ${this.tone()}
    
    Instructions:
    - Use sophisticated vocabulary and elegant phrasing.
    - Include relevant emojis sparingly to maintain a premium feel.
    - ${carouselInstruction}
    - Ensure the content is optimized for ${this.platform()}.
    - If the format is "Reel Script", include visual cues and dialogue.
    - If the format is "Story", keep it punchy and interactive.
    
    Respond ONLY with the generated content.`;
  }

  async copyToClipboard() {
    if (!this.output()) return;
    
    try {
      await navigator.clipboard.writeText(this.output());
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
}
