import { useState } from "react";
import { Loader2, Image as ImageIcon, Video, Download } from "lucide-react";
import { getGeminiClient, generateContentWithRetry } from "../lib/gemini";

export function Visualizer() {
  const [prompt, setPrompt] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    if (!prompt.trim() || isGeneratingImage) return;
    setIsGeneratingImage(true);
    setError(null);
    setImageUrl(null);

    try {
      const response = await generateContentWithRetry({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: "1K"
          }
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          setImageUrl(`data:image/png;base64,${base64EncodeString}`);
          break;
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate image. Please check API key and try again.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!prompt.trim() || isGeneratingVideo) return;
    setIsGeneratingVideo(true);
    setError(null);
    setVideoUrl(null);

    try {
      const ai = getGeminiClient();
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({operation: operation});
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        setVideoUrl(downloadLink);
      } else {
        setError("Video generation completed but no URL was returned.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate video. Please try again.");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto w-full p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-semibold mb-2">Architecture Visualizer</h2>
        <p className="text-[#8E9299]">Generate server rack diagrams, network topologies, and animated deployment flows using AI.</p>
      </div>

      <div className="flex-1 bg-[#151619] border border-[#2a2b30] rounded-xl flex flex-col overflow-hidden p-6 space-y-6">
        
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-400">Describe your architecture or deployment scenario</label>
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A high-tech server rack with glowing blue lights representing a quantum loping network distribution..."
            className="w-full h-24 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-4 text-white focus:border-blue-500 focus:outline-none resize-none"
          />
          
          <div className="flex gap-4">
            <button 
              onClick={handleGenerateImage}
              disabled={isGeneratingImage || isGeneratingVideo || !prompt.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-[#2a2b30] hover:bg-[#3a3b40] disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {isGeneratingImage ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
              Generate Diagram (Image)
            </button>
            <button 
              onClick={handleGenerateVideo}
              disabled={isGeneratingImage || isGeneratingVideo || !prompt.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {isGeneratingVideo ? <Loader2 size={18} className="animate-spin" /> : <Video size={18} />}
              Generate Flow (Video)
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex-1 border-2 border-dashed border-[#2a2b30] rounded-xl flex items-center justify-center bg-[#0d0e12] overflow-hidden relative">
          {!imageUrl && !videoUrl && !isGeneratingImage && !isGeneratingVideo && (
            <div className="text-center text-[#4a4b50]">
              <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
              <p>Generated visuals will appear here</p>
            </div>
          )}

          {isGeneratingImage && (
            <div className="text-center text-blue-400">
              <Loader2 size={48} className="mx-auto mb-4 animate-spin opacity-50" />
              <p>Generating high-resolution diagram...</p>
            </div>
          )}

          {isGeneratingVideo && (
            <div className="text-center text-blue-400">
              <Loader2 size={48} className="mx-auto mb-4 animate-spin opacity-50" />
              <p>Rendering animated deployment flow (this may take a few minutes)...</p>
            </div>
          )}

          {imageUrl && !isGeneratingImage && (
            <img src={imageUrl} alt="Generated Architecture" className="w-full h-full object-contain" />
          )}

          {videoUrl && !isGeneratingVideo && (
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
              <video src={videoUrl} controls className="max-w-full max-h-[80%] rounded-lg border border-[#2a2b30]" />
              <a 
                href={videoUrl} 
                target="_blank" 
                rel="noreferrer"
                className="mt-4 flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Download size={16} /> Download Video
              </a>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
