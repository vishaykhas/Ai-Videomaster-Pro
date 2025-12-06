import React, { useState, useEffect } from 'react';
import { User as UserIcon, CreditCard, Bell, Shield, Key, Save, Check, Zap, ExternalLink, Loader2, Crown, Gift, ArrowRight, Package } from 'lucide-react';
import { requestVeoKey, checkVeoKey } from '../services/geminiService';
import { User, PricingConfig } from '../types';
import { getAllModules, listPackages } from '../services/licenseService';

interface SettingsProps {
  user: User | null;
  pricingConfig: PricingConfig;
  onRedeemLicense: (code: string) => boolean;
}

const Settings: React.FC<SettingsProps> = ({ user, pricingConfig, onRedeemLicense }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'integrations'>('profile');
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [veoConnected, setVeoConnected] = useState(false);
  
  // Redemption State
  const [showRedeem, setShowRedeem] = useState(false);
  const [licenseCode, setLicenseCode] = useState('');
  const [redeemStatus, setRedeemStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Package Details
  const [packageName, setPackageName] = useState('Free Plan');

  useEffect(() => {
    if (user) {
        setName(user.name);
        if (user.activePackageId) {
            const pkgs = listPackages();
            const p = pkgs.find(pkg => pkg.id === user.activePackageId);
            if(p) setPackageName(p.name);
        }
    }
    checkVeoStatus();
  }, [user]);

  const checkVeoStatus = async () => {
    try {
        const status = await checkVeoKey();
        setVeoConnected(status);
    } catch (e) {
        console.error("Failed to check Veo status", e);
    }
  };

  const handleVeoConnect = async () => {
      try {
        await requestVeoKey();
        await checkVeoStatus();
      } catch (e) {
        console.error("Failed to connect Veo", e);
      }
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };
  
  const handleLicenseSubmit = () => {
      if(!licenseCode) return;
      const success = onRedeemLicense(licenseCode);
      if(success) {
          setRedeemStatus('success');
          setLicenseCode('');
      } else {
          setRedeemStatus('error');
      }
  };

  const renderTabs = () => (
    <div className="flex space-x-1 bg-dark-900/50 p-1 rounded-xl border border-gray-800 mb-8 w-fit transition-colors duration-300">
      {[
        { id: 'profile', label: 'Profile', icon: UserIcon },
        { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
        { id: 'integrations', label: 'Integrations', icon: Key },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as any)}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === tab.id
              ? 'bg-brand-600 text-white shadow-lg'
              : 'text-theme-muted hover:text-theme-base hover:bg-dark-800'
          }`}
        >
          <tab.icon size={16} />
          {tab.label}
        </button>
      ))}
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-dark-800 border border-gray-800 rounded-2xl p-8 transition-colors duration-300">
        <h3 className="text-lg font-semibold text-theme-base mb-6 flex items-center gap-2">
            <UserIcon size={20} className="text-brand-500" /> 
            Personal Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm text-theme-muted font-medium">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-dark-950 border border-gray-700 rounded-xl p-3 text-theme-base focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-theme-muted font-medium">Email Address</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full bg-dark-900/50 border border-gray-800 rounded-xl p-3 text-gray-500 cursor-not-allowed transition-colors"
            />
            <p className="text-xs text-theme-muted">Contact support to change email.</p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-brand-600 hover:bg-brand-500 text-white font-semibold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-colors"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderBilling = () => (
    <div className="space-y-6 animate-fade-in">
        
        {/* Active Plan Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-brand-900/50 to-dark-800 border border-brand-500/30 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Crown size={120} />
                </div>
                <h4 className="text-theme-muted text-sm font-medium mb-1">Current Subscription</h4>
                <p className="text-3xl font-bold text-theme-base mb-4 capitalize">{packageName}</p>
                
                {user?.licenseExpiry && (
                    <p className="text-xs text-yellow-400 mb-4">
                        Expires on: {new Date(user.licenseExpiry).toLocaleDateString()}
                    </p>
                )}

                <div className="flex flex-wrap gap-2">
                    {user?.allowedModules.slice(0, 3).map(m => (
                        <span key={m} className="text-[10px] bg-brand-900/40 text-brand-300 px-2 py-1 rounded border border-brand-500/20 uppercase">
                            {m.replace('module_', '').replace('_', ' ')}
                        </span>
                    ))}
                    {(user?.allowedModules.length || 0) > 3 && (
                        <span className="text-[10px] bg-brand-900/40 text-brand-300 px-2 py-1 rounded border border-brand-500/20 uppercase">
                            +{ (user?.allowedModules.length || 0) - 3} More
                        </span>
                    )}
                </div>
            </div>
            
            <div className="bg-dark-800 border border-gray-800 rounded-2xl p-6 transition-colors duration-300">
                <div className="flex justify-between items-end mb-4">
                    <div>
                         <h4 className="text-theme-muted text-sm font-medium mb-1">Credits</h4>
                         <p className="text-2xl font-bold text-theme-base">
                             {user?.credits} 
                             <span className="text-sm text-theme-muted font-normal ml-1">credits</span>
                         </p>
                    </div>
                </div>
                <div className="w-full bg-dark-950 rounded-full h-4 overflow-hidden border border-gray-800">
                    <div 
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500"
                        style={{ width: `${Math.min((user?.credits || 0) / 10, 100)}%` }}
                    ></div>
                </div>
                <p className="text-xs text-theme-muted mt-3">
                    Credits renew monthly.
                </p>
            </div>
        </div>

        {/* License Redemption Form */}
        <div className="bg-dark-800 border border-gray-800 rounded-2xl p-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Zap size={20} className="text-yellow-500" /> Activate New License
            </h3>
            <div className="flex flex-col md:flex-row gap-4">
                <input 
                    type="text" 
                    value={licenseCode}
                    onChange={(e) => {
                        setLicenseCode(e.target.value.toUpperCase());
                        setRedeemStatus('idle');
                    }}
                    placeholder="AIVMP-XXXX-XXXX-XXXX"
                    className="flex-1 bg-dark-950 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-brand-500 uppercase font-mono tracking-widest"
                />
                <button 
                    onClick={handleLicenseSubmit}
                    className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                    Activate License
                </button>
            </div>
            
            {redeemStatus === 'error' && (
                <p className="text-red-400 text-sm mt-3 flex items-center gap-1">
                    <Zap size={14} /> Invalid or used license key.
                </p>
            )}
            {redeemStatus === 'success' && (
                <p className="text-green-400 text-sm mt-3 flex items-center gap-1">
                    <Check size={14} /> License activated! Modules unlocked.
                </p>
            )}
        </div>
    </div>
  );

  const renderIntegrations = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="bg-dark-800 border border-gray-800 rounded-2xl p-8 transition-colors duration-300">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-theme-base mb-2 flex items-center gap-2">
                        <Key size={20} className="text-brand-500" /> 
                        Google Veo Integration
                    </h3>
                    <p className="text-theme-muted text-sm max-w-lg mb-6">
                        Required for generating AI Videos.
                    </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${veoConnected ? 'bg-green-900/20 border-green-500/30 text-green-500' : 'bg-yellow-900/20 border-yellow-500/30 text-yellow-500'}`}>
                    {veoConnected ? 'Connected' : 'Action Required'}
                </div>
            </div>

            <div className="bg-dark-950 border border-gray-800 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-colors duration-300">
                <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                        <span className="text-xl font-bold text-gray-400">G</span>
                     </div>
                     <div>
                         <h4 className="text-theme-base font-medium">Google AI Studio Key</h4>
                         <p className="text-xs text-theme-muted">Required for veo-3.1-generate-preview</p>
                     </div>
                </div>
                
                <button 
                    onClick={handleVeoConnect}
                    className="flex items-center gap-2 bg-theme-base text-theme-inverted hover:opacity-90 px-6 py-2.5 rounded-lg font-semibold transition-all"
                >
                    {veoConnected ? 'Reconnect Account' : 'Connect Google Account'}
                    <ExternalLink size={16} />
                </button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-theme-base mb-2">Account Settings</h1>
        <p className="text-theme-muted">Manage your profile, subscription plan, and API integrations.</p>
      </div>

      {renderTabs()}

      {activeTab === 'profile' && renderProfile()}
      {activeTab === 'billing' && renderBilling()}
      {activeTab === 'integrations' && renderIntegrations()}
    </div>
  );
};

export default Settings;