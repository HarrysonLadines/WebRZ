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
    setMessages((prev) => [...prev, userMessage]); // mensaje del usuario
    setMessage("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
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
    <div className="h-screen w-screen flex items-center justify-center bg-gray-200">
      <div className="w-4/7 h-6/7 bg-black/50 backdrop-blur-md rounded-[50px] shadow-2xl border border-white/20 flex flex-col">
        {/* Encabezado del chat */}
        <div className="flex items-center gap-4 p-4 bg-black/50 border-b border-white/20 rounded-t-[50px]">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            A
          </div>
          <span className="text-white text-lg font-semibold">Don ChatGPT</span>
        </div>

        {/* Zona donde aparecen los mensajes */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`px-4 py-2 rounded-2xl max-w-md break-words shadow-md ${
                index % 2 === 0
                  ? "self-end bg-blue-500/70 text-white"
                  : "self-start bg-gray-500/70 text-white"
              }`}
            >
              {msg}
            </motion.div>
          ))}

          {/* Indicador de que el bot está escribiendo */}
          {isTyping && (
            <div className="self-start bg-gray-500/70 text-white px-4 py-2 rounded-2xl max-w-xs shadow-md animate-pulse">
              Don ChatGPT está escribiendo...
            </div>
          )}
        </div>

        {/* Área para escribir y enviar mensajes */}
        <div className="p-4 bg-black/50 border-t border-white/20 flex gap-2 rounded-b-[50px]">
          <InputGroup className="flex-1">
            <InputGroupTextarea
              placeholder="Escribe un mensaje..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="resize-none"
            />
            <InputGroupButton
              onClick={handleSend}
              className="rounded-full p-2"
              size="icon-xs"
            >
              <ArrowUpIcon className="w-5 h-5" />
            </InputGroupButton>
          </InputGroup>
        </div>
      </div>
    </div>
  );
}
