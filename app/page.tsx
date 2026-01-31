"use client";
import { useState, useEffect } from "react";
import { db, storage } from "../firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Chat() {
  const [user, setUser] = useState(false);
  const [name, setName] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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

  const uploadFile = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileRef = ref(storage, `chat/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    sendMessage(null, url, "image");
  };

  if (!user) {
    return (
      <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', background:'#1a1a1a', color:'white'}}>
        <h1>Mint Chat</h1>
        <input style={{color:'black', padding:'10px'}} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ім'я" />
        <button style={{marginTop:'10px', background:'green', padding:'10px 20px'}} onClick={() => name && setUser(true)}>Увійти</button>
      </div>
    );
  }

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100vh', background:'#f0f0f0'}}>
      <div style={{flex:1, overflowY:'auto', padding:'20px'}}>
        {messages.map((msg) => (
          <div key={msg.id} style={{margin:'10px 0', padding:'10px', background: msg.sender === name ? '#dcf8c6' : 'white', alignSelf: msg.sender === name ? 'flex-end' : 'flex-start', borderRadius:'10px'}}>
            <small>{msg.sender}</small>
            {msg.type === "text" ? <p>{msg.text}</p> : <img src={msg.mediaUrl} style={{maxWidth:'200px', display:'block'}} />}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} style={{padding:'20px', background:'white', display:'flex', gap:'10px'}}>
        <input type="file" onChange={uploadFile} style={{width:'auto'}} />
        <input style={{flex:1, padding:'10px'}} value={text} onChange={(e) => setText(e.target.value)} placeholder="Повідомлення" />
        <button type="submit">Відправити</button>
      </form>
    </div>
  );
}
