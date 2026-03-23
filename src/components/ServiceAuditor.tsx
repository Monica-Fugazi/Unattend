import { useState } from "react";
import { Activity, Loader2, Trash2, Network, Shield, Play, Code, ServerCrash } from "lucide-react";
import Markdown from "react-markdown";
import { getGeminiClient, generateContentWithRetry } from "../lib/gemini";

export function ServiceAuditor() {
  const [servicesList, setServicesList] = useState("");
  const [assessmentResult, setAssessmentResult] = useState("");
  const [isAssessing, setIsAssessing] = useState(false);

  const [remoteConfig, setRemoteConfig] = useState({
    rdp: "Disabled",
    winrm: "Disabled",
    ssh: "Disabled",
    stealth: "Disabled"
  });
  const [remoteResult, setRemoteResult] = useState("");
  const [isGeneratingRemote, setIsGeneratingRemote] = useState(false);

  const handleAssess = async () => {
    if (!servicesList.trim() || isAssessing) return;
    setIsAssessing(true);
    setAssessmentResult("");
    
    try {
      const prompt = `You are an elite Windows Server Administrator and Security Auditor.
The user has provided a list of background services running on their system.
Assess these services for uninstallation or disabling to debloat and secure the system.

**Services List:**
${servicesList}

**Provide:**
1. A categorized list of services that are safe to remove/disable (Telemetry, Bloatware, Unnecessary).
2. A PowerShell script to safely disable or uninstall these specific services.
3. Warnings for any critical services the user should NOT touch.
Use markdown formatting.`;
      
      const response = await generateContentWithRetry({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });
      setAssessmentResult(response.text || "No assessment generated.");
    } catch (error) {
      console.error(error);
      setAssessmentResult("Error generating assessment.");
    } finally {
      setIsAssessing(false);
    }
  };

  const handleGenerateRemote = async () => {
    setIsGeneratingRemote(true);
    setRemoteResult("");
    
    try {
      const prompt = `You are an elite Windows Server Security Architect.
Generate a PowerShell script to configure Remote Access with the following simple controls:

- **RDP (Remote Desktop):** ${remoteConfig.rdp}
- **WinRM (PowerShell Remoting):** ${remoteConfig.winrm}
- **OpenSSH Server:** ${remoteConfig.ssh}
- **Stealth/Emergency Backdoor Access:** ${remoteConfig.stealth}

Provide a robust PowerShell script that configures the services, firewall rules, and registry keys to enforce these exact states. Include brief comments explaining the changes. Use markdown formatting.`;
      
      const response = await generateContentWithRetry({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });
      setRemoteResult(response.text || "No script generated.");
    } catch (error) {
      console.error(error);
      setRemoteResult("Error generating remote access script.");
    } finally {
      setIsGeneratingRemote(false);
    }
  };

  const updateRemoteConfig = (key: keyof typeof remoteConfig, value: string) => {
    setRemoteConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto w-full p-8 overflow-y-auto space-y-8">
      <div className="mb-2">
        <h2 className="text-3xl font-semibold mb-2 flex items-center gap-3">
          <Activity className="text-emerald-500" size={32} />
          Service Auditor & Access Control
        </h2>
        <p className="text-[#8E9299]">Easily assess background services for safe uninstallation and manage simple remote access controls.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Background Service Assessment */}
        <div className="bg-[#151619] border border-[#2a2b30] rounded-xl flex flex-col overflow-hidden">
          <div className="p-6 border-b border-[#2a2b30] bg-[#1a1b1e]">
            <h3 className="text-xl font-medium text-white flex items-center gap-2">
              <ServerCrash size={20} className="text-rose-400" />
              Background Service Assessment
            </h3>
            <p className="text-sm text-gray-400 mt-1">Paste your current services (e.g. from Get-Service) to find what can be safely uninstalled.</p>
          </div>
          <div className="p-6 space-y-4 flex-1 flex flex-col">
            <textarea 
              value={servicesList}
              onChange={(e) => setServicesList(e.target.value)}
              placeholder="Paste output of 'Get-Service' or list of running processes here..."
              className="w-full h-32 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none resize-none font-mono text-sm"
            />
            <button 
              onClick={handleAssess}
              disabled={isAssessing || !servicesList.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#2a2b30] hover:bg-[#3a3b40] disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {isAssessing ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              Assess for Uninstall
            </button>
            
            <div className="flex-1 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-4 overflow-y-auto min-h-[200px]">
              {assessmentResult ? (
                <div className="markdown-body text-sm">
                  <Markdown>{assessmentResult}</Markdown>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">
                  Assessment results will appear here.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Remote Access Control */}
        <div className="bg-[#151619] border border-[#2a2b30] rounded-xl flex flex-col overflow-hidden">
          <div className="p-6 border-b border-[#2a2b30] bg-[#1a1b1e]">
            <h3 className="text-xl font-medium text-white flex items-center gap-2">
              <Network size={20} className="text-blue-400" />
              Simple Remote Access Control
            </h3>
            <p className="text-sm text-gray-400 mt-1">Quickly toggle and generate scripts for remote access protocols.</p>
          </div>
          <div className="p-6 space-y-4 flex-1 flex flex-col">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">RDP (Remote Desktop)</label>
                <select 
                  value={remoteConfig.rdp}
                  onChange={(e) => updateRemoteConfig("rdp", e.target.value)}
                  className="w-full bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none text-sm"
                >
                  <option value="Disabled">Disabled (Secure)</option>
                  <option value="Enabled (Standard)">Enabled (Standard)</option>
                  <option value="Enabled (NLA Only, Restricted IPs)">Enabled (NLA Only, Restricted IPs)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">WinRM (PowerShell)</label>
                <select 
                  value={remoteConfig.winrm}
                  onChange={(e) => updateRemoteConfig("winrm", e.target.value)}
                  className="w-full bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none text-sm"
                >
                  <option value="Disabled">Disabled (Secure)</option>
                  <option value="Enabled (HTTPS Only)">Enabled (HTTPS Only)</option>
                  <option value="Enabled (HTTP/HTTPS)">Enabled (HTTP/HTTPS)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">OpenSSH Server</label>
                <select 
                  value={remoteConfig.ssh}
                  onChange={(e) => updateRemoteConfig("ssh", e.target.value)}
                  className="w-full bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none text-sm"
                >
                  <option value="Disabled">Disabled (Secure)</option>
                  <option value="Enabled (Key Auth Only)">Enabled (Key Auth Only)</option>
                  <option value="Enabled (Password & Key)">Enabled (Password & Key)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-1">
                  <Shield size={14} className="text-rose-500" />
                  Stealth Access
                </label>
                <select 
                  value={remoteConfig.stealth}
                  onChange={(e) => updateRemoteConfig("stealth", e.target.value)}
                  className="w-full bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none text-sm"
                >
                  <option value="Disabled">Disabled</option>
                  <option value="Enabled (Hidden Port Knocking)">Enabled (Hidden Port Knocking)</option>
                  <option value="Enabled (Reverse Shell Beacon)">Enabled (Reverse Shell Beacon)</option>
                </select>
              </div>
            </div>

            <button 
              onClick={handleGenerateRemote}
              disabled={isGeneratingRemote}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors mt-2"
            >
              {isGeneratingRemote ? <Loader2 size={18} className="animate-spin" /> : <Code size={18} />}
              Generate Access Script
            </button>
            
            <div className="flex-1 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-4 overflow-y-auto min-h-[200px]">
              {remoteResult ? (
                <div className="markdown-body text-sm">
                  <Markdown>{remoteResult}</Markdown>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">
                  Remote access script will appear here.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
