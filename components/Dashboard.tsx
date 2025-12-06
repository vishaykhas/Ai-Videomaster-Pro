
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, Video, DollarSign, Clapperboard, Map, Megaphone, Image, Share2, Wand2, ArrowRight, Sparkles, Copy, Feather } from 'lucide-react';
import { AppView } from '../types';

interface DashboardProps {
    onViewChange?: (view: AppView) => void;
}

const data7Days = [
  { name: 'Mon', views: 4000, subs: 240 },
  { name: 'Tue', views: 3000, subs: 139 },
  { name: 'Wed', views: 2000, subs: 980 },
  { name: 'Thu', views: 2780, subs: 390 },
  { name: 'Fri', views: 1890, subs: 480 },
  { name: 'Sat', views: 2390, subs: 380 },
  { name: 'Sun', views: 3490, subs: 430 },
];

const data30Days = [
  { name: 'Week 1', views: 12000, subs: 850 },
  { name: 'Week 2', views: 19000, subs: 1200 },
  { name: 'Week 3', views: 15000, subs: 1100 },
  { name: 'Week 4', views: 24000, subs: 2100 },
];

const statsData = {
  '7': {
    views: { value: "1.2M", change: "+12.5%" },
    subs: { value: "+5,430", change: "+8.2%" },
    revenue: { value: "$4,250", change: "+22.1%" },
    published: { value: "12", change: "+2" }
  },
  '30': {
    views: { value: "5.8M", change: "+18.2%" },
    subs: { value: "+21,500", change: "+14.5%" },
    revenue: { value: "$19,800", change: "+35.4%" },
    published: { value: "48", change: "+15" }
  }
};

const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
  <div className="bg-dark-800 border border-gray-800 p-6 rounded-2xl transition-colors duration-300">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <span className="text-green-500 text-sm font-medium flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-full">
        <TrendingUp size={12} /> {change}
      </span>
    </div>
    <h3 className="text-theme-muted text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-theme-base">{value}</p>
  </div>
);

const ToolCard = ({ title, desc, icon: Icon, colorClass, onClick }: any) => (
    <button 
        onClick={onClick}
        className="text-left bg-dark-800 border border-gray-800 hover:border-brand-500/50 hover:bg-dark-900 p-6 rounded-2xl transition-all group flex flex-col h-full min-w-0"
    >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorClass}`}>
            <Icon size={24} className="text-white" />
        </div>
        <h3 className="text-lg font-bold text-theme-base mb-2 group-hover:text-brand-400 transition-colors">{title}</h3>
        <p className="text-sm text-theme-muted mb-4 flex-1">{desc}</p>
        <div className="flex items-center text-xs font-bold text-theme-muted uppercase tracking-wider group-hover:text-brand-400 group-hover:gap-2 transition-all">
            Launch Tool <ArrowRight size={14} className="ml-1" />
        </div>
    </button>
);

const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const [timeRange, setTimeRange] = useState<'7' | '30'>('7');
  
  const currentStats = statsData[timeRange];
  const chartData = timeRange === '7' ? data7Days : data30Days;

  const navigate = (view: AppView) => {
      if (onViewChange) onViewChange(view);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Studio Hub Quick Access */}
      <div>
          <h2 className="text-2xl font-bold text-theme-base mb-4 flex items-center gap-2">
              <Sparkles size={24} className="text-brand-500" /> Studio Hub
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               <ToolCard 
                    title="AI Video Generator" 
                    desc="Create viral YouTube scripts & videos."
                    icon={Wand2} 
                    colorClass="bg-gradient-to-br from-brand-500 to-teal-600 shadow-lg shadow-brand-500/20"
                    onClick={() => navigate(AppView.CREATE_WIZARD)}
               />
               <ToolCard 
                    title="ASMR Engine" 
                    desc="Generate sensory, whisper-style 4K content."
                    icon={Feather} 
                    colorClass="bg-gradient-to-br from-teal-400 to-emerald-500 shadow-lg shadow-teal-500/20"
                    onClick={() => navigate(AppView.ASMR_GENERATOR)}
               />
               <ToolCard 
                    title="Video Cloner" 
                    desc="Replicate viral style with 100% copyright safety."
                    icon={Copy} 
                    colorClass="bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/20"
                    onClick={() => navigate(AppView.VIDEO_CLONER)}
               />
               <ToolCard 
                    title="CineAI Movie Studio" 
                    desc="Produce full 3-hour cinematic movies."
                    icon={Clapperboard} 
                    colorClass="bg-gradient-to-br from-red-600 to-orange-600 shadow-lg shadow-red-600/20"
                    onClick={() => navigate(AppView.MOVIE_STUDIO)}
               />
               <ToolCard 
                    title="Walkthrough Engine" 
                    desc="Generate 4K real estate & architectural tours."
                    icon={Map} 
                    colorClass="bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/20"
                    onClick={() => navigate(AppView.WALKTHROUGH_MAKER)}
               />
               <ToolCard 
                    title="Video Ads Maker" 
                    desc="Create high-conversion commercials."
                    icon={Megaphone} 
                    colorClass="bg-gradient-to-br from-fuchsia-600 to-pink-600 shadow-lg shadow-fuchsia-600/20"
                    onClick={() => navigate(AppView.VIDEO_ADS_MAKER)}
               />
               <ToolCard 
                    title="Thumbnail Studio" 
                    desc="Design click-worthy thumbnails."
                    icon={Image} 
                    colorClass="bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg shadow-violet-600/20"
                    onClick={() => navigate(AppView.THUMBNAIL_MAKER)}
               />
               <ToolCard 
                    title="Auto Traffic" 
                    desc="Publish content to 30+ platforms."
                    icon={Share2} 
                    colorClass="bg-gradient-to-br from-green-600 to-emerald-600 shadow-lg shadow-green-600/20"
                    onClick={() => navigate(AppView.AUTO_TRAFFIC)}
               />
          </div>
      </div>

      <div className="border-t border-gray-800 pt-8">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-theme-base">Analytics Overview</h2>
            <div className="flex gap-3">
                <select 
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as '7' | '30')}
                    className="bg-dark-800 border border-gray-700 text-theme-base rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-500 transition-colors duration-300"
                >
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                </select>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Views" value={currentStats.views.value} change={currentStats.views.change} icon={Video} color="bg-blue-600" />
            <StatCard title="Subscribers Gained" value={currentStats.subs.value} change={currentStats.subs.change} icon={Users} color="bg-purple-600" />
            <StatCard title="Revenue (Est.)" value={currentStats.revenue.value} change={currentStats.revenue.change} icon={DollarSign} color="bg-green-600" />
            <StatCard title="Videos Published" value={currentStats.published.value} change={currentStats.published.change} icon={Video} color="bg-brand-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-dark-800 border border-gray-800 p-6 rounded-2xl transition-colors duration-300 min-w-0">
                <h3 className="text-lg font-semibold text-theme-base mb-6">Channel Growth</h3>
                <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                        </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-sub)" axisLine={false} tickLine={false} />
                        <YAxis stroke="var(--text-sub)" axisLine={false} tickLine={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                            itemStyle={{ color: '#14b8a6' }}
                        />
                        <Area type="monotone" dataKey="views" stroke="#14b8a6" fillOpacity={1} fill="url(#colorViews)" />
                    </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-dark-800 border border-gray-800 p-6 rounded-2xl transition-colors duration-300 min-w-0">
                <h3 className="text-lg font-semibold text-theme-base mb-6">Audience Retention</h3>
                <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-sub)" axisLine={false} tickLine={false} />
                        <YAxis stroke="var(--text-sub)" axisLine={false} tickLine={false} />
                        <Tooltip 
                            cursor={{fill: 'var(--bg-hover)', opacity: 0.5}}
                            contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                        />
                        <Bar dataKey="subs" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
