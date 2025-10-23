
import React, { useState, useEffect } from 'react';
import { VEO_POLLING_MESSAGES } from '../../constants';
import LoadingSpinner from './LoadingSpinner';

interface VeoPollingStatusProps {
    apiStatusMessage: string | null;
}

const VeoPollingStatus: React.FC<VeoPollingStatusProps> = ({ apiStatusMessage }) => {
    const [displayMessage, setDisplayMessage] = useState(VEO_POLLING_MESSAGES[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            setDisplayMessage(prev => {
                const currentIndex = VEO_POLLING_MESSAGES.indexOf(prev);
                const nextIndex = (currentIndex + 1) % VEO_POLLING_MESSAGES.length;
                return VEO_POLLING_MESSAGES[nextIndex];
            });
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-lg border border-gray-700">
            <LoadingSpinner size="lg" />
            <p className="mt-6 text-lg font-semibold text-blue-300 animate-pulse">{displayMessage}</p>
            {apiStatusMessage && <p className="mt-2 text-sm text-gray-400">{apiStatusMessage}</p>}
        </div>
    );
};

export default VeoPollingStatus;
