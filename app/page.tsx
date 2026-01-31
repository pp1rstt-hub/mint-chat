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
      alert("Занадто великий файл! Спробуй щось менше.");
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

  if (!user) {
    return (
      <div style={{backgroundColor:'#111b21', height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', color:'white', fontFamily:'sans-serif'}}>
        <div style={{backgroundColor:'#202c33', padding:'25px', borderRadius:'10px', textAlign:'center', width:'300px'}}>
          <h2 style={{color:'#00a884', marginBottom:'20px'}}>Mint Chat</h2>
          <input style={{width:'100%', padding:'10px', borderRadius:'5px', border:'none', backgroundColor:'#2a3942', color:'white', marginBottom:'15px', boxSizing:'border-box'}} 
                 value={name} onChange={(e)=>setName(e.target.value)} placeholder="Ваше ім'я" />
          <button style={{width:'100%', padding:'10px', backgroundColor:'#00a884', border:'none', borderRadius:'5px', fontWeight:'bold', cursor:'pointer'}} 
                  onClick={()=>name && setUser(true)}>УВІЙТИ</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:'flex', height:'100vh', backgroundColor:'#0b141a', color:'#e9edef', fontFamily:'sans-serif', justifyContent:'center'}}>
      <div style={{width:'100%', maxWidth:'600px', display:'flex', flexDirection:'column', borderLeft:'1px solid #313d45', borderRight:'1px solid #313d45'}}>
        {/* Шапка */}
        <div style={{padding:'10px 15px', backgroundColor:'#202c33', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <span style={{fontWeight:'bold'}}>🔥 Chat Room</span>
          <span style={{fontSize:'12px', color:'#00a884'}}>{name}</span>
        </div>
        
        {/* Повідомлення */}
        <div style={{flex:1, overflowY:'auto', padding:'15px', display:'flex', flexDirection:'column', gap:'8px', backgroundImage:'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")'}}>
          {messages.map(msg => (
            <div key={msg.id} style={{alignSelf: msg.sender === name ? 'flex-end' : 'flex-start', maxWidth:'85%'}}>
              <div style={{backgroundColor: msg.sender === name ? '#005c4b' : '#202c33', padding:'6px 10px', borderRadius:'8px', boxShadow:'0 1px 1px rgba(0,0,0,0.2)'}}>
                {msg.sender !== name && <div style={{fontSize:'10px', color:'#00a884', fontWeight:'bold', marginBottom:'2px'}}>{msg.sender}</div>}
                {msg.type === 'text' && <div style={{fontSize:'14px', lineHeight:'1.4'}}>{msg.text}</div>}
                {msg.type === 'image' && <img src={msg.mediaUrl} style={{maxWidth:'100%', borderRadius:'5px', marginTop:'3px'}} />}
                {msg.type === 'audio' && <audio src={msg.mediaUrl} controls style={{height:'30px', width:'100%', marginTop:'3px'}} />}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Панель вводу */}
        <div style={{padding:'10px', backgroundColor:'#202c33', display:'flex', alignItems:'center', gap:'10px'}}>
          <label style={{cursor:'pointer', fontSize:'20px'}}>🖼️
            <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
          </label>
          
          <button onMouseDown={startRecording} onMouseUp={()=>mediaRecorder.current?.stop()} 
                  onTouchStart={startRecording} onTouchEnd={()=>mediaRecorder.current?.stop()}
                  style={{background:'none', border:'none', fontSize:'20px', cursor:'pointer', color: isRecording ? 'red' : 'white'}}>
            {isRecording ? '🛑' : '🎤'}
          </button>

          <input style={{flex:1, padding:'8px 12px', borderRadius:'20px', border:'none', backgroundColor:'#2a3942', color:'white', fontSize:'14px', outline:'none'}} 
                 value={text} onChange={(e)=>setText(e.target.value)} 
                 onKeyPress={(e)=>e.key === 'Enter' && sendToDb(null, 'text')} placeholder="Повідомлення" />
          
          <button onClick={()=>sendToDb(null, 'text')} style={{backgroundColor:'#00a884', border:'none', borderRadius:'50%', width:'35px', height:'35px', color:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>➤</button>
        </div>
      </div>
    </div>
  );
}
