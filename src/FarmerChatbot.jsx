import React, { useState, useRef, useEffect } from "react";

export default function FarmerChatbot() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "🌱 Namaste! Main aapka krishi sahayak hoon. Aap kya janna chahte hain?" }
  ]);
  const [input, setInput] = useState("");
  const [lang, setLang] = useState("hi-IN"); // default Hindi

  const recognitionRef = useRef(null);

  const sendMessage = async (customInput) => {
    const msgText = (customInput ?? input).trim();
    if (!msgText) return;

    // Add user message to UI
    const userMsg = { sender: "user", text: msgText };
    setMessages(prev => [...prev, userMsg]);

    try {
     const response = await fetch("/api/webhooks/rest/webhook", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ sender: "farmer1", message: msgText, metadata: { language: lang } })
});

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      // Rasa-style responses may be an array; guard against empty or unexpected shapes
      const botMsgs = Array.isArray(data) && data.length
        ? data.map(d => ({ sender: "bot", text: d.text ?? "" }))
        : [{ sender: "bot", text: "⚠️ Koi uttar nahi mila. Kripya phir se koshish karein." }];

      setMessages(prev => [...prev, ...botMsgs]);

      // Speak bot replies (cancel any ongoing speech first)
      window.speechSynthesis.cancel();
      botMsgs.forEach(msg => speakText(msg.text, lang));
    } catch (err) {
      console.error("sendMessage error:", err);
      setMessages(prev => [...prev, { sender: "bot", text: "❌ Server error, try again later." }]);
    } finally {
      setInput("");
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    // If already running, stop it first
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript;
      setInput(spokenText);
      sendMessage(spokenText);
    };

    recognition.onerror = (event) => {
      console.error("SpeechRecognition error:", event.error);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  // Stop recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
        recognitionRef.current = null;
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  const speakText = (text, language) => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col h-screen bg-green-50 p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-green-800">👨‍🌾 Kisan Sahayak Chatbot</h2>
        <select
          className="border border-green-400 rounded px-2 py-1 text-sm"
          onChange={(e) => setLang(e.target.value)}
          value={lang}
        >
          <option value="hi-IN">Hindi</option>
          <option value="ml-IN">Malayalam</option>
          <option value="ta-IN">Tamil</option>
          <option value="mr-IN">Marathi</option>
          <option value="en-IN">English</option>
        </select>
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-white rounded-2xl shadow p-3 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`my-1 flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`px-3 py-2 rounded-2xl max-w-xs text-sm shadow ${
                m.sender === "user"
                  ? "bg-green-600 text-white rounded-br-none"
                  : "bg-gray-200 text-gray-900 rounded-bl-none"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Box */}
      <div className="mt-3 flex items-center">
        <button
          onClick={startListening}
          className="bg-yellow-500 text-white px-3 py-2 rounded-l-2xl hover:bg-yellow-600"
          aria-label="Start voice input"
        >
          🎙
        </button>
        <input
          className="flex-1 border border-green-400 px-3 py-2 focus:outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Apna prashn likhiye ya mic dabaiye..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={() => sendMessage()}
          className="bg-green-600 text-white px-4 py-2 rounded-r-2xl hover:bg-green-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
