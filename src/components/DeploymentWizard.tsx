import { useState, useEffect } from "react";
import { 
  Play, Loader2, FileText, Volume2, Mic, ChevronRight, ChevronLeft, 
  Download, Server, Shield, Network, Cpu, Settings, HardDrive, 
  Database, Fingerprint, Terminal, CheckSquare, WifiOff
} from "lucide-react";
import Markdown from "react-markdown";
import { getGeminiClient } from "../lib/gemini";
import { Modality } from "@google/genai";
import { cn } from "../lib/utils";

const STEPS = [
  { id: "extract", title: "Current Setup", icon: HardDrive, desc: "Extract existing server config" },
  { id: "infra", title: "Infra & Boot", icon: Server, desc: "PXE, BCD, MicroLinux & MCP" },
  { id: "storage", title: "Storage & I/O", icon: Database, desc: "NVMe, RAM Disk, VHDX" },
  { id: "config", title: "Core Config", icon: Cpu, desc: "DriverStore & Network" },
  { id: "security", title: "Security", icon: Fingerprint, desc: "Auth, Retina, Certs" },
  { id: "firmware", title: "Firmware", icon: Shield, desc: "NVRAM, ROMs, Stealth" },
  { id: "automation", title: "Automation & UI", icon: Terminal, desc: "AI PS, WinUI Shell, DSC" },
  { id: "generate", title: "Generate", icon: Play, desc: "Build Deployment Package" },
  { id: "validation", title: "Validation", icon: CheckSquare, desc: "Post-Deployment Checklist" }
];

export function DeploymentWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [validationChecklist, setValidationChecklist] = useState<{ id: string; label: string; checked: boolean }[]>([]);
  
  // Advanced Enterprise Wizard State
  const [config, setConfig] = useState({
    extractionData: "",
    hostOS: "linux",
    pxeOptions: "iPXE with HTTP boot",
    bcdKernelOpt: "Enable dynamic tick, useplatformclock false, thread scheduling optimizations",
    microLinuxKernel: "Boot Windows via /microlinux kernel wrapper for extreme stability",
    mcpSynapticKernel: "Enable MCP and Synaptic kernel options for base neural network architecture",
    nvmeIo: "Optimize NVMe I/O queues, disable 8.3 name creation, set NTFS memory usage",
    ramDisk: "Create 16GB RAM Disk, pin to CPU cores 4-7 for tempDB",
    ramDiskCooling: "Enable burst RAM disk rotation for thermal management",
    parentDiskShadow: "Configure Parent VHDX with Read-Only Shadow Copy differential",
    vhdxSequencer: "Enable VHDX sequencer for DDR5 real-time task organization",
    igpuQuantum: "Enable iGPU micro-quantum synthetic circuit for real-time data compression and encryption",
    drivers: "Inject to DriverStore (pnputil /add-driver)",
    network: "Public network packet distribution with natural 'quantum loping' system and public packet drop syncs",
    offlinePacketRestore: "Special no-internet restore from local packet distribution and other TBD sources",
    atomicClockSync: "Configure strict NTP sync with stratum 1 atomic clocks to eradicate time slip",
    updates: "Install all critical updates during setup",
    users: "Zero Access Tolerance: Disable System, Admin, and Service accounts. Strict isolated access only.",
    cellularAuth: "Require Cellular Phone Connect Security Pass for login",
    retinaScan: "Enable Intel Retina Scan (Telemetry Fabric -2 OS Int)",
    voiceRecAuth: "Voice recognition security lock and unlock",
    remoteKillSwitch: "3-way remote location switch for emergency lockout/in",
    certificates: "Full certificate access control for all operations",
    stealthOperations: "Execute hidden and secret deployment options",
    nvramControl: "Component non-volatile memory (NVRAM) access and control",
    firmwareAcls: "Hardware ACLs and ROM control for motherboards and all components",
    radioWaveJamming: "Radio wave reflect, jam, or dissolution within 1-inch diameter outside casing using built-in transistor micro-jammers",
    gpoRegistry: "Apply security baseline GPOs, disable telemetry via Registry",
    tasks: "Daily maintenance task, weekly backup trigger",
    preBoot: "Inject drivers into boot.wim, run custom script before OOBE",
    dsc: "Ensure IIS, File-Services, and custom app pools are present",
    aiPowerShell: "iPowerShell ISE setup for complete isolation with mobile credentialed security",
    headlessLockdown: "No HDMI access to OS (Headless Lock Option)",
    shellLoader: "Configure WinUI custom Shell Loader options",
    enterpriseChecklist: "Generate Enterprise-style validation checklists post-install"
  });

  const updateConfig = (key: keyof typeof config, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateExtractionScript = async () => {
    setIsGenerating(true);
    try {
      if (isOfflineMode) {
        // Offline fallback
        const offlineScript = `# Offline Mode: Basic Extraction Script Template
$ErrorActionPreference = "SilentlyContinue"
Write-Host "Extracting Windows Server Configuration (Offline Template)..."

# 1. Drivers
Export-WindowsDriver -Online -Destination "C:\\Backup\\Drivers"

# 2. Features
Get-WindowsFeature | Where-Object Installed | Select-Object Name | Export-Csv "C:\\Backup\\Features.csv" -NoTypeInformation

# 3. Users
Get-LocalUser | Export-Csv "C:\\Backup\\Users.csv" -NoTypeInformation

# 4. Network
Get-NetAdapter | Export-Csv "C:\\Backup\\Network.csv" -NoTypeInformation

Write-Host "Extraction complete."`;
        updateConfig("extractionData", offlineScript);
      } else {
        const ai = getGeminiClient();
        const prompt = `Write a comprehensive PowerShell script to extract the current Windows Server configuration.
        It needs to extract:
        1. All third-party drivers (Export-WindowsDriver)
        2. Current Windows Features and Roles
        3. Active Local Users and Groups
        4. Network Configuration (IP, DNS, Adapters)
        5. Applied GPOs (gpresult)
        6. Scheduled Tasks
        7. Installed Certificates
        
        Output ONLY the PowerShell script in a markdown code block.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: prompt,
        });
        
        updateConfig("extractionData", response.text || "");
      }
    } catch (error) {
      console.error(error);
      if (isOfflineMode) {
        updateConfig("extractionData", "# Error generating offline script.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!config.extractionData) {
      handleGenerateExtractionScript();
    }
  }, [isOfflineMode]);

  const handleFinalGenerate = async () => {
    setIsGenerating(true);
    setResult("");
    
    // Generate validation checklist based on config
    const checklist = [
      { id: "pxe", label: `Verify PXE Boot on ${config.hostOS} host`, checked: false },
      { id: "storage", label: "Validate NVMe I/O and RAM Disk allocation", checked: false },
      { id: "security", label: "Confirm Biometric (Retina/Voice) Auth integration", checked: false },
      { id: "network", label: "Check Network Packet Distribution (Quantum Loping)", checked: false },
      { id: "firmware", label: "Verify NVRAM and Hardware ACL lockdown", checked: false },
      { id: "dsc", label: "Validate DSC and AI PowerShell ISE isolation", checked: false },
      { id: "clock", label: "Confirm Atomic Clock Stratum 1 Sync", checked: false }
    ];
    setValidationChecklist(checklist);
    
    try {
      if (isOfflineMode) {
        // Offline fallback template
        const offlineResult = `# Enterprise Deployment Package (Offline Mode)

> **Note:** This package was generated using local templates because Offline Mode is enabled.

## 1. Cross-Platform PXE & BCD Setup
**Host OS:** ${config.hostOS}
**PXE Options:** ${config.pxeOptions}
**BCD Opts:** ${config.bcdKernelOpt}

\`\`\`bash
# Local template for PXE setup
sudo apt-get install dnsmasq
# Configure dnsmasq.conf for HTTP boot
\`\`\`

## 2. Advanced Storage Script (Storage.ps1)
**NVMe I/O:** ${config.nvmeIo}
**RAM Disk:** ${config.ramDisk}

\`\`\`powershell
# Storage.ps1 Template
Write-Host "Configuring Storage..."
# Apply NVMe optimizations
# Apply RAM Disk settings
\`\`\`

## 3. autounattend.xml
**DriverStore:** ${config.drivers}
**Network:** ${config.network}

\`\`\`xml
<!-- Basic autounattend.xml template -->
<unattend xmlns="urn:schemas-microsoft-com:unattend">
  <settings pass="windowsPE">
    <!-- Setup config -->
  </settings>
</unattend>
\`\`\`

## 4. Security & Auth Script (Security.ps1)
**Users:** ${config.users}
**Retina Scan:** ${config.retinaScan}

\`\`\`powershell
# Security.ps1 Template
Write-Host "Applying Security Policies..."
\`\`\`

## 5. SetupComplete.cmd & DSC
**DSC:** ${config.dsc}
**GPO/Registry:** ${config.gpoRegistry}

\`\`\`cmd
@echo off
echo Running SetupComplete...
\`\`\`

## 6. Enterprise Checklist
- [ ] Verify PXE Boot
- [ ] Validate Storage Configuration
- [ ] Check Security Policies
- [ ] Confirm DSC Application
`;
        setResult(offlineResult);
      } else {
        const ai = getGeminiClient();
        const prompt = `You are an elite Enterprise Windows Server 2025 Architect.
The user wants an extremely advanced, step-by-step deployment package that can be hosted on ANY OS (${config.hostOS}) using a unified API/PXE approach.

Here are the user's advanced requirements:
**Infrastructure & Boot:**
- PXE Options: ${config.pxeOptions}
- BCD/Kernel Opt: ${config.bcdKernelOpt}
- MicroLinux Kernel: ${config.microLinuxKernel}
- MCP & Synaptic Kernel: ${config.mcpSynapticKernel}

**Storage & I/O:**
- NVMe I/O Treatment: ${config.nvmeIo}
- RAM Disk & Core Allocation: ${config.ramDisk}
- Burst RAM Disk Rotation (Cooling): ${config.ramDiskCooling}
- Parent Disk with Shadow Copy RO: ${config.parentDiskShadow}
- VHDX Sequencer (DDR5 Real-time): ${config.vhdxSequencer}
- iGPU Micro-Quantum Circuit (Compression/Encryption): ${config.igpuQuantum}

**Core Config:**
- DriverStore: ${config.drivers}
- Network Setup: ${config.network}
- Offline Packet Restore: ${config.offlinePacketRestore}
- Atomic Clock Sync: ${config.atomicClockSync}
- Updates: ${config.updates}

**Security & Identity:**
- Users & Roles: ${config.users}
- Cellular Phone Connect Security Pass: ${config.cellularAuth}
- Intel Retina Scan (Telemetry Fabric -2 OS Int): ${config.retinaScan}
- Voice Recognition Auth: ${config.voiceRecAuth}
- Emergency Kill Switch: ${config.remoteKillSwitch}
- Certificate Creator: ${config.certificates}

**Hardware & Firmware Security:**
- Stealth Operations: ${config.stealthOperations}
- NVRAM Control: ${config.nvramControl}
- Firmware ACLs & ROMs: ${config.firmwareAcls}
- Radio Wave Jamming: ${config.radioWaveJamming}

**Automation & UI:**
- AI Integrated PowerShell: ${config.aiPowerShell}
- Headless Lockdown (No HDMI): ${config.headlessLockdown}
- WinUI Shell Loader: ${config.shellLoader}
- Enterprise Checklists: ${config.enterpriseChecklist}
- GPO & Registry: ${config.gpoRegistry}
- DSC & Roles: ${config.dsc}

**Extracted Data Context:** ${config.extractionData.substring(0, 500)}...

Please generate a complete, highly technical deployment guide including:
1. **Cross-Platform PXE & BCD Setup**: Instructions for ${config.hostOS} and BCD kernel scheduling optimizations.
2. **Advanced Storage Script (Storage.ps1)**: PowerShell to configure the NVMe I/O, RAM Disk core allocation, VHDX sequencer, and Shadow Copy RO.
3. **autounattend.xml**: Answer file handling DriverStore injection, network, and OOBE.
4. **Security & Auth Script (Security.ps1)**: Setup for Cellular Auth, Intel Retina Scan, and Enterprise Certificates.
5. **SetupComplete.cmd & DSC**: Script to run registry adjustments, AI PowerShell integration, WinUI shell loader, and enforce DSC.
6. **Enterprise Checklist**: A markdown checklist for post-install validation.

Use markdown formatting with clear headings and code blocks.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: prompt,
        });
        
        setResult(response.text || "No response generated.");
      }
    } catch (error) {
      console.error("Generation error:", error);
      setResult("An error occurred while generating the deployment package.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTTS = async () => {
    if (!result || isOfflineMode) return;
    setIsPlayingTTS(true);
    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: "Your advanced Enterprise Windows Server 2025 deployment package is ready. It includes NVMe I/O optimizations, RAM disk core allocation, biometric security configurations, and AI-integrated PowerShell setup. Please review the generated markdown for the complete code." }] }],
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
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-semibold mb-2">Enterprise Deployment Wizard</h2>
          <p className="text-[#8E9299]">Advanced step-by-step prompted install for Windows Server 2025 with AI, Biometrics, and High-Performance I/O.</p>
        </div>
        <button
          onClick={() => setIsOfflineMode(!isOfflineMode)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
            isOfflineMode 
              ? "bg-amber-500/20 text-amber-400 border-amber-500/50" 
              : "bg-[#151619] text-[#8E9299] border-[#2a2b30] hover:text-white"
          )}
        >
          <WifiOff size={16} />
          {isOfflineMode ? "Offline Mode Active" : "Offline Mode"}
        </button>
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

          {/* STEP 2: Infra & Boot */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h3 className="text-xl font-medium text-white mb-2">Infrastructure & Boot</h3>
                <p className="text-[#8E9299] text-sm">Configure deployment hosting, PXE, and BCD kernel scheduling optimizations.</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">BDC Setup for Kernel Scheduling Opt</label>
                  <textarea 
                    value={config.bcdKernelOpt}
                    onChange={(e) => updateConfig("bcdKernelOpt", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">MicroLinux Kernel Wrapper</label>
                  <textarea 
                    value={config.microLinuxKernel}
                    onChange={(e) => updateConfig("microLinuxKernel", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">MCP & Synaptic Kernel (Neural Net)</label>
                  <textarea 
                    value={config.mcpSynapticKernel}
                    onChange={(e) => updateConfig("mcpSynapticKernel", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Storage & I/O */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h3 className="text-xl font-medium text-white mb-2">Advanced Storage & I/O</h3>
                <p className="text-[#8E9299] text-sm">Configure NVMe treatments, RAM disks, and VHDX sequencers for extreme DDR5 speeds.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">NVMe Drive I/O Treatment</label>
                  <textarea 
                    value={config.nvmeIo}
                    onChange={(e) => updateConfig("nvmeIo", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">RAM Disk Option with Core Allocation</label>
                  <textarea 
                    value={config.ramDisk}
                    onChange={(e) => updateConfig("ramDisk", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Burst RAM Disk Rotation (Cooling)</label>
                  <textarea 
                    value={config.ramDiskCooling}
                    onChange={(e) => updateConfig("ramDiskCooling", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">VHDX Sequencer (Real-Time Task Org)</label>
                  <textarea 
                    value={config.vhdxSequencer}
                    onChange={(e) => updateConfig("vhdxSequencer", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Parent Disk Option with Shadow Copy RO</label>
                  <input 
                    type="text"
                    value={config.parentDiskShadow}
                    onChange={(e) => updateConfig("parentDiskShadow", e.target.value)}
                    className="w-full bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">iGPU Micro-Quantum Synthetic Circuit (Compression & Encryption)</label>
                  <textarea 
                    value={config.igpuQuantum}
                    onChange={(e) => updateConfig("igpuQuantum", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Core Config */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h3 className="text-xl font-medium text-white mb-2">Core Configuration</h3>
                <p className="text-[#8E9299] text-sm">Set up DriverStore, network integration, and system updates.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">DriverStore Storage</label>
                  <textarea 
                    value={config.drivers}
                    onChange={(e) => updateConfig("drivers", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Network Setup & Integration</label>
                  <textarea 
                    value={config.network}
                    onChange={(e) => updateConfig("network", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Offline Packet Restore (No Internet)</label>
                  <textarea 
                    value={config.offlinePacketRestore}
                    onChange={(e) => updateConfig("offlinePacketRestore", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Atomic Clock Sync (Time Slip Eradication)</label>
                  <textarea 
                    value={config.atomicClockSync}
                    onChange={(e) => updateConfig("atomicClockSync", e.target.value)}
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

          {/* STEP 5: Security & Identity */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h3 className="text-xl font-medium text-white mb-2">Security & Identity</h3>
                <p className="text-[#8E9299] text-sm">Configure biometric auth, cellular passes, and enterprise certificates.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">User Groups & Role Designation</label>
                  <textarea 
                    value={config.users}
                    onChange={(e) => updateConfig("users", e.target.value)}
                    className="w-full h-16 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Cellular Phone Connect Security Pass</label>
                  <textarea 
                    value={config.cellularAuth}
                    onChange={(e) => updateConfig("cellularAuth", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Retina Scan Option (Intel Telemetry Fabric -2)</label>
                  <textarea 
                    value={config.retinaScan}
                    onChange={(e) => updateConfig("retinaScan", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Voice Recognition Security</label>
                  <textarea 
                    value={config.voiceRecAuth}
                    onChange={(e) => updateConfig("voiceRecAuth", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">3-Way Remote Location Switch</label>
                  <textarea 
                    value={config.remoteKillSwitch}
                    onChange={(e) => updateConfig("remoteKillSwitch", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Certificate Creator</label>
                  <input 
                    type="text"
                    value={config.certificates}
                    onChange={(e) => updateConfig("certificates", e.target.value)}
                    className="w-full bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Firmware & Hardware */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h3 className="text-xl font-medium text-white mb-2">Firmware & Hardware Security</h3>
                <p className="text-[#8E9299] text-sm">Configure stealth operations, NVRAM access, and hardware-level ACLs.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Stealth Operations</label>
                  <textarea 
                    value={config.stealthOperations}
                    onChange={(e) => updateConfig("stealthOperations", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">NVRAM Access & Control</label>
                  <textarea 
                    value={config.nvramControl}
                    onChange={(e) => updateConfig("nvramControl", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Hardware ACLs & ROM Control</label>
                  <textarea 
                    value={config.firmwareAcls}
                    onChange={(e) => updateConfig("firmwareAcls", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Radio Wave Jamming & Reflection</label>
                  <textarea 
                    value={config.radioWaveJamming}
                    onChange={(e) => updateConfig("radioWaveJamming", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Automation & UI */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h3 className="text-xl font-medium text-white mb-2">Automation & UI</h3>
                <p className="text-[#8E9299] text-sm">Define AI PowerShell, WinUI Shell Loaders, and Enterprise Checklists.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">iPowerShell ISE Isolation</label>
                  <textarea 
                    value={config.aiPowerShell}
                    onChange={(e) => updateConfig("aiPowerShell", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Headless Lockdown (No HDMI Access)</label>
                  <textarea 
                    value={config.headlessLockdown}
                    onChange={(e) => updateConfig("headlessLockdown", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Shell Loader Options via WinUI</label>
                  <textarea 
                    value={config.shellLoader}
                    onChange={(e) => updateConfig("shellLoader", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Enterprise Style Checklists</label>
                  <textarea 
                    value={config.enterpriseChecklist}
                    onChange={(e) => updateConfig("enterpriseChecklist", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">GPOs & Registry Adjustments</label>
                  <textarea 
                    value={config.gpoRegistry}
                    onChange={(e) => updateConfig("gpoRegistry", e.target.value)}
                    className="w-full h-20 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Generate */}
          {currentStep === 7 && (
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
          {/* STEP 9: Validation Checklist */}
          {currentStep === 8 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 h-full flex flex-col">
              <div>
                <h3 className="text-xl font-medium text-white mb-2">Post-Deployment Validation</h3>
                <p className="text-[#8E9299] text-sm">Use this checklist to verify the integrity of your deployment. These items were generated based on your specific configuration.</p>
              </div>
              
              <div className="flex-1 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-6 overflow-y-auto">
                {validationChecklist.length > 0 ? (
                  <div className="space-y-4">
                    {validationChecklist.map((item) => (
                      <div 
                        key={item.id} 
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer",
                          item.checked 
                            ? "bg-green-500/10 border-green-500/50 text-green-400" 
                            : "bg-[#151619] border-[#2a2b30] text-gray-300 hover:border-blue-500/50"
                        )}
                        onClick={() => {
                          setValidationChecklist(prev => prev.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i));
                        }}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded border-2 flex items-center justify-center transition-colors",
                          item.checked ? "bg-green-500 border-green-500" : "border-[#4a4b50]"
                        )}>
                          {item.checked && <CheckSquare size={14} className="text-white" />}
                        </div>
                        <span className="font-medium">{item.label}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[#4a4b50] space-y-4">
                    <CheckSquare size={48} className="opacity-20" />
                    <p>Generate a deployment package first to see your validation checklist.</p>
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

