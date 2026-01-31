"use client";
import { useState, useEffect, useRef } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

// Твій робочий конфіг
const firebaseConfig = {
  apiKey: "AIzaSyBwS-T5U1W9X0Z2Y8L7M4N3Q6R5P4O3I2", 
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
  const [recording, setRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
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

  const send = async (data: { t?: string, img?: string, audio?: string }) => {
    if (!data.t && !data.img && !data.audio) return;
    await addDoc(collection(db, "messages"), {
      text: data.t || "",
      image: data.img || null,
      audio: data.audio || null,
      sender: name,
      createdAt: serverTimestamp()
    });
    setText("");
  };

  const handleImage = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => send({ img: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      const chunks: any = [];
      mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
        const reader = new FileReader();
        reader.onloadend = () => send({ audio: reader.result as string });
        reader.readAsDataURL(blob);
      };
      mediaRecorder.current.start();
      setRecording(true);
    } catch (err) { alert("Дай доступ до мікрофона!"); }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  if (!user) {
    return (
      <div style={{background:'#000', height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', color:'#fff', fontFamily:'sans-serif'}}>
        <div style={{border:'1px solid #00a884', padding:'50px', borderRadius:'15px', textAlign:'center', boxShadow:'0 0 30px rgba(0,168,132,0.15)'}}>
          <h1 style={{color:'#00a884', fontSize:'42px', margin:'0 0 20px', letterSpacing:'3px'}}>MINT</h1>
          <input style={{padding:'14px', background:'#111', color:'#fff', border:'1px solid #333', borderRadius:'8px', outline:'none', width:'220px', fontSize:'16px'}} 
                 onKeyPress={(e)=>e.key==='Enter' && name && setUser(true)}
                 onChange={(e)=>setName(e.target.value)} placeholder="Username..." />
          <br/><br/>
          <button style={{padding:'14px 50px', background:'#00a884', border:'none', color:'#fff', cursor:'pointer', fontWeight:'bold', borderRadius:'8px', fontSize:'16px'}} 
                  onClick={()=>name && setUser(true)}>ENTER</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:'flex', height:'100vh', background:'#000', color:'#fff', fontFamily:'sans-serif'}}>
      {/* SIDEBAR */}
      <div style={{width:'280px', background:'#080808', borderRight:'1px solid #1a1a1a', display:'flex', flexDirection:'column'}}>
        <div style={{padding:'25px', borderBottom:'1px solid #1a1a1a'}}>
          <h2 style={{color:'#00a884', margin:0, letterSpacing:'2px'}}>MINT CHAT</h2>
        </div>
        <div style={{flex:1, padding:'20px'}}>
          <div style={{color:'#444', fontSize:'11px', fontWeight:'bold', marginBottom:'15px', textTransform:'uppercase'}}>Channels</div>
          <div style={{padding:'12px', background:'#111', borderRadius:'10px', color:'#00a884', borderLeft:'4px solid #00a884', cursor:'pointer', fontWeight:'500'}}>
             # general-chat
          </div>
        </div>
        <div style={{padding:'20px', color:'#333', fontSize:'12px', borderTop:'1px solid #1a1a1a'}}>
          Logged as: <span style={{color:'#666'}}>{name}</span>
        </div>
      </div>

      {/* MAIN CHAT */}
      <div style={{flex:1, display:'flex', flexDirection:'column', position:'relative'}}>
        <div style={{flex:1, overflowY:'auto', padding:'25px', display:'flex', flexDirection:'column', gap:'15px'}}>
          {messages.map(m => (
            <div key={m.id} style={{alignSelf: m.sender === name ? 'flex-end' : 'flex-start', maxWidth:'75%'}}>
              <div style={{fontSize:'11px', color:'#00a884', marginBottom:'4px', textAlign: m.sender === name ? 'right' : 'left', fontWeight:'600'}}>{m.sender}</div>
              <div style={{
                background: m.sender === name ? '#005c4b' : '#1a1a1a', 
                padding:'12px', 
                borderRadius:'15px', 
                borderBottomRightRadius: m.sender === name ? '2px' : '15px', 
                borderBottomLeftRadius: m.sender === name ? '15px' : '2px',
                boxShadow:'0 2px 5px rgba(0,0,0,0.2)'
              }}>
                {m.image && <img src={m.image} style={{maxWidth:'100%', borderRadius:'10px', marginBottom:'8px', display:'block'}} />}
                {m.audio && (
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <audio src={m.audio} controls style={{filter:'invert(1) hue-rotate(90deg)', height:'30px', width:'210px'}} />
                  </div>
                )}
                {m.text && <div style={{wordBreak:'break-word', fontSize:'15px', lineHeight:'1.4'}}>{m.text}</div>}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA */}
        <div style={{padding:'20px', background:'#080808', display:'flex', gap:'15px', alignItems:'center', borderTop:'1px solid #1a1a1a'}}>
          <label style={{cursor:'pointer', fontSize:'22px', transition:'0.2s'}} title="Send Image">
            📷<input type="file" hidden accept="image/*" onChange={handleImage} />
          </label>
          
          <button onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
                  style={{background:'none', border:'none', fontSize:'22px', cursor:'pointer', color: recording ? '#ff4b4b' : '#fff', transition:'0.2s'}}>
            {recording ? '🛑' : '🎤'}
          </button>

          <input style={{flex:1, padding:'14px 20px', background:'#141414', color:'#fff', border:'1px solid #222', borderRadius:'25px', outline:'none', fontSize:'15px'}} 
                 value={text} onChange={(e)=>setText(e.target.value)} onKeyPress={(e)=>e.key==='Enter'&&send({t:text})} placeholder="Type something..." />
          
          <button onClick={() => send({t:text})} style={{background:'#00a884', border:'none', width:'45px', height:'45px', borderRadius:'50%', color:'#fff', cursor:'pointer', display:'flex', justifyContent:'center', alignItems:'center', fontSize:'18px'}}>➤</button>
        </div>
      </div>
    </div>
  );
}
