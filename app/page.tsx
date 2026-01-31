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
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  const sendMessage = async (e: any, mediaUrl = null, type = "text") => {
    e?.preventDefault();
    if (!text.trim() && !mediaUrl) return;
    await addDoc(collection(db, "messages"), {
      text: type === "text" ? text : "",
      sender: name,
      mediaUrl,
      type,
      createdAt: serverTimestamp(),
    });
    setText("");
  };

  const uploadFile = async (e: any, type: string) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileRef = ref(storage, `chat/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    sendMessage(null, url, type);
  };

  if (!user) {
    return (
      <div style={{backgroundColor: '#111b21', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'Arial'}}>
        <h1 style={{color: '#00a884', fontSize: '40px', marginBottom: '30px'}}>Mint Chat</h1>
        <div style={{backgroundColor: '#202c33', padding: '40px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', textAlign: 'center'}}>
          <input style={{width: '250px', padding: '15px', borderRadius: '8px', border: 'none', backgroundColor: '#2a3942', color: 'white', outline: 'none'}} 
                 value={name} onChange={(e) => setName(e.target.value)} placeholder="Введіть ваше ім'я..." />
          <button style={{display: 'block', width: '100%', marginTop: '20px', padding: '15px', backgroundColor: '#00a884', color: '#111b21', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'}} 
                  onClick={() => name && setUser(true)}>ПОЧАТИ ЧАТ</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{display: 'flex', height: '100vh', backgroundColor: '#0b141a', color: '#e9edef', fontFamily: 'Arial', overflow: 'hidden'}}>
      {/* БОКОВА ПАНЕЛЬ */}
      <div style={{width: '300px', backgroundColor: '#111b21', borderRight: '1px solid #313d45', display: 'flex', flexDirection: 'column'}}>
        <div style={{padding: '20px', backgroundColor: '#202c33', display: 'flex', alignItems: 'center', gap: '15px'}}>
          <div style={{width: '40px', height: '40px', backgroundColor: '#00a884', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>{name[0]}</div>
          <span style={{fontWeight: 'bold'}}>{name} (Ви)</span>
        </div>
        <div style={{padding: '20px', color: '#00a884', fontWeight: 'bold', borderBottom: '1px solid #313d45'}}>АКТИВНІ ЧАТИ</div>
        <div style={{padding: '20px', backgroundColor: '#2a3942', cursor: 'pointer'}}>🔥 Загальна кімната</div>
      </div>

      {/* ВІКНО ЧАТУ */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', position: 'relative'}}>
        <div style={{padding: '15px 20px', backgroundColor: '#202c33', zIndex: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.3)'}}>
          <h2 style={{margin: 0, fontSize: '18px'}}>Груповий чат</h2>
        </div>

        <div style={{flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundBlendMode: 'overlay', backgroundColor: '#0b141a'}}>
          {messages.map((msg) => (
            <div key={msg.id} style={{alignSelf: msg.sender === name ? 'flex-end' : 'flex-start', maxWidth: '70%'}}>
              <div style={{backgroundColor: msg.sender === name ? '#005c4b' : '#202c33', padding: '8px 12px', borderRadius: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>
                <div style={{fontSize: '11px', color: '#00a884', fontWeight: 'bold', marginBottom: '4px'}}>{msg.sender}</div>
                {msg.type === 'text' && <div style={{fontSize: '15px'}}>{msg.text}</div>}
                {msg.type === 'image' && <img src={msg.mediaUrl} style={{maxWidth: '100%', borderRadius: '8px', marginTop: '5px', border: '1px solid #313d45'}} />}
                {msg.type === 'audio' && <audio src={msg.mediaUrl} controls style={{marginTop: '5px', height: '35px', width: '200px'}} />}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* ПАНЕЛЬ ВВОДУ */}
        <form onSubmit={sendMessage} style={{padding: '10px 20px', backgroundColor: '#202c33', display: 'flex', alignItems: 'center', gap: '15px'}}>
          <label title="Картинка" style={{cursor: 'pointer', fontSize: '24px'}}>🖼️
            <input type="file" hidden accept="image/*" onChange={(e) => uploadFile(e, 'image')} />
          </label>
          <label title="Голосове" style={{cursor: 'pointer', fontSize: '24px'}}>🎤
            <input type="file" hidden accept="audio/*" onChange={(e) => uploadFile(e, 'audio')} />
          </label>
          <input style={{flex: 1, padding: '12px 20px', borderRadius: '25px', border: 'none', backgroundColor: '#2a3942', color: 'white', fontSize: '15px', outline: 'none'}} 
                 value={text} onChange={(e) => setText(e.target.value)} placeholder="Напишіть повідомлення..." />
          <button type="submit" style={{backgroundColor: '#00a884', border: 'none', borderRadius: '50%', width: '45px', height: '45px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '20px'}}>➤</button>
        </form>
      </div>
    </div>
  );
}
