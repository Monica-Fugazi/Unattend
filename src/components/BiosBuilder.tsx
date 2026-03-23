import { useState } from "react";
import { Loader2, Microchip, Search, Code, Cpu, Terminal, Upload, Image as ImageIcon, Trash2, Shield, Zap, CheckSquare, Square, Server } from "lucide-react";
import Markdown from "react-markdown";
import { getGeminiClient } from "../lib/gemini";
import { ThinkingLevel } from "@google/genai";

const COMMON_TWEAKS = [
  "Unlock hidden NVRAM menus",
  "Undervolt offsets",
  "Inject micro-jammer drivers",
  "Disable Intel ME / AMD PSP",
  "Enable Above 4G Decoding / Re-Size BAR",
  "Bypass Wi-Fi Whitelist",
  "Unlock BCLK Overclocking",
  "Update CPU Microcode"
];

export function BiosBuilder() {
  const [platform, setPlatform] = useState("");
  const [selectedTweaks, setSelectedTweaks] = useState<string[]>([]);
  const [customTweaks, setCustomTweaks] = useState("");
  const [secureBoot, setSecureBoot] = useState("Custom Keys (PK/KEK/db/dbx)");
  const [tpmIntegration, setTpmIntegration] = useState("Discrete TPM 2.0 (dTPM)");
  const [fwAccessControl, setFwAccessControl] = useState("Intel Boot Guard / AMD HVB (Strict)");
  const [igpuQuantum, setIgpuQuantum] = useState("Enabled (Synthetic Circuit Mode)");
  const [qbitCount, setQbitCount] = useState("4 Qubit (Max Compression/Transfer)");
  const [igpuCompression, setIgpuCompression] = useState("Real-time LZ4/ZSTD Hardware Offload");
  const [igpuEncryption, setIgpuEncryption] = useState("AES-256-GCM / ChaCha20 In-Memory");
  const [nestedCpu, setNestedCpu] = useState("Nested VT-x/AMD-V (L1/L2 Hypervisor)");
  const [nestedGpu, setNestedGpu] = useState("SR-IOV (vGPU Profiles)");
  const [nestedNetwork, setNestedNetwork] = useState("SR-IOV NIC Offload (VF/PF)");
  const [nestedStealth, setNestedStealth] = useState("Fully Invisible (Hypervisor Signature Spoofing)");
  const [nestedBenefits, setNestedBenefits] = useState("Zero-Exit VM Execution & Cache QoS");
  const [logoDescription, setLogoDescription] = useState("");
  const [logoData, setLogoData] = useState<{ mimeType: string; data: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [groundingUrls, setGroundingUrls] = useState<string[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setLogoData({ mimeType: file.type, data: base64String });
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    const combinedTweaks = [...selectedTweaks, customTweaks].filter(Boolean).join("\n- ");
    if (!platform.trim() || !combinedTweaks.trim() || isGenerating) return;
    setIsGenerating(true);
    setResult("");
    setGroundingUrls([]);

    try {
      const ai = getGeminiClient();
      let promptText = `You are an elite firmware engineer, UEFI architect, and hardware hacker.
The user wants to build a custom BIOS/UEFI for a unique platform.
Tagline: "The tip of the tweak."

**Platform/Motherboard/Architecture:**
${platform}

**Advanced Firmware Security:**
- Secure Boot: ${secureBoot}
- TPM Integration: ${tpmIntegration}
- Firmware Update Access Control: ${fwAccessControl}

**iGPU Micro-Quantum Synthetic Circuits:**
- Acceleration Mode: ${igpuQuantum}
- Qubit Allocation (Data Transfer): ${qbitCount}
- Compressed Data Handling: ${igpuCompression}
- Hardware Encryption: ${igpuEncryption}

**Nested OS & Server Redeployment:**
- CPU Virtualization & Nesting: ${nestedCpu}
- GPU/PCIe Passthrough: ${nestedGpu}
- Network Environment: ${nestedNetwork}
- Hypervisor Stealth (Invisibility): ${nestedStealth}
- Additional Nested Benefits: ${nestedBenefits}

**Desired Tweaks & Enhancements:**
- ${[...selectedTweaks, customTweaks].filter(Boolean).join('\n- ')}
`;

      if (logoDescription) {
        promptText += `\n**Custom Boot Logo Description:**\n${logoDescription}\n`;
      }
      if (logoData) {
        promptText += `\n**Custom Boot Logo Image:** (See attached image)\n`;
      }

      promptText += `\n**Requirements:**
1. Provide a highly technical, step-by-step guide to modifying the UEFI/BIOS firmware for this specific platform.
2. Include C/ASM code snippets for UEFI DXE drivers or SMM modules if applicable.
3. Include NVRAM variable modifications and microcode injection steps.
4. Provide a "Google Reference IDE" section: Recommend specific IDEs (like Visual Studio, EDK II, Ghidra), required SDKs, and exact Google search terms the user should use for further exploration and support.
5. Emphasize "the tip of the tweak" - pushing the hardware to its absolute limit while maintaining stability.
6. Include detailed instructions on how to convert, format, and inject the custom boot logo into the UEFI firmware (e.g., replacing the standard OEM logo GUID using UEFITool or similar).

Use markdown formatting with clear headings and code blocks.`;

      const parts: any[] = [{ text: promptText }];
      if (logoData) {
        parts.push({
          inlineData: {
            mimeType: logoData.mimeType,
            data: logoData.data
          }
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: { parts },
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });

      setResult(response.text || "No response generated.");

      // Extract Grounding URLs
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const urls = chunks
          .map((chunk: any) => chunk.web?.uri)
          .filter(Boolean);
        setGroundingUrls(Array.from(new Set(urls)));
      }
    } catch (error) {
      console.error("Generation error:", error);
      setResult("An error occurred while generating the BIOS configuration.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto w-full p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-semibold mb-2 flex items-center gap-3">
          <Microchip className="text-blue-500" size={32} />
          AI BIOS Builder & Enhancer
        </h2>
        <p className="text-[#8E9299] italic">"The tip of the tweak." — AI-assisted BIOS building for unique platforms with Google IDE reference support.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Input Panel */}
        <div className="col-span-1 bg-[#151619] border border-[#2a2b30] rounded-xl flex flex-col overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                <Cpu size={16} />
                Platform / Architecture
              </label>
              <textarea 
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="e.g. Custom ARM64 board, Intel Xeon Scalable Gen 5, RISC-V..."
                className="w-full h-24 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            <div className="space-y-4 border-t border-[#2a2b30] pt-4">
              <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-2">
                <Shield size={16} className="text-emerald-400" />
                Advanced Firmware Security
              </h3>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Secure Boot Configuration</label>
                <select 
                  value={secureBoot}
                  onChange={(e) => setSecureBoot(e.target.value)}
                  className="w-full bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none text-sm"
                >
                  <option value="Standard (OEM Keys)">Standard (OEM Keys)</option>
                  <option value="Custom Keys (PK/KEK/db/dbx)">Custom Keys (PK/KEK/db/dbx)</option>
                  <option value="Audit Mode / Setup Mode">Audit Mode / Setup Mode</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">TPM Integration</label>
                <select 
                  value={tpmIntegration}
                  onChange={(e) => setTpmIntegration(e.target.value)}
                  className="w-full bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none text-sm"
                >
                  <option value="Discrete TPM 2.0 (dTPM)">Discrete TPM 2.0 (dTPM)</option>
                  <option value="Firmware TPM (fTPM / Intel PTT)">Firmware TPM (fTPM / Intel PTT)</option>
                  <option value="Disabled / Hidden">Disabled / Hidden</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Firmware Update Access Control</label>
                <select 
                  value={fwAccessControl}
                  onChange={(e) => setFwAccessControl(e.target.value)}
                  className="w-full bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none text-sm"
                >
                  <option value="Standard BIOS Lock (PRRs)">Standard BIOS Lock (PRRs)</option>
                  <option value="Intel Boot Guard / AMD HVB (Strict)">Intel Boot Guard / AMD HVB (Strict)</option>
                  <option value="Physical Presence Jumper Only">Physical Presence Jumper Only</option>
                  <option value="Unlocked (Flash Descriptor Unlocked)">Unlocked (Flash Descriptor Unlocked)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 border-t border-[#2a2b30] pt-4">
              <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-2">
                <Zap size={16} className="text-purple-400" />
                iGPU Micro-Quantum Synthetic Circuits
              </h3>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Acceleration Mode</label>
                <select 
                  value={igpuQuantum}
                  onChange={(e) => setIgpuQuantum(e.target.value)}
                  className="w-full bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none text-sm"
                >
                  <option value="Enabled (Synthetic Circuit Mode)">Enabled (Synthetic Circuit Mode)</option>
                  <option value="Standard Compute Mode">Standard Compute Mode</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Synthetic Qubit Allocation (Data Transfer)</label>
                <select 
                  value={qbitCount}
                  onChange={(e) => setQbitCount(e.target.value)}
                  className="w-full bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none text-sm"
                >
                  <option value="1 Qubit (Standard)">1 Qubit (Standard)</option>
                  <option value="2 Qubit (Enhanced)">2 Qubit (Enhanced)</option>
                  <option value="3 Qubit (Advanced)">3 Qubit (Advanced)</option>
                  <option value="4 Qubit (Max Compression/Transfer)">4 Qubit (Max Compression/Transfer)</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Compressed Data Handling</label>
                <select 
                  value={igpuCompression}
                  onChange={(e) => setIgpuCompression(e.target.value)}
                  className="w-full bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none text-sm"
                >
                  <option value="Real-time LZ4/ZSTD Hardware Offload">Real-time LZ4/ZSTD Hardware Offload</option>
                  <option value="Quantum-State Entropy Compression">Quantum-State Entropy Compression</option>
                  <option value="Standard Memory Compression">Standard Memory Compression</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Hardware Encryption</label>
                <select 
                  value={igpuEncryption}
                  onChange={(e) => setIgpuEncryption(e.target.value)}
                  className="w-full bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none text-sm"
                >
                  <option value="AES-256-GCM / ChaCha20 In-Memory">AES-256-GCM / ChaCha20 In-Memory</option>
                  <option value="Lattice-Based Post-Quantum Crypto">Lattice-Based Post-Quantum Crypto</option>
                  <option value="Standard TME (Total Memory Encryption)">Standard TME (Total Memory Encryption)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 border-t border-[#2a2b30] pt-4">
              <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-2">
                <Server size={16} className="text-blue-400" />
                Nested OS & Server Redeployment
              </h3>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">CPU Virtualization & Nesting</label>
                <select 
                  value={nestedCpu}
                  onChange={(e) => setNestedCpu(e.target.value)}
                  className="w-full bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none text-sm"
                >
                  <option value="Nested VT-x/AMD-V (L1/L2 Hypervisor)">Nested VT-x/AMD-V (L1/L2 Hypervisor)</option>
                  <option value="APICv / AVIC Hardware Offload">APICv / AVIC Hardware Offload</option>
                  <option value="Standard Virtualization">Standard Virtualization</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">GPU/PCIe Passthrough</label>
                <select 
                  value={nestedGpu}
                  onChange={(e) => setNestedGpu(e.target.value)}
                  className="w-full bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none text-sm"
                >
                  <option value="SR-IOV (vGPU Profiles)">SR-IOV (vGPU Profiles)</option>
                  <option value="IOMMU/VT-d Strict Passthrough">IOMMU/VT-d Strict Passthrough</option>
                  <option value="GVT-g / MxGPU">GVT-g / MxGPU</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Network Environment</label>
                <select 
                  value={nestedNetwork}
                  onChange={(e) => setNestedNetwork(e.target.value)}
                  className="w-full bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none text-sm"
                >
                  <option value="SR-IOV NIC Offload (VF/PF)">SR-IOV NIC Offload (VF/PF)</option>
                  <option value="Direct MAC Assignment (OVS Hardware)">Direct MAC Assignment (OVS Hardware)</option>
                  <option value="Standard VirtIO">Standard VirtIO</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Hypervisor Stealth (Invisibility)</label>
                <select 
                  value={nestedStealth}
                  onChange={(e) => setNestedStealth(e.target.value)}
                  className="w-full bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none text-sm"
                >
                  <option value="Fully Invisible (Hypervisor Signature Spoofing)">Fully Invisible (Hypervisor Signature Spoofing)</option>
                  <option value="Hardware-Level Masking (RDTSC/CPUID)">Hardware-Level Masking (RDTSC/CPUID)</option>
                  <option value="Standard (Visible to Guest)">Standard (Visible to Guest)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Additional Nested Benefits</label>
                <select 
                  value={nestedBenefits}
                  onChange={(e) => setNestedBenefits(e.target.value)}
                  className="w-full bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none text-sm"
                >
                  <option value="Zero-Exit VM Execution & Cache QoS">Zero-Exit VM Execution & Cache QoS</option>
                  <option value="Aggressive Memory Page Deduplication">Aggressive Memory Page Deduplication</option>
                  <option value="Unrestricted Guest Execution">Unrestricted Guest Execution</option>
                  <option value="None">None</option>
                </select>
              </div>
            </div>
            
            <div className="border-t border-[#2a2b30] pt-4">
              <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                <Terminal size={16} />
                Desired Tweaks & Enhancements
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {COMMON_TWEAKS.map((tweak) => {
                  const isSelected = selectedTweaks.includes(tweak);
                  return (
                    <button
                      key={tweak}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTweaks(selectedTweaks.filter(t => t !== tweak));
                        } else {
                          setSelectedTweaks([...selectedTweaks, tweak]);
                        }
                      }}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left text-sm transition-colors ${
                        isSelected 
                          ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                          : 'bg-[#0d0e12] border-[#2a2b30] text-gray-400 hover:border-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      <span className="truncate">{tweak}</span>
                    </button>
                  );
                })}
              </div>

              <textarea 
                value={customTweaks}
                onChange={(e) => setCustomTweaks(e.target.value)}
                placeholder="Add any other custom tweaks here..."
                className="w-full h-24 bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                <ImageIcon size={16} />
                Custom Boot Logo (Optional)
              </label>
              <div className="space-y-2">
                <input 
                  type="text"
                  value={logoDescription}
                  onChange={(e) => setLogoDescription(e.target.value)}
                  placeholder="Describe the logo (e.g., 'Neon cyberpunk skull')"
                  className="w-full bg-[#0d0e12] border border-[#2a2b30] rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none text-sm"
                />
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#2a2b30] hover:bg-[#3a3b40] text-white rounded-lg cursor-pointer transition-colors text-sm">
                    <Upload size={16} />
                    {logoData ? "Image Uploaded" : "Upload Logo Image"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                  {logoData && (
                    <button onClick={() => setLogoData(null)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !platform.trim() || (!selectedTweaks.length && !customTweaks.trim())}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Code size={18} />}
              Generate Custom ROM Guide
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="col-span-2 bg-[#151619] border border-[#2a2b30] rounded-xl flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {result ? (
              <div className="markdown-body">
                <Markdown>{result}</Markdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#4a4b50] space-y-4">
                <Microchip size={48} className="opacity-20" />
                <p className="text-center max-w-sm">
                  Enter your platform details and desired tweaks to generate a custom UEFI/BIOS modification guide with IDE references.
                </p>
              </div>
            )}
          </div>
          
          {/* Grounding URLs / Google Reference */}
          {groundingUrls.length > 0 && (
            <div className="p-4 border-t border-[#2a2b30] bg-[#1a1b1e]">
              <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Search size={14} className="text-blue-400" />
                Google Reference IDE & Support Links
              </h4>
              <ul className="space-y-1">
                {groundingUrls.map((url, idx) => (
                  <li key={idx}>
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 hover:underline truncate block"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
