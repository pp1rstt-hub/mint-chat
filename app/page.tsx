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
      <div className="flex flex-col items-center justify-center h-screen bg-[#0b141a] text-white">
        <h1 className="text-4xl font-bold mb-8 text-green-500">Mint Chat</h1>
        <div className="bg-[#202c33] p-8 rounded-lg shadow-xl w-80">
          <input className="w-full p-3 rounded bg-[#2a3942] border-none text-white focus:outline-none" 
                 value={name} onChange={(e) => setName(e.target.value)} placeholder="Введіть ім'я..." />
          <button className="w-full mt-4 bg-green-600 hover:bg-green-700 p-3 rounded font-bold transition" 
                  onClick={() => name && setUser(true)}>Увійти в чат</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0b141a] text-[#e9edef]">
      {/* Бокова панель (Чати) */}
      <div className="w-80 border-r border-[#313d45] hidden md:flex flex-col bg-[#111b21]">
        <div className="p-4 bg-[#202c33] flex justify-between items-center">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-black font-bold">{name[0]}</div>
          <span className="font-semibold">{name}</span>
        </div>
        <div className="p-4 text-green-500 font-medium border-b border-[#313d45]">Активні чати</div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 bg-[#2a3942] cursor-pointer">Загальний чат</div>
        </div>
      </div>

      {/* Основне вікно чату */}
      <div className="flex-1 flex flex-col relative" style={{backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: "overlay"}}>
        <div className="p-4 bg-[#202c33] shadow-md z-10">
          <h2 className="font-bold text-lg">Груповий чат</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === name ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] p-2 rounded-lg shadow ${msg.sender === name ? "bg-[#005c4b] text-white" : "bg-[#202c33] text-white"}`}>
                <p className="text-[10px] text-green-400 font-bold mb-1">{msg.sender}</p>
                {msg.type === "text" ? <p className="text-sm">{msg.text}</p> : <img src={msg.mediaUrl} className="rounded mt-1 max-w-full h-auto" />}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-3 bg-[#202c33] flex items-center gap-3">
          <label className="cursor-pointer hover:bg-[#3b4a54] p-2 rounded-full transition">
            <span className="text-2xl">📎</span>
            <input type="file" className="hidden" onChange={uploadFile} accept="image/*" />
          </label>
          <input className="flex-1 p-2 bg-[#2a3942] border-none rounded-lg text-white focus:outline-none" 
                 value={text} onChange={(e) => setText(e.target.value)} placeholder="Повідомлення..." />
          <button type="submit" className="bg-green-600 p-2 rounded-full w-10 h-10 flex items-center justify-center hover:bg-green-700 transition">➤</button>
        </form>
      </div>
    </div>
  );
}
