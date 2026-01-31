"use client";
import { useState, useEffect, useRef } from "react";
import { db, storage } from "../firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Chat() {
  const [user, setUser] = useState(false);
  const [name, setName] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  const sendToDb = async (mediaUrl: string | null, type: string) => {
    await addDoc(collection(db, "messages"), {
      text: type === "text" ? text : "",
      sender: name,
      mediaUrl,
      type,
      createdAt: serverTimestamp(),
    });
    setText("");
  };

  const uploadFile = async (file: File | Blob, type: string) => {
    try {
      const fileName = `chat/${Date.now()}_${type}`;
      const fileRef = ref(storage, fileName);
      const snapshot = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snapshot.ref);
      await sendToDb(url, type);
    } catch (e) {
      alert("Помилка завантаження! Перевір Rules в Firebase Storage.");
    }
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    audioChunks.current = [];
    mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
    mediaRecorder.current.onstop = () => {
      const audioBlob = new Blob(audioChunks.current, { type: "audio/mpeg" });
      uploadFile(audioBlob, "audio");
    };
    mediaRecorder.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
  };

  if (!user) {
    return (
      <div style={{backgroundColor:'#111b21', height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'white', fontFamily:'Arial'}}>
        <h1 style={{color:'#00a884', fontSize:'40px', marginBottom:'20px'}}>Mint Chat</h1>
        <div style={{backgroundColor:'#202c33', padding:'40px', borderRadius:'15px', textAlign:'center'}}>
          <input style={{width:'250px', padding:'15px', borderRadius:'8px', border:'none', backgroundColor:'#2a3942', color:'white', outline:'none'}} 
                 value={name} onChange={(e)=>setName(e.target.value)} placeholder="Введіть ім'я..." />
          <button style={{display:'block', width:'100%', marginTop:'20px', padding:'15px', backgroundColor:'#00a884', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}} 
                  onClick={()=>name && setUser(true)}>УВІЙТИ</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:'flex', height:'100vh', backgroundColor:'#0b141a', color:'#e9edef', fontFamily:'Arial'}}>
      {/* Бокова панель */}
      <div style={{width:'300px', backgroundColor:'#111b21', borderRight:'1px solid #313d45', display:'flex', flexDirection:'column'}} className="hidden md:flex">
        <div style={{padding:'20px', backgroundColor:'#202c33', fontWeight:'bold'}}>{name}</div>
        <div style={{padding:'20px', color:'#00a884'}}>Чати: Загальний</div>
      </div>

      {/* Чат */}
      <div style={{flex:1, display:'flex', flexDirection:'column'}}>
        <div style={{padding:'15px', backgroundColor:'#202c33', borderBottom:'1px solid #313d45'}}>Mint Chat Room</div>
        <div style={{flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'10px', backgroundImage:'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")'}}>
          {messages.map(msg => (
            <div key={msg.id} style={{alignSelf: msg.sender === name ? 'flex-end' : 'flex-start', maxWidth:'70%'}}>
              <div style={{backgroundColor: msg.sender === name ? '#005c4b' : '#202c33', padding:'10px', borderRadius:'10px'}}>
                <div style={{fontSize:'10px', color:'#00a884', fontWeight:'bold'}}>{msg.sender}</div>
                {msg.type === 'text' && <div>{msg.text}</div>}
                {msg.type === 'image' && <img src={msg.mediaUrl} style={{maxWidth:'100%', borderRadius:'5px'}} />}
                {msg.type === 'audio' && <audio src={msg.mediaUrl} controls style={{height:'35px', width:'200px'}} />}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Панель вводу */}
        <div style={{padding:'15px', backgroundColor:'#202c33', display:'flex', gap:'10px', alignItems:'center'}}>
          <label style={{cursor:'pointer', fontSize:'24px'}}>🖼️
            <input type="file" hidden accept="image/*" onChange={(e)=>e.target.files && uploadFile(e.target.files[0], 'image')} />
          </label>
          
          <button onMouseDown={startRecording} onMouseUp={stopRecording} 
                  style={{background:'none', border:'none', fontSize:'24px', cursor:'pointer', color: isRecording ? 'red' : 'white'}}>
            {isRecording ? '🔴' : '🎤'}
          </button>

          <input style={{flex:1, padding:'10px', borderRadius:'20px', border:'none', backgroundColor:'#2a3942', color:'white'}} 
                 value={text} onChange={(e)=>setText(e.target.value)} placeholder="Повідомлення..." 
                 onKeyPress={(e)=>e.key === 'Enter' && sendToDb(null, 'text')} />
          
          <button onClick={()=>sendToDb(null, 'text')} style={{backgroundColor:'#00a884', border:'none', borderRadius:'50%', width:'40px', height:'40px', cursor:'pointer'}}>➤</button>
        </div>
      </div>
    </div>
  );
}
