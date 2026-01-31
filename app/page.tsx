"use client";
import { useState, useEffect, useRef } from "react";
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

  // Оновлення повідомлень в реальному часі для всіх пристроїв
  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      alert("Помилка бази даних!");
    }
  };

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => sendToDb(reader.result as string, "image");
    reader.readAsDataURL(file);
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
          <input style={{padding:'10px', width:'200px', backgroundColor:'#111', color:'#fff', border:'1px solid #333', outline:'none'}} 
                 value={name} onChange={(e)=>setName(e.target.value)} placeholder="Ім'я" />
          <button style={{padding:'10px 20px', marginLeft:'10px', backgroundColor:'#00a884', border:'none', cursor:'pointer', fontWeight:'bold'}} 
                  onClick={()=>name && setUser(true)}>ВХІД</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:'flex', height:'100vh', backgroundColor:'#000', color:'#fff', fontFamily:'Arial'}}>
      {/* ЛІВА ПАНЕЛЬ */}
      <div style={{width:'250px', borderRight:'1px solid #222', display:'flex', flexDirection:'column', backgroundColor:'#0a0a0a'}}>
        <div style={{padding:'20px', borderBottom:'1px solid #222', fontWeight:'bold', color:'#00a884'}}>ПРОФІЛЬ: {name}</div>
        <div style={{padding:'20px', color:'#666'}}>Контакти: Загальний</div>
      </div>

      {/* ЧАТ */}
      <div style={{flex:1, display:'flex', flexDirection:'column'}}>
        <div style={{padding:'15px', borderBottom:'1px solid #222', backgroundColor:'#0a0a0a', fontWeight:'bold'}}>ГОЛОВНИЙ ЧАТ</div>
        
        <div style={{flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'15px', backgroundColor:'#000'}}>
          {messages.map(msg => (
            <div key={msg.id} style={{alignSelf: msg.sender === name ? 'flex-end' : 'flex-start', maxWidth:'60%'}}>
              <div style={{fontSize:'10px', color:'#00a884', marginBottom:'2px'}}>{msg.sender}</div>
              <div style={{backgroundColor: msg.sender === name ? '#003d33' : '#1a1a1a', padding:'10px', borderRadius:'5px'}}>
                {msg.type === 'text' && <div>{msg.text}</div>}
                {msg.type === 'image' && <img src={msg.mediaUrl} style={{maxWidth:'100%', borderRadius:'5px'}} />}
                {msg.type === 'audio' && <audio src={msg.mediaUrl} controls style={{height:'30px', width:'200px'}} />}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* ВВОД */}
        <div style={{padding:'20px', borderTop:'1px solid #222', display:'flex', gap:'15px', backgroundColor:'#0a0a0a', alignItems:'center'}}>
          <label style={{cursor:'pointer'}}>🖼️<input type="file" hidden accept="image/*" onChange={handleFileUpload} /></label>
          <button onMouseDown={startRecording} onMouseUp={()=>mediaRecorder.current?.stop()} 
                  style={{background:'none', border:'none', fontSize:'20px', cursor:'pointer', color: isRecording ? 'red' : 'white'}}>🎤</button>
          <input style={{flex:1, padding:'10px', backgroundColor:'#111', border:'1px solid #333', color:'#fff', outline:'none', borderRadius:'5px'}} 
                 value={text} onChange={(e)=>setText(e.target.value)} onKeyPress={(e)=>e.key === 'Enter' && sendToDb(null, 'text')} placeholder="Повідомлення..." />
          <button onClick={()=>sendToDb(null, 'text')} style={{backgroundColor:'#00a884', border:'none', padding:'10px 20px', cursor:'pointer', fontWeight:'bold'}}>SEND</button>
        </div>
      </div>
    </div>
  );
}
