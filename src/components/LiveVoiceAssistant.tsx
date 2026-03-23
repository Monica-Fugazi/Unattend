import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2, Activity } from "lucide-react";
import { getGeminiClient } from "../lib/gemini";
import { Modality, LiveServerMessage } from "@google/genai";

export function LiveVoiceAssistant() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const ai = getGeminiClient();
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup Audio Context for 16kHz PCM
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(audioCtx.destination);

      // Connect to Live API
      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are a Windows Server 2025 expert assistant. The user is talking to you while working on their server. Provide concise, helpful answers about server administration, PowerShell, and unattended installations.",
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            
            // Start sending audio
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate volume for UI
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              setVolume(Math.sqrt(sum / inputData.length));

              // Convert Float32 to Int16 PCM
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              
              // Convert to Base64
              const buffer = new Uint8Array(pcmData.buffer);
              let binary = '';
              for (let i = 0; i < buffer.byteLength; i++) {
                binary += String.fromCharCode(buffer[i]);
              }
              const base64Data = window.btoa(binary);

              sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              // Decode and play received audio
              const binaryString = window.atob(base64Audio);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              try {
                // The API returns PCM 24kHz. We need to decode it.
                // For simplicity, we can use the Web Audio API decodeAudioData if it was a standard format,
                // but for raw PCM we need to create an AudioBuffer.
                // Actually, the Live API returns PCM 24kHz. Let's construct a WAV header to decode it easily.
                const wavBuffer = createWavHeader(bytes, 24000);
                const audioBuffer = await audioContextRef.current.decodeAudioData(wavBuffer.buffer);
                
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);
                source.start();
              } catch (e) {
                console.error("Error playing audio:", e);
              }
            }
          },
          onclose: () => {
            stopSession();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setError("Connection error occurred.");
            stopSession();
          }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error("Failed to start session:", err);
      setError("Failed to access microphone or connect to AI.");
      setIsConnecting(false);
      stopSession();
    }
  };

  const stopSession = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.then((session: any) => session.close()).catch(() => {});
      sessionRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setVolume(0);
  };

  // Helper to wrap raw PCM in a WAV container for easy decoding
  const createWavHeader = (pcmData: Uint8Array, sampleRate: number): Uint8Array => {
    const wav = new Uint8Array(44 + pcmData.length);
    const view = new DataView(wav.buffer);
    
    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + pcmData.length, true);
    writeString(view, 8, 'WAVE');
    
    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, 1, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    
    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, pcmData.length, true);
    
    // Write PCM data
    wav.set(pcmData, 44);
    
    return wav;
  };

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 max-w-2xl mx-auto w-full">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-semibold mb-4">Live Voice Assistant</h2>
        <p className="text-[#8E9299]">
          Talk directly to your Windows Server 2025 expert. Perfect for hands-free assistance while configuring your server.
        </p>
      </div>

      <div className="bg-[#151619] border border-[#2a2b30] rounded-3xl p-12 w-full flex flex-col items-center relative overflow-hidden">
        {/* Visualizer Background */}
        {isConnected && (
          <div 
            className="absolute inset-0 bg-blue-500/10 transition-opacity duration-75"
            style={{ opacity: Math.min(volume * 10, 0.5) }}
          />
        )}

        <div className="relative z-10 flex flex-col items-center">
          <button
            onClick={isConnected ? stopSession : startSession}
            disabled={isConnecting}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
              isConnected 
                ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.3)]' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-[0_0_30px_rgba(37,99,235,0.3)]'
            } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isConnecting ? (
              <Loader2 size={40} className="animate-spin" />
            ) : isConnected ? (
              <MicOff size={40} />
            ) : (
              <Mic size={40} />
            )}
          </button>

          <div className="mt-8 flex items-center gap-3">
            {isConnected ? (
              <>
                <Activity className="text-green-500 animate-pulse" size={20} />
                <span className="text-green-500 font-medium tracking-wide">Listening...</span>
              </>
            ) : isConnecting ? (
              <span className="text-blue-400 font-medium tracking-wide">Connecting to Gemini...</span>
            ) : (
              <span className="text-[#8E9299] font-medium tracking-wide">Tap to start conversation</span>
            )}
          </div>
          
          {error && (
            <div className="mt-4 text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
