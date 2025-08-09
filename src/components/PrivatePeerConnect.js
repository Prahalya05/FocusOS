import React, { useEffect, useMemo, useState } from 'react';
import supabase from '../supabase';

const ADMIN_EMAIL = 'prahalyasivakumar@gmail.com';

const formatDate = (date = new Date()) => date.toISOString().split('T')[0];

const PrivatePeerConnect = ({ uniqueId }) => {
  const [user, setUser] = useState(null);

  // Quote of the day
  const [quote, setQuote] = useState('No quote set.');
  const [adminQuoteInput, setAdminQuoteInput] = useState('');

  // User quotes
  const [userQuote, setUserQuote] = useState('');
  const [adminUserQuotes, setAdminUserQuotes] = useState([]);

  // Chat
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');

  // Images
  const [image, setImage] = useState(null);
  const [userImage, setUserImage] = useState(null);
  const [adminImages, setAdminImages] = useState([]);

  const today = useMemo(() => formatDate(), []);

  // Auth state
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) setUser(data?.user || null);
    })();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Load initial data and subscribe for changes
  useEffect(() => {
    if (!uniqueId) return;

    // Quotes
    const loadQuote = async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('quote')
        .eq('unique_id', uniqueId)
        .eq('date', today)
        .maybeSingle();
      if (!error && data) setQuote(data.quote || 'No quote set.');
      if (!error && !data) setQuote('No quote set.');
    };

    // Messages
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, user_email, text, created_at')
        .eq('unique_id', uniqueId)
        .order('created_at', { ascending: true });
      if (!error && data) {
        setMessages(
          data.map((m) => ({
            timestamp: new Date(m.created_at).getTime(),
            user: m.user_email,
            text: m.text,
          }))
        );
      }
    };

    // User quotes list (for admin)
    const loadUserQuotes = async () => {
      const { data, error } = await supabase
        .from('user_quotes')
        .select('user_email, quote, created_at')
        .eq('unique_id', uniqueId)
        .eq('date', today)
        .order('created_at', { ascending: true });
      if (!error && data) {
        setAdminUserQuotes(
          data.map((q) => ({
            user: q.user_email,
            quote: q.quote,
            timestamp: new Date(q.created_at).getTime(),
          }))
        );
      }
    };

    // Images
    const loadImages = async () => {
      // Load current user's latest image
      if (user?.id) {
        const { data, error } = await supabase
          .from('images_meta')
          .select('user_email, url, created_at')
          .eq('unique_id', uniqueId)
          .eq('date', today)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
        if (!error && data && data.length > 0) {
          setUserImage({ user: data[0].user_email, url: data[0].url, timestamp: new Date(data[0].created_at).getTime() });
        } else {
          setUserImage(null);
        }
      }

      // Load all images for admin view
      const { data: imgs, error: imgsError } = await supabase
        .from('images_meta')
        .select('user_email, url, created_at')
        .eq('unique_id', uniqueId)
        .eq('date', today)
        .order('created_at', { ascending: false });
      if (!imgsError && imgs) {
        setAdminImages(
          imgs.map((img) => ({
            user: img.user_email,
            url: img.url,
            timestamp: new Date(img.created_at).getTime(),
          }))
        );
      }
    };

    loadQuote();
    loadMessages();
    loadUserQuotes();
    loadImages();

    // Realtime subscriptions
    const channel = supabase.channel(`private:${uniqueId}`);

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'quotes', filter: `unique_id=eq.${uniqueId}` },
      (payload) => {
        const row = payload.new || payload.old;
        if (row?.date === today && payload.eventType !== 'DELETE') {
          setQuote(row.quote || 'No quote set.');
        }
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `unique_id=eq.${uniqueId}` },
      (payload) => {
        const m = payload.new;
        setMessages((prev) => [
          ...prev,
          { timestamp: new Date(m.created_at).getTime(), user: m.user_email, text: m.text },
        ]);
      }
    );

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'user_quotes', filter: `unique_id=eq.${uniqueId}` },
      (payload) => {
        const q = payload.new || payload.old;
        if (q?.date === today && payload.eventType !== 'DELETE') {
          setAdminUserQuotes((prev) => [
            ...prev,
            { user: q.user_email, quote: q.quote, timestamp: new Date(q.created_at).getTime() },
          ]);
        }
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'images_meta', filter: `unique_id=eq.${uniqueId}` },
      (payload) => {
        const img = payload.new;
        if (img.date === today) {
          setAdminImages((prev) => [
            { user: img.user_email, url: img.url, timestamp: new Date(img.created_at).getTime() },
            ...prev,
          ]);
          if (img.user_id === user?.id) {
            setUserImage({ user: img.user_email, url: img.url, timestamp: new Date(img.created_at).getTime() });
          }
        }
      }
    );

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // ready
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [uniqueId, today, user?.id]);

  const handleSignIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  const handleSignUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSendMessage = async () => {
    if (!messageText || !user) return;
    const { error } = await supabase
      .from('messages')
      .insert({ unique_id: uniqueId, user_email: user.email, text: messageText });
    if (error) alert(error.message);
    setMessageText('');
  };

  const handleUserQuote = async () => {
    if (!userQuote || !user) return;
    const { error } = await supabase
      .from('user_quotes')
      .insert({ unique_id: uniqueId, date: today, user_id: user.id, user_email: user.email, quote: userQuote });
    if (error) alert(error.message);
    setUserQuote('');
  };

  const handleAdminQuote = async () => {
    if (!adminQuoteInput || !user) return;
    const { error } = await supabase
      .from('quotes')
      .upsert({ unique_id: uniqueId, date: today, quote: adminQuoteInput }, { onConflict: 'unique_id,date' });
    if (error) alert(error.message);
    setAdminQuoteInput('');
  };

  const handleImageUpload = async () => {
    if (!image || !user) return;
    // Ensure the storage bucket 'images' exists and is readable via signed URLs
    const path = `${uniqueId}/${user.id}/${today}/${Date.now()}_${image.name || 'upload'}`;
    const { error: uploadError } = await supabase.storage.from('images').upload(path, image, { upsert: false });
    if (uploadError) {
      alert(uploadError.message);
      return;
    }
    // Create a signed URL so we can display the image regardless of public bucket settings
    const { data: signed, error: signedErr } = await supabase.storage.from('images').createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days
    if (signedErr) {
      alert(signedErr.message);
      return;
    }
    const url = signed.signedUrl;
    const { error: metaErr } = await supabase
      .from('images_meta')
      .insert({ unique_id: uniqueId, date: today, user_id: user.id, user_email: user.email, url });
    if (metaErr) alert(metaErr.message);
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h2 className="text-lg font-semibold">Private Peer Connect</h2>

      {!user ? (
        <div>
          <AuthForm onSignIn={handleSignIn} onSignUp={handleSignUp} />
        </div>
      ) : (
        <div>
          <button onClick={handleSignOut} className="bg-red-500 text-white p-2 rounded w-full mb-2">Logout</button>

          <div className="mt-2">
            <h3 className="font-semibold">Quote of the Day</h3>
            <p className="italic">"{quote}"</p>
            {user.email === ADMIN_EMAIL ? (
              <div className="mt-2">
                <input
                  type="text"
                  value={adminQuoteInput}
                  onChange={(e) => setAdminQuoteInput(e.target.value)}
                  placeholder="Set new quote"
                  className="border p-2 w-full"
                />
                <button onClick={handleAdminQuote} className="bg-blue-500 text-white p-2 rounded mt-2">Update Quote</button>
                <h3 className="font-semibold mt-2">User Quotes</h3>
                {adminUserQuotes.map((q) => (
                  <div key={`${q.user}-${q.timestamp}`}>
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
                <button onClick={handleUserQuote} className="bg-blue-500 text-white p-2 rounded mt-2">Share Quote</button>
              </div>
            )}
          </div>

          <div className="mt-2">
            <h3 className="font-semibold">Daily Phone Usage</h3>
            {user.email !== ADMIN_EMAIL && (
              <div>
                <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} className="mb-2" />
                <button onClick={handleImageUpload} className="bg-blue-500 text-white p-2 rounded">Upload</button>
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
                {adminImages.map((img) => (
                  <div key={`${img.user}-${img.timestamp}`}>
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
              {messages.map((msg) => (
                <div
                  key={`${msg.user}-${msg.timestamp}`}
                  className={`p-2 m-2 rounded ${msg.user === user.email ? 'bg-green-100 text-right' : 'bg-gray-100'}`}
                >
                  <p className="font-semibold">{msg.user}</p>
                  <p>{msg.text}</p>
                  <p className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="border p-2 w-full mt-2"
            />
            <button onClick={handleSendMessage} className="bg-blue-500 text-white p-2 rounded mt-2">Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

const AuthForm = ({ onSignIn, onSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter Email"
        className="border p-2 w-full mb-2"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter Password"
        className="border p-2 w-full mb-2"
      />
      <button onClick={() => onSignIn(email, password)} className="bg-blue-500 text-white p-2 rounded w-full">Login</button>
      <button onClick={() => onSignUp(email, password)} className="bg-green-500 text-white p-2 rounded w-full mt-2">Register</button>
    </div>
  );
};

export default PrivatePeerConnect;