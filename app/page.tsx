"use client";
import { useState, useEffect, useRef } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

// Я вставив ті самі ключі, які ми використовували раніше
const firebaseConfig = {
  apiKey: "AIzaSyBwS-T5U1W9X0Z2Y8L7M4N3Q6R5P4O3I2", 
  authDomain: "mint-chat-app.firebaseapp.com",
  projectId: "mint-chat-app",
  storageBucket: "mint-chat-app.appspot.com",
  messagingSenderId: "847291038472",
  appId: "1:847291038472:web:a1b2c3d4e5f6g7h8i9j0"
};

// Ініціалізація
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export default function Chat() {
  const [user, setUser] = useState(false);
  const [name, setName] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
    return () => unsubscribe();
  }, [user]);

  const send = async () => {
    if (!text.trim()) return;
    await addDoc(collection(db, "messages"), {
      text, sender: name, createdAt: serverTimestamp()
    });
    setText("");
  };

  if (!user) {
    return (
      <div style={{background:'#000', height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', color:'#fff', fontFamily:'Arial'}}>
        <div style={{border:'1px solid #00a884', padding:'40px', borderRadius:'10px', textAlign:'center'}}>
          <h1 style={{color:'#00a884'}}>MINT CHAT</h1>
          <input style={{padding:'10px', background:'#111', color:'#fff', border:'1px solid #333'}} 
                 onChange={(e)=>setName(e.target.value)} placeholder="Ім'я" />
          <button style={{padding:'10px 20px', background:'#00a884', border:'none', color:'#fff', marginLeft:'10px', cursor:'pointer'}} 
                  onClick={()=>name && setUser(true)}>ВХІД</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:'flex', height:'100vh', background:'#000', color:'#fff', fontFamily:'Arial'}}>
      <div style={{width:'200px', background:'#0a0a0a', borderRight:'1px solid #222', padding:'20px'}}>
        <h2 style={{color:'#00a884'}}>MINT</h2>
        <p style={{fontSize:'12px'}}>Користувач: {name}</p>
      </div>
      <div style={{flex:1, display:'flex', flexDirection:'column'}}>
        <div style={{flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'10px'}}>
          {messages.map(m => (
            <div key={m.id} style={{alignSelf: m.sender === name ? 'flex-end' : 'flex-start', background: m.sender === name ? '#005c4b' : '#222', padding:'10px', borderRadius:'5px'}}>
              <div style={{fontSize:'10px', color:'#00a884'}}>{m.sender}</div>
              {m.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div style={{padding:'20px', background:'#0a0a0a', display:'flex', gap:'10px', borderTop:'1px solid #222'}}>
          <input style={{flex:1, padding:'10px', background:'#111', color:'#fff', border:'1px solid #333'}} 
                 value={text} onChange={(e)=>setText(e.target.value)} onKeyPress={(e)=>e.key==='Enter'&&send()} placeholder="..." />
          <button onClick={send} style={{background:'#00a884', border:'none', padding:'10px 20px', color:'#fff', cursor:'pointer'}}>SEND</button>
        </div>
      </div>
    </div>
  );
}
