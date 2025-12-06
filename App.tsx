
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import VideoWizard from './components/VideoWizard';
import AuthScreen from './components/AuthScreen';
import Settings from './components/Settings';
import AdminPanel from './components/AdminPanel';
import ThumbnailMaker from './components/ThumbnailMaker';
import AutoTrafficModule from './components/AutoTrafficModule';
import VideoAdsMaker from './components/VideoAdsMaker';
import WalkthroughWizard from './components/WalkthroughWizard';
import MovieStudio from './components/MovieStudio';
import VideoCloner from './components/VideoCloner';
import ASMRGenerator from './components/ASMRGenerator';
import { AppView, User, PricingConfig, LicenseKey, ThumbnailProject, ModuleId } from './types';
import { Search, Bell, Shield, FolderOpen, Edit, Trash2, Lock, Beaker, Share2, Copy, X, Globe, Wifi, AlertTriangle, Info, Laptop, CloudOff, FileWarning } from 'lucide-react';
import { validateLicense, getAllModules } from './services/licenseService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isTestMode, setIsTestMode] = useState(false);
  
  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  
  // Environment Detection State
  const [envType, setEnvType] = useState<'localhost' | 'sandboxed' | 'public' | 'blob'>('public');
  const [copyFeedback, setCopyFeedback] = useState(false);

  const [pricingConfig, setPricingConfig] = useState<PricingConfig>({
      basePrice: 97,
      discountPercent: 50,
      isSaleActive: true,
      buyLink: "https://warriorplus.com/o/item/example"
  });

  // --- URL Sanitization & Mode Check ---
  useEffect(() => {
    // 1. Check for Test Mode URL Parameter (?mode=test)
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');

    if (mode === 'test') {
        const testUser: User = {
            name: "Beta Tester",
            email: "guest@tester.com",
            plan: "pro",
            credits: 500,
            isAdmin: false,
            allowedModules: getAllModules().map(m => m.id), // Give access to all modules for testing
        };
        setUser(testUser);
        setIsAuthenticated(true);
        setIsTestMode(true);
        return; // Skip checking local storage if testing
    }

    // 2. Check Local Storage
    const savedSession = localStorage.getItem('videomaster_session');
    if (savedSession) {
      try {
        const parsedUser = JSON.parse(savedSession);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('videomaster_session');
      }
    }
    const savedTheme = localStorage.getItem('videomaster_theme') as 'dark' | 'light';
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
      const root = document.documentElement;
      if (theme === 'light') root.classList.add('light-mode');
      else root.classList.remove('light-mode');
      localStorage.setItem('videomaster_theme', theme);
  }, [theme]);

  // Generate Link on Mount/Update
  useEffect(() => {
      try {
          const currentUrl = new URL(window.location.href);
          
          // CRITICAL: Check for blob protocol
          if (currentUrl.protocol === 'blob:') {
              setEnvType('blob');
              setShareLink("Deploy to get a real link");
              return;
          }

          currentUrl.searchParams.set('mode', 'test');
          setShareLink(currentUrl.toString());

          // Detect Environment Type
          const hostname = currentUrl.hostname;
          
          if (hostname === 'localhost' || hostname === '127.0.0.1') {
              setEnvType('localhost');
          } else if (
              hostname.includes('bolt.new') || 
              hostname.includes('stackblitz') || 
              hostname.includes('webcontainer') ||
              hostname.endsWith('.goog')
          ) {
              setEnvType('sandboxed');
          } else {
              setEnvType('public');
          }

      } catch (e) {
          console.error("Failed to generate share link", e);
          setShareLink(window.location.href);
      }
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // New License Handler
  const handleGenerateLicense = (targetEmail: string): string => {
      // Legacy shim for admin panel prop - redirect to service if needed or keep simple
      return "USE_ADMIN_PANEL"; 
  };

  const handleRedeemLicense = (code: string): boolean => {
      if (!user) return false;
      const result = validateLicense(code, user.email);
      
      if (result.valid && result.userUpdates) {
          const updatedUser = { ...user, ...result.userUpdates };
          setUser(updatedUser);
          localStorage.setItem('videomaster_session', JSON.stringify(updatedUser));
          return true;
      }
      console.error(result.error);
      return false;
  };

  const copyShareLink = () => {
      if (envType === 'blob') return;
      navigator.clipboard.writeText(shareLink);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Projects View Component
  const ProjectsView = () => (
    <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
             <h1 className="text-2xl font-bold text-theme-base">My Projects</h1>
             <button 
                onClick={() => setCurrentView(AppView.THUMBNAIL_MAKER)}
                className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
             >
                 Open Studio
             </button>
        </div>
        <div className="p-12 text-center border border-gray-800 rounded-xl bg-dark-900">
            <FolderOpen size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">Manage your creations inside the AI Thumbnail Studio tab.</p>
            <button onClick={() => setCurrentView(AppView.THUMBNAIL_MAKER)} className="mt-4 text-brand-500 hover:underline">Go to Studio</button>
        </div>
    </div>
  );

  if (!isAuthenticated) {
    return <AuthScreen 
        onLogin={(userData, rememberMe) => {
            if (!userData.allowedModules) {
                userData.allowedModules = [ModuleId.VIDEO_GEN]; 
            }
            setUser(userData);
            setIsAuthenticated(true);
            if (rememberMe) localStorage.setItem('videomaster_session', JSON.stringify(userData));
        }} 
        onRedeemLicense={handleRedeemLicense}
    />;
  }

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setCurrentView(AppView.DASHBOARD);
    localStorage.removeItem('videomaster_session');
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('mode');
    window.history.pushState({}, document.title, cleanUrl.pathname + cleanUrl.search);
    setIsTestMode(false);
  };

  // --- View Guard ---
  const VIEW_MODULE_MAP: Partial<Record<AppView, ModuleId>> = {
      [AppView.CREATE_WIZARD]: ModuleId.VIDEO_GEN,
      [AppView.ASMR_GENERATOR]: ModuleId.ASMR,
      [AppView.VIDEO_CLONER]: ModuleId.CLONER,
      [AppView.MOVIE_STUDIO]: ModuleId.MOVIE,
      [AppView.WALKTHROUGH_MAKER]: ModuleId.WALKTHROUGH,
      [AppView.VIDEO_ADS_MAKER]: ModuleId.ADS,
      [AppView.THUMBNAIL_MAKER]: ModuleId.THUMBNAIL,
      [AppView.AUTO_TRAFFIC]: ModuleId.TRAFFIC,
  };

  const renderContent = () => {
    if (currentView === AppView.ADMIN && !user?.isAdmin) {
        return <Dashboard onViewChange={setCurrentView} />;
    }

    const requiredModule = VIEW_MODULE_MAP[currentView];
    if (requiredModule && !user?.isAdmin) {
        if (!user?.allowedModules.includes(requiredModule)) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
                    <div className="bg-dark-800 p-8 rounded-2xl border border-gray-800 max-w-md">
                        <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
                            <Lock size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Module Locked</h2>
                        <p className="text-gray-400 mb-6">
                            Your current plan does not include access to the <strong>{requiredModule.replace('module_', '').replace('_', ' ')}</strong> module.
                        </p>
                        <button 
                            onClick={() => setCurrentView(AppView.SETTINGS)}
                            className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-xl font-bold transition-all"
                        >
                            Upgrade Plan
                        </button>
                    </div>
                </div>
            );
        }
    }

    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard onViewChange={setCurrentView} />;
      case AppView.CREATE_WIZARD:
        return <VideoWizard onBack={() => setCurrentView(AppView.DASHBOARD)} />;
      case AppView.VIDEO_ADS_MAKER:
        return <VideoAdsMaker />;
      case AppView.THUMBNAIL_MAKER:
        return <ThumbnailMaker />;
      case AppView.WALKTHROUGH_MAKER:
        return <WalkthroughWizard />;
      case AppView.MOVIE_STUDIO:
        return <MovieStudio />;
      case AppView.VIDEO_CLONER:
        return <VideoCloner />;
      case AppView.ASMR_GENERATOR:
        return <ASMRGenerator />;
      case AppView.AUTO_TRAFFIC:
        return <AutoTrafficModule />;
      case AppView.PROJECTS:
        return <ProjectsView />;
      case AppView.SETTINGS:
        return <Settings user={user} pricingConfig={pricingConfig} onRedeemLicense={handleRedeemLicense} />;
      case AppView.ADMIN:
         return <AdminPanel pricingConfig={pricingConfig} onUpdateConfig={setPricingConfig} onGenerateLicense={handleGenerateLicense} />;
      default:
        return <Dashboard onViewChange={setCurrentView} />;
    }
  };

  const getInitials = (name: string) => name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex min-h-screen bg-dark-950 text-theme-base font-sans transition-colors duration-300 relative">
      
      {isTestMode && (
          <div className="fixed top-0 left-0 right-0 h-1 z-[100] bg-gradient-to-r from-yellow-400 to-orange-500"></div>
      )}

      {/* SHARE MODAL */}
      {showShareModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-dark-800 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-purple-500"></div>
                  
                  <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                          <div>
                              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                  <Share2 size={20} className="text-brand-500" /> Share Preview
                              </h2>
                              <p className="text-sm text-gray-400">Give anyone instant access to test this app.</p>
                          </div>
                          <button onClick={() => setShowShareModal(false)} className="text-gray-500 hover:text-white transition-colors">
                              <X size={20} />
                          </button>
                      </div>

                      <div className="bg-dark-950 border border-gray-800 rounded-xl p-4 mb-6">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Magic Link (Auto-Login)</label>
                          <div className="flex gap-2">
                              <input 
                                  readOnly
                                  value={shareLink}
                                  className={`flex-1 bg-dark-900 border rounded-lg px-3 py-2 font-mono text-xs outline-none truncate ${envType === 'blob' ? 'border-red-500 text-red-400' : 'border-gray-800 text-green-400'}`}
                              />
                              <button 
                                  onClick={copyShareLink}
                                  disabled={envType === 'blob'}
                                  className={`bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-xs transition-colors ${envType === 'blob' ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                  {copyFeedback ? 'Copied!' : <><Copy size={14} /> Copy</>}
                              </button>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-2">
                              <Wifi size={16} /> Connection Status
                          </h4>
                          
                          {/* 1. BLOB DETECTED (THE FIX) */}
                          {envType === 'blob' && (
                              <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-lg flex gap-3">
                                  <FileWarning size={24} className="text-red-500 shrink-0" />
                                  <div className="text-xs text-red-100/90 leading-relaxed">
                                      <p className="font-bold text-red-400 mb-1">Local Memory URL Detected (blob:)</p>
                                      <p className="mb-2">You are currently running in a temporary preview memory slot. <strong>"blob:" URLs cannot be shared</strong> and will fail on other tabs/browsers.</p>
                                      <p className="bg-red-500/10 p-2 rounded border border-red-500/20 inline-block mt-1">
                                          <strong>Solution:</strong> You MUST click the <strong>Deploy</strong> button (top right) to generate a real, shareable internet address.
                                      </p>
                                  </div>
                              </div>
                          )}

                          {envType === 'sandboxed' && (
                              <div className="bg-yellow-900/10 border border-yellow-500/20 p-4 rounded-lg flex gap-3">
                                  <CloudOff size={24} className="text-yellow-500 shrink-0" />
                                  <div className="text-xs text-yellow-100/90 leading-relaxed">
                                      <p className="font-bold text-yellow-400 mb-1">Warning: Cloud Environment</p>
                                      <p className="mb-2">This link might be locked to your <strong>current session</strong>. It may not work for others if the preview proxy rotates.</p>
                                      <p><strong>Fix:</strong> Click <strong>Deploy</strong> for a permanent link.</p>
                                  </div>
                              </div>
                          )}

                          {envType === 'localhost' && (
                              <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-lg flex gap-3">
                                  <Laptop size={24} className="text-blue-500 shrink-0" />
                                  <div className="text-xs text-blue-100/90 leading-relaxed">
                                      <p className="font-bold text-blue-400 mb-1">Localhost Environment</p>
                                      <p>This link works on <strong>this machine only</strong>.</p>
                                  </div>
                              </div>
                          )}

                          {envType === 'public' && (
                              <div className="bg-green-900/10 border border-green-500/20 p-4 rounded-lg flex gap-3">
                                  <Globe size={24} className="text-green-500 shrink-0" />
                                  <div className="text-xs text-green-100/90 leading-relaxed">
                                      <p className="font-bold text-green-400 mb-1">You are Live!</p>
                                      <p>This is a public URL. Anyone with this link can access the app as a Beta Tester.</p>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
                  
                  <div className="bg-dark-900 p-4 border-t border-gray-800 flex justify-end">
                      <button onClick={() => setShowShareModal(false)} className="text-sm text-gray-400 hover:text-white font-medium">
                          Close
                      </button>
                  </div>
              </div>
          </div>
      )}

      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        onLogout={handleLogout}
        user={user}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <div className="flex-1 ml-64">
        <header className="h-20 border-b border-gray-800 bg-dark-950/50 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between transition-colors duration-300">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-theme-base capitalize flex items-center gap-2">
                    {currentView === AppView.ADMIN && <Shield size={20} className="text-red-500" />}
                    {currentView.replace(/_/g, ' ').toLowerCase()}
                </h2>
                {isTestMode && (
                    <span className="bg-yellow-900/30 text-yellow-500 border border-yellow-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                        <Beaker size={12} /> Test Mode
                    </span>
                )}
            </div>
            
            <div className="flex items-center gap-6">
                <button 
                    onClick={() => setShowShareModal(true)}
                    className="hidden md:flex items-center gap-2 bg-brand-600/10 text-brand-500 border border-brand-500/20 px-4 py-2 rounded-full text-sm font-bold hover:bg-brand-600 hover:text-white transition-all shadow-lg hover:shadow-brand-500/25"
                >
                    <Share2 size={16} /> Share Demo
                </button>

                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                    <input type="text" placeholder="Search..." className="bg-dark-900 border border-gray-800 rounded-full pl-10 pr-4 py-2 text-sm text-theme-base focus:border-brand-500 outline-none w-64 placeholder-theme-muted transition-colors duration-300" />
                </div>
                <button className="relative text-theme-muted hover:text-theme-base"><Bell size={20} /><span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-500 rounded-full"></span></button>
                <div className="flex items-center gap-3 pl-6 border-l border-gray-800">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-theme-base">{user?.name || 'User'}</p>
                        <p className="text-xs text-theme-muted capitalize">{user?.isAdmin ? 'Administrator' : user?.plan + ' Plan'}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${user?.isAdmin ? 'bg-red-600' : 'bg-gradient-to-tr from-brand-500 to-purple-500'}`}>{user ? getInitials(user.name) : 'U'}</div>
                </div>
            </div>
        </header>
        <main className="p-8 h-[calc(100vh-5rem)] overflow-y-auto custom-scrollbar">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
