/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { DeploymentWizard } from "./components/DeploymentWizard";
import { BiosBuilder } from "./components/BiosBuilder";
import { ServiceAuditor } from "./components/ServiceAuditor";
import { AIChat } from "./components/AIChat";
import { LiveVoiceAssistant } from "./components/LiveVoiceAssistant";
import { Visualizer } from "./components/Visualizer";
import { AuthProvider } from "./components/AuthProvider";

export default function App() {
  const [activeTab, setActiveTab] = useState("wizard");

  return (
    <AuthProvider>
      <div className="flex h-screen w-full bg-[#0d0e12] overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 h-full overflow-hidden relative">
          {activeTab === "wizard" && <DeploymentWizard />}
          {activeTab === "bios" && <BiosBuilder />}
          {activeTab === "auditor" && <ServiceAuditor />}
          {activeTab === "chat" && <AIChat />}
          {activeTab === "voice" && <LiveVoiceAssistant />}
          {activeTab === "visualizer" && <Visualizer />}
        </main>
      </div>
    </AuthProvider>
  );
}
