
import React, { useState } from 'react';
import { Copy, Wand2, Film, FileText, Loader2, CheckCircle2, AlertCircle, Play, Music, Video, Globe, ArrowLeft } from 'lucide-react';
import { generateClonePlan, generateVideo, requestVeoKey, checkVeoKey, generateVoiceover } from '../services/geminiService';

const VideoCloner: React.FC = () => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Input State
    const [reference, setReference] = useState('');
    const [topic, setTopic] = useState('');
    const [mode, setMode] = useState('Explainer / Educational');

    // Generated Plan
    const [plan, setPlan] = useState<{ script: string, visual_prompt: string, audio_style: string, detected_language?: string } | null>(null);
    
    // Output
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!reference || !topic) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateClonePlan(reference, topic, mode);
            setPlan(result);
            setStep(2);
        } catch (e: any) {
            setError(e.message || "Failed to analyze reference.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRender = async () => {
        if (!plan) return;
        setIsLoading(true);
        setError(null);
        try {
            const hasKey = await checkVeoKey();
            if (!hasKey) await requestVeoKey();

            // Combine Blueprint into Final Veo Prompt
            const finalPrompt = `${plan.visual_prompt}. Style: ${mode}. High quality, 4k.`;
            const url = await generateVideo(finalPrompt, '1080p', '16:9');
            
            if (url) {
                setVideoUrl(url);
                setStep(3);
            } else {
                throw new Error("Video generation returned no URL.");
            }
        } catch (e: any) {
            setError(e.message || "Rendering failed. Check API Key.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 animate-fade-in bg-dark-950 min-h-screen text-white">
            <div className="flex items-center gap-4 mb-8 border-b border-gray-800 pb-6">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg shadow-blue-500/20">
                    <Copy size={32} className="text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">AI Video Cloner</h1>
                    <p className="text-gray-400">Replicate viral styles with 100% original, copyright-safe content.</p>
                </div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-4 mb-8">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`flex items-center gap-2 ${step >= i ? 'text-blue-400' : 'text-gray-600'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${step >= i ? 'bg-blue-500/20 border-blue-500' : 'border-gray-700'}`}>
                            {i}
                        </div>
                        <span className="text-sm font-medium">
                            {i === 1 ? 'Reference' : i === 2 ? 'Blueprint' : 'Production'}
                        </span>
                    </div>
                ))}
            </div>

            {/* STEP 1 */}
            {step === 1 && (
                <div className="bg-dark-900 border border-gray-800 rounded-2xl p-8 shadow-xl space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Reference Video (Style Source)</label>
                        <input 
                            type="text" 
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            className="w-full bg-dark-950 border border-gray-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none"
                            placeholder="Paste YouTube Link or Describe Style (e.g. 'Fast-paced tech review like MKBHD')"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-400 uppercase mb-2">New Video Topic</label>
                        <input 
                            type="text" 
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="w-full bg-dark-950 border border-gray-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none"
                            placeholder="e.g. The History of Coffee"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Clone Mode</label>
                        <select 
                            value={mode}
                            onChange={(e) => setMode(e.target.value)}
                            className="w-full bg-dark-950 border border-gray-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none"
                        >
                            <option>Explainer / Educational</option>
                            <option>Storytelling / Documentary</option>
                            <option>Viral Short / TikTok</option>
                            <option>Cinematic / Trailer</option>
                            <option>News / Report</option>
                        </select>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-400 flex items-center gap-2">
                            <AlertCircle size={20} /> {error}
                        </div>
                    )}

                    <button 
                        onClick={handleAnalyze}
                        disabled={isLoading || !reference || !topic}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
                        {isLoading ? 'Deconstructing Style...' : 'Analyze & Generate Blueprint'}
                    </button>
                </div>
            )}

            {/* STEP 2 */}
            {step === 2 && plan && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-dark-900 border border-gray-800 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileText className="text-blue-500" /> Safe Script
                            </h3>
                            {plan.detected_language && (
                                <span className="text-xs bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20 uppercase font-bold flex items-center gap-2">
                                    <Globe size={12} /> {plan.detected_language}
                                </span>
                            )}
                        </div>
                        <div className="h-[400px] overflow-y-auto bg-dark-950 p-4 rounded-xl border border-gray-800 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap custom-scrollbar">
                            {plan.script}
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="bg-dark-900 border border-gray-800 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Video className="text-purple-500" /> Visual Strategy
                            </h3>
                            <p className="text-gray-400 text-sm">{plan.visual_prompt}</p>
                        </div>
                        
                        <div className="bg-dark-900 border border-gray-800 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Music className="text-green-500" /> Audio Vibe
                            </h3>
                            <p className="text-gray-400 text-sm">{plan.audio_style}</p>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <button 
                            onClick={handleRender}
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <Film />}
                            {isLoading ? 'Rendering Clone (Veo)...' : 'Render Final Video'}
                        </button>
                        
                        <button 
                            onClick={() => setStep(1)}
                            className="w-full text-gray-500 hover:text-white flex items-center justify-center gap-2 py-2"
                        >
                            <ArrowLeft size={16} /> Back to Analysis
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3 */}
            {step === 3 && videoUrl && (
                <div className="text-center max-w-3xl mx-auto">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">Video Cloned Successfully!</h2>
                    
                    <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-gray-800 shadow-2xl mb-8">
                        <video src={videoUrl} controls className="w-full h-full object-contain" />
                    </div>

                    <div className="flex justify-center gap-4">
                        <button 
                            onClick={() => setStep(2)}
                            className="text-gray-500 hover:text-white flex items-center gap-2"
                        >
                            <ArrowLeft size={16} /> Back to Blueprint
                        </button>
                        <span className="text-gray-700">|</span>
                        <button 
                            onClick={() => { setStep(1); setReference(''); setTopic(''); setVideoUrl(null); }}
                            className="text-gray-500 hover:text-white underline"
                        >
                            Clone Another Video
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoCloner;
