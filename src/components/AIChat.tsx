import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Search } from "lucide-react";
import Markdown from "react-markdown";
import { getGeminiClient, withRetry } from "../lib/gemini";
import { GenerateContentResponse, ThinkingLevel } from "@google/genai";

interface Message {
  role: "user" | "model";
  content: string;
  groundingUrls?: string[];
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", content: "Hello! I am your Windows Server 2025 AI Assistant. I can help you with configuration, troubleshooting, and finding the latest documentation. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Create chat session reference
  const chatSessionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const ai = getGeminiClient();
      
      // Initialize chat session if it doesn't exist
      if (!chatSessionRef.current) {
        chatSessionRef.current = ai.chats.create({
          model: "gemini-3-flash-preview",
          config: {
            systemInstruction: "You are an expert Windows Server 2025 administrator assistant. Help the user with server configurations, PowerShell, and unattended installations.",
            tools: [{ googleSearch: {} }],
          }
        });
      }

      const response: GenerateContentResponse = await withRetry(() => chatSessionRef.current.sendMessage({ message: userMsg }));
      
      // Extract grounding URLs if available
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const urls: string[] = [];
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            urls.push(chunk.web.uri);
          }
        });
      }

      setMessages(prev => [...prev, { 
        role: "model", 
        content: response.text || "I couldn't generate a response.",
        groundingUrls: urls.length > 0 ? urls : undefined
      }]);
      
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: "model", content: "Sorry, I encountered an error while processing your request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto w-full p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-semibold mb-2">AI Assistant</h2>
        <p className="text-[#8E9299]">Ask questions about Windows Server 2025, PowerShell, or deployment strategies. Powered by Google Search.</p>
      </div>

      <div className="flex-1 bg-[#151619] border border-[#2a2b30] rounded-xl flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-blue-600" : "bg-[#2a2b30]"}`}>
                {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[80%] ${msg.role === "user" ? "bg-blue-600/20 text-blue-50 border border-blue-500/30" : "bg-[#2a2b30]/50 text-gray-200 border border-[#2a2b30]"} rounded-2xl px-5 py-4`}>
                <div className="markdown-body">
                  <Markdown>{msg.content}</Markdown>
                </div>
                
                {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2 uppercase tracking-wider font-semibold">
                      <Search size={12} />
                      Sources
                    </div>
                    <ul className="space-y-1">
                      {msg.groundingUrls.map((url, i) => (
                        <li key={i}>
                          <a href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline truncate block">
                            {url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#2a2b30] flex items-center justify-center shrink-0">
                <Bot size={16} />
              </div>
              <div className="bg-[#2a2b30]/50 border border-[#2a2b30] rounded-2xl px-5 py-4 flex items-center gap-2 text-gray-400">
                <Loader2 size={16} className="animate-spin" />
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-[#2a2b30] bg-[#1a1b1e]">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about Windows Server 2025 features..."
              className="w-full bg-[#0d0e12] border border-[#2a2b30] rounded-lg pl-4 pr-12 py-3 text-white placeholder-[#4a4b50] focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 text-blue-500 hover:bg-blue-500/10 rounded-md disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
