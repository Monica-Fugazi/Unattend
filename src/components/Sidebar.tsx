import { Server, Mic, MessageSquare, Settings, FileCode2, Image as ImageIcon, Microchip, Activity, LogIn, LogOut } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "./AuthProvider";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { user, signIn, logOut } = useAuth();
  const tabs = [
    { id: "wizard", label: "Deployment Wizard", icon: FileCode2 },
    { id: "bios", label: "BIOS Builder", icon: Microchip },
    { id: "auditor", label: "Service Auditor", icon: Activity },
    { id: "chat", label: "AI Assistant", icon: MessageSquare },
    { id: "voice", label: "Live Voice", icon: Mic },
    { id: "visualizer", label: "Visualizer", icon: ImageIcon },
  ];

  return (
    <div className="w-64 border-r border-[#2a2b30] bg-[#151619] flex flex-col h-full shrink-0">
      <div className="p-6 flex items-center gap-3 border-b border-[#2a2b30]">
        <Server className="text-blue-500" size={24} />
        <h1 className="font-semibold text-white tracking-tight">WinServer 2025</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-blue-500/10 text-blue-400" 
                  : "text-[#8E9299] hover:bg-[#2a2b30] hover:text-white"
              )}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#2a2b30] space-y-2">
        {user ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300">
              {user.photoURL && <img src={user.photoURL} alt="Avatar" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />}
              <span className="truncate">{user.displayName || user.email}</span>
            </div>
            <button 
              onClick={logOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        ) : (
          <button 
            onClick={signIn}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-blue-400 hover:bg-blue-500/10 transition-colors"
          >
            <LogIn size={18} />
            Sign In with Google
          </button>
        )}
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#8E9299] hover:bg-[#2a2b30] hover:text-white transition-colors">
          <Settings size={18} />
          Settings
        </button>
      </div>
    </div>
  );
}
