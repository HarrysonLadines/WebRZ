"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  InputGroup,
  InputGroupTextarea,
  InputGroupButton,
} from "@/components/ui/input-group";
import { ArrowUpIcon } from "lucide-react";

// Página principal del chat
export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Cargar mensajes previos del chat desde la sesión
  useEffect(() => {
    const stored = sessionStorage.getItem("chatMessages");
    if (stored) setMessages(JSON.parse(stored));
  }, []);

  // Guardar los mensajes en la sesión cada vez que cambian
  useEffect(() => {
    sessionStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  // Enviar mensaje al servidor
  const handleSend = async () => {
    if (message.trim() === "") return;

    const userMessage = message;
    setMessages((prev) => [...prev, userMessage]); 
    setMessage("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, usuarioId: 1 }), 
      });

      if (!res.body) throw new Error("No se recibió respuesta del servidor");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let partialMessage = "";

      // Se agrega un mensaje vacío del bot que se irá actualizando
      setMessages((prev) => [...prev, ""]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        partialMessage += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = partialMessage; // actualiza mensaje del bot
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        "❌ Error al conectar con el servidor.",
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Efectos de fondo futuristas */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)] animate-pulse"></div>
      <div className="absolute top-10 left-10 w-32 h-32 bg-cyan-400/20 rounded-full blur-3xl animate-bounce"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-pink-400/20 rounded-full blur-3xl animate-bounce delay-1000"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-4/5 max-w-4xl h-5/6 bg-black/60 backdrop-blur-xl rounded-[40px] shadow-2xl border border-cyan-400/30 flex flex-col relative z-10"
        style={{
          boxShadow: '0 0 50px rgba(0, 255, 255, 0.2), inset 0 0 50px rgba(0, 255, 255, 0.1)',
        }}
      >
        {/* Encabezado del chat */}
        <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-black/80 to-purple-900/50 border-b border-cyan-400/30 rounded-t-[40px] relative">
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg animate-pulse">
            A
          </div>
          <span className="text-cyan-100 text-xl font-semibold tracking-wide">Don ChatGPT</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent animate-shimmer"></div>
        </div>

        {/* Zona donde aparecen los mensajes */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 scrollbar-thin scrollbar-thumb-cyan-400 scrollbar-track-transparent">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
              className={`px-5 py-3 rounded-3xl max-w-lg break-words shadow-lg transition-all duration-300 hover:shadow-xl ${
                index % 2 === 0
                  ? "self-end bg-gradient-to-r from-cyan-500 to-blue-600 text-white border border-cyan-400/50"
                  : "self-start bg-gradient-to-r from-gray-700 to-gray-800 text-cyan-100 border border-gray-600/50"
              }`}
              style={{
                boxShadow: index % 2 === 0 ? '0 0 20px rgba(0, 255, 255, 0.3)' : '0 0 20px rgba(100, 100, 100, 0.2)',
              }}
            >
              {msg}
            </motion.div>
          ))}

          {/* Indicador de que el bot está escribiendo */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="self-start bg-gradient-to-r from-gray-700 to-gray-800 text-cyan-100 px-5 py-3 rounded-3xl max-w-xs shadow-lg border border-gray-600/50 flex items-center gap-2"
              style={{ boxShadow: '0 0 20px rgba(100, 100, 100, 0.2)' }}
            >
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-200"></div>
              </div>
              Don ChatGPT está escribiendo...
            </motion.div>
          )}
        </div>

        {/* Área para escribir y enviar mensajes */}
        <div className="p-6 bg-gradient-to-r from-black/80 to-purple-900/50 border-t border-cyan-400/30 flex gap-3 rounded-b-[40px] relative">
          <InputGroup className="flex-1">
            <InputGroupTextarea
              placeholder="Escribe un mensaje..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="resize-none bg-gray-800/70 text-cyan-100 placeholder-cyan-400/50 border border-cyan-400/30 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all duration-300"
            />
            <InputGroupButton
              onClick={handleSend}
              className="rounded-full p-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg transition-all duration-300 hover:shadow-xl"
              size="icon-xs"
              style={{ boxShadow: '0 0 15px rgba(0, 255, 255, 0.4)' }}
            >
              <ArrowUpIcon className="w-5 h-5" />
            </InputGroupButton>
          </InputGroup>
        </div>
      </motion.div>
    </div>
  );
}

