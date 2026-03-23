import { useState } from "react";
import { 
  Play, Loader2, FileText, Volume2, Mic, ChevronRight, ChevronLeft, 
  Download, Server, Shield, Network, Cpu, Settings, Users, HardDrive
} from "lucide-react";
import Markdown from "react-markdown";
import { getGeminiClient } from "../lib/gemini";
import { Modality } from "@google/genai";
import { cn } from "../lib/utils";

const STEPS = [
  { id: "extract", title: "Current Setup", icon: HardDrive, desc: "Extract existing server config" },
  { id: "infra", title: "Infrastructure", icon: Server, desc: "PXE & Cross-Platform Host" },
  { id: "config", title: "Core Config", icon: Cpu, desc: "Drivers, Network & Updates" },
  { id: "security", title: "Security & Identity", icon: Shield, desc: "Users, Groups, GPO & Registry" },
  { id: "automation", title: "Automation", icon: Settings, desc: "DSC, Tasks & Pre-boot" },
  { id: "generate", title: "Generate", icon: Play, desc: "Build Deployment Package" }
];

export function DeploymentWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  
  // Wizard State
  const [config, setConfig] = useState({
    extractionData: "",
    hostOS: "linux",
    pxeOptions: "iPXE with HTTP boot",
    drivers: "Include all current drivers (Export-WindowsDriver)",
    network: "DHCP with fallback static IP, join domain",
    updates: "Install all critical updates during setup",
    users: "Create local Admin, disable default Administrator, set up standard roles",
    gpoRegistry: "Apply security baseline GPOs, disable telemetry via Registry",
    tasks: "Daily maintenance task, weekly backup trigger",
    preBoot: "Inject drivers into boot.wim, run custom script before OOBE",
    dsc: "Ensure IIS, File-Services, and custom app pools are present"
  });

  const updateConfig = (key: keyof typeof config, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateExtractionScript = async () => {
    setIsGenerating(true);
    try {
      const ai = getGeminiClient();
      const prompt = `Write a comprehensive PowerShell script to extract the current Windows Server configuration.
      It needs to extract:
      1. All third-party drivers (Export-WindowsDriver)
      2. Current Windows Features and Roles
      3. Active Local Users and Groups
      4. Network Configuration (IP, DNS, Adapters)
      5. Applied GPOs (gpresult)
      6. Scheduled Tasks
      
      Output ONLY the PowerShell script in a markdown code block.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });
      
      updateConfig("extractionData", response.text || "");
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinalGenerate = async () => {
    setIsGenerating(true);
    setResult("");
    
    try {
      const ai = getGeminiClient();
      const prompt = `You are an expert in Windows Server 2025 deployment, Windows ADK, WinPE, and Desired State Configuration (DSC).
The user wants a comprehensive, step-by-step deployment package that can be hosted on ANY OS (Linux, Mac, Windows) using a unified API/PXE approach.

Here are the user's requirements from the wizard:
- **Host OS for Deployment Server**: ${config.hostOS}
- **PXE Options**: ${config.pxeOptions}
- **Drivers**: ${config.drivers}
- **Network**: ${config.network}
- **Updates**: ${config.updates}
- **Users & Roles**: ${config.users}
- **GPO & Registry**: ${config.gpoRegistry}
- **Scheduled Tasks**: ${config.tasks}
- **Pre-boot (WinPE/OOBE)**: ${config.preBoot}
- **DSC & Roles**: ${config.dsc}
- **Extracted Data Context**: ${config.extractionData.substring(0, 1000)}...

Please generate a complete deployment guide including:
1. **Cross-Platform PXE Setup Guide**: Step-by-step to host the deployment share on ${config.hostOS}.
2. **autounattend.xml**: A robust answer file handling disk wipe, pre-boot scripts, driver injection paths, network setup, user creation, and auto-logon for OOBE.
3. **SetupComplete.cmd**: Script to run registry adjustments, GPO imports, and trigger updates.
4. **DSC Configuration Script (Deploy.ps1)**: A PowerShell DSC script to enforce the requested roles, features, and scheduled tasks.
5. **Step-by-Step Instructions**: How to tie it all together.

Use markdown formatting with clear headings and code blocks.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });
      
      setResult(response.text || "No response generated.");
    } catch (error) {
      console.error("Generation error:", error);
      setResult("An error occurred while generating the deployment package.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTTS = async () => {
    if (!result) return;
    setIsPlayingTTS(true);
    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: "Your comprehensive Windows Server 2025 deployment package is ready. It includes cross-platform PXE instructions, the autounattend XML, and the DSC configuration scripts. Please review the generated markdown for the complete code." }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
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

  const nextStep = () => setCurrentStep(p => Math.min(STEPS.length - 1, p + 1));
  const prevStep = () => setCurrentStep(p => Math.max(0, p - 1));

  return (
    <div className="h-full flex flex-col p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold mb-2">Deployment Wizard</h2>
        <p className="text-[#8E9299]">Step-by-step prompted install and setup for Windows Server 2025.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-[#2a2b30] z-0" />
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentStep;
          const isPassed = idx < currentStep;
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 bg-[#0d0e12] px-2">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                isActive ? "border-blue-500 bg-blue-500/20 text-blue-400" : 
                isPassed ? "border-green-500 bg-green-500/20 text-green-400" : 
                "border-[#2a2b30] bg-[#151619] text-[#4a4b50]"
              )}>
                <Icon size={18} />
              </div>
              <span className={cn(
                "text-xs font-medium absolute -bottom-6 whitespace-nowrap",
                isActive ? "text-blue-400" : isPassed ? "text-green-400" : "text-[#4a4b50]"
              )}>{step.title}</span>
            </div>
          );
        })}
      </div>

      <div className="flex-1 bg-[#151619] border border-[#2a2b30] rounded-xl flex flex-col overflow-hidden mt-6">
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* STEP 1: Extract */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h3 className="text-xl font-medium text-white mb-2">Extract Current Setup</h3>
                <p className="text-[#8E9299] text-sm">Run our AI-generated script on your existing server to extract drivers, roles, and configurations, or paste your own data below.</p>
              </div>
              <button 
                onClick={handleGenerateExtractionScript}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-[#2a2b30] hover:bg-[#3a3b40] text-white rounded-lg text-sm transition-colors"
              >
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Generate Extraction Script
              </button>
              <textarea 
                value={config.extractionData}
                onChange={(e) => updateConfig("extractionData", e.target.value)}
                placeholder="Paste extracted configuration data here..."
                className="w-full h-64 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-4 text-sm text-gray-300 font-mono focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>
          )}

          {/* STEP 2: Infra */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h3 className="text-xl font-medium text-white mb-2">Infrastructure & PXE</h3>
                <p className="text-[#8E9299] text-sm">Configure how the deployment will be hosted and booted.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Deployment Host OS</label>
                  <select 
                    value={config.hostOS}
                    onChange={(e) => updateConfig("hostOS", e.target.value)}
                    className="w-full bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="linux">Linux (Ubuntu/Debian/RHEL)</option>
                    <option value="mac">macOS</option>
                    <option value="windows">Windows Server</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">PXE Boot Options</label>
                  <input 
                    type="text"
                    value={config.pxeOptions}
                    onChange={(e) => updateConfig("pxeOptions", e.target.value)}
                    className="w-full bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Config */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h3 className="text-xl font-medium text-white mb-2">Core Configuration</h3>
                <p className="text-[#8E9299] text-sm">Set up drivers, network integration, and system updates.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Driver Injection</label>
                  <textarea 
                    value={config.drivers}
                    onChange={(e) => updateConfig("drivers", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Network Integration</label>
                  <textarea 
                    value={config.network}
                    onChange={(e) => updateConfig("network", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Update Strategy</label>
                  <input 
                    type="text"
                    value={config.updates}
                    onChange={(e) => updateConfig("updates", e.target.value)}
                    className="w-full bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Security */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h3 className="text-xl font-medium text-white mb-2">Security & Identity</h3>
                <p className="text-[#8E9299] text-sm">Configure users, roles, Group Policies, and Registry tweaks.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">User Groups & Roles</label>
                  <textarea 
                    value={config.users}
                    onChange={(e) => updateConfig("users", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">GPOs & Registry Adjustments</label>
                  <textarea 
                    value={config.gpoRegistry}
                    onChange={(e) => updateConfig("gpoRegistry", e.target.value)}
                    className="w-full h-24 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Automation */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h3 className="text-xl font-medium text-white mb-2">Automation & DSC</h3>
                <p className="text-[#8E9299] text-sm">Define Desired State Configuration, scheduled tasks, and pre-boot actions.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Pre-Boot Activation (WinPE/OOBE)</label>
                  <textarea 
                    value={config.preBoot}
                    onChange={(e) => updateConfig("preBoot", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Desired State Configuration (DSC)</label>
                  <textarea 
                    value={config.dsc}
                    onChange={(e) => updateConfig("dsc", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Scheduled Tasks (Tasked Events)</label>
                  <input 
                    type="text"
                    value={config.tasks}
                    onChange={(e) => updateConfig("tasks", e.target.value)}
                    className="w-full bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Generate */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 h-full flex flex-col">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-medium text-white mb-2">Generate Deployment Package</h3>
                  <p className="text-[#8E9299] text-sm">Review your settings and let AI build your complete Windows Server 2025 deployment kit.</p>
                </div>
                <div className="flex gap-3">
                  {result && (
                    <button 
                      onClick={handleTTS}
                      disabled={isPlayingTTS}
                      className="flex items-center gap-2 px-4 py-2 bg-[#2a2b30] hover:bg-[#3a3b40] text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      <Volume2 size={16} />
                      {isPlayingTTS ? "Playing..." : "Read Summary"}
                    </button>
                  )}
                  <button 
                    onClick={handleFinalGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                  >
                    {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                    Build Package
                  </button>
                </div>
              </div>
              
              <div className="flex-1 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-6 overflow-y-auto">
                {result ? (
                  <div className="markdown-body">
                    <Markdown>{result}</Markdown>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[#4a4b50] space-y-4">
                    <Server size={48} className="opacity-20" />
                    <p>Click "Build Package" to generate your scripts, XMLs, and instructions.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-[#2a2b30] bg-[#1a1b1e] flex justify-between items-center">
          <button 
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-[#8E9299] hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={18} />
            Back
          </button>
          
          <div className="text-sm text-[#4a4b50] font-medium">
            Step {currentStep + 1} of {STEPS.length}
          </div>

          <button 
            onClick={nextStep}
            disabled={currentStep === STEPS.length - 1}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg font-medium disabled:opacity-30 transition-colors"
          >
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
