
import { GoogleGenAI, GenerateContentResponse, Modality, Type, VideosOperation, VideoGenerationReferenceImage } from "@google/genai";
import { AspectRatio } from '../types';

const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

export const generateChatMessage = async (prompt: string, history: { role: string, parts: { text: string }[] }[], useThinkingMode: boolean): Promise<GenerateContentResponse> => {
  const ai = getAiClient();
  const model = useThinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
  const config = useThinkingMode ? { thinkingConfig: { thinkingBudget: 32768 } } : {};
  
  const chat = ai.chats.create({ model, config, history });
  const response = await chat.sendMessage({ message: prompt });
  return response;
};

export const generateImage = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio,
    },
  });
  return response.generatedImages[0].image.imageBytes;
};

export const editImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: imageBase64, mimeType } },
        { text: prompt },
      ],
    },
    config: { responseModalities: [Modality.IMAGE] },
  });
  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part?.inlineData) {
    return part.inlineData.data;
  }
  throw new Error("No image data in response.");
};

export const generateVideo = async (prompt: string, aspectRatio: AspectRatio, image?: { base64: string; mimeType: string }, onProgress?: (message: string) => void): Promise<VideosOperation> => {
    const ai = getAiClient();
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        ...(image && { image: { imageBytes: image.base64, mimeType: image.mimeType } }),
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio,
        }
    });

    while (!operation.done) {
        onProgress?.(`Operation status: ${operation.status?.state || 'processing'}. Please wait...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    return operation;
};

export const analyzeVideo = async (prompt: string, videoFrames: { mimeType: string, data: string }[]): Promise<string> => {
    const ai = getAiClient();
    const imageParts = videoFrames.map(frame => ({
        inlineData: {
            mimeType: frame.mimeType,
            data: frame.data
        }
    }));

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: prompt }, ...imageParts] }
    });
    return response.text;
};

export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { data: audioBase64, mimeType } },
                { text: "Transcribe the following audio recording." }
            ]
        }
    });
    return response.text;
};

export const generateStoryIdeas = async (prompt: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the theme "${prompt}", generate 10 unique and compelling short story ideas. Each idea should have a title and a one-sentence description.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    ideas: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.INTEGER },
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                            }
                        }
                    }
                }
            }
        }
    });
    return response.text;
};

export const generateScript = async (storyTitle: string, storyDescription: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Write a short story script based on the following idea:\nTitle: ${storyTitle}\nDescription: ${storyDescription}\nThe script should be engaging and suitable for a short video.`
    });
    return response.text;
};

export const generateTtsAudio = async (text: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
        },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? '';
};


export const generateVideoPromptsFromScript = async (script: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Take the following script and break it down into 8 distinct visual segments for a video. For each segment, create a concise, descriptive prompt suitable for a text-to-video AI model like Veo. The prompts should be purely visual descriptions.\n\nScript:\n${script}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    prompts: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                segment: { type: Type.INTEGER },
                                prompt: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        }
    });
    return response.text;
};
