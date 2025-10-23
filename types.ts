
export type View = 'chat' | 'imageGen' | 'imageEdit' | 'videoGen' | 'videoAnalyze' | 'audioTranscript' | 'storyToVideo';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export interface StoryIdea {
  id: number;
  title: string;
  description: string;
}

export interface VideoPromptSegment {
  segment: number;
  prompt: string;
  videoUrl?: string;
  status: 'pending' | 'generating' | 'done' | 'error';
}
