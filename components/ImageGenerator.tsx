
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { AspectRatio } from '../types';
import { ASPECT_RATIOS } from '../constants';
import LoadingSpinner from './common/LoadingSpinner';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const imageBase64 = await generateImage(prompt, aspectRatio);
      setImageUrl(`data:image/jpeg;base64,${imageBase64}`);
    } catch (err) {
      console.error(err);
      setError('Failed to generate image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">Image Generator</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
            Prompt
          </label>
          <textarea
            id="prompt"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., A cinematic shot of a raccoon astronaut commandeering a pirate ship in a nebula"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
          <div className="flex flex-wrap gap-2">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => setAspectRatio(ratio)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  aspectRatio === ratio
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : 'Generate Image'}
        </button>
      </form>
      {error && <p className="mt-4 text-red-400 text-center">{error}</p>}
      <div className="mt-8">
        {isLoading && (
          <div className="flex justify-center items-center h-64 bg-gray-700 rounded-lg">
            <LoadingSpinner size="lg" />
          </div>
        )}
        {imageUrl && (
          <div className="bg-gray-900 p-2 rounded-lg">
            <img src={imageUrl} alt="Generated" className="rounded-md w-full object-contain" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenerator;
