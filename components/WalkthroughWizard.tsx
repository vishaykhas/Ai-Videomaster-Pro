
import React, { useState, useRef } from 'react';
import { Map, UploadCloud, Film, Play, Loader2, Sparkles, Monitor, Smartphone, RectangleVertical, Square, ImagePlus, Check, X, Wand2, Home, Camera, Music, Mic, AlertCircle, LayoutTemplate, Box, Maximize2, ArrowLeft } from 'lucide-react';
import { generateWalkthroughScript, generateVideo, generateVoiceover, playAudio, requestVeoKey, checkVeoKey, generateRealEstateVisuals } from '../services/geminiService';

const WalkthroughWizard: React.FC = () => {
    // --- Step State ---
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Input, 2: Scene Plan, 3: Render
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Input State ---
    const [propertyType, setPropertyType] = useState('Luxury Apartment');
    const [description, setDescription] = useState('');
    const [amenities, setAmenities] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5'>('16:9');
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const [generationMode, setGenerationMode] = useState<'strict' | 'creative'>('creative');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Plan State ---
    const [scenePlan, setScenePlan] = useState<any>(null); // { title, scenes[], musicMood, veoPrompt }
    const [generatedAssets, setGeneratedAssets] = useState<{floorPlan: string, conceptImage: string} | null>(null);
    const [audioBase64, setAudioBase64] = useState<string | null>(null);

    // --- Output State ---
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    // --- Handlers ---
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setReferenceImage(reader.result as string);
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

    const handleGeneratePlan = async () => {
        if (!propertyType || !description) {
            setError("Please fill in property type and description.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            // Run generations in parallel for speed
            const [planResult, visualResult] = await Promise.all([
                generateWalkthroughScript(propertyType, description, amenities),
                generateRealEstateVisuals(propertyType, description, generationMode, referenceImage)
            ]);

            setScenePlan(planResult);
            setGeneratedAssets(visualResult);
            setStep(2);
        } catch (e: any) {
            setError("Failed to generate plan. " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateAudio = async () => {
        if (!scenePlan || !scenePlan.scenes) return;
        setIsLoading(true);
        try {
            // Combine script parts for voiceover
            const fullText = scenePlan.scenes.map((s: any) => s.audio).join(' ');
            const audio = await generateVoiceover(fullText, 'Kore'); // Kore is standard lux
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

            let apiRatio: '16:9' | '9:16' = '16:9';
            if (aspectRatio === '9:16' || aspectRatio === '4:5' || aspectRatio === '1:1') {
                apiRatio = '9:16';
            }

            // Enhanced Veo Prompt with reference if using Strict Mode
            const prompt = `Cinematic Real Estate Walkthrough. ${scenePlan?.veoPrompt}. 4k resolution, photorealistic, architectural visualization.`;
            
            // If Strict Mode, we use the reference image. If Creative Mode, we might use the AI-generated concept as the start.
            let startImage = referenceImage || undefined;
            if (generationMode === 'creative' && generatedAssets?.conceptImage) {
                 startImage = generatedAssets.conceptImage;
            }

            const url = await generateVideo(prompt, '1080p', apiRatio, startImage);
            
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
                ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
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
                <div className="p-3 bg-blue-900/30 rounded-xl text-blue-500">
                    <Map size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Walkthrough Engine</h1>
                    <p className="text-gray-400">Cinematic 4K Real Estate Tours from Text & Plans.</p>
                </div>
            </div>

            {/* Progress */}
            <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto">
                 {[1, 2, 3].map(i => (
                     <div key={i} className={`flex items-center gap-2 ${step >= i ? 'text-blue-500' : 'text-gray-600'}`}>
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border ${step >= i ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-700'}`}>
                             {i}
                         </div>
                         <span className="text-sm font-medium">
                            {i === 1 ? 'Property Input' : i === 2 ? 'Visual Plan' : 'Render'}
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
                                <label className="block text-sm font-medium text-gray-400 mb-2">Property Type</label>
                                <select 
                                    value={propertyType}
                                    onChange={(e) => setPropertyType(e.target.value)}
                                    className="w-full bg-dark-900 border border-gray-700 rounded-xl p-4 text-white focus:border-blue-500 outline-none"
                                >
                                    <option>Luxury Apartment</option>
                                    <option>Modern Villa</option>
                                    <option>Commercial Office</option>
                                    <option>Shopping Mall</option>
                                    <option>Land Plot / Farm</option>
                                    <option>Hotel / Resort</option>
                                    <option>Warehouse / Industrial</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Key Amenities / Features</label>
                                <input 
                                    type="text" 
                                    value={amenities}
                                    onChange={(e) => setAmenities(e.target.value)}
                                    className="w-full bg-dark-900 border border-gray-700 rounded-xl p-4 text-white focus:border-blue-500 outline-none"
                                    placeholder="e.g. Pool, Gym, Rooftop Garden, 24/7 Security"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Detailed Description</label>
                                <textarea 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full h-32 bg-dark-900 border border-gray-700 rounded-xl p-4 text-white focus:border-blue-500 outline-none resize-none"
                                    placeholder="Describe the layout, vibe, lighting, and specific areas to highlight..."
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Reference Image / Floor Plan</label>
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-700 rounded-xl h-40 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-dark-900 transition-colors relative overflow-hidden"
                                >
                                    {referenceImage ? (
                                        <>
                                            <img src={referenceImage} className="w-full h-full object-cover" alt="ref" />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                <p className="text-white font-bold">Change Image</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <ImagePlus size={32} className="text-gray-500 mb-2" />
                                            <p className="text-sm text-gray-500">Upload Layout or Ref Photo</p>
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
                            </div>

                            {/* Generation Mode Toggle (Only visible if reference image is set, or implies creative gen if not) */}
                            {referenceImage && (
                                <div className="bg-dark-900 p-3 rounded-xl border border-gray-700">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">AI Design Mode</label>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setGenerationMode('strict')}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                                generationMode === 'strict' 
                                                ? 'bg-blue-600 text-white shadow-lg' 
                                                : 'bg-dark-800 text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            Strict Reconstruction
                                        </button>
                                        <button 
                                            onClick={() => setGenerationMode('creative')}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                                generationMode === 'creative' 
                                                ? 'bg-fuchsia-600 text-white shadow-lg' 
                                                : 'bg-dark-800 text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            Creative AI Design
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2 italic">
                                        {generationMode === 'strict' 
                                        ? "AI will follow your reference image layout and structure exactly." 
                                        : "AI will use your image as inspiration but create a unique, enhanced design."}
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Output Ratio</label>
                                <div className="grid grid-cols-4 gap-3">
                                    <RatioButton r="16:9" icon={Monitor} label="Standard" />
                                    <RatioButton r="9:16" icon={Smartphone} label="Story" />
                                    <RatioButton r="1:1" icon={Square} label="Square" />
                                    <RatioButton r="4:5" icon={RectangleVertical} label="Portrait" />
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 mt-4">
                             {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                             <button 
                                onClick={handleGeneratePlan}
                                disabled={isLoading || !description}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
                             >
                                 {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
                                 {isLoading ? 'Generating Visuals & Plans...' : 'Generate Plan & Visuals'}
                             </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: SCENE PLAN & VISUALS */}
                {step === 2 && scenePlan && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">{scenePlan.title || "Walkthrough Plan"}</h2>
                                <div className="flex gap-4 text-sm text-gray-400">
                                    <span className="flex items-center gap-1"><Music size={14} /> {scenePlan.musicMood}</span>
                                    <span className="flex items-center gap-1"><Home size={14} /> {propertyType}</span>
                                </div>
                            </div>
                        </div>

                        {/* Generated Assets Display */}
                        {generatedAssets && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-dark-900 border border-gray-700 rounded-xl p-4">
                                    <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                                        <Box size={16} className="text-fuchsia-500" /> AI Concept Render (3D)
                                    </h4>
                                    <div className="aspect-video bg-black rounded-lg overflow-hidden relative group">
                                        <img src={generatedAssets.conceptImage} alt="3D Concept" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <a href={generatedAssets.conceptImage} download="concept.jpg" className="text-white bg-black/50 p-2 rounded-lg hover:bg-black/80">
                                                <Maximize2 size={20} />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-dark-900 border border-gray-700 rounded-xl p-4">
                                    <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                                        <LayoutTemplate size={16} className="text-blue-500" /> AI Floor Plan (2D)
                                    </h4>
                                    <div className="aspect-video bg-white rounded-lg overflow-hidden relative group">
                                        <img src={generatedAssets.floorPlan} alt="Floor Plan" className="w-full h-full object-contain" />
                                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                             <a href={generatedAssets.floorPlan} download="floorplan.jpg" className="text-white bg-black/50 p-2 rounded-lg hover:bg-black/80">
                                                <Maximize2 size={20} />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Scene List */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-white mt-6 mb-2">Cinematic Shot List</h3>
                            {scenePlan.scenes && scenePlan.scenes.length > 0 ? scenePlan.scenes.map((scene: any, i: number) => (
                                <div key={i} className="bg-dark-900 border border-gray-700 rounded-xl p-4 flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-900/30 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <h4 className="font-bold text-white text-sm">{scene.type}</h4>
                                            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded flex items-center gap-1">
                                                <Camera size={10} /> {scene.movement}
                                            </span>
                                        </div>
                                        <p className="text-gray-300 text-sm mb-2">{scene.visual}</p>
                                        <div className="bg-dark-950 p-2 rounded-lg border border-gray-800 flex gap-2">
                                            <Mic size={14} className="text-gray-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-gray-400 italic">"{scene.audio}"</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-gray-500 italic">No scenes generated.</p>
                            )}
                        </div>

                        {/* Audio & Actions */}
                        <div className="flex items-center justify-between bg-dark-900 p-4 rounded-xl border border-gray-700">
                            <div className="flex items-center gap-4">
                                {audioBase64 ? (
                                    <button 
                                        onClick={() => playAudio(audioBase64)}
                                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2"
                                    >
                                        <Play size={14} fill="currentColor" /> Play Narration
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleGenerateAudio}
                                        disabled={isLoading}
                                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2"
                                    >
                                        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Mic size={14} />} 
                                        Generate Voiceover
                                    </button>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Ready to visualize?</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-6 flex justify-between">
                            <button onClick={() => setStep(1)} className="text-gray-500 hover:text-white">Edit Inputs</button>
                            <button 
                                onClick={handleRenderVideo}
                                disabled={isLoading}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-900/20"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : <Film size={20} />}
                                {isLoading ? 'Rendering (Veo 3.1)...' : 'Render 4K Walkthrough'}
                            </button>
                        </div>
                        
                        {isLoading && (
                            <div className="text-center text-sm text-gray-500">
                                Sending architectural prompt to Veo. This may take a minute.
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
                        <h2 className="text-3xl font-bold text-white mb-2">Walkthrough Ready!</h2>
                        <p className="text-gray-400 mb-8">Your cinematic tour is ready for download.</p>

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
                             <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2">
                                 <UploadCloud size={20} /> Download MP4
                             </button>
                             <button onClick={() => setStep(1)} className="bg-dark-700 hover:bg-dark-600 text-white font-bold px-6 py-3 rounded-xl">
                                 New Tour
                             </button>
                        </div>
                        
                        <div className="flex justify-center mt-6">
                            <button onClick={() => setStep(2)} className="text-gray-500 hover:text-white flex items-center gap-2 text-sm">
                                <ArrowLeft size={14} /> Back to Planning
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WalkthroughWizard;
