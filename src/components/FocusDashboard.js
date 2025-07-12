import React, { useState, useEffect } from 'react';

const FocusDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [streak, setStreak] = useState(0);
    const [mood, setMood] = useState('');
    const [quote, setQuote] = useState('Stay focused and keep learning!');

    useEffect(() => {
        const savedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const savedStreak = parseInt(localStorage.getItem('streak') || '0');
        const lastUpdate = localStorage.getItem('lastUpdate');
        const today = new Date().toISOString().split('T')[0];

        if (lastUpdate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastUpdate !== yesterday.toISOString().split('T')[0]) {
                setStreak(0);
                localStorage.setItem('streak', '0');
            }
            localStorage.setItem('lastUpdate', today);
        }
        setTasks(savedTasks);
        setStreak(savedStreak);
    }, []);

    const handleMoodChange = (e) => {
        setMood(e.target.value);
        localStorage.setItem('mood', e.target.value);
    };

    return (
        <div className="bg-white p-4 rounded shadow mb-4">
            <h2 className="text-lg font-semibold">Focus Dashboard</h2>
            <p className="italic">"{quote}"</p>
            <div className="mt-2">
                <h3 className="font-semibold">Today's Tasks</h3>
                <ul>
                    {tasks.map(task => (
                        <li key={task.id} className={task.done ? 'line-through' : ''}>
                            {task.text}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mt-2">
                <h3 className="font-semibold">Current Streak</h3>
                <p>{streak} days</p>
            </div>
            <div className="mt-2">
                <h3 className="font-semibold">Mood Check-In</h3>
                <select value={mood} onChange={handleMoodChange} className="border p-2">
                    <option value="">Select Mood</option>
                    <option value="Great">Great</option>
                    <option value="Okay">Okay</option>
                    <option value="Low">Low</option>
                </select>
            </div>
        </div>
    );
};

export default FocusDashboard;