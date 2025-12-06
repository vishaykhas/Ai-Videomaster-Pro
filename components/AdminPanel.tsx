
import React, { useState, useEffect } from 'react';
import { DollarSign, Tag, Save, Shield, Users, Zap, Link as LinkIcon, CheckCircle, AlertCircle, Copy, Package, Plus, Trash2, Lock, RefreshCw, Activity, Server, X, Key, Share2, Globe, Rocket } from 'lucide-react';
import { PricingConfig, ProductPackage, ModuleId, LicenseKey } from '../types';
import { listPackages, createPackage, deletePackage, getAllModules, generateLicenseKey, listLicenses, processWebhook } from '../services/licenseService';

interface AdminPanelProps {
  pricingConfig: PricingConfig;
  onUpdateConfig: (config: PricingConfig) => void;
  onGenerateLicense: (email: string) => string; // Legacy prop, we'll use the new service mostly
}

const AdminPanel: React.FC<AdminPanelProps> = ({ pricingConfig, onUpdateConfig }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'packages' | 'licenses' | 'webhook' | 'distribution'>('dashboard');
  const [packages, setPackages] = useState<ProductPackage[]>([]);
  const [licenses, setLicenses] = useState<LicenseKey[]>([]);
  const [allModules] = useState(getAllModules());
  const [notification, setNotification] = useState<string | null>(null);

  // Package Builder State
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState(97);
  const [selectedModules, setSelectedModules] = useState<ModuleId[]>([]);

  // License Gen Modal State
  const [showKeyGenModal, setShowKeyGenModal] = useState(false);
  const [targetPackageId, setTargetPackageId] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState('');

  // Webhook Sim State
  const [webhookJson, setWebhookJson] = useState('{\n  "product_id": "warrior_001",\n  "product_name": "AI Video Master - Traffic Bundle",\n  "customer_email": "buyer@example.com"\n}');
  const [webhookLog, setWebhookLog] = useState<string[]>([]);

  // Distribution State
  const [testLink, setTestLink] = useState('');

  useEffect(() => {
      refreshData();
      // Safe link generation using URL API
      try {
          const url = new URL(window.location.href);
          url.searchParams.set('mode', 'test');
          setTestLink(url.toString());
      } catch (e) {
          setTestLink(window.location.href);
      }
  }, []);

  const refreshData = () => {
      setPackages(listPackages());
      setLicenses(listLicenses());
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreatePackage = () => {
      if (!newPkgName) return;
      createPackage({
          id: `pkg_${Date.now()}`,
          name: newPkgName,
          description: `Includes ${selectedModules.length} modules.`,
          price: newPkgPrice,
          isActive: true,
          includedModules: selectedModules
      });
      refreshData();
      showNotification("Package created successfully");
      setNewPkgName('');
      setSelectedModules([]);
  };

  const initiateKeyGen = (pkgId: string) => {
      setTargetPackageId(pkgId);
      setCustomerEmail('');
      setShowKeyGenModal(true);
  };

  const confirmKeyGen = () => {
      if (!targetPackageId || !customerEmail) return;
      try {
          generateLicenseKey(targetPackageId, customerEmail);
          refreshData();
          showNotification(`License generated for ${customerEmail}`);
          setShowKeyGenModal(false);
      } catch (e: any) {
          console.error(e);
          showNotification(`Error: ${e.message}`);
      }
  };

  const handleWebhookTest = () => {
      try {
          const payload = JSON.parse(webhookJson);
          const key = processWebhook(payload);
          refreshData();
          setWebhookLog(prev => [`[${new Date().toLocaleTimeString()}] Success: Generated ${key.code} for ${key.generatedForEmail}`, ...prev]);
      } catch (e: any) {
          setWebhookLog(prev => [`[${new Date().toLocaleTimeString()}] Error: ${e.message}`, ...prev]);
      }
  };

  const toggleModuleSelection = (mid: ModuleId) => {
      if (selectedModules.includes(mid)) {
          setSelectedModules(prev => prev.filter(m => m !== mid));
      } else {
          setSelectedModules(prev => [...prev, mid]);
      }
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      showNotification("Copied to clipboard");
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-10 relative">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-900/20 rounded-xl text-red-500 border border-red-500/20">
                <Shield size={32} />
            </div>
            <div>
                <h1 className="text-3xl font-bold text-theme-base">Admin Command Center</h1>
                <p className="text-theme-muted">AI-Managed Licensing & Access Control</p>
            </div>
          </div>
          <div className="flex gap-2 bg-dark-800 p-1 rounded-lg border border-gray-700 overflow-x-auto">
              {['dashboard', 'packages', 'licenses', 'distribution', 'webhook'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 rounded-md text-sm font-bold capitalize transition-all whitespace-nowrap ${
                        activeTab === tab ? 'bg-red-600 text-white shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                      {tab}
                  </button>
              ))}
          </div>
      </div>

      {notification && (
        <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-xl flex items-center gap-3 text-green-400 animate-bounce-in">
            <CheckCircle size={20} />
            {notification}
        </div>
      )}

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-dark-800 border border-gray-800 p-6 rounded-2xl">
                  <h3 className="text-theme-muted text-sm font-bold uppercase mb-2">Total Revenue (Simulated)</h3>
                  <p className="text-3xl font-bold text-white">${(licenses.length * 97).toLocaleString()}</p>
                  <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 w-3/4"></div>
                  </div>
              </div>
              <div className="bg-dark-800 border border-gray-800 p-6 rounded-2xl">
                  <h3 className="text-theme-muted text-sm font-bold uppercase mb-2">Active Licenses</h3>
                  <p className="text-3xl font-bold text-white">{licenses.filter(l => l.status === 'active').length}</p>
                  <p className="text-xs text-green-400 mt-2 flex items-center gap-1"><Activity size={12} /> +5 today</p>
              </div>
              <div className="bg-dark-800 border border-gray-800 p-6 rounded-2xl">
                  <h3 className="text-theme-muted text-sm font-bold uppercase mb-2">Active Packages</h3>
                  <p className="text-3xl font-bold text-white">{packages.length}</p>
                  <p className="text-xs text-blue-400 mt-2">Available for purchase</p>
              </div>
          </div>
      )}

      {/* PACKAGES TAB */}
      {activeTab === 'packages' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Builder */}
              <div className="lg:col-span-1 bg-dark-800 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Package size={20} className="text-blue-500" /> Package Builder
                  </h3>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Package Name</label>
                          <input 
                            value={newPkgName}
                            onChange={(e) => setNewPkgName(e.target.value)}
                            className="w-full bg-dark-950 border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500"
                            placeholder="e.g. Gold Bundle"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price ($)</label>
                          <input 
                            type="number"
                            value={newPkgPrice}
                            onChange={(e) => setNewPkgPrice(Number(e.target.value))}
                            className="w-full bg-dark-950 border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500"
                          />
                      </div>
                      
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Included Modules</label>
                          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar bg-dark-950 p-2 rounded-lg border border-gray-700">
                              {allModules.map(m => (
                                  <div 
                                    key={m.id} 
                                    onClick={() => toggleModuleSelection(m.id)}
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedModules.includes(m.id) ? 'bg-blue-900/30 border border-blue-500/50' : 'hover:bg-dark-800 border border-transparent'}`}
                                  >
                                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedModules.includes(m.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-600'}`}>
                                          {selectedModules.includes(m.id) && <CheckCircle size={10} className="text-white" />}
                                      </div>
                                      <span className="text-sm text-gray-300">{m.name}</span>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <button 
                        onClick={handleCreatePackage}
                        disabled={!newPkgName || selectedModules.length === 0}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <Plus size={18} /> Create Package
                      </button>
                  </div>
              </div>

              {/* List */}
              <div className="lg:col-span-2 space-y-4">
                  {packages.map(pkg => (
                      <div key={pkg.id} className="bg-dark-800 border border-gray-800 rounded-xl p-6 flex justify-between items-center group hover:border-blue-500/30 transition-colors">
                          <div>
                              <h4 className="text-lg font-bold text-white">{pkg.name}</h4>
                              <p className="text-sm text-gray-400">{pkg.includedModules.length} Modules • ${pkg.price}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                  {pkg.includedModules.slice(0, 4).map(m => (
                                      <span key={m} className="text-[10px] bg-dark-950 text-gray-500 px-2 py-1 rounded border border-gray-700">
                                          {allModules.find(x => x.id === m)?.name || m}
                                      </span>
                                  ))}
                                  {pkg.includedModules.length > 4 && <span className="text-[10px] text-gray-500 self-center">+{pkg.includedModules.length - 4} more</span>}
                              </div>
                          </div>
                          <div className="flex gap-3">
                              <button 
                                onClick={() => initiateKeyGen(pkg.id)}
                                className="px-4 py-2 bg-green-600/10 text-green-500 border border-green-500/30 rounded-lg text-sm font-bold hover:bg-green-600 hover:text-white transition-all"
                              >
                                  Generate Key
                              </button>
                              <button 
                                onClick={() => deletePackage(pkg.id)}
                                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                              >
                                  <Trash2 size={18} />
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* LICENSES TAB */}
      {activeTab === 'licenses' && (
          <div className="bg-dark-800 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">License Registry</h3>
                  <span className="text-sm text-gray-500">{licenses.length} Total Keys</span>
              </div>
              <table className="w-full text-left">
                  <thead className="bg-dark-900 text-gray-400 text-xs uppercase font-bold">
                      <tr>
                          <th className="p-4">User Email</th>
                          <th className="p-4">License Key</th>
                          <th className="p-4">Package</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Created</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                      {licenses.map(lic => {
                          const pkgName = packages.find(p => p.id === lic.packageId)?.name || 'Unknown';
                          return (
                              <tr key={lic.code} className="hover:bg-dark-900/50 transition-colors group">
                                  <td className="p-4 text-white font-medium">{lic.generatedForEmail}</td>
                                  <td className="p-4">
                                      <div className="flex items-center gap-2">
                                          <code className="bg-black/30 px-2 py-1 rounded text-blue-400 font-mono text-xs">
                                              {lic.code}
                                          </code>
                                          <button onClick={() => copyToClipboard(lic.code)} className="text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                              <Copy size={12} />
                                          </button>
                                      </div>
                                  </td>
                                  <td className="p-4 text-gray-300 text-sm">{pkgName}</td>
                                  <td className="p-4">
                                      <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold ${lic.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                          {lic.status}
                                      </span>
                                  </td>
                                  <td className="p-4 text-gray-500 text-sm">{new Date(lic.createdAt).toLocaleDateString()}</td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      )}

      {/* DISTRIBUTION TAB */}
      {activeTab === 'distribution' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-dark-800 border border-gray-800 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-yellow-900/20 rounded-xl text-yellow-500 border border-yellow-500/20">
                          <Rocket size={24} />
                      </div>
                      <div>
                          <h3 className="text-xl font-bold text-white">Beta Tester Access</h3>
                          <p className="text-gray-400 text-sm">Generate magic links for public testing.</p>
                      </div>
                  </div>

                  <div className="space-y-6">
                      <div className="bg-dark-900/50 p-4 rounded-xl border border-gray-700">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Magic Test Link</label>
                          <div className="flex gap-2">
                              <input 
                                  readOnly
                                  value={testLink}
                                  className="flex-1 bg-black border border-gray-800 rounded-lg px-3 py-2 text-green-400 font-mono text-sm outline-none"
                              />
                              <button 
                                  onClick={() => copyToClipboard(testLink)}
                                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                              >
                                  <Copy size={16} /> Copy
                              </button>
                          </div>
                          <p className="text-xs text-yellow-500/80 mt-3 flex items-start gap-2">
                              <AlertCircle size={14} className="mt-0.5 shrink-0" />
                              Note: This link bypasses authentication. Use only for sharing with trusted testers or public demos.
                          </p>
                      </div>

                      <div>
                          <h4 className="font-bold text-white mb-2">Instructions for You:</h4>
                          <ul className="text-sm text-gray-400 space-y-2 list-disc pl-4">
                              <li>Users clicking this link will be automatically logged in as a <strong>Beta Tester</strong>.</li>
                              <li>They will have full access to all Pro modules.</li>
                              <li>This works on any device where this URL is accessible.</li>
                              <li className="text-white">To make this link work for others, you must <strong>Deploy</strong> your app first (e.g. to Vercel/Netlify).</li>
                          </ul>
                      </div>
                  </div>
              </div>

              <div className="bg-dark-800 border border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                  <Globe size={48} className="text-blue-500 mb-6 opacity-80" />
                  <h3 className="text-xl font-bold text-white mb-2">Public Deployment</h3>
                  <p className="text-gray-400 text-sm mb-6 max-w-sm">
                      Your current environment is likely private. To share with the world, deploy this project.
                  </p>
                  <a 
                      href="https://vercel.com/new" 
                      target="_blank" 
                      rel="noreferrer"
                      className="bg-white text-black hover:bg-gray-200 font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-all"
                  >
                      <Server size={18} /> Deploy to Vercel
                  </a>
                  <p className="text-xs text-gray-500 mt-4">
                      (Or check your editor's "Share" button)
                  </p>
              </div>
          </div>
      )}

      {/* WEBHOOK SIM TAB */}
      {activeTab === 'webhook' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-dark-800 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Server size={20} className="text-purple-500" /> Webhook Simulator
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                      Test integration with WarriorPlus, JVZoo, or Stripe. Paste the JSON payload below.
                  </p>
                  
                  <textarea 
                    value={webhookJson}
                    onChange={(e) => setWebhookJson(e.target.value)}
                    className="w-full h-64 bg-dark-950 border border-gray-700 rounded-xl p-4 text-green-400 font-mono text-sm outline-none focus:border-purple-500 resize-none"
                  />
                  
                  <button 
                    onClick={handleWebhookTest}
                    className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                      <Zap size={18} /> Simulate Purchase Event
                  </button>
              </div>

              <div className="bg-black border border-gray-800 rounded-2xl p-6 font-mono text-sm h-[500px] overflow-y-auto">
                  <h4 className="text-gray-500 font-bold uppercase mb-4 border-b border-gray-800 pb-2">System Logs</h4>
                  {webhookLog.length === 0 && <span className="text-gray-600 italic">Waiting for events...</span>}
                  {webhookLog.map((log, i) => (
                      <div key={i} className={`mb-2 ${log.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                          {log}
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* MODALS */}
      {showKeyGenModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-dark-800 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <Key size={20} className="text-green-500" /> Issue License
                      </h3>
                      <button onClick={() => setShowKeyGenModal(false)} className="text-gray-500 hover:text-white">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Package</label>
                          <div className="bg-dark-950 border border-gray-800 rounded-lg p-3 text-white text-sm">
                              {packages.find(p => p.id === targetPackageId)?.name || 'Unknown Package'}
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Customer Email</label>
                          <input 
                              type="email"
                              value={customerEmail}
                              onChange={(e) => setCustomerEmail(e.target.value)}
                              placeholder="customer@example.com"
                              className="w-full bg-dark-950 border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-green-500"
                              autoFocus
                          />
                      </div>
                      
                      <button 
                          onClick={confirmKeyGen}
                          disabled={!customerEmail}
                          className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl mt-4"
                      >
                          Confirm & Generate
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default AdminPanel;
