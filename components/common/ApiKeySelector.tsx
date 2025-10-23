import React, { useState, useEffect } from 'react';

// Fix: Define a named interface for `aistudio` and use it on the `Window` interface
// to resolve conflicts with other global declarations.
declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
    interface Window {
        // FIX: Made the `aistudio` property optional to resolve potential declaration conflicts.
        aistudio?: AIStudio;
    }
}

interface ApiKeySelectorProps {
  onKeySelected: () => void;
  featureName: string;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected, featureName }) => {
  const [keySelected, setKeySelected] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (hasKey) {
            setKeySelected(true);
            onKeySelected();
        }
      }
    };
    checkKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      try {
        await window.aistudio.openSelectKey();
        // Assume success and optimistically update UI to avoid race conditions
        setKeySelected(true);
        onKeySelected();
      } catch (error) {
        console.error("Error opening API key selection:", error);
      }
    } else {
        alert("API key selection utility is not available.");
    }
  };

  if (keySelected) {
    return null;
  }

  return (
    <div className="bg-gray-800 border border-blue-500 rounded-lg p-6 my-6 text-center shadow-lg">
      <h3 className="text-xl font-bold text-white mb-2">{featureName} Requires API Key</h3>
      <p className="text-gray-300 mb-4">
        To use this feature, you must select an API key. This will be used for billing purposes.
      </p>
      <p className="text-sm text-gray-400 mb-4">
        For more information, please see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">billing documentation</a>.
      </p>
      <button
        onClick={handleSelectKey}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
      >
        Select API Key
      </button>
    </div>
  );
};

export default ApiKeySelector;
