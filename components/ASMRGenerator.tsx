
import React, { useState } from 'react';
import { Feather, Mic, Wind, FileText, Video, Play, Loader2, AlertCircle, CheckCircle, Headphones, Sparkles, Monitor, Smartphone, Square, RectangleVertical, ArrowLeft } from 'lucide-react';
import { generateASMRPlan, generateVideo, generateVoiceover, requestVeoKey, checkVeoKey, playAudio } from '../services/geminiService';

const ASMRGenerator: React.FC = () => {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Inputs
    const [topic, setTopic] = useState('');
    const [trigger, setTrigger] = useState('Whispering');
    const [vibe, setVibe] = useState('Sleep Aid');
    const [language, setLanguage] = useState('English');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5'>('16:9');

    // Generated Data
    const [plan, setPlan] = useState<any>(null);
    const [audioBase64, setAudioBase64] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    const handleGeneratePlan = async () => {
        if (!topic) return;
        setIsLoading(true);
        setError(null);
        try {
            const generatedPlan = await generateASMRPlan(topic, trigger, vibe, language);
            setPlan(generatedPlan);
            setStep(2);
        } catch (e: any) {
            setError(e.message || "Failed to generate plan.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateAudio = async () => {
        if (!plan) return;
        setIsLoading(true);
        try {
            // We use a soft voice. Ideally, specialized SVS, but here we use Gemini TTS with instructions.
            // The script already contains markers, we pass it to TTS.
            // 'Leda' or 'Aoede' are generally softer voices in Gemini.
            const audio = await generateVoiceover(plan.asmr_script, 'Leda');
            setAudioBase64(audio);
        } catch (e: any) {
            setError("Audio generation failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRenderVideo = async () => {
        if (!plan) return;
        setIsLoading(true);
        setError(null);
        
        try {
            const hasKey = await checkVeoKey();
            if(!hasKey) await requestVeoKey();

            let apiRatio: '16:9' | '9:16' = '16:9';
            if (aspectRatio === '9:16' || aspectRatio === '4:5' || aspectRatio === '1:1') {
                apiRatio = '9:16';
            }

            // ASMR Specific Prompting for Veo
            const finalPrompt = `Cinematic ASMR Video. 4K, Macro, Slow Motion. ${plan.visual_generation_instructions}. Soft lighting, relaxing atmosphere.`;
            
            const url = await generateVideo(finalPrompt, '1080p', apiRatio);
            
            if (url) {
                setVideoUrl(url);
                setStep(3);
            } else {
                throw new Error("Video generation returned no URL.");
            }
        } catch (e: any) {
             setError(e.message || "Video rendering failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const RatioButton = ({ r, icon: Icon, label }: any) => (
        <button 
            onClick={() => setAspectRatio(r)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all w-full ${
                aspectRatio === r 
                ? 'bg-teal-500/20 border-teal-500 text-teal-400' 
                : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-500'
            }`}
        >
            <Icon size={20} className="mb-2" />
            <span className="text-xs font-bold">{label}</span>
            <span className="text-[10px] opacity-60">{r}</span>
        </button>
    );

    return (
        <div className="max-w-5xl mx-auto p-6 animate-fade-in bg-dark-950 min-h-screen text-white">
            <div className="flex items-center gap-4 mb-8 border-b border-gray-800 pb-6">
                <div className="p-4 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl shadow-lg shadow-teal-500/20">
                    <Feather size={32} className="text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">ASMR Video Engine</h1>
                    <p className="text-gray-400">Generate sensory, whisper-style 4K content tailored for relaxation.</p>
                </div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-4 mb-12 bg-gray-900/50 p-2 rounded-xl w-fit">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${step === i ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'text-gray-600'}`}>
                        <span className="font-bold text-sm">0{i}</span>
                        <span className="text-xs font-medium uppercase tracking-wider">
                            {i === 1 ? 'Concept' : i === 2 ? 'Blueprint' : 'Production'}
                        </span>
                    </div>
                ))}
            </div>

            {/* STEP 1: CONCEPT */}
            {step === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">ASMR Topic / Trigger</label>
                            <textarea 
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="w-full h-32 bg-gray-900 border border-gray-800 rounded-xl p-4 text-white outline-none focus:border-teal-500 transition-all"
                                placeholder="e.g. Forest Rain Ambience with Tapping on Wood..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Primary Trigger</label>
                                <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 outline-none">
                                    {['Whispering', 'Soft Spoken', 'Tapping', 'Scratching', 'Brushing', 'Water Sounds', 'Crinkling', 'Visual Only'].map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Vibe / Purpose</label>
                                <select value={vibe} onChange={(e) => setVibe(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 outline-none">
                                    {['Sleep Aid', 'Anxiety Relief', 'Focus/Study', 'Tingles', 'Comfort', 'Roleplay'].map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Language</label>
                            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 outline-none">
                                {['English', 'Hindi', 'Spanish', 'French', 'Japanese', 'Korean', 'Russian', 'Arabic'].map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Video Ratio</label>
                            <div className="grid grid-cols-4 gap-3">
                                <RatioButton r="16:9" icon={Monitor} label="Wide" />
                                <RatioButton r="9:16" icon={Smartphone} label="Reel" />
                                <RatioButton r="1:1" icon={Square} label="Sq" />
                                <RatioButton r="4:5" icon={RectangleVertical} label="Port" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center items-center text-center space-y-6 bg-gray-900/30 rounded-2xl p-8 border border-gray-800">
                        <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-teal-500/20 animate-pulse">
                            <Headphones size={40} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Sensory Lab</h3>
                        <p className="text-gray-400 max-w-xs">Our AI will design a binaural soundscape and macro-visual plan for your video.</p>
                        <button 
                            onClick={handleGeneratePlan}
                            disabled={isLoading || !topic}
                            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-900/20"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                            Generate ASMR Plan
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 2: BLUEPRINT */}
            {step === 2 && plan && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 h-[500px] overflow-y-auto custom-scrollbar">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FileText className="text-teal-500" size={20} /> Whisper Script
                                </h3>
                                <button onClick={() => setStep(1)} className="text-gray-500 hover:text-white text-sm flex items-center gap-1">
                                    <ArrowLeft size={14} /> Edit
                                </button>
                            </div>
                            <p className="text-gray-300 whitespace-pre-wrap font-serif leading-relaxed text-lg">{plan.asmr_script}</p>
                        </div>
                        
                        {/* Audio Controls */}
                        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Mic size={20} className="text-teal-500" />
                                <span className="text-sm font-bold text-gray-300">Vocal Track</span>
                            </div>
                            {audioBase64 ? (
                                <button onClick={() => playAudio(audioBase64)} className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                                    <Play size={14} fill="currentColor" /> Preview Whisper
                                </button>
                            ) : (
                                <button onClick={handleGenerateAudio} disabled={isLoading} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-bold text-sm">
                                    {isLoading ? <Loader2 className="animate-spin" size={14} /> : 'Synthesize Audio'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Video className="text-purple-500" size={20} /> Visual Strategy
                            </h3>
                            <div className="space-y-4">
                                <div className="bg-black/40 p-4 rounded-xl border border-gray-800">
                                    <span className="text-xs uppercase font-bold text-gray-500 block mb-1">Visual Prompts</span>
                                    <p className="text-sm text-gray-300">{plan.visual_generation_instructions}</p>
                                </div>
                                <div className="bg-black/40 p-4 rounded-xl border border-gray-800">
                                    <span className="text-xs uppercase font-bold text-gray-500 block mb-1">Sound Layering</span>
                                    <p className="text-sm text-gray-300">{plan.background_music_and_sound_layer}</p>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-400 flex items-center gap-2">
                                <AlertCircle size={20} /> {error}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button 
                                onClick={() => setStep(1)}
                                className="px-6 py-4 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                            >
                                Back
                            </button>
                            <button 
                                onClick={handleRenderVideo}
                                disabled={isLoading}
                                className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : <Video />}
                                {isLoading ? 'Rendering 4K Visuals (Veo)...' : 'Render Final Video'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 3: RESULT */}
            {step === 3 && videoUrl && (
                <div className="text-center max-w-3xl mx-auto">
                    <div className="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center text-teal-500 mx-auto mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">ASMR Experience Ready</h2>
                    
                    <div className={`mx-auto bg-black rounded-2xl overflow-hidden border border-gray-800 shadow-2xl mb-8 ${aspectRatio === '9:16' || aspectRatio === '4:5' ? 'max-w-xs' : 'max-w-2xl'}`}>
                        <video src={videoUrl} controls className="w-full h-full object-contain" />
                    </div>

                    <div className="flex justify-center gap-4">
                        <button 
                            onClick={() => setStep(2)}
                            className="text-gray-500 hover:text-white flex items-center gap-2"
                        >
                            <ArrowLeft size={16} /> Back to Plan
                        </button>
                        <span className="text-gray-700">|</span>
                        <button 
                            onClick={() => { setStep(1); setTopic(''); setPlan(null); setVideoUrl(null); }}
                            className="text-gray-500 hover:text-white underline"
                        >
                            Create New ASMR
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ASMRGenerator;
