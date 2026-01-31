"use client";
import { useState, useEffect, useRef } from "react";
// Підключаємо твій існуючий конфіг
import { db } from "../firebase"; 
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

export default function Chat() {
  const [user, setUser] = useState(false);
  const [name, setName] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    // Ця функція ПОВИННА бачити повідомлення з усіх пристроїв
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, (err) => {
      console.error("FIREBASE ERROR:", err);
    });
    return () => unsubscribe();
  }, []);

  const sendToDb = async (mediaData: string | null, type: string) => {
    if (!text.trim() && !mediaData) return;
    try {
      await addDoc(collection(db, "messages"), {
        text: type === "text" ? text : "",
        sender: name,
        mediaUrl: mediaData,
        type,
        createdAt: serverTimestamp(),
      });
      setText("");
    } catch (e) {
      alert("Помилка! База не приймає повідомлення. Перевір правила Rules в Firebase!");
    }
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    const chunks: any[] = [];
    mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.current.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const reader = new FileReader();
      reader.onloadend = () => sendToDb(reader.result as string, "audio");
      reader.readAsDataURL(blob);
    };
    mediaRecorder.current.start();
    setIsRecording(true);
  };

  if (!user) {
    return (
      <div style={{backgroundColor:'#000', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:'Arial'}}>
        <div style={{textAlign:'center', border:'1px solid #333', padding:'50px', borderRadius:'10px'}}>
          <h1 style={{color:'#00a884'}}>MINT CHAT</h1>
          <input style={{padding:'10px', width:'200px', backgroundColor:'#111', color:'#fff', border:'1px solid #333'}} 
                 value={name} onChange={(e)=>setName(e.target.value)} placeholder="Ім'я" />
          <button style={{padding:'10px 20px', marginLeft:'10px', backgroundColor:'#00a884', border:'none', cursor:'pointer'}} 
                  onClick={()=>name && setUser(true)}>ВХІД</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:'flex', height:'100vh', backgroundColor:'#000', color:'#fff', fontFamily:'Arial'}}>
      <div style={{width:'250px', borderRight:'1px solid #222', backgroundColor:'#0a0a0a', padding:'20px'}}>
        <div style={{color:'#00a884', fontWeight:'bold'}}>ПРОФІЛЬ: {name}</div>
      </div>
      <div style={{flex:1, display:'flex', flexDirection:'column'}}>
        <div style={{flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'10px'}}>
          {messages.map(msg => (
            <div key={msg.id} style={{alignSelf: msg.sender === name ? 'flex-end' : 'flex-start', maxWidth:'70%'}}>
              <div style={{fontSize:'10px', color:'#00a884'}}>{msg.sender}</div>
              <div style={{backgroundColor: msg.sender === name ? '#003d33' : '#1a1a1a', padding:'10px', borderRadius:'5px'}}>
                {msg.type === 'text' && <div>{msg.text}</div>}
                {msg.type === 'image' && <img src={msg.mediaUrl} style={{maxWidth:'100%'}} />}
                {msg.type === 'audio' && <audio src={msg.mediaUrl} controls style={{width:'200px', height:'30px'}} />}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div style={{padding:'20px', borderTop:'1px solid #222', display:'flex', gap:'10px', alignItems:'center'}}>
          <button onMouseDown={startRecording} onMouseUp={()=>mediaRecorder.current?.stop()} style={{background:'none', border:'none', fontSize:'20px', color: isRecording ? 'red' : '#fff'}}>🎤</button>
          <input style={{flex:1, padding:'10px', backgroundColor:'#111', border:'1px solid #333', color:'#fff'}} 
                 value={text} onChange={(e)=>setText(e.target.value)} onKeyPress={(e)=>e.key === 'Enter' && sendToDb(null, 'text')} placeholder="Текст..." />
          <button onClick={()=>sendToDb(null, 'text')} style={{backgroundColor:'#00a884', border:'none', padding:'10px'}}>SEND</button>
        </div>
      </div>
    </div>
  );
}
