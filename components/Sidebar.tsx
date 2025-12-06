import React from 'react';
import { LayoutDashboard, Video, Settings, LogOut, Zap, ShieldCheck, Sun, Moon, Image, FolderOpen, Share2, Megaphone, Map, Clapperboard, Copy, Feather, Lock } from 'lucide-react';
import { AppView, ModuleId, User } from '../types';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onLogout: () => void;
  user: User | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onLogout, user, theme, onToggleTheme }) => {
  
  // Mapping AppView to ModuleId for permission checking
  // Dashboard, Settings, Admin are always allowed (Admin logic handled separately)
  const MODULE_MAP: Record<string, ModuleId> = {
      [AppView.CREATE_WIZARD]: ModuleId.VIDEO_GEN,
      [AppView.ASMR_GENERATOR]: ModuleId.ASMR,
      [AppView.VIDEO_CLONER]: ModuleId.CLONER,
      [AppView.MOVIE_STUDIO]: ModuleId.MOVIE,
      [AppView.WALKTHROUGH_MAKER]: ModuleId.WALKTHROUGH,
      [AppView.VIDEO_ADS_MAKER]: ModuleId.ADS,
      [AppView.THUMBNAIL_MAKER]: ModuleId.THUMBNAIL,
      [AppView.AUTO_TRAFFIC]: ModuleId.TRAFFIC,
  };

  const navItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, moduleId: null },
    { id: AppView.CREATE_WIZARD, label: 'Create Video', icon: Video, moduleId: ModuleId.VIDEO_GEN },
    { id: AppView.ASMR_GENERATOR, label: 'ASMR Engine', icon: Feather, moduleId: ModuleId.ASMR },
    { id: AppView.VIDEO_CLONER, label: 'Video Cloner', icon: Copy, moduleId: ModuleId.CLONER },
    { id: AppView.VIDEO_ADS_MAKER, label: 'Video Ads', icon: Megaphone, moduleId: ModuleId.ADS },
    { id: AppView.THUMBNAIL_MAKER, label: 'Thumbnail Studio', icon: Image, moduleId: ModuleId.THUMBNAIL },
    { id: AppView.WALKTHROUGH_MAKER, label: 'Walkthroughs', icon: Map, moduleId: ModuleId.WALKTHROUGH },
    { id: AppView.MOVIE_STUDIO, label: 'CineAI Studio', icon: Clapperboard, moduleId: ModuleId.MOVIE },
    { id: AppView.AUTO_TRAFFIC, label: 'Auto Traffic', icon: Share2, moduleId: ModuleId.TRAFFIC },
    { id: AppView.PROJECTS, label: 'My Projects', icon: FolderOpen, moduleId: null },
    { id: AppView.SETTINGS, label: 'Settings', icon: Settings, moduleId: null },
  ];

  if (user?.isAdmin) {
    navItems.push({ id: AppView.ADMIN, label: 'Admin Panel', icon: ShieldCheck, moduleId: null });
  }

  return (
    <aside className="w-64 bg-dark-900 border-r border-gray-800 flex flex-col h-screen fixed left-0 top-0 z-50 transition-colors duration-300">
      <div className="p-6 border-b border-gray-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center shadow-md">
            <Zap className="w-5 h-5 text-white fill-current" />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-theme-base to-gray-500">
          VideoMaster
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          
          // Check Permissions
          let isLocked = false;
          if (item.moduleId) {
              // If user is admin, they see everything. If not, check allowedModules.
              // If allowedModules is undefined (legacy user), default to locking everything except basic? 
              // For safety, assume locked if not explicitly allowed.
              if (!user?.isAdmin) {
                  const allowed = user?.allowedModules || [];
                  if (!allowed.includes(item.moduleId)) {
                      isLocked = true;
                  }
              }
          }

          return (
            <button
              key={item.id}
              onClick={() => !isLocked && onViewChange(item.id)}
              disabled={isLocked}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20'
                  : isLocked 
                    ? 'text-gray-600 cursor-not-allowed hover:bg-transparent opacity-60'
                    : 'text-theme-muted hover:bg-dark-700 hover:text-theme-base'
              }`}
            >
              <div className="flex items-center gap-3">
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
              </div>
              {isLocked && <Lock size={14} className="text-gray-600" />}
            </button>
          );
        })}
      </nav>

      <div className="px-4">
         <button 
            onClick={onToggleTheme}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-dark-950 border border-gray-800 text-theme-muted hover:text-theme-base transition-colors mb-4"
         >
             <span className="text-xs font-medium">Appearance</span>
             {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
         </button>
      </div>

      <div className="p-4 mx-4 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-xl border border-indigo-500/20 mb-0">
        <h4 className="text-sm font-semibold text-white mb-1">Status</h4>
        <p className="text-xs text-indigo-200 mb-3">
            {user?.isAdmin ? 'Administrator' : (user?.plan || 'Free') + ' Plan'}
        </p>
        <div className="w-full bg-gray-700/50 rounded-full h-1.5 mb-1">
            <div className="bg-brand-500 h-1.5 rounded-full" style={{width: '75%'}}></div>
        </div>
        <p className="text-[10px] text-indigo-200 text-right">{user?.credits || 0} Credits</p>
      </div>

      <div className="p-4 border-t border-gray-800 mt-4">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-theme-muted hover:text-theme-base transition-colors"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;