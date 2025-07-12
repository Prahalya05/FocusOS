import React, { useState } from 'react';
import './App.css';
import FocusDashboard from './components/FocusDashboard';
import GoalsTracker from './components/GoalsTracker';
import PomodoroTimer from './components/PomodoroTimer';
import PrivatePeerConnect from './components/PrivatePeerConnect';

const App = () => {
    const [uniqueId, setUniqueId] = useState('');

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <h1 className="text-2xl font-bold text-center mb-4">FocusOS</h1>
            <div className="mb-4">
                <input
                    type="text"
                    value={uniqueId}
                    onChange={(e) => setUniqueId(e.target.value)}
                    placeholder="Enter Unique ID for Private Connect"
                    className="border p-2 w-full"
                />
            </div>
            <FocusDashboard />
            <GoalsTracker />
            <PomodoroTimer />
            {uniqueId && <PrivatePeerConnect uniqueId={uniqueId} />}
        </div>
    );
};

export default App;