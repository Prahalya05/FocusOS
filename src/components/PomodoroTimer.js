import React, { useState, useEffect } from 'react';

const PomodoroTimer = () => {
    const [time, setTime] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [isBreak, setIsBreak] = useState(false);

    useEffect(() => {
        let interval = null;
        if (isActive && time > 0) {
            interval = setInterval(() => {
                setTime(time => time - 1);
            }, 1000);
        } else if (time === 0) {
            setIsActive(false);
            setIsBreak(!isBreak);
            setTime(isBreak ? 25 * 60 : 5 * 60);
            new Audio('https://www.soundjay.com/buttons/beep-01a.mp3').play();
        }
        return () => clearInterval(interval);
    }, [isActive, time, isBreak]);

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setIsBreak(false);
        setTime(25 * 60);
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="bg-white p-4 rounded shadow mb-4">
            <h2 className="text-lg font-semibold">Pomodoro Timer</h2>
            <p className="text-2xl">{formatTime(time)}</p>
            <div className="mt-2">
                <button
                    onClick={toggleTimer}
                    className="bg-blue-500 text-white p-2 rounded mr-2"
                >
                    {isActive ? 'Pause' : 'Start'}
                </button>
                <button
                    onClick={resetTimer}
                    className="bg-red-500 text-white p-2 rounded"
                >
                    Reset
                </button>
            </div>
        </div>
    );
};

export default PomodoroTimer;