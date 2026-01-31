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

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  const sendToDb = async (mediaData: string | null, type: string) => {
    try {
      await addDoc(collection(db, "messages"), {
        text: type === "text" ? text : "",
        sender: name,
        mediaUrl: mediaData, // Тепер тут просто довгий текст (Base64)
        type,
        createdAt: serverTimestamp(),
      });
      setText("");
    } catch (e) {
      alert("Помилка! Можливо, файл занадто великий.");
    }
  };

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      sendToDb(reader.result as string, "image");
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => sendToDb(reader.result as string, "audio");
        reader.readAsDataURL(blob);
      };
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      alert("Дозволь доступ до мікрофона!");
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
  };

  if (!user) {
    return (
      <div style={{backgroundColor:'#111b21', height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'white', fontFamily:'sans-serif'}}>
        <h1 style={{color:'#00a884', fontSize:'32px', marginBottom:'20px'}}>Mint Chat FREE</h1>
        <div style={{backgroundColor:'#202c33', padding:'30px', borderRadius:'12px', textAlign:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.5)'}}>
          <input style={{width:'220px', padding:'12px', borderRadius:'8px', border:'none', backgroundColor:'#2a3942', color:'white', outline:'none', marginBottom:'15px'}} 
                 value={name} onChange={(e)=>setName(e.target.value)} placeholder="Твоє ім'я" />
          <button style={{width:'100%', padding:'12px', backgroundColor:'#00a884', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}} 
                  onClick={()=>name && setUser(true)}>УВІЙТИ</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:'flex', height:'100vh', backgroundColor:'#0b141a', color:'#e9edef', fontFamily:'sans-serif'}}>
      <div style={{flex:1, display:'flex', flexDirection:'column'}}>
        <div style={{padding:'15px', backgroundColor:'#202c33', borderBottom:'1px solid #313d45', fontWeight:'bold'}}>Чат: {name}</div>
        
        <div style={{flex:1, overflowY:'auto', padding:'15px', display:'flex', flexDirection:'column', gap:'10px', backgroundImage:'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")'}}>
          {messages.map(msg => (
            <div key={msg.id} style={{alignSelf: msg.sender === name ? 'flex-end' : 'flex-start', maxWidth:'80%'}}>
              <div style={{backgroundColor: msg.sender === name ? '#005c4b' : '#202c33', padding:'8px 12px', borderRadius:'10px', position:'relative'}}>
                <div style={{fontSize:'10px', color:'#00a884', fontWeight:'bold', marginBottom:'3px'}}>{msg.sender}</div>
                {msg.type === 'text' && <div style={{fontSize:'15px'}}>{msg.text}</div>}
                {msg.type === 'image' && <img src={msg.mediaUrl} style={{maxWidth:'100%', borderRadius:'8px', display:'block'}} />}
                {msg.type === 'audio' && <audio src={msg.mediaUrl} controls style={{height:'35px', width:'180px'}} />}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div style={{padding:'10px', backgroundColor:'#202c33', display:'flex', alignItems:'center', gap:'10px'}}>
          <label style={{cursor:'pointer', fontSize:'22px'}}>🖼️
            <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
          </label>
          
          <button onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
                  style={{background:'none', border:'none', fontSize:'22px', cursor:'pointer', color: isRecording ? 'red' : 'white'}}>
            {isRecording ? '🛑' : '🎤'}
          </button>

          <input style={{flex:1, padding:'10px 15px', borderRadius:'20px', border:'none', backgroundColor:'#2a3942', color:'white', outline:'none'}} 
                 value={text} onChange={(e)=>setText(e.target.value)} 
                 onKeyPress={(e)=>e.key === 'Enter' && sendToDb(null, 'text')} placeholder="Повідомлення..." />
          
          <button onClick={()=>sendToDb(null, 'text')} style={{backgroundColor:'#00a884', border:'none', borderRadius:'50%', width:'40px', height:'40px', color:'white', cursor:'pointer'}}>➤</button>
        </div>
      </div>
    </div>
  );
}
