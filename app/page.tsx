"use client";
import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, limit, serverTimestamp } from "firebase/firestore";

// Твої дані з Firebase (вже вписані)
const firebaseConfig = {
  apiKey: "AIzaSyBq9FF9P6fxkJCoFdlaH2k7iUCrq2JD9ac",
  authDomain: "mintchat-8825a.firebaseapp.com",
  projectId: "mintchat-8825a",
  storageBucket: "mintchat-8825a.firebasestorage.app",
  messagingSenderId: "1031675940053",
  appId: "1:1031675940053:web:6623438bc9fc0b42dc265c",
  measurementId: "G-4G8146S8K5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("chat_user");
    if (saved) setUser(JSON.parse(saved));

    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogin = () => {
    if (!username.trim()) return;
    const userData = { username };
    localStorage.setItem("chat_user", JSON.stringify(userData));
    setUser(userData);
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;
    await addDoc(collection(db, "messages"), {
      text: inputValue,
      sender: user.username,
      createdAt: serverTimestamp()
    });
    setInputValue("");
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0b0e11', color: 'white' }}>
        <div style={{ background: '#15191c', padding: '30px', borderRadius: '20px', textAlign: 'center' }}>
          <h2>MintChat Online ☁️</h2>
          <input placeholder="Твій нік" value={username} onChange={e => setUsername(e.target.value)} style={{ display: 'block', width: '100%', padding: '10px', margin: '15px 0', borderRadius: '8px', border: 'none' }} />
          <button onClick={handleLogin} style={{ width: '100%', padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Увійти</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0b0e11', color: 'white', fontFamily: 'sans-serif' }}>
      <div style={{ width: '250px', background: '#15191c', padding: '20px', borderRight: '1px solid #333' }}>
        <h3 style={{ color: '#3b82f6' }}>MintChat Cloud</h3>
        <p style={{ color: '#f59e0b' }}>Ви: @{user.username}</p>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {messages.map(m => (
            <div key={m.id} style={{ textAlign: m.sender === user.username ? 'right' : 'left', marginBottom: '10px' }}>
              <div style={{ background: m.sender === user.username ? '#2563eb' : '#374151', padding: '10px', borderRadius: '15px', display: 'inline-block' }}>
                <div style={{ fontSize: '10px', opacity: 0.6 }}>{m.sender}</div>
                <div>{m.text}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div style={{ padding: '20px', background: '#15191c', display: 'flex', gap: '10px' }}>
          <input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} style={{ flex: 1, padding: '10px', borderRadius: '20px', border: 'none', background: '#0b0e11', color: 'white' }} />
          <button onClick={sendMessage} style={{ background: '#2563eb', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer' }}>Відправити</button>
        </div>
      </div>
    </div>
  );
}
