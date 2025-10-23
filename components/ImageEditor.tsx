
import React, { useState } from 'react';
import { editImage, fileToBase64 } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';
import FileUploader from './common/FileUploader';

const ImageEditor: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [originalImage, setOriginalImage] = useState<{ file: File; base64: string; url: string } | null>(null);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      setOriginalImage({ file, base64, url: URL.createObjectURL(file) });
      setEditedImageUrl(null);
      setError(null);
    } catch (err) {
      setError("Failed to load image.");
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !originalImage) {
      setError('Please upload an image and enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedImageUrl(null);

    try {
      const editedBase64 = await editImage(prompt, originalImage.base64, originalImage.file.type);
      setEditedImageUrl(`data:image/png;base64,${editedBase64}`);
    } catch (err) {
      console.error(err);
      setError('Failed to edit image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">Image Editor</h2>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-300">1. Upload Image</h3>
          <FileUploader onFileUpload={handleFileChange} acceptedFileTypes="image/*" label="Click to upload an image" />
          {originalImage && (
            <div className="mt-4 bg-gray-900 p-2 rounded-lg">
              <img src={originalImage.url} alt="Original" className="rounded-md w-full" />
            </div>
          )}
        </div>
        <div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-300">2. Describe Your Edit</h3>
              <textarea
                id="prompt"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Add a retro filter, or remove the person in the background"
                disabled={!originalImage}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !originalImage || !prompt}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Apply Edit'}
            </button>
          </form>
          {error && <p className="mt-4 text-red-400 text-center">{error}</p>}
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-300">Result</h3>
            <div className="bg-gray-700 rounded-lg min-h-[200px] flex justify-center items-center">
              {isLoading ? <LoadingSpinner size="lg" /> : 
                editedImageUrl ? <img src={editedImageUrl} alt="Edited" className="rounded-md w-full" /> : 
                <p className="text-gray-400">Your edited image will appear here</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
