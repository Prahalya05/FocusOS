import React, { useState, useEffect } from 'react';

const GoalsTracker = () => {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');

    useEffect(() => {
        const savedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        setTasks(savedTasks);
    }, []);

    const addTask = () => {
        if (!newTask) return;
        const task = { id: Date.now(), text: newTask, done: false };
        const updatedTasks = [...tasks, task];
        setTasks(updatedTasks);
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
        setNewTask('');
    };

    const toggleTask = (id) => {
        const updatedTasks = tasks.map(task =>
            task.id === id ? { ...task, done: !task.done } : task
        );
        setTasks(updatedTasks);
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
        if (updatedTasks.every(task => task.done)) {
            const streak = parseInt(localStorage.getItem('streak') || '0') + 1;
            localStorage.setItem('streak', streak.toString());
            localStorage.setItem('lastUpdate', new Date().toISOString().split('T')[0]);
        }
    };

    return (
        <div className="bg-white p-4 rounded shadow mb-4">
            <h2 className="text-lg font-semibold">Goals & Tasks</h2>
            <div className="flex mt-2">
                <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add a new task"
                    className="border p-2 flex-grow"
                />
                <button onClick={addTask} className="bg-blue-500 text-white p-2 rounded ml-2">
                    Add
                </button>
            </div>
            <ul className="mt-2">
                {tasks.map(task => (
                    <li key={task.id} className="flex items-center">
                        <input
                            type="checkbox"
                            checked={task.done}
                            onChange={() => toggleTask(task.id)}
                            className="mr-2"
                        />
                        <span className={task.done ? 'line-through' : ''}>{task.text}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default GoalsTracker;