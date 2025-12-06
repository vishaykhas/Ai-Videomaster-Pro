
import React, { useState } from 'react';
import { Youtube, Search, Sparkles, Calendar, Check, ArrowRight, Loader2, AlertCircle, Copy, Edit2, Clock, ArrowLeft } from 'lucide-react';
import { ConnectedAccount, TrafficCampaign, PlatformJob, SocialPlatform } from '../types';
import { generateSocialCampaign } from '../services/geminiService';

interface Props {
    connectedAccounts: ConnectedAccount[];
    onComplete: (campaign: TrafficCampaign) => void;
    onCancel: () => void;
}

const TrafficCampaignWizard: React.FC<Props> = ({ connectedAccounts, onComplete, onCancel }) => {
    const [step, setStep] = useState(1);
    const [videoUrl, setVideoUrl] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [videoData, setVideoData] = useState<{title: string; desc: string; thumb: string} | null>(null);
    
    const [generatedContent, setGeneratedContent] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([
        'twitter', 'linkedin', 'facebook', 'hackernews', 'producthunt', 'indiehackers'
    ]);

    const [jobs, setJobs] = useState<PlatformJob[]>([]);

    // STEP 1: Fetch Video
    const handleFetchVideo = () => {
        if (!videoUrl) return;
        setIsFetching(true);
        // Simulate Fetch
        setTimeout(() => {
            setVideoData({
                title: "How to Build a SaaS in 7 Days (No Code)",
                desc: "In this video I show you the exact stack I used to build a profitable SaaS product using Bubble, Gemini AI, and Stripe. Watch to learn the blueprint.",
                thumb: "https://picsum.photos/seed/saas/800/450"
            });
            setIsFetching(false);
            setStep(2);
        }, 1500);
    };

    // STEP 2: Generate Content
    const handleGenerate = async () => {
        if (!videoData) return;
        setIsGenerating(true);
        try {
            const result = await generateSocialCampaign(videoData.title, videoData.desc);
            setGeneratedContent(result);
            
            // Map generated content to jobs
            const newJobs: PlatformJob[] = [];
            const now = new Date();
            const targetUrl = videoUrl || 'https://youtube.com';
            
            // Helper: Generate Smart Intent Links for "One-Click Publishing"
            const generateIntentLink = (platform: SocialPlatform, text: string, subject?: string, hashtags?: string[]) => {
                const encodedText = encodeURIComponent(text || '');
                const encodedUrl = encodeURIComponent(targetUrl);
                const encodedSubject = encodeURIComponent(subject || '');
                const tags = hashtags ? encodeURIComponent(hashtags.join(',')) : '';

                switch (platform) {
                    case 'twitter':
                        return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}&hashtags=${tags}`;
                    case 'linkedin':
                        return `https://www.linkedin.com/feed/?shareActive=true&shareUrl=${encodedUrl}`; 
                    case 'facebook':
                        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
                    case 'reddit':
                        return `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedSubject || encodedText}`;
                    case 'pinterest':
                        return `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`;
                    case 'tumblr':
                        return `https://www.tumblr.com/widgets/share/tool?canonicalUrl=${encodedUrl}&title=${encodedSubject}&caption=${encodedText}`;
                    case 'email':
                        return `mailto:?subject=${encodedSubject}&body=${encodedText}%0A%0A${encodedUrl}`;
                    case 'hackernews':
                        return `https://news.ycombinator.com/submitlink?u=${encodedUrl}&t=${encodedSubject}`;
                    case 'whatsapp': 
                        return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
                    case 'telegram':
                        return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
                    case 'vk':
                        return `https://vk.com/share.php?url=${encodedUrl}&title=${encodedSubject}`;
                    default:
                        if (platform === 'medium') return `https://medium.com/new-story`;
                        if (platform === 'wordpress') return `https://wordpress.com/post`;
                        return targetUrl;
                }
            };

            // Helper to create job
            const createJob = (platform: SocialPlatform, content: any, delayMs: number = 0) => {
                const intentLink = generateIntentLink(platform, content.text || content.body || content.description, content.subject || content.title, content.hashtags || content.tags);
                
                newJobs.push({
                    id: `job_${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    campaignId: 'temp',
                    platform: platform,
                    status: 'scheduled', 
                    scheduledTime: new Date(now.getTime() + delayMs),
                    content: { platform, ...content, link: intentLink }
                });
            };

            // Process Standard Arrays safely with checks
            if (result.twitter && Array.isArray(result.twitter) && selectedPlatforms.includes('twitter')) {
                result.twitter.forEach((t: any, i: number) => createJob('twitter', t, i * 3600000));
            }
            if (result.linkedin && Array.isArray(result.linkedin) && selectedPlatforms.includes('linkedin')) {
                result.linkedin.forEach((t: any, i: number) => createJob('linkedin', t, 60000));
            }
            
            // Process Single Object Platforms
            if (result.reddit && selectedPlatforms.includes('reddit')) createJob('reddit', { subject: result.reddit.title, text: result.reddit.body }, 7200000);
            if (result.email && selectedPlatforms.includes('email')) createJob('email', { subject: result.email.subject, text: result.email.body }, 86400000);
            if (result.blog && (selectedPlatforms.includes('wordpress') || selectedPlatforms.includes('medium'))) {
                if(selectedPlatforms.includes('wordpress')) createJob('wordpress', { subject: result.blog.title, text: result.blog.summary });
                if(selectedPlatforms.includes('medium')) createJob('medium', { subject: result.blog.title, text: result.blog.summary });
            }

            // New Platforms Processing
            if (result.tumblr && selectedPlatforms.includes('tumblr')) createJob('tumblr', { subject: result.tumblr.title, text: result.tumblr.body, hashtags: result.tumblr.tags });
            if (result.pinterest && selectedPlatforms.includes('pinterest')) createJob('pinterest', { subject: result.pinterest.title, text: result.pinterest.description });
            if (result.quora && selectedPlatforms.includes('quora')) createJob('quora', { subject: result.quora.question, text: result.quora.answer_preview });
            if (result.mix && selectedPlatforms.includes('mix')) createJob('mix', { subject: result.mix.title, text: result.mix.description });
            if (result.flipboard && selectedPlatforms.includes('flipboard')) createJob('flipboard', { subject: result.flipboard.title, text: result.flipboard.caption });
            if (result.vk && selectedPlatforms.includes('vk')) createJob('vk', { text: result.vk.text, hashtags: result.vk.hashtags });
            if (result.mastodon && selectedPlatforms.includes('mastodon')) createJob('mastodon', { text: result.mastodon.text, hashtags: result.mastodon.hashtags });
            if (result.discord && selectedPlatforms.includes('discord')) createJob('discord', { text: result.discord.message });
            if (result.telegram && selectedPlatforms.includes('telegram')) createJob('telegram', { text: result.telegram.message });
            if (result.facebook && selectedPlatforms.includes('facebook')) createJob('facebook', { text: result.facebook.text, hashtags: result.facebook.hashtags });
            if (result.instagram && selectedPlatforms.includes('instagram')) createJob('instagram', { text: result.instagram.caption, hashtags: result.instagram.hashtags });
            
            // Newsletters
            if (result.substack && selectedPlatforms.includes('substack')) createJob('substack', { subject: result.substack.title, text: `${result.substack.subtitle}\n\n${result.substack.body}` });
            if (result.revue && selectedPlatforms.includes('revue')) createJob('revue', { subject: result.revue.subject, text: result.revue.description });

            // Blog Embeds
            if (result.blogger && selectedPlatforms.includes('blogger')) createJob('blogger', { subject: result.blogger.title, text: result.blogger.htmlBody });
            if (result.ghost && selectedPlatforms.includes('ghost')) createJob('ghost', { subject: result.ghost.title, text: result.ghost.markdownBody });

            // Viral Traffic Sites
            if (result.hackernews && selectedPlatforms.includes('hackernews')) createJob('hackernews', { subject: result.hackernews.title, text: result.hackernews.text });
            if (result.producthunt && selectedPlatforms.includes('producthunt')) createJob('producthunt', { subject: result.producthunt.tagline, text: result.producthunt.description });
            if (result.indiehackers && selectedPlatforms.includes('indiehackers')) createJob('indiehackers', { subject: result.indiehackers.title, text: result.indiehackers.text });
            
            // Bookmarking & Sharing
            if (result.scoopit && selectedPlatforms.includes('scoopit')) createJob('scoopit', { subject: result.scoopit.title, text: result.scoopit.description, hashtags: result.scoopit.tags });
            if (result.triberr && selectedPlatforms.includes('triberr')) createJob('triberr', { subject: result.triberr.title, text: result.triberr.body });
            if (result.ello && selectedPlatforms.includes('ello')) createJob('ello', { subject: result.ello.title, text: result.ello.body });
            if (result.folkd && selectedPlatforms.includes('folkd')) createJob('folkd', { subject: result.folkd.title, text: result.folkd.description, hashtags: result.folkd.tags });
            if (result.pearltrees && selectedPlatforms.includes('pearltrees')) createJob('pearltrees', { subject: result.pearltrees.title, text: result.pearltrees.note });
            if (result.diigo && selectedPlatforms.includes('diigo')) createJob('diigo', { subject: result.diigo.title, text: result.diigo.description, hashtags: result.diigo.tags });

            setJobs(newJobs);
            setStep(3);
        } catch (e) {
            console.error(e);
            alert("Failed to generate content. Please check API key or try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    // STEP 3: Review & Schedule
    const handleSchedule = () => {
        if (!videoData) return;
        
        const campaign: TrafficCampaign = {
            id: `camp_${Date.now()}`,
            videoId: videoUrl,
            videoTitle: videoData.title,
            videoUrl: videoUrl,
            thumbnailUrl: videoData.thumb,
            status: 'active',
            createdAt: new Date(),
            jobs: jobs.map(j => ({ ...j, status: 'scheduled' }))
        };
        onComplete(campaign);
    };

    const availablePlatforms: SocialPlatform[] = [
        'twitter', 'linkedin', 'facebook', 'instagram', 'reddit', 'pinterest', 
        'hackernews', 'producthunt', 'indiehackers',
        'tumblr', 'medium', 'quora', 'flipboard', 'mix', 'vk', 
        'mastodon', 'discord', 'telegram', 'email', 'wordpress',
        'substack', 'revue', 'blogger', 'ghost',
        'scoopit', 'triberr', 'ello', 'folkd', 'pearltrees', 'diigo'
    ];

    return (
        <div className="max-w-5xl mx-auto animate-fade-in">
            {/* Progress */}
            <div className="flex items-center justify-between mb-8 px-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`flex items-center gap-2 ${step >= i ? 'text-brand-500' : 'text-gray-600'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border ${step >= i ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-700'}`}>
                            {i}
                        </div>
                        <span className="font-medium hidden md:block">
                            {i === 1 ? 'Source Video' : i === 2 ? 'Generate AI Content' : 'Review & Schedule'}
                        </span>
                    </div>
                ))}
            </div>

            <div className="bg-dark-800 border border-gray-800 rounded-2xl p-8 shadow-xl">
                
                {/* STEP 1 */}
                {step === 1 && (
                    <div>
                         <h2 className="text-2xl font-bold text-white mb-4">Select YouTube Video</h2>
                         <p className="text-gray-400 mb-6">Paste the URL of the video you want to promote.</p>
                         
                         <div className="relative mb-6">
                             <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" />
                             <input 
                                type="text" 
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                className="w-full bg-dark-900 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white focus:border-brand-500 outline-none"
                                placeholder="https://www.youtube.com/watch?v=..."
                             />
                         </div>
                         
                         <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-lg p-4 mb-8 flex gap-3">
                             <input type="checkbox" className="mt-1 w-4 h-4" id="consent" />
                             <label htmlFor="consent" className="text-sm text-yellow-200 cursor-pointer">
                                I confirm I own rights to this video or have permission to distribute it.
                             </label>
                         </div>

                         <div className="flex justify-between">
                             <button onClick={onCancel} className="text-gray-500">Cancel</button>
                             <button 
                                onClick={handleFetchVideo}
                                disabled={!videoUrl || isFetching}
                                className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
                             >
                                 {isFetching ? <Loader2 className="animate-spin" /> : <Search size={18} />}
                                 {isFetching ? 'Analyzing Video...' : 'Fetch Video Data'}
                             </button>
                         </div>
                    </div>
                )}

                {/* STEP 2 */}
                {step === 2 && videoData && (
                    <div>
                        <div className="flex gap-6 mb-8">
                            <img src={videoData.thumb} className="w-48 rounded-lg border border-gray-700" alt="thumb" />
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">{videoData.title}</h3>
                                <p className="text-sm text-gray-400 line-clamp-3">{videoData.desc}</p>
                            </div>
                        </div>
                        
                        <div className="mb-8">
                            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                                Target Platforms <span className="text-xs font-normal text-gray-500 bg-dark-900 px-2 py-1 rounded">Select all that apply</span>
                            </h4>
                            <div className="flex flex-wrap gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                {availablePlatforms.map(p => (
                                    <button 
                                        key={p}
                                        onClick={() => {
                                            if(selectedPlatforms.includes(p)) setSelectedPlatforms(prev => prev.filter(x => x !== p));
                                            else setSelectedPlatforms(prev => [...prev, p]);
                                        }}
                                        className={`px-4 py-2 rounded-lg border capitalize transition-all text-sm font-medium ${
                                            selectedPlatforms.includes(p) 
                                            ? 'bg-brand-500/20 border-brand-500 text-brand-400 shadow-lg shadow-brand-500/10' 
                                            : 'bg-dark-900 border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-4">
                            <button onClick={() => setStep(1)} className="text-gray-500 hover:text-white flex items-center gap-2 text-sm">
                                <ArrowLeft size={14} /> Back to Video
                            </button>
                            
                            <button 
                                onClick={handleGenerate}
                                disabled={isGenerating || selectedPlatforms.length === 0}
                                className="bg-gradient-to-r from-brand-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-900/20"
                            >
                                {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                                {isGenerating ? 'Generating AI Campaigns...' : 'Generate Traffic Campaign'}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                    <div>
                        <h2 className="text-xl font-bold text-white mb-6">Review & Schedule</h2>
                        
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 mb-8 custom-scrollbar">
                            {jobs.map(job => (
                                <div key={job.id} className="bg-dark-900/50 border border-gray-800 rounded-xl p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="uppercase text-xs font-bold bg-gray-800 px-2 py-1 rounded text-gray-300 border border-gray-700">{job.platform}</span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock size={12} /> {job.scheduledTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <button className="text-gray-500 hover:text-white"><Edit2 size={14} /></button>
                                    </div>
                                    {job.content.subject && (
                                        <p className="font-bold text-white mb-2 text-sm">{job.content.subject}</p>
                                    )}
                                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{job.content.text}</p>
                                    {job.content.hashtags && job.content.hashtags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-3">
                                            {job.content.hashtags.map((tag, i) => (
                                                <span key={i} className="text-xs text-blue-400 bg-blue-900/20 px-1.5 py-0.5 rounded">{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                             <div className="text-sm text-gray-400">
                                 Scheduled <strong>{jobs.length} posts</strong> across {selectedPlatforms.length} platforms.
                             </div>
                             <div className="flex gap-4">
                                <button onClick={() => setStep(2)} className="text-gray-500 hover:text-white transition-colors flex items-center gap-2">
                                    <ArrowLeft size={14} /> Back
                                </button>
                                <button 
                                    onClick={handleSchedule}
                                    className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-900/20 transition-all"
                                >
                                    <Check size={18} /> Confirm & Launch
                                </button>
                             </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default TrafficCampaignWizard;
