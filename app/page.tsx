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

  // СЛУХАЄМО БАЗУ (щоб бачити повідомлення з усіх пристроїв)
  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }, (error) => {
      console.error("Помилка отримання даних:", error);
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
      alert("Помилка! Можливо файл занадто великий для безкоштовної бази.");
    }
  };

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      // Стискаємо трохи, щоб влізло в базу
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
      alert("Дозволь мікрофон!");
    }
  };

  if (!user) {
    return (
      <div style={{backgroundColor:'#111b21', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontFamily:'Arial'}}>
        <div style={{backgroundColor:'#202c33', padding:'40px', borderRadius:'15px', textAlign:'center', width:'320px'}}>
          <h1 style={{color:'#00a884', marginBottom:'20px'}}>Mint Chat</h1>
          <input style={{width:'100%', padding:'15px', borderRadius:'8px', border:'none', backgroundColor:'#2a3942', color:'white', outline:'none', boxSizing:'border-box'}} 
                 value={name} onChange={(e)=>setName(e.target.value)} placeholder="Твоє ім'я..." />
          <button style={{width:'100%', marginTop:'20px', padding:'15px', backgroundColor:'#00a884', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}} 
                  onClick={()=>name && setUser(true)}>УВІЙТИ</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:'flex', width:'100vw', height:'100vh', backgroundColor:'#0b141a', color:'#e9edef', fontFamily:'Arial', overflow:'hidden'}}>
      
      {/* ЛІВА ПАНЕЛЬ (ЧАТИ) */}
      <div style={{width:'30%', minWidth:'250px', backgroundColor:'#111b21', borderRight:'1px solid #313d45', display:'flex', flexDirection:'column'}}>
        <div style={{padding:'20px', backgroundColor:'#202c33', display:'flex', alignItems:'center', gap:'10px'}}>
          <div style={{width:'40px', height:'40px', backgroundColor:'#00a884', borderRadius:'50%', display:'flex', justifyContent:'center', alignItems:'center', fontWeight:'bold'}}>{name[0]}</div>
          <span>{name} (Ви)</span>
        </div>
        <div style={{padding:'15px', color:'#00a884', fontSize:'14px', borderBottom:'1px solid #313d45'}}>СПИСОК ЧАТІВ</div>
        <div style={{padding:'20px', backgroundColor:'#2a3942', cursor:'pointer'}}>🌍 Загальна група</div>
      </div>

      {/* ПРАВА ЧАСТИНА (ВІКНО ЧАТУ) */}
      <div style={{flex:1, display:'flex', flexDirection:'column', backgroundColor:'#0b141a'}}>
        <div style={{padding:'15px', backgroundColor:'#202c33', fontWeight:'bold', borderBottom:'1px solid #313d45'}}>Загальний чат</div>
        
        <div style={{flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'10px', backgroundImage:'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundBlendMode:'overlay', backgroundColor:'#0b141a'}}>
          {messages.map(msg => (
            <div key={msg.id} style={{alignSelf: msg.sender === name ? 'flex-end' : 'flex-start', maxWidth:'75%'}}>
              <div style={{backgroundColor: msg.sender === name ? '#005c4b' : '#202c33', padding:'10px', borderRadius:'10px', boxShadow:'0 1px 2px rgba(0,0,0,0.5)'}}>
                {msg.sender !== name && <div style={{fontSize:'12px', color:'#00a884', fontWeight:'bold', marginBottom:'5px'}}>{msg.sender}</div>}
                {msg.type === 'text' && <div style={{fontSize:'15px'}}>{msg.text}</div>}
                {msg.type === 'image' && <img src={msg.mediaUrl} style={{maxWidth:'100%', borderRadius:'8px', marginTop:'5px'}} />}
                {msg.type === 'audio' && <audio src={msg.mediaUrl} controls style={{height:'35px', width:'200px', marginTop:'5px'}} />}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* ПАНЕЛЬ ВВОДУ */}
        <div style={{padding:'10px 20px', backgroundColor:'#202c33', display:'flex', alignItems:'center', gap:'15px'}}>
          <label style={{cursor:'pointer', fontSize:'24px'}}>🖼️
            <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
          </label>
          <button onMouseDown={startRecording} onMouseUp={() => mediaRecorder.current?.stop()} 
                  style={{background:'none', border:'none', fontSize:'24px', cursor:'pointer', color: isRecording ? 'red' : 'white'}}>
            {isRecording ? '🛑' : '🎤'}
          </button>
          <input style={{flex:1, padding:'12px', borderRadius:'25px', border:'none', backgroundColor:'#2a3942', color:'white', outline:'none'}} 
                 value={text} onChange={(e)=>setText(e.target.value)} onKeyPress={(e)=>e.key === 'Enter' && sendToDb(null, 'text')} placeholder="Повідомлення..." />
          <button onClick={()=>sendToDb(null, 'text')} style={{backgroundColor:'#00a884', border:'none', borderRadius:'50%', width:'45px', height:'45px', color:'white', cursor:'pointer'}}>➤</button>
        </div>
      </div>
    </div>
  );
}
