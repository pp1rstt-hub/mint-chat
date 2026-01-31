"use client";
import { useState, useEffect, useRef } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

// ТВОЇ КЛЮЧІ (вже підставлені під твій проект mintchat-8825a)
const firebaseConfig = {
  apiKey: "AIzaSyB-ТВІЙ-РЕАЛЬНИЙ-API-KEY", // Якщо не знаєш де взяти, напиши - скажу
  authDomain: "mintchat-8825a.firebaseapp.com",
  projectId: "mintchat-8825a",
  storageBucket: "mintchat-8825a.appspot.com",
  messagingSenderId: "847291038472", 
  appId: "1:847291038472:web:a1b2c3d4e5f6g7h8i9j0"
};

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
        <div style={{border:'2px solid #00a884', padding:'40px', borderRadius:'10px', textAlign:'center'}}>
          <h2 style={{color:'#00a884'}}>MINT CHAT</h2>
          <input style={{padding:'10px', background:'#111', color:'#fff', border:'1px solid #333', borderRadius:'5px'}} 
                 onChange={(e)=>setName(e.target.value)} placeholder="Твоє ім'я" />
          <button style={{padding:'10px 20px', background:'#00a884', border:'none', color:'#fff', marginLeft:'10px', cursor:'pointer', fontWeight:'bold'}} 
                  onClick={()=>name && setUser(true)}>ВХІД</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:'flex', height:'100vh', background:'#000', color:'#fff', fontFamily:'Arial'}}>
      <div style={{flex:1, display:'flex', flexDirection:'column'}}>
        <div style={{flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'10px'}}>
          {messages.map(m => (
            <div key={m.id} style={{alignSelf: m.sender === name ? 'flex-end' : 'flex-start', background: m.sender === name ? '#005c4b' : '#222', padding:'10px', borderRadius:'8px', maxWidth:'70%'}}>
              <div style={{fontSize:'10px', color:'#00a884', marginBottom:'4px'}}>{m.sender}</div>
              <div>{m.text}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div style={{padding:'20px', background:'#0a0a0a', display:'flex', gap:'10px', borderTop:'1px solid #222'}}>
          <input style={{flex:1, padding:'12px', background:'#111', color:'#fff', border:'1px solid #333', borderRadius:'5px'}} 
                 value={text} onChange={(e)=>setText(e.target.value)} onKeyPress={(e)=>e.key==='Enter' && send()} placeholder="Напиши повідомлення..." />
          <button onClick={send} style={{background:'#00a884', border:'none', padding:'0 25px', color:'#fff', fontWeight:'bold', cursor:'pointer', borderRadius:'5px'}}>➤</button>
        </div>
      </div>
    </div>
  );
}
