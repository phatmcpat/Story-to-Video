
import React from 'react';
import { View } from '../types';

interface HeaderProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const NavButton: React.FC<{
  view: View;
  currentView: View;
  onClick: (view: View) => void;
  children: React.ReactNode;
}> = ({ view, currentView, onClick, children }) => {
  const isActive = view === currentView;
  return (
    <button
      onClick={() => onClick(view)}
      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
        isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
};

const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  
  const navItems: { view: View, label: string }[] = [
    { view: 'chat', label: 'Chatbot' },
    { view: 'imageGen', label: 'Image Generation' },
    { view: 'imageEdit', label: 'Image Editor' },
    { view: 'videoGen', label: 'Video Generation' },
    { view: 'videoAnalyze', label: 'Video Analysis' },
    { view: 'audioTranscript', label: 'Audio Transcription' },
    { view: 'storyToVideo', label: 'Story to Video' },
  ];

  return (
    <header className="bg-gray-800 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-white">Gemini Creative Suite</h1>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map(item => (
                <NavButton key={item.view} view={item.view} currentView={activeView} onClick={setActiveView}>
                  {item.label}
                </NavButton>
              ))}
            </div>
          </div>
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-300 hover:text-white focus:outline-none">
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map(item => (
              <button
                key={item.view}
                onClick={() => {
                  setActiveView(item.view);
                  setIsMenuOpen(false);
                }}
                className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${
                  activeView === item.view ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
