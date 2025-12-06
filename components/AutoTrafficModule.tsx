
import React, { useState, useEffect } from 'react';
import { Share2, PlusCircle, BarChart3, Link, Globe, Youtube, Twitter, Linkedin, Mail, Send, Rss, CheckCircle2, AlertCircle, Loader2, MousePointer2, RefreshCw, Image, MessageCircle, Hash, Facebook, Instagram, BookOpen, Newspaper, Ghost, Terminal, Target, Bookmark, ArrowLeft, ArrowRight, Eye, ThumbsUp, ExternalLink, Filter, Calendar, Clock, MoreHorizontal } from 'lucide-react';
import { ConnectedAccount, TrafficCampaign, SocialPlatform, PlatformJob } from '../types';
import TrafficCampaignWizard from './TrafficCampaignWizard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const PLATFORMS: { id: SocialPlatform; name: string; icon: any; color: string }[] = [
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: '#FF0000' },
    { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: '#1DA1F2' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: '#0077B5' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877F2' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E1306C' },
    { id: 'pinterest', name: 'Pinterest', icon: Image, color: '#BD081C' },
    { id: 'hackernews', name: 'Hacker News', icon: Terminal, color: '#FF6600' },
    { id: 'producthunt', name: 'Product Hunt', icon: Target, color: '#DA552F' },
    { id: 'indiehackers', name: 'Indie Hackers', icon: Globe, color: '#0E2439' },
    { id: 'reddit', name: 'Reddit', icon: Globe, color: '#FF4500' },
    { id: 'quora', name: 'Quora', icon: MessageCircle, color: '#B92B27' },
    { id: 'medium', name: 'Medium', icon: Rss, color: '#000000' },
    { id: 'substack', name: 'Substack', icon: BookOpen, color: '#FF6719' },
    { id: 'revue', name: 'Revue', icon: Newspaper, color: '#5324FF' },
    { id: 'tumblr', name: 'Tumblr', icon: Hash, color: '#35465C' },
    { id: 'flipboard', name: 'Flipboard', icon: Image, color: '#E12828' },
    { id: 'mix', name: 'Mix.com', icon: Globe, color: '#FF5A00' },
    { id: 'vk', name: 'VK', icon: Globe, color: '#0077FF' },
    { id: 'mastodon', name: 'Mastodon', icon: Hash, color: '#6364FF' },
    { id: 'discord', name: 'Discord', icon: MessageCircle, color: '#5865F2' },
    { id: 'telegram', name: 'Telegram', icon: Send, color: '#0088cc' },
    { id: 'scoopit', name: 'Scoop.it', icon: Bookmark, color: '#4EA92F' },
    { id: 'triberr', name: 'Triberr', icon: Rss, color: '#CF5C2F' },
    { id: 'ello', name: 'Ello', icon: MessageCircle, color: '#000000' },
    { id: 'folkd', name: 'Folkd', icon: Link, color: '#0073D1' },
    { id: 'pearltrees', name: 'Pearltrees', icon: Image, color: '#198CFF' },
    { id: 'diigo', name: 'Diigo', icon: Bookmark, color: '#4386FC' },
    { id: 'email', name: 'Email List', icon: Mail, color: '#EA4335' },
    { id: 'wordpress', name: 'WordPress', icon: Rss, color: '#21759b' },
    { id: 'blogger', name: 'Blogger', icon: Globe, color: '#fb8f3d' },
    { id: 'ghost', name: 'Ghost', icon: Ghost, color: '#15171a' },
    { id: 'googlediscover', name: 'Google Discover', icon: Globe, color: '#EA4335' },
    { id: 'googlenews', name: 'Google News', icon: Newspaper, color: '#4285F4' }
];

const AutoTrafficModule: React.FC = () => {
    const [view, setView] = useState<'dashboard' | 'wizard' | 'connect' | 'reports' | 'detail'>('dashboard');
    const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
    const [campaigns, setCampaigns] = useState<TrafficCampaign[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<TrafficCampaign | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // --- Mock Data Initialization ---
    useEffect(() => {
        // Load from local storage or seed
        const savedAccounts = localStorage.getItem('autotraffic_accounts');
        if (savedAccounts) {
            setAccounts(JSON.parse(savedAccounts));
        }

        const savedCampaigns = localStorage.getItem('autotraffic_campaigns');
        if (savedCampaigns) {
            setCampaigns(JSON.parse(savedCampaigns));
        } else {
            // Seed dummy campaigns for Reports Demo
            const seed: TrafficCampaign[] = [
                {
                    id: 'camp_demo_1',
                    videoId: 'https://youtube.com/demo1',
                    videoTitle: '10 Ways AI Changes Web Dev',
                    videoUrl: 'https://youtube.com/watch?v=demo1',
                    thumbnailUrl: 'https://picsum.photos/id/1/200/112',
                    status: 'active',
                    createdAt: new Date(Date.now() - 86400000 * 2),
                    totalClicks: 1245,
                    jobs: [
                        { id: 'j1', campaignId: 'camp_demo_1', platform: 'twitter', status: 'published', scheduledTime: new Date(), content: { platform: 'twitter', text: 'Check this out!', link: 'https://twitter.com/intent/tweet?text=Check+this+out!&url=https%3A%2F%2Fyoutube.com%2Fwatch%3Fv%3Ddemo1' }, analytics: { impressions: 4500, clicks: 320, engagements: 150 } },
                        { id: 'j2', campaignId: 'camp_demo_1', platform: 'linkedin', status: 'published', scheduledTime: new Date(), content: { platform: 'linkedin', text: 'Great for pros', link: 'https://www.linkedin.com/feed/?shareActive=true&shareUrl=https%3A%2F%2Fyoutube.com%2Fwatch%3Fv%3Ddemo1' }, analytics: { impressions: 1200, clicks: 450, engagements: 80 } },
                        { id: 'j3', campaignId: 'camp_demo_1', platform: 'reddit', status: 'published', scheduledTime: new Date(), content: { platform: 'reddit', text: 'Thoughts?', link: 'https://www.reddit.com/submit?url=https%3A%2F%2Fyoutube.com%2Fwatch%3Fv%3Ddemo1&title=Thoughts%3F' }, analytics: { impressions: 8000, clicks: 150, engagements: 300 } }
                    ]
                },
                {
                    id: 'camp_demo_2',
                    videoId: 'https://youtube.com/demo2',
                    videoTitle: 'How to Bake Sourdough',
                    videoUrl: 'https://youtube.com/watch?v=demo2',
                    thumbnailUrl: 'https://picsum.photos/id/2/200/112',
                    status: 'completed',
                    createdAt: new Date(Date.now() - 86400000 * 5),
                    totalClicks: 3420,
                    jobs: []
                }
            ];
            setCampaigns(seed);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('autotraffic_accounts', JSON.stringify(accounts));
    }, [accounts]);

    useEffect(() => {
        localStorage.setItem('autotraffic_campaigns', JSON.stringify(campaigns));
    }, [campaigns]);

    // --- Actions ---
    const handleConnect = (platform: SocialPlatform) => {
        setIsLoading(true);
        setTimeout(() => {
            const newAccount: ConnectedAccount = {
                id: Date.now().toString(),
                platform,
                name: `${platform} User`,
                status: 'connected',
                connectedAt: new Date()
            };
            setAccounts(prev => {
                const existing = prev.find(a => a.platform === platform);
                if(existing) return prev.filter(a => a.platform !== platform);
                return [...prev, newAccount];
            });
            setIsLoading(false);
        }, 1000);
    };

    const handleCreateCampaign = (newCampaign: TrafficCampaign) => {
        setCampaigns([newCampaign, ...campaigns]);
        setView('dashboard');
    };

    const handleQuickSetup = () => {
        setIsLoading(true);
        setTimeout(() => {
             const popularPlatforms: SocialPlatform[] = ['twitter', 'linkedin', 'reddit', 'pinterest', 'hackernews', 'producthunt', 'medium'];
             setAccounts(popularPlatforms.map((p, i) => ({
                 id: `acc_${i}`,
                 platform: p,
                 name: `My ${p}`,
                 status: 'connected',
                 connectedAt: new Date()
             })));
             setIsLoading(false);
        }, 1500);
    };

    const viewCampaignDetail = (campaign: TrafficCampaign) => {
        setSelectedCampaign(campaign);
        setView('detail');
    };

    // --- Sub-Views ---

    const DashboardView = () => (
        <div className="animate-fade-in">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-dark-800 border border-gray-800 p-6 rounded-2xl">
                     <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-brand-900/30 rounded-lg text-brand-500"><MousePointer2 size={20} /></div>
                        <span className="text-theme-muted text-sm">Total Traffic Clicks</span>
                     </div>
                     <p className="text-3xl font-bold text-white">
                        {campaigns.reduce((acc, c) => acc + (c.totalClicks || 0), 0).toLocaleString()}
                     </p>
                     <p className="text-xs text-green-500 mt-1">+12% this week</p>
                </div>
                <div className="bg-dark-800 border border-gray-800 p-6 rounded-2xl">
                     <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-900/30 rounded-lg text-purple-500"><Share2 size={20} /></div>
                        <span className="text-theme-muted text-sm">Active Campaigns</span>
                     </div>
                     <p className="text-3xl font-bold text-white">{campaigns.filter(c => c.status === 'active').length}</p>
                     <p className="text-xs text-purple-400 mt-1">Auto-posting running</p>
                </div>
                 <div className="bg-dark-800 border border-gray-800 p-6 rounded-2xl">
                     <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-900/30 rounded-lg text-blue-500"><Link size={20} /></div>
                        <span className="text-theme-muted text-sm">Backlinks Created</span>
                     </div>
                     <p className="text-3xl font-bold text-white">{(campaigns.length * 12) + 85}</p>
                     <p className="text-xs text-blue-400 mt-1">SEO Tier 1 Links</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-dark-800 border border-gray-800 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-theme-base">Recent Campaigns</h3>
                        <button 
                            onClick={() => setView('wizard')}
                            className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                        >
                            <PlusCircle size={16} /> New Traffic Campaign
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        {campaigns.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                <Share2 size={48} className="mx-auto mb-3 opacity-20" />
                                <p>No active campaigns. Start promoting your videos!</p>
                            </div>
                        ) : (
                            campaigns.slice(0, 5).map(campaign => (
                                <div 
                                    key={campaign.id} 
                                    onClick={() => viewCampaignDetail(campaign)}
                                    className="flex items-center gap-4 p-4 bg-dark-900/50 rounded-xl border border-gray-800 hover:border-brand-500/30 hover:bg-dark-900 transition-all cursor-pointer"
                                >
                                    <img src={campaign.thumbnailUrl || "https://picsum.photos/200/112"} className="w-24 h-14 object-cover rounded-lg shadow-sm" alt="thumb" />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-theme-base line-clamp-1">{campaign.videoTitle}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${campaign.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                                                {campaign.status}
                                            </span>
                                            <span className="text-xs text-gray-500">{campaign.jobs.length} Platforms</span>
                                            <span className="text-xs text-gray-500">• {new Date(campaign.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="text-right hidden md:block">
                                        <p className="text-lg font-bold text-white">{campaign.totalClicks || 0}</p>
                                        <p className="text-[10px] text-gray-500">CLICKS</p>
                                    </div>
                                    <ArrowRight size={16} className="text-gray-600" />
                                </div>
                            ))
                        )}
                    </div>
                    
                    {campaigns.length > 0 && (
                        <button onClick={() => setView('reports')} className="w-full mt-4 text-sm text-theme-muted hover:text-white transition-colors">
                            View All Campaigns
                        </button>
                    )}
                </div>

                {/* Accounts Status */}
                <div className="bg-dark-800 border border-gray-800 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-theme-base">Integrations</h3>
                        <button onClick={() => setView('connect')} className="text-brand-400 text-xs hover:underline">Manage</button>
                    </div>
                    
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {PLATFORMS.map(p => {
                            const isConnected = accounts.some(a => a.platform === p.id);
                            return (
                                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-dark-900/50">
                                    <div className="flex items-center gap-3">
                                        <p.icon size={18} style={{ color: p.color }} />
                                        <span className="text-sm font-medium text-gray-300">{p.name}</span>
                                    </div>
                                    {isConnected ? (
                                        <CheckCircle2 size={16} className="text-green-500" />
                                    ) : (
                                        <div className="w-3 h-3 rounded-full bg-gray-700"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    
                    {accounts.length === 0 && (
                        <button 
                            onClick={handleQuickSetup}
                            disabled={isLoading}
                            className="w-full mt-6 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                        >
                           {isLoading ? <Loader2 className="animate-spin" size={14}/> : <RefreshCw size={14}/>}
                           One-Click Setup (Demo)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    const ReportsView = () => (
        <div className="animate-fade-in max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <BarChart3 size={24} className="text-brand-500" />
                    Campaign Reports
                </h2>
                <div className="flex gap-3">
                    <div className="relative">
                        <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <select className="bg-dark-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-brand-500 appearance-none">
                            <option>All Statuses</option>
                            <option>Active</option>
                            <option>Completed</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-dark-800 border border-gray-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-dark-900 text-gray-400 text-xs uppercase font-bold">
                        <tr>
                            <th className="p-6">Campaign / Video</th>
                            <th className="p-6">Created</th>
                            <th className="p-6">Platforms</th>
                            <th className="p-6">Traffic</th>
                            <th className="p-6">Status</th>
                            <th className="p-6 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {campaigns.map(campaign => (
                            <tr key={campaign.id} className="hover:bg-dark-900/50 transition-colors group">
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <img src={campaign.thumbnailUrl || "https://picsum.photos/200"} className="w-16 h-10 object-cover rounded" alt="thumb" />
                                        <div>
                                            <h4 className="font-bold text-white line-clamp-1">{campaign.videoTitle}</h4>
                                            <a href={campaign.videoUrl} target="_blank" rel="noreferrer" className="text-xs text-gray-500 hover:text-brand-400 flex items-center gap-1">
                                                <ExternalLink size={10} /> View Video
                                            </a>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6 text-sm text-gray-300">
                                    {new Date(campaign.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-6">
                                    <div className="flex -space-x-2">
                                        {campaign.jobs.slice(0, 4).map((job, i) => {
                                            const p = PLATFORMS.find(pl => pl.id === job.platform);
                                            return (
                                                <div key={i} className="w-6 h-6 rounded-full border border-dark-800 bg-dark-700 flex items-center justify-center text-[10px] text-white" style={{backgroundColor: p?.color}}>
                                                    {p?.name[0]}
                                                </div>
                                            )
                                        })}
                                        {campaign.jobs.length > 4 && (
                                            <div className="w-6 h-6 rounded-full border border-dark-800 bg-dark-600 flex items-center justify-center text-[10px] text-white">
                                                +{campaign.jobs.length - 4}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center gap-2">
                                        <MousePointer2 size={14} className="text-brand-500" />
                                        <span className="font-bold text-white">{campaign.totalClicks?.toLocaleString() || 0}</span>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold ${campaign.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                                        {campaign.status}
                                    </span>
                                </td>
                                <td className="p-6 text-right">
                                    <button 
                                        onClick={() => viewCampaignDetail(campaign)}
                                        className="text-sm text-brand-400 hover:text-brand-300 font-medium"
                                    >
                                        View Report
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {campaigns.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-12 text-center text-gray-500">
                                    No campaigns found. Create one to see reports.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const CampaignDetailView = () => {
        if (!selectedCampaign) return null;

        // Simulated Chart Data
        const chartData = [
            { name: 'Mon', clicks: 400 },
            { name: 'Tue', clicks: 300 },
            { name: 'Wed', clicks: 600 },
            { name: 'Thu', clicks: 800 },
            { name: 'Fri', clicks: 500 },
            { name: 'Sat', clicks: 900 },
            { name: 'Sun', clicks: 1200 },
        ];

        return (
            <div className="animate-fade-in max-w-6xl mx-auto pb-10">
                {/* Header */}
                <div className="mb-8">
                    <button onClick={() => setView('reports')} className="text-gray-400 hover:text-white text-sm flex items-center gap-2 mb-4 transition-colors">
                        <ArrowLeft size={16} /> Back to Reports
                    </button>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex gap-6">
                            <img src={selectedCampaign.thumbnailUrl || "https://picsum.photos/200"} className="w-32 h-20 object-cover rounded-lg shadow-lg" alt="thumb" />
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-2">{selectedCampaign.videoTitle}</h1>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                    <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(selectedCampaign.createdAt).toLocaleDateString()}</span>
                                    <span className={`px-2 py-0.5 rounded-full uppercase text-[10px] font-bold ${selectedCampaign.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                                        {selectedCampaign.status}
                                    </span>
                                    <a href={selectedCampaign.videoUrl} target="_blank" rel="noreferrer" className="text-brand-400 hover:underline flex items-center gap-1">
                                        View Video <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="bg-dark-800 hover:bg-dark-700 border border-gray-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                                <RefreshCw size={16} /> Sync Stats
                            </button>
                            <button className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-bold">
                                Edit Campaign
                            </button>
                        </div>
                    </div>
                </div>

                {/* Top Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                     <div className="bg-dark-800 border border-gray-800 p-6 rounded-2xl">
                        <p className="text-theme-muted text-xs uppercase font-bold mb-2">Total Traffic</p>
                        <p className="text-3xl font-bold text-white flex items-baseline gap-2">
                            {selectedCampaign.totalClicks?.toLocaleString() || 0}
                            <span className="text-sm text-green-500 font-medium">+24%</span>
                        </p>
                     </div>
                     <div className="bg-dark-800 border border-gray-800 p-6 rounded-2xl">
                        <p className="text-theme-muted text-xs uppercase font-bold mb-2">Total Impressions</p>
                        <p className="text-3xl font-bold text-white flex items-baseline gap-2">
                            {(selectedCampaign.jobs.reduce((acc, j) => acc + (j.analytics?.impressions || 0), 0)).toLocaleString()}
                        </p>
                     </div>
                     <div className="bg-dark-800 border border-gray-800 p-6 rounded-2xl">
                        <p className="text-theme-muted text-xs uppercase font-bold mb-2">Engagement</p>
                        <p className="text-3xl font-bold text-white flex items-baseline gap-2">
                             {(selectedCampaign.jobs.reduce((acc, j) => acc + (j.analytics?.engagements || 0), 0)).toLocaleString()}
                        </p>
                     </div>
                     <div className="bg-dark-800 border border-gray-800 p-6 rounded-2xl">
                        <p className="text-theme-muted text-xs uppercase font-bold mb-2">Success Rate</p>
                        <div className="flex items-center gap-3">
                             <p className="text-3xl font-bold text-white">100%</p>
                             <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                 <div className="h-full bg-green-500 w-full"></div>
                             </div>
                        </div>
                     </div>
                </div>

                {/* Chart & Platforms */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Chart Area */}
                    <div className="lg:col-span-2 bg-dark-800 border border-gray-800 rounded-2xl p-6 min-w-0">
                        <h3 className="text-lg font-bold text-white mb-6">Traffic Performance</h3>
                        <div style={{ width: '100%', height: 300 }}>
                             <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={chartData}>
                                    <defs>
                                      <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis dataKey="name" stroke="#9ca3af" axisLine={false} tickLine={false} />
                                    <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#374151', color: '#fff' }}
                                        itemStyle={{ color: '#14b8a6' }}
                                    />
                                    <Area type="monotone" dataKey="clicks" stroke="#14b8a6" fillOpacity={1} fill="url(#colorClicks)" />
                                  </AreaChart>
                             </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Platforms List */}
                    <div className="bg-dark-800 border border-gray-800 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-6">Platform Distribution</h3>
                        <div className="space-y-4">
                             {selectedCampaign.jobs.slice(0, 5).map((job, i) => {
                                 const platform = PLATFORMS.find(p => p.id === job.platform);
                                 const clicks = job.analytics?.clicks || 0;
                                 const total = selectedCampaign.totalClicks || 1;
                                 const percent = Math.round((clicks / total) * 100);
                                 
                                 return (
                                     <div key={i}>
                                         <div className="flex justify-between text-sm mb-1">
                                             <span className="flex items-center gap-2 text-gray-300">
                                                 {platform && <platform.icon size={14} style={{color: platform.color}} />}
                                                 {platform?.name}
                                             </span>
                                             <span className="font-bold text-white">{clicks} clicks</span>
                                         </div>
                                         <div className="w-full bg-dark-900 rounded-full h-2">
                                             <div className="h-2 rounded-full bg-brand-500" style={{width: `${percent}%`}}></div>
                                         </div>
                                     </div>
                                 )
                             })}
                             {selectedCampaign.jobs.length === 0 && <p className="text-gray-500 text-sm">No data yet.</p>}
                        </div>
                    </div>
                </div>

                {/* Detailed Jobs Table */}
                <div className="mt-8 bg-dark-800 border border-gray-800 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-gray-700">
                        <h3 className="text-lg font-bold text-white">Campaign Jobs</h3>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-dark-900 text-gray-400 text-xs uppercase font-bold">
                            <tr>
                                <th className="p-4">Platform</th>
                                <th className="p-4">Content Snippet</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Clicks</th>
                                <th className="p-4">Impressions</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {selectedCampaign.jobs.map((job) => {
                                const platform = PLATFORMS.find(p => p.id === job.platform);
                                const linkUrl = job.content.link || selectedCampaign.videoUrl || '#';
                                return (
                                    <tr key={job.id} className="hover:bg-dark-900/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded bg-dark-700 border border-gray-600">
                                                    {platform && <platform.icon size={16} style={{color: platform.color}} />}
                                                </div>
                                                <span className="font-medium text-gray-300">{platform?.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="max-w-xs text-sm text-gray-400 truncate" title={job.content.text || job.content.subject}>
                                                {job.content.subject ? <span className="font-bold block text-gray-300">{job.content.subject}</span> : null}
                                                {job.content.text}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${
                                                job.status === 'published' ? 'bg-green-900/30 text-green-400' :
                                                job.status === 'failed' ? 'bg-red-900/30 text-red-400' :
                                                'bg-yellow-900/30 text-yellow-400'
                                            }`}>
                                                {job.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-white font-medium">{job.analytics?.clicks || 0}</td>
                                        <td className="p-4 text-gray-400">{job.analytics?.impressions || 0}</td>
                                        <td className="p-4 text-right">
                                            <a 
                                                href={linkUrl} 
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                                title="Publish or View Post"
                                            >
                                                Open / Post <ExternalLink size={12} />
                                            </a>
                                        </td>
                                    </tr>
                                );
                            })}
                            {selectedCampaign.jobs.length === 0 && (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No jobs found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        );
    };

    const ConnectView = () => (
        <div className="animate-fade-in max-w-6xl mx-auto">
            <div className="mb-8 flex items-center gap-4">
                <button onClick={() => setView('dashboard')} className="text-gray-500 hover:text-white">Back</button>
                <h2 className="text-2xl font-bold text-white">Connect Social Accounts</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {PLATFORMS.map(p => {
                    const isConnected = accounts.some(a => a.platform === p.id);
                    return (
                        <div key={p.id} className={`p-6 rounded-xl border transition-all ${isConnected ? 'bg-green-900/10 border-green-500/30' : 'bg-dark-800 border-gray-700'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 rounded-xl bg-dark-950 border border-gray-800">
                                    <p.icon size={24} style={{ color: p.color }} />
                                </div>
                                {isConnected && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded font-bold">ACTIVE</span>}
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">{p.name}</h3>
                            <p className="text-xs text-gray-500 mb-6 min-h-[32px]">
                                {isConnected ? 'Ready to publish' : 'Connect to auto-post.'}
                            </p>
                            
                            <button 
                                onClick={() => handleConnect(p.id)}
                                disabled={isLoading}
                                className={`w-full py-2 rounded-lg font-bold text-sm transition-colors ${
                                    isConnected 
                                    ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' 
                                    : 'bg-brand-600 text-white hover:bg-brand-500'
                                }`}
                            >
                                {isConnected ? 'Disconnect' : 'Connect'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="min-h-full p-8 bg-dark-950">
            {/* Sub Navigation */}
            {view !== 'wizard' && (
                <div className="flex justify-center mb-8">
                    <div className="bg-dark-800 border border-gray-800 p-1 rounded-xl flex gap-1">
                         <button 
                            onClick={() => setView('dashboard')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-dark-950 text-white shadow' : 'text-gray-400 hover:text-gray-300'}`}
                        >
                            Dashboard
                        </button>
                         <button 
                            onClick={() => setView('reports')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'reports' || view === 'detail' ? 'bg-dark-950 text-white shadow' : 'text-gray-400 hover:text-gray-300'}`}
                        >
                            Campaigns & Reports
                        </button>
                         <button 
                            onClick={() => setView('connect')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'connect' ? 'bg-dark-950 text-white shadow' : 'text-gray-400 hover:text-gray-300'}`}
                        >
                            Integrations
                        </button>
                    </div>
                </div>
            )}

            {view === 'dashboard' && <DashboardView />}
            {view === 'reports' && <ReportsView />}
            {view === 'detail' && <CampaignDetailView />}
            {view === 'connect' && <ConnectView />}
            {view === 'wizard' && (
                <TrafficCampaignWizard 
                    connectedAccounts={accounts}
                    onComplete={handleCreateCampaign}
                    onCancel={() => setView('dashboard')}
                />
            )}
        </div>
    );
};

export default AutoTrafficModule;
