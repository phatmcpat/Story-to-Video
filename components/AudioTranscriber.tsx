
import React, { useState, useEffect } from 'react';
import { transcribeAudio } from '../services/geminiService';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import LoadingSpinner from './common/LoadingSpinner';

const AudioTranscriber: React.FC = () => {
  const { isRecording, startRecording, stopRecording, audioBlob } = useAudioRecorder();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);

  const fileToBase64 = (file: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  useEffect(() => {
    const processAudio = async () => {
      if (audioBlob) {
        setIsLoading(true);
        setError(null);
        setTranscript(null);
        try {
          const base64Audio = await fileToBase64(audioBlob);
          const result = await transcribeAudio(base64Audio, audioBlob.type);
          setTranscript(result);
        } catch (err) {
          console.error(err);
          setError('Failed to transcribe audio. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    };
    processAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob]);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">Audio Transcription</h2>
      <div className="flex flex-col items-center space-y-6">
        <p className="text-gray-300 text-center">
          Click the button to start recording your voice. Click again to stop and get a transcription.
        </p>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`relative flex items-center justify-center w-24 h-24 rounded-full transition-colors duration-300 ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isRecording && <div className="absolute w-full h-full bg-red-500 rounded-full animate-ping opacity-75"></div>}
          <div className="w-8 h-8 bg-white rounded-sm" style={{ clipPath: isRecording ? 'inset(0)' : 'polygon(0 0, 0% 100%, 100% 50%)' }}></div>
        </button>
        <p className="font-semibold text-lg">{isRecording ? 'Recording...' : 'Ready to record'}</p>
      </div>
      
      {error && <p className="mt-6 text-red-400 text-center">{error}</p>}

      <div className="mt-8">
        {isLoading && (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-700 rounded-lg">
                <LoadingSpinner size="md" />
                <p className="mt-4 text-gray-300">Transcribing audio...</p>
            </div>
        )}
        {transcript && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-center">Transcription</h3>
            <div className="p-4 bg-gray-900 rounded-lg text-gray-300 whitespace-pre-wrap">
              {transcript}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioTranscriber;
