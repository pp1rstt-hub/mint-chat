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

  const sendMessage = async (e: any) => {
    e?.preventDefault();
    if (!text.trim()) return;
    await addDoc(collection(db, "messages"), { text, sender: name, type: "text", createdAt: serverTimestamp() });
    setText("");
  };

  const uploadFile = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileRef = ref(storage, `chat/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    await addDoc(collection(db, "messages"), { mediaUrl: url, sender: name, type: "image", createdAt: serverTimestamp() });
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#111b21] text-white">
        <h1 className="text-3xl font-bold mb-6 text-[#00a884]">Mint Chat</h1>
        <div className="bg-[#202c33] p-8 rounded-lg w-80 shadow-2xl">
          <input className="w-full p-3 rounded bg-[#2a3942] border-none mb-4 outline-none" 
                 value={name} onChange={(e) => setName(e.target.value)} placeholder="Твоє ім'я" />
          <button className="w-full bg-[#00a884] p-3 rounded font-bold text-[#111b21]" 
                  onClick={() => name && setUser(true)}>УВІЙТИ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0b141a] text-[#e9edef]">
      <div className="w-1/4 border-r border-[#313d45] hidden md:flex flex-col bg-[#111b21]">
        <div className="p-4 bg-[#202c33] font-bold border-b border-[#313d45]">{name}</div>
        <div className="p-4 text-[#00a884]">Активні чати</div>
      </div>

      <div className="flex-1 flex flex-col bg-[#0b141a] relative">
        <div className="p-4 bg-[#202c33] border-b border-[#313d45] font-bold">🔥 Загальна кімната</div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" style={{backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: 'overlay', backgroundColor: '#0b141a'}}>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === name ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] p-2 px-3 rounded-lg shadow ${msg.sender === name ? "bg-[#005c4b]" : "bg-[#202c33]"}`}>
                <p className="text-[10px] text-[#00a884] font-bold">{msg.sender}</p>
                {msg.type === "text" ? <p className="text-sm">{msg.text}</p> : <img src={msg.mediaUrl} className="rounded max-w-full mt-1" />}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-3 bg-[#202c33] flex items-center gap-2">
          <label className="cursor-pointer text-2xl px-2">
            📎 <input type="file" className="hidden" onChange={uploadFile} />
          </label>
          <input className="flex-1 p-2 bg-[#2a3942] rounded-lg outline-none" 
                 value={text} onChange={(e) => setText(e.target.value)} placeholder="Повідомлення..." />
          <button type="submit" className="bg-[#00a884] p-2 rounded-full w-10 h-10 flex items-center justify-center">➤</button>
        </form>
      </div>
    </div>
  );
}
