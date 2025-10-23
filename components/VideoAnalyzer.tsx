
import React, { useState, useRef } from 'react';
import { analyzeVideo, fileToBase64 } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';
import FileUploader from './common/FileUploader';

const FRAME_EXTRACTION_RATE_MS = 1000; // 1 frame per second

const VideoAnalyzer: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (file: File) => {
    setVideoFile(file);
    setAnalysisResult(null);
    setError(null);
  };

  const extractFrames = (): Promise<{ mimeType: string; data: string }[]> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current || !canvasRef.current || !videoFile) {
        return reject('Video or canvas element not available');
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const frames: { mimeType: string; data: string }[] = [];
      video.src = URL.createObjectURL(videoFile);
      
      video.onloadeddata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        let currentTime = 0;
        const duration = video.duration;

        const captureFrame = () => {
          if (context) {
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            frames.push({
              mimeType: 'image/jpeg',
              data: dataUrl.split(',')[1],
            });
            setStatus(`Extracted ${frames.length} frames...`);
          }
          currentTime += FRAME_EXTRACTION_RATE_MS / 1000;
          if (currentTime <= duration) {
            video.currentTime = currentTime;
          } else {
            video.removeEventListener('seeked', captureFrame);
            resolve(frames);
          }
        };

        video.addEventListener('seeked', captureFrame);
        video.currentTime = 0;
      };

      video.onerror = () => reject('Error loading video file.');
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !videoFile) {
      setError('Please upload a video and enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setStatus('Initializing...');

    try {
      setStatus('Extracting frames from video...');
      const frames = await extractFrames();
      if(frames.length === 0) throw new Error("Could not extract any frames from the video.");
      
      setStatus(`Analyzing ${frames.length} frames with Gemini...`);
      const result = await analyzeVideo(prompt, frames);
      setAnalysisResult(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to analyze video. Please try again.');
    } finally {
      setIsLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">Video Analyzer</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Upload Video</label>
          <FileUploader onFileUpload={handleFileChange} acceptedFileTypes="video/*" label="Click to upload a video" />
          {videoFile && <p className="text-sm text-gray-400 mt-2">Selected: {videoFile.name}</p>}
        </div>
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">What to analyze?</label>
          <textarea
            id="prompt" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Summarize the key events in this video, or identify all the objects on the table."
          />
        </div>
        <button
          type="submit" disabled={isLoading || !videoFile}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex justify-center items-center">
          {isLoading ? 'Analyzing...' : 'Analyze Video'}
        </button>
      </form>
      {error && <p className="mt-4 text-red-400 text-center">{error}</p>}
      <div className="mt-8">
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-8 bg-gray-700 rounded-lg">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-300">{status}</p>
          </div>
        )}
        {analysisResult && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-center">Analysis Result</h3>
            <div className="p-4 bg-gray-900 rounded-lg prose prose-invert max-w-none prose-p:text-gray-300">
                <p className="whitespace-pre-wrap">{analysisResult}</p>
            </div>
          </div>
        )}
      </div>
      <video ref={videoRef} className="hidden" muted />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default VideoAnalyzer;
