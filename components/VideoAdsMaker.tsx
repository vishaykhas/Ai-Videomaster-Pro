
import React, { useState, useRef } from 'react';
import { Megaphone, UploadCloud, Film, Play, Loader2, Sparkles, Monitor, Smartphone, RectangleVertical, Square, ImagePlus, Check, X, Wand2, AlertCircle, ArrowLeft } from 'lucide-react';
import { generateAdScript, generateVideo, generateVoiceover, playAudio, requestVeoKey, checkVeoKey } from '../services/geminiService';

const VideoAdsMaker: React.FC = () => {
    // --- Step State ---
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Input, 2: Script, 3: Render
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Input State ---
    const [productName, setProductName] = useState('');
    const [description, setDescription] = useState('');
    const [audience, setAudience] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5'>('16:9');
    const [productImage, setProductImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Script State ---
    const [adScript, setAdScript] = useState<{ hook: string; body: string; cta: string; visual_prompt: string } | null>(null);
    const [audioBase64, setAudioBase64] = useState<string | null>(null);

    // --- Output State ---
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    // --- Handlers ---
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setProductImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSelectKey = async () => {
        try {
            await requestVeoKey();
            setError(null); // Clear error after attempt
        } catch (e) {
            console.error("Key selection failed", e);
        }
    };

    const handleGenerateScript = async () => {
        if (!productName || !description) {
            setError("Please fill in product name and description.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateAdScript(productName, description, audience || "General Audience");
            setAdScript(result);
            setStep(2);
        } catch (e: any) {
            setError("Failed to generate script. " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateAudio = async () => {
        if (!adScript) return;
        setIsLoading(true);
        try {
            // Combine script parts for voiceover
            const fullText = `${adScript.hook}. ${adScript.body}. ${adScript.cta}`;
            const audio = await generateVoiceover(fullText, 'Puck'); // Puck is energetic for ads
            setAudioBase64(audio);
        } catch (e: any) {
            setError("Audio generation failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRenderVideo = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const hasKey = await checkVeoKey();
            if(!hasKey) {
                await requestVeoKey();
            }

            // Map UI Aspect Ratios to API supported ones
            // 1:1 and 4:5 map to 9:16 (vertical) for safety, or 16:9 if user prefers standard
            let apiRatio: '16:9' | '9:16' = '16:9';
            if (aspectRatio === '9:16' || aspectRatio === '4:5' || aspectRatio === '1:1') {
                apiRatio = '9:16';
            }

            const prompt = `TV Commercial for ${productName}. ${adScript?.visual_prompt}. Professional lighting, 4k resolution.`;
            
            // Pass image if available to guide the start frame
            const url = await generateVideo(prompt, '1080p', apiRatio, productImage || undefined);
            
            if (url) {
                setVideoUrl(url);
                setStep(3);
            } else {
                throw new Error("Video generation returned no URL.");
            }
        } catch (e: any) {
             setError(e.message || "Video rendering failed. Ensure you selected a paid Google API Key.");
        } finally {
            setIsLoading(false);
        }
    };

    const RatioButton = ({ r, icon: Icon, label }: any) => (
        <button 
            onClick={() => setAspectRatio(r)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                aspectRatio === r 
                ? 'bg-brand-500/20 border-brand-500 text-brand-400' 
                : 'bg-dark-900 border-gray-700 text-gray-500 hover:border-gray-500'
            }`}
        >
            <Icon size={24} className="mb-2" />
            <span className="text-xs font-bold">{label}</span>
            <span className="text-[10px] opacity-60">{r}</span>
        </button>
    );

    return (
        <div className="max-w-5xl mx-auto animate-fade-in p-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-fuchsia-900/30 rounded-xl text-fuchsia-500">
                    <Megaphone size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Video Ads Maker</h1>
                    <p className="text-gray-400">Create high-conversion 4K commercials with AI.</p>
                </div>
            </div>

            {/* Progress */}
            <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto">
                 {[1, 2, 3].map(i => (
                     <div key={i} className={`flex items-center gap-2 ${step >= i ? 'text-brand-500' : 'text-gray-600'}`}>
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border ${step >= i ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-700'}`}>
                             {i}
                         </div>
                         <span className="text-sm font-medium">
                            {i === 1 ? 'Product Info' : i === 2 ? 'Script & Audio' : 'Render'}
                         </span>
                     </div>
                 ))}
            </div>

            <div className="bg-dark-800 border border-gray-800 rounded-2xl p-8 shadow-xl">
                
                {/* STEP 1: INPUT */}
                {step === 1 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Product Name</label>
                                <input 
                                    type="text" 
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    className="w-full bg-dark-900 border border-gray-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none"
                                    placeholder="e.g. Lumina Smart Watch"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Target Audience</label>
                                <input 
                                    type="text" 
                                    value={audience}
                                    onChange={(e) => setAudience(e.target.value)}
                                    className="w-full bg-dark-900 border border-gray-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none"
                                    placeholder="e.g. Fitness enthusiasts, Tech lovers"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Key Benefits / Description</label>
                                <textarea 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full h-32 bg-dark-900 border border-gray-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none resize-none"
                                    placeholder="Describe your product features and selling points..."
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Product Image (Optional)</label>
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-700 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 hover:bg-dark-900 transition-colors relative overflow-hidden"
                                >
                                    {productImage ? (
                                        <>
                                            <img src={productImage} className="w-full h-full object-cover" alt="product" />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                <p className="text-white font-bold">Change Image</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <ImagePlus size={32} className="text-gray-500 mb-2" />
                                            <p className="text-sm text-gray-500">Click to upload product shot</p>
                                        </>
                                    )}
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleImageUpload} 
                                        className="hidden" 
                                        accept="image/*"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Used as the starting frame for video generation to ensure consistency.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Video Aspect Ratio</label>
                                <div className="grid grid-cols-4 gap-3">
                                    <RatioButton r="16:9" icon={Monitor} label="Standard" />
                                    <RatioButton r="9:16" icon={Smartphone} label="Story/Reel" />
                                    <RatioButton r="1:1" icon={Square} label="Square" />
                                    <RatioButton r="4:5" icon={RectangleVertical} label="Portrait" />
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 mt-4">
                             {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                             <button 
                                onClick={handleGenerateScript}
                                disabled={isLoading || !productName}
                                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
                             >
                                 {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
                                 {isLoading ? 'Analyzing Product...' : 'Generate AIDA Ad Script'}
                             </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: SCRIPT */}
                {step === 2 && adScript && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Sparkles className="text-brand-500" size={20} /> AI Generated Script
                                </h3>
                                <div className="space-y-4">
                                    <div className="bg-dark-900 p-4 rounded-xl border border-gray-700">
                                        <span className="text-xs uppercase font-bold text-fuchsia-400 block mb-1">Hook (0-5s)</span>
                                        <p className="text-gray-200">{adScript.hook}</p>
                                    </div>
                                    <div className="bg-dark-900 p-4 rounded-xl border border-gray-700">
                                        <span className="text-xs uppercase font-bold text-blue-400 block mb-1">Body / Value Prop</span>
                                        <p className="text-gray-200">{adScript.body}</p>
                                    </div>
                                    <div className="bg-dark-900 p-4 rounded-xl border border-gray-700">
                                        <span className="text-xs uppercase font-bold text-green-400 block mb-1">Call to Action</span>
                                        <p className="text-gray-200">{adScript.cta}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-white mb-4">Voiceover Preview</h3>
                                <div className="bg-dark-900 p-8 rounded-xl border border-gray-700 flex flex-col items-center justify-center text-center h-full">
                                    {audioBase64 ? (
                                        <div className="space-y-4">
                                            <div className="w-16 h-16 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-500 mx-auto">
                                                <Megaphone size={32} />
                                            </div>
                                            <p className="text-sm text-green-400">Audio Generated Successfully</p>
                                            <button 
                                                onClick={() => playAudio(audioBase64)}
                                                className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 mx-auto"
                                            >
                                                <Play size={16} fill="currentColor" /> Play Audio
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <p className="text-gray-400 text-sm">Generate a professional AI voiceover for this script.</p>
                                            <button 
                                                onClick={handleGenerateAudio}
                                                disabled={isLoading}
                                                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-full font-bold text-sm"
                                            >
                                                {isLoading ? 'Generating...' : 'Generate Voiceover'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-6 flex justify-between">
                            <button onClick={() => setStep(1)} className="text-gray-500 hover:text-white">Edit Details</button>
                            <button 
                                onClick={handleRenderVideo}
                                disabled={isLoading}
                                className="bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-green-900/20"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : <Film size={20} />}
                                {isLoading ? 'Rendering Video (Veo)...' : 'Render Final Video'}
                            </button>
                        </div>
                        
                        {isLoading && (
                            <div className="text-center text-sm text-gray-500">
                                This calls Google Veo 3.1. It may take up to a minute. Please wait.
                            </div>
                        )}
                        {error && (
                             <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg flex items-start gap-3 mt-4 mb-4 justify-center">
                                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="text-red-400 text-sm">{error}</p>
                                    {(error.includes("Key") || error.includes("found")) && (
                                        <button onClick={handleSelectKey} className="mt-2 text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded">
                                            Select Google API Key
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 3: OUTPUT */}
                {step === 3 && videoUrl && (
                    <div className="text-center animate-fade-in">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6">
                             <Check size={40} />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Ad Created Successfully!</h2>
                        <p className="text-gray-400 mb-8">Your {aspectRatio} video is ready for download.</p>

                        <div className={`mx-auto bg-black rounded-xl overflow-hidden border border-gray-700 shadow-2xl ${aspectRatio === '9:16' || aspectRatio === '4:5' ? 'max-w-xs' : 'max-w-2xl'}`}>
                             <video 
                                src={videoUrl} 
                                controls 
                                className="w-full h-auto"
                                autoPlay
                                loop
                             />
                        </div>

                        <div className="flex justify-center gap-4 mt-8">
                             <button className="bg-brand-600 hover:bg-brand-500 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2">
                                 <UploadCloud size={20} /> Download MP4
                             </button>
                             <button onClick={() => setStep(1)} className="bg-dark-700 hover:bg-dark-600 text-white font-bold px-6 py-3 rounded-xl">
                                 Create Another
                             </button>
                        </div>
                        
                        <div className="flex justify-center mt-6">
                            <button onClick={() => setStep(2)} className="text-gray-500 hover:text-white flex items-center gap-2 text-sm">
                                <ArrowLeft size={14} /> Back to Script
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoAdsMaker;
