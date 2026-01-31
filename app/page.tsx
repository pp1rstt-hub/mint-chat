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
    await addDoc(collection(db, "messages"), {
      text: text,
      sender: name,
      type: "text",
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
    await addDoc(collection(db, "messages"), {
      mediaUrl: url,
      sender: name,
      type: "image",
      createdAt: serverTimestamp(),
    });
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#111b21] text-[#e9edef]">
        <h1 className="text-4xl font-bold mb-6 text-green-500">Mint Chat</h1>
        <div className="bg-[#202c33] p-10 rounded-lg shadow-2xl w-96 text-center">
          <input className="w-full p-3 rounded bg-[#2a3942] text-white border-none mb-4 focus:ring-2 focus:ring-green-500 outline-none" 
                 value={name} onChange={(e) => setName(e.target.value)} placeholder="Як тебе звати?" />
          <button className="w-full bg-[#00a884] hover:bg-[#008f72] p-3 rounded-md font-bold transition-all text-[#111b21]" 
                  onClick={() => name && setUser(true)}>ПОЧАТИ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0b141a] text-[#e9edef] overflow-hidden">
      {/* Бокова панель */}
      <div className="w-80 border-r border-[#313d45] flex flex-col bg-[#111b21]">
        <div className="p-4 bg-[#202c33] flex items-center gap-3 border-b border-[#313d45]">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center font-bold text-white">{name[0]}</div>
          <span className="font-medium text-lg">{name}</span>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <div className="p-3 bg-[#2a3942] rounded-lg border-l-4 border-green-500">Загальний чат</div>
        </div>
      </div>

      {/* Основна частина */}
      <div className="flex-1 flex flex-col relative bg-[#0b141a]">
        <div className="p-4 bg-[#202c33] z-10 border-b border-[#313d45]">
          <h2 className="font-bold text-lg text-white">🔥 Основна кімната</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-fixed">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === name ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] p-3 rounded-xl shadow-lg ${msg.sender === name ? "bg-[#005c4b] rounded-tr-none" : "bg-[#202c33] rounded-tl-none"}`}>
                <p className="text-[11px] text-green-400 font-bold mb-1">{msg.sender}</p>
                {msg.type === "text" ? <p className="text-[15px]">{msg.text}</p> : <img src={msg.mediaUrl} className="rounded-lg max-w-full border border-[#313d45]" />}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 bg-[#202c33] flex items-center gap-4 border-t border-[#313d45]">
          <label className="cursor-pointer hover:bg-[#3b4a54] p-2 rounded-full transition-colors text-2xl">
            📎 <input type="file" className="hidden" onChange={uploadFile} accept="image/*" />
          </label>
          <input className="flex-1 p-3 bg-[#2a3942] border-none rounded-xl text-white focus:outline-none placeholder-[#8696a0]" 
                 value={text} onChange={(e) => setText(e.target.value)} placeholder="Напишіть щось..." />
          <button type="submit" className="bg-[#00a884] p-3 rounded-full w-12 h-12 flex items-center justify-center hover:bg-[#008f72] transition-transform active:scale-95 shadow-lg">
            <span className="text-white text-xl">➤</span>
          </button>
        </form>
      </div>
    </div>
  );
}
