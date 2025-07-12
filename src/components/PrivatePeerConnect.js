import React, { useState, useEffect } from 'react';
import supabase from '../supabase';

const PrivatePeerConnect = ({ uniqueId }) => {
    const [user, setUser] = useState(null);
    const [quote, setQuote] = useState('');
    const [userQuote, setUserQuote] = useState('');
    const [messages, setMessages] = useState([]);
    const [image, setImage] = useState(null);
    const [userImage, setUserImage] = useState(null);
    const [adminImages, setAdminImages] = useState([]);
    const [adminUserQuotes, setAdminUserQuotes] = useState([]);
    const ADMIN_EMAIL = 'prahalyasivakumar@gmail.com';

    useEffect(() => {
        firebase.auth().onAuthStateChanged(setUser);
        const today = new Date().toISOString().split('T')[0];
        firebase.database().ref(`privateChannels/${uniqueId}/quotes/${today}`)
            .on('value', snapshot => setQuote(snapshot.val()?.quote || 'No quote set.'));
        firebase.database().ref(`privateChannels/${uniqueId}/messages`)
            .on('value', snapshot => setMessages(Object.values(snapshot.val() || {})));
        if (user?.email === ADMIN_EMAIL) {
            firebase.database().ref(`privateChannels/${uniqueId}/images/${today}`)
                .on('value', snapshot => setAdminImages(Object.values(snapshot.val() || {})));
            firebase.database().ref(`privateChannels/${uniqueId}/userQuotes/${today}`)
                .on('value', snapshot => setAdminUserQuotes(Object.values(snapshot.val() || {})));
        } else if (user) {
            firebase.database().ref(`privateChannels/${uniqueId}/images/${today}/${user.uid}`)
                .on('value', snapshot => setUserImage(snapshot.val()));
        }
    }, [uniqueId, user]);

    const handleImageUpload = () => {
        if (!image || !user) return;
        const today = new Date().toISOString().split('T')[0];
        const storageRef = firebase.storage().ref(`privateChannels/${uniqueId}/images/${user.uid}/${today}`);
        storageRef.put(image).then(() => {
            storageRef.getDownloadURL().then(url => {
                firebase.database().ref(`privateChannels/${uniqueId}/images/${today}/${user.uid}`)
                    .set({ url, user: user.email, timestamp: Date.now() });
            });
        });
    };

    const handleSendMessage = () => {
        const text = document.getElementById('message-input').value;
        if (!text || !user) return;
        firebase.database().ref(`privateChannels/${uniqueId}/messages`).push({
            user: user.email,
            text,
            timestamp: Date.now()
        });
        document.getElementById('message-input').value = '';
    };

    const handleUserQuote = () => {
        if (!userQuote || !user) return;
        const today = new Date().toISOString().split('T')[0];
        firebase.database().ref(`privateChannels/${uniqueId}/userQuotes/${today}/${user.uid}`)
            .set({ quote: userQuote, user: user.email, timestamp: Date.now() });
        setUserQuote('');
    };

    const handleAdminQuote = () => {
        const newQuote = document.getElementById('admin-quote').value;
        if (!newQuote || !user) return;
        const today = new Date().toISOString().split('T')[0];
        firebase.database().ref(`privateChannels/${uniqueId}/quotes/${today}`)
            .set({ quote: newQuote, date: today });
        document.getElementById('admin-quote').value = '';
    };

    return (
        <div className="bg-white p-4 rounded shadow mb-4">
            <h2 className="text-lg font-semibold">Private Peer Connect</h2>
            {!user ? (
                <div>
                    <input
                        id="user-email"
                        type="email"
                        placeholder="Enter Email"
                        className="border p-2 w-full mb-2"
                    />
                    <input
                        id="user-password"
                        type="password"
                        placeholder="Enter Password"
                        className="border p-2 w-full mb-2"
                    />
                    <button
                        onClick={() => {
                            const email = document.getElementById('user-email').value;
                            const password = document.getElementById('user-password').value;
                            firebase.auth().signInWithEmailAndPassword(email, password)
                                .catch(error => alert(error.message));
                        }}
                        className="bg-blue-500 text-white p-2 rounded w-full"
                    >
                        Login
                    </button>
                    <button
                        onClick={() => {
                            const email = document.getElementById('user-email').value;
                            const password = document.getElementById('user-password').value;
                            firebase.auth().createUserWithEmailAndPassword(email, password)
                                .then(() => {
                                    firebase.database().ref(`users/${firebase.auth().currentUser.uid}`)
                                        .set({ uniqueId, email });
                                    firebase.database().ref(`privateChannels/${uniqueId}/users/${firebase.auth().currentUser.uid}`)
                                        .set({ email });
                                })
                                .catch(error => alert(error.message));
                        }}
                        className="bg-green-500 text-white p-2 rounded w-full mt-2"
                    >
                        Register
                    </button>
                </div>
            ) : (
                <div>
                    <button
                        onClick={() => firebase.auth().signOut()}
                        className="bg-red-500 text-white p-2 rounded w-full mb-2"
                    >
                        Logout
                    </button>
                    <div className="mt-2">
                        <h3 className="font-semibold">Quote of the Day</h3>
                        <p className="italic">"{quote}"</p>
                        {user.email === ADMIN_EMAIL ? (
                            <div className="mt-2">
                                <input
                                    id="admin-quote"
                                    type="text"
                                    placeholder="Set new quote"
                                    className="border p-2 w-full"
                                />
                                <button
                                    onClick={handleAdminQuote}
                                    className="bg-blue-500 text-white p-2 rounded mt-2"
                                >
                                    Update Quote
                                </button>
                                <h3 className="font-semibold mt-2">User Quotes</h3>
                                {adminUserQuotes.map(q => (
                                    <div key={q.timestamp}>
                                        <p className="font-semibold">{q.user}</p>
                                        <p className="italic">"{q.quote}"</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-2">
                                <input
                                    type="text"
                                    value={userQuote}
                                    onChange={(e) => setUserQuote(e.target.value)}
                                    placeholder="Share your quote"
                                    className="border p-2 w-full"
                                />
                                <button
                                    onClick={handleUserQuote}
                                    className="bg-blue-500 text-white p-2 rounded mt-2"
                                >
                                    Share Quote
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="mt-2">
                        <h3 className="font-semibold">Daily Phone Usage</h3>
                        {user.email !== ADMIN_EMAIL && (
                            <div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setImage(e.target.files[0])}
                                    className="mb-2"
                                />
                                <button
                                    onClick={handleImageUpload}
                                    className="bg-blue-500 text-white p-2 rounded"
                                >
                                    Upload
                                </button>
                                {userImage && (
                                    <div className="mt-2">
                                        <p className="font-semibold">Your Upload</p>
                                        <img src={userImage.url} alt="Usage" className="w-full h-auto rounded" />
                                    </div>
                                )}
                            </div>
                        )}
                        {user.email === ADMIN_EMAIL && (
                            <div className="mt-2">
                                <h3 className="font-semibold">Friend's Uploads</h3>
                                {adminImages.map(img => (
                                    <div key={img.timestamp}>
                                        <p className="font-semibold">{img.user}</p>
                                        <img src={img.url} alt="Usage" className="w-full h-auto rounded" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="mt-2">
                        <h3 className="font-semibold">Private Chat</h3>
                        <div className="max-h-64 overflow-y-auto">
                            {messages.map(msg => (
                                <div
                                    key={msg.timestamp}
                                    className={`p-2 m-2 rounded ${msg.user === user.email ? 'bg-green-100 text-right' : 'bg-gray-100'}`}
                                >
                                    <p className="font-semibold">{msg.user}</p>
                                    <p>{msg.text}</p>
                                    <p className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                                </div>
                            ))}
                        </div>
                        <input
                            id="message-input"
                            type="text"
                            placeholder="Type a message..."
                            className="border p-2 w-full mt-2"
                        />
                        <button
                            onClick={handleSendMessage}
                            className="bg-blue-500 text-white p-2 rounded mt-2"
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrivatePeerConnect;