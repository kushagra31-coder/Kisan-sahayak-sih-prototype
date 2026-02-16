import { useState, useCallback, useRef, useEffect } from "react";
import { LANGUAGES, GREETING, PLACEHOLDER, type LangCode } from "@/lib/languages";
import { BOT_RESPONSES } from "@/lib/bot-responses";

interface Message {
  sender: "user" | "bot";
  text: string;
}

export function useChatbot() {
  const [lang, setLang] = useState<LangCode>("hi-IN");
  const [messages, setMessages] = useState<Message[]>([
    { sender: "bot", text: GREETING["hi-IN"] },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const changeLang = useCallback((newLang: LangCode) => {
    setLang(newLang);
    setMessages([{ sender: "bot", text: GREETING[newLang] }]);
  }, []);

  const speakText = useCallback((text: string, language: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const matched = voices.find((v) => v.lang === language);
    utterance.lang = matched ? matched.lang : "hi-IN";
    if (matched) utterance.voice = matched;
    window.speechSynthesis.speak(utterance);
  }, []);

  const getLocalResponse = useCallback((currentLang: LangCode): string => {
    const responses = BOT_RESPONSES[currentLang];
    return responses[Math.floor(Math.random() * responses.length)];
  }, []);

  const sendMessage = useCallback(async (customInput?: string) => {
    const msgText = customInput || input;
    if (!msgText.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: msgText }]);
    setInput("");
    setIsTyping(true);

    // Simulate bot thinking delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    const botReply = getLocalResponse(lang);
    setIsTyping(false);
    setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    speakText(botReply, lang);
  }, [input, lang, speakText, getLocalResponse]);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new SR();
    recognition.lang = lang;
    setIsListening(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const spokenText = event.results[0][0].transcript;
      setInput(spokenText);
      sendMessage(spokenText);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  }, [lang, sendMessage]);

  return {
    lang, changeLang, messages, input, setInput,
    sendMessage, startListening, isListening, isTyping,
    bottomRef, placeholder: PLACEHOLDER[lang], languages: LANGUAGES,
  };
}
