import { useState, useRef } from "react";
import { Play, Loader2, FileText, Volume2, Mic } from "lucide-react";
import Markdown from "react-markdown";
import { getGeminiClient, generateContentWithRetry } from "../lib/gemini";
import { Modality } from "@google/genai";

export function DependencyBuilder() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setIsGenerating(true);
    setResult("");
    
    try {
      const prompt = `You are a Windows Server 2025 expert. The user wants to build a seamless unattended installation (autounattend.xml) and extract dependencies to rebuild a server.
      
User requirements:
${input}

Please provide:
1. A brief explanation of the roles/features needed.
2. The exact PowerShell commands (Install-WindowsFeature) to install these dependencies.
3. A sample \`autounattend.xml\` snippet that configures these roles during deployment.
Use markdown formatting.`;

      const response = await generateContentWithRetry({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });
      
      setResult(response.text || "No response generated.");
    } catch (error) {
      console.error("Generation error:", error);
      setResult("An error occurred while generating the scripts.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTTS = async () => {
    if (!result) return;
    setIsPlayingTTS(true);
    try {
      const response = await generateContentWithRetry({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: "Here is your Windows Server 2025 configuration summary. " + result.substring(0, 500) + "... Please read the generated scripts for full details." }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Puck' },
            },
          },
        },
      });
      
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
        audio.onended = () => setIsPlayingTTS(false);
        await audio.play();
      } else {
        setIsPlayingTTS(false);
      }
    } catch (error) {
      console.error("TTS error:", error);
      setIsPlayingTTS(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64data = (reader.result as string).split(',')[1];
            await transcribeAudio(base64data, 'audio/webm');
          };
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
      }
    }
  };

  const transcribeAudio = async (base64Audio: string, mimeType: string) => {
    setIsGenerating(true);
    try {
      const response = await generateContentWithRetry({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { inlineData: { data: base64Audio, mimeType } },
            { text: "Transcribe this audio. It contains requirements for a Windows Server setup." }
          ]
        }
      });
      if (response.text) {
        setInput(prev => prev + (prev ? " " : "") + response.text);
      }
    } catch (error) {
      console.error("Transcription error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold mb-2">AutoAttend Builder</h2>
        <p className="text-[#8E9299]">Extract dependencies and generate unattended installation scripts for Windows Server 2025.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
        {/* Input Section */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#151619] border border-[#2a2b30] rounded-xl p-4 flex-1 flex flex-col">
            <label className="text-sm font-medium text-[#8E9299] mb-2 uppercase tracking-wider">Server Requirements</label>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your server needs (e.g., 'I need an IIS Web Server with ASP.NET 4.8 and Active Directory Domain Services') or paste Get-WindowsFeature output..."
              className="flex-1 bg-transparent border-none resize-none focus:ring-0 text-white placeholder-[#4a4b50] p-0"
            />
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#2a2b30]">
              <button 
                onClick={toggleRecording}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isRecording ? 'bg-red-500/20 text-red-400' : 'bg-[#2a2b30] text-white hover:bg-[#3a3b40]'}`}
              >
                <Mic size={16} />
                {isRecording ? "Stop Dictation" : "Dictate"}
              </button>
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !input.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                Generate Scripts
              </button>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="bg-[#151619] border border-[#2a2b30] rounded-xl p-4 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#2a2b30]">
            <div className="flex items-center gap-2 text-sm font-medium text-[#8E9299] uppercase tracking-wider">
              <FileText size={16} />
              Generated Output
            </div>
            {result && (
              <button 
                onClick={handleTTS}
                disabled={isPlayingTTS}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2b30] hover:bg-[#3a3b40] text-white rounded-md text-sm transition-colors disabled:opacity-50"
              >
                <Volume2 size={16} />
                {isPlayingTTS ? "Playing..." : "Read Summary"}
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2">
            {result ? (
              <div className="markdown-body">
                <Markdown>{result}</Markdown>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-[#4a4b50] text-sm">
                Output will appear here after generation.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
