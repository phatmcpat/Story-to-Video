
import React, { useState, useEffect } from 'react';
import { StoryIdea, VideoPromptSegment, AspectRatio } from '../types';
import * as geminiService from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';
import ApiKeySelector from './common/ApiKeySelector';
import VeoPollingStatus from './common/VeoPollingStatus';

type Stage = 'idea' | 'select' | 'script' | 'videos';

const StoryToVideo: React.FC = () => {
    const [stage, setStage] = useState<Stage>('idea');
    const [ideaPrompt, setIdeaPrompt] = useState('');
    const [storyIdeas, setStoryIdeas] = useState<StoryIdea[]>([]);
    const [selectedIdea, setSelectedIdea] = useState<StoryIdea | null>(null);
    const [script, setScript] = useState('');
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [videoPrompts, setVideoPrompts] = useState<VideoPromptSegment[]>([]);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isKeyReady, setIsKeyReady] = useState(false);
    const [apiStatusMessage, setApiStatusMessage] = useState<string | null>(null);

    const handleReset = () => {
        setStage('idea');
        setIdeaPrompt('');
        setStoryIdeas([]);
        setSelectedIdea(null);
        setScript('');
        setVideoPrompts([]);
        setError(null);
        setIsLoading(false);
        setAudioUrl(null);
    };

    const handleGenerateIdeas = async () => {
        if (!ideaPrompt.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const responseText = await geminiService.generateStoryIdeas(ideaPrompt);
            const parsed = JSON.parse(responseText);
            setStoryIdeas(parsed.ideas);
            setStage('select');
        } catch (err) {
            console.error(err);
            setError("Failed to generate story ideas. The model might have returned an unexpected format.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectIdea = async (idea: StoryIdea) => {
        setSelectedIdea(idea);
        setIsLoading(true);
        setError(null);
        try {
            const generatedScript = await geminiService.generateScript(idea.title, idea.description);
            setScript(generatedScript);
            setStage('script');
        } catch (err) {
            console.error(err);
            setError("Failed to generate script.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateAudio = async () => {
        if (!script) return;
        setIsLoading(true);
        setError(null);
        try {
            const audioBase64 = await geminiService.generateTtsAudio(script);
            if (audioBase64) {
                const audioBlob = new Blob([Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
                setAudioUrl(URL.createObjectURL(audioBlob));
            } else {
                throw new Error("Received empty audio data.");
            }
        } catch(err) {
            console.error(err);
            setError("Failed to generate audio.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGeneratePrompts = async () => {
        if (!script) return;
        setIsLoading(true);
        setError(null);
        try {
            const responseText = await geminiService.generateVideoPromptsFromScript(script);
            const parsed = JSON.parse(responseText);
            setVideoPrompts(parsed.prompts.map((p: any) => ({ ...p, status: 'pending' })));
            setStage('videos');
        } catch (err) {
            console.error(err);
            setError("Failed to generate video prompts.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateVideos = async () => {
        if (!isKeyReady) {
            setError("Please select an API key first.");
            return;
        }

        for (let i = 0; i < videoPrompts.length; i++) {
            const currentPrompt = videoPrompts[i];
            setVideoPrompts(prompts => prompts.map(p => p.segment === currentPrompt.segment ? { ...p, status: 'generating' } : p));
            setError(null);

            try {
                const operation = await geminiService.generateVideo(currentPrompt.prompt, aspectRatio, undefined, (msg) => setApiStatusMessage(`Segment ${i+1}/${videoPrompts.length}: ${msg}`));
                if (operation.response?.generatedVideos?.[0]?.video?.uri) {
                    const downloadLink = operation.response.generatedVideos[0].video.uri;
                    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                    const videoBlob = await response.blob();
                    const videoUrl = URL.createObjectURL(videoBlob);
                    setVideoPrompts(prompts => prompts.map(p => p.segment === currentPrompt.segment ? { ...p, status: 'done', videoUrl } : p));
                } else {
                    throw new Error(`Video generation failed for segment ${i+1}.`);
                }
            } catch (err: any) {
                console.error(err);
                if (err.message?.includes("Requested entity was not found")) {
                    setError("API Key error. Please try selecting your API key again.");
                    setIsKeyReady(false); // Force re-selection
                } else {
                    setError(`Error on segment ${i+1}: ${err.message}`);
                }
                setVideoPrompts(prompts => prompts.map(p => p.segment === currentPrompt.segment ? { ...p, status: 'error' } : p));
                break; // Stop on first error
            } finally {
                setApiStatusMessage(null);
            }
        }
    };

    const renderStage = () => {
        if(isLoading) return <div className="flex justify-center p-10"><LoadingSpinner size="lg"/></div>;

        switch (stage) {
            case 'idea':
                return (
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-center">1. Start with an Idea</h3>
                        <textarea value={ideaPrompt} onChange={e => setIdeaPrompt(e.target.value)} rows={4} placeholder="e.g., A space detective series set on Mars" className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <button onClick={handleGenerateIdeas} disabled={!ideaPrompt.trim()} className="mt-4 w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-600">Generate Story Concepts</button>
                    </div>
                );
            case 'select':
                return (
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-center">2. Select a Story Concept</h3>
                        <div className="space-y-4">
                            {storyIdeas.map(idea => (
                                <div key={idea.id} onClick={() => handleSelectIdea(idea)} className="p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition">
                                    <h4 className="font-bold text-blue-300">{idea.title}</h4>
                                    <p className="text-sm text-gray-300">{idea.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'script':
                return (
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-center">3. Review Your Script</h3>
                        <div className="p-4 bg-gray-900 rounded-lg max-h-96 overflow-y-auto whitespace-pre-wrap text-gray-300 mb-4">{script}</div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={handleGenerateAudio} className="w-full bg-teal-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-700 disabled:bg-gray-600">Generate Audio (TTS)</button>
                            <button onClick={handleGeneratePrompts} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-600">Create Video Segments</button>
                        </div>
                         {audioUrl && <div className="mt-4"><audio controls src={audioUrl} className="w-full" /></div>}
                    </div>
                );
            case 'videos':
                return (
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-center">4. Generate Videos</h3>
                        <ApiKeySelector onKeySelected={() => setIsKeyReady(true)} featureName="Veo Video Generation" />
                        {isKeyReady && (
                            <>
                                <div className="my-4">
                                  <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                                  <div className="flex gap-2">
                                    {(["16:9", "9:16"] as AspectRatio[]).map((ratio) => (
                                      <button type="button" onClick={() => setAspectRatio(ratio)}
                                        className={`px-4 py-2 text-sm rounded-lg transition-colors ${aspectRatio === ratio ? 'bg-blue-600 text-white ring-2 ring-blue-400' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                        {ratio === "16:9" ? "Landscape" : "Portrait"}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <button onClick={handleGenerateVideos} disabled={!isKeyReady || videoPrompts.some(p => p.status === 'generating')} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-600">Generate All Videos</button>
                            </>
                        )}
                        {apiStatusMessage && <VeoPollingStatus apiStatusMessage={apiStatusMessage} />}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                            {videoPrompts.map(p => (
                                <div key={p.segment} className="bg-gray-700 p-3 rounded-lg">
                                    <h5 className="font-bold text-sm">Segment {p.segment}</h5>
                                    <p className="text-xs text-gray-400 mb-2">{p.prompt}</p>
                                    <div className="aspect-video bg-gray-800 rounded flex items-center justify-center">
                                        {p.status === 'generating' && <LoadingSpinner />}
                                        {p.status === 'done' && p.videoUrl && <video src={p.videoUrl} controls loop className="w-full h-full rounded" />}
                                        {p.status === 'error' && <p className="text-red-400 text-xs">Error</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
        }
    };
    
    return (
        <div className="max-w-7xl mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Story-to-Video Pipeline</h2>
                <button onClick={handleReset} className="text-sm bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">Start Over</button>
            </div>
            {error && <p className="mb-4 p-3 bg-red-900 border border-red-700 text-red-200 rounded-lg">{error}</p>}
            {renderStage()}
        </div>
    );
};

export default StoryToVideo;
