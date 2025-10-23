
import React, { useState } from 'react';
import Header from './components/Header';
import Chatbot from './components/Chatbot';
import ImageGenerator from './components/ImageGenerator';
import ImageEditor from './components/ImageEditor';
import VideoGenerator from './components/VideoGenerator';
import VideoAnalyzer from './components/VideoAnalyzer';
import AudioTranscriber from './components/AudioTranscriber';
import StoryToVideo from './components/StoryToVideo';
import { View } from './types';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('chat');

  const renderView = () => {
    switch (activeView) {
      case 'chat':
        return <Chatbot />;
      case 'imageGen':
        return <ImageGenerator />;
      case 'imageEdit':
        return <ImageEditor />;
      case 'videoGen':
        return <VideoGenerator />;
      case 'videoAnalyze':
        return <VideoAnalyzer />;
      case 'audioTranscript':
        return <AudioTranscriber />;
      case 'storyToVideo':
        return <StoryToVideo />;
      default:
        return <Chatbot />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Header activeView={activeView} setActiveView={setActiveView} />
      <main className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
