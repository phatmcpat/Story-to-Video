
import React, { useState } from 'react';
import { generateVideo, fileToBase64 } from '../services/geminiService';
import { AspectRatio } from '../types';
import VeoPollingStatus from './common/VeoPollingStatus';
import ApiKeySelector from './common/ApiKeySelector';
import FileUploader from './common/FileUploader';

const VideoGenerator: React.FC = () => {
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [image, setImage] = useState<{ file: File; base64: string; url: string } | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [apiStatusMessage, setApiStatusMessage] = useState<string | null>(null);
  const [isKeyReady, setIsKeyReady] = useState(false);

  const handleFileChange = async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      setImage({ file, base64, url: URL.createObjectURL(file) });
    } catch (err) {
      setError("Failed to load image.");
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || (mode === 'image' && !image)) {
      setError('Please provide all required inputs.');
      return;
    }
    if (!isKeyReady) {
      setError("Please select an API key first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setVideoUrl(null);
    setApiStatusMessage(null);

    try {
      const imageParam = mode === 'image' && image ? { base64: image.base64, mimeType: image.file.type } : undefined;
      const operation = await generateVideo(prompt, aspectRatio, imageParam, setApiStatusMessage);
      
      if (operation.response?.generatedVideos?.[0]?.video?.uri) {
        const downloadLink = operation.response.generatedVideos[0].video.uri;
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const videoBlob = await response.blob();
        setVideoUrl(URL.createObjectURL(videoBlob));
      } else {
        throw new Error('Video generation failed or returned no URI.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setError("API Key error. Please try selecting your API key again.");
        setIsKeyReady(false); // Force re-selection
      } else {
        setError('Failed to generate video. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">Veo Video Generator</h2>

      <ApiKeySelector onKeySelected={() => setIsKeyReady(true)} featureName="Veo Video Generation" />

      {isKeyReady && (
        <>
          <div className="flex justify-center mb-6">
            <div className="bg-gray-700 p-1 rounded-lg flex space-x-1">
              <button onClick={() => setMode('text')} className={`px-4 py-2 rounded-md transition ${mode === 'text' ? 'bg-blue-600' : ''}`}>Text-to-Video</button>
              <button onClick={() => setMode('image')} className={`px-4 py-2 rounded-md transition ${mode === 'image' ? 'bg-blue-600' : ''}`}>Image-to-Video</button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'image' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Starting Image</label>
                <FileUploader onFileUpload={handleFileChange} acceptedFileTypes="image/*" label="Upload starting image" />
                {image && <img src={image.url} alt="Preview" className="mt-4 rounded-lg max-h-48 mx-auto" />}
              </div>
            )}
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
              <textarea
                id="prompt" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="A high-speed chase through a city of giant crystals..."
              />
            </div>
            <div>
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
            <button type="submit" disabled={isLoading || !isKeyReady}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex justify-center items-center">
              {isLoading ? 'Generating...' : 'Generate Video'}
            </button>
          </form>

          {error && <p className="mt-4 text-red-400 text-center">{error}</p>}

          <div className="mt-8">
            {isLoading && <VeoPollingStatus apiStatusMessage={apiStatusMessage} />}
            {videoUrl && (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-center">Your Video is Ready!</h3>
                <video src={videoUrl} controls autoPlay loop className="rounded-lg w-full" />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VideoGenerator;
