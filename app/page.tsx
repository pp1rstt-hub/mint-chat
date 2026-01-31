"use client";
import { useState, useEffect, useRef } from "react";
import { db, storage } from "./firebase"; // Переконайся, що файл firebase.js поруч
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Chat() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const sendMessage = async (e, mediaUrl = null, type = "text") => {
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

  const uploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileRef = ref(storage, `chat/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    sendMessage(null, url, file.type.includes("image") ? "image" : "file");
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
        <h1 className="text-3xl mb-4">Mint Chat</h1>
        <input className="p-2 rounded text-black" value={name} onChange={(e) => setName(e.target.value)} placeholder="Твоє ім'я..." />
        <button className="mt-4 bg-green-500 px-6 py-2 rounded" onClick={() => name && setUser(true)}>Увійти</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`p-3 rounded-lg max-w-xs ${msg.sender === name ? "bg-green-500 text-white ml-auto" : "bg-white text-black"}`}>
            <p className="text-xs opacity-75">{msg.sender}</p>
            {msg.type === "text" && <p>{msg.text}</p>}
            {msg.type === "image" && <img src={msg.mediaUrl} className="rounded-lg mt-2" alt="img" />}
            {msg.type === "file" && <a href={msg.mediaUrl} target="_blank" className="underline">Файл/Голос</a>}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="p-4 bg-white flex items-center gap-2">
        <label className="cursor-pointer text-2xl">📎
          <input type="file" className="hidden" onChange={uploadFile} />
        </label>
        <input className="flex-1 p-2 border rounded" value={text} onChange={(e) => setText(e.target.value)} placeholder="Повідомлення..." />
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">➤</button>
      </form>
    </div>
  );
}
