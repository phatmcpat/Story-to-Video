
import { AspectRatio } from './types';

export const MODELS = {
  CHAT: 'gemini-2.5-flash',
  PRO: 'gemini-2.5-pro',
  IMAGE_GEN: 'imagen-4.0-generate-001',
  IMAGE_EDIT: 'gemini-2.5-flash-image',
  VIDEO_GEN: 'veo-3.1-fast-generate-preview',
  AUDIO_TRANSCRIPTION: 'gemini-2.5-flash',
  TTS: 'gemini-2.5-flash-preview-tts',
};

export const ASPECT_RATIOS: AspectRatio[] = ["1:1", "16:9", "9:16", "4:3", "3:4"];

export const VEO_POLLING_MESSAGES = [
  "Warming up the video synthesizer...",
  "Gathering pixels from the digital ether...",
  "Teaching photons how to dance...",
  "Rendering cinematic brilliance, one frame at a time...",
  "The director is reviewing the dailies...",
  "This is taking a moment, your masterpiece is worth the wait.",
  "Finalizing the color grade and special effects...",
  "Polishing the final cut...",
];
