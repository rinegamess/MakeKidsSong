export interface StoryboardScene {
  id: number;
  timeStart: number;
  timeEnd: number;
  visual: string;
  cameraMovement: string;
  character: string;
  animation: string;
  background: string;
  mood: string;
  colorPalette: string;
  subtitle: string;
  narration: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface Project {
  id: string;
  name: string;
  topic: string;
  ageGroup: string;
  language: string;
  songStyle: string;
  videoStyle: string;
  voiceStyle: string;
  status: 'idle' | 'generating' | 'completed' | 'failed';
  currentStep: string;
  progress: number;
  createdAt: string;
  duration: number;
  elapsedTime: number; // in seconds
  apiCost: number; // estimated in USD
  sceneCount: number;
  imageCount: number;
  error?: string | null;
  lyrics?: string;
  storyboard?: StoryboardScene[];
  hasVideo?: boolean;
}

export interface ProjectLog {
  timestamp: string;
  message: string;
  step?: string;
}
