
import React, { useState } from 'react';
import { Clapperboard, Sparkles, User, FileText, Video, Play, Loader2, Plus, Film, Wand2, ChevronRight, CheckCircle2, AlertCircle, Camera, Mic, ArrowLeft } from 'lucide-react';
import { generateMoviePremise, generateMovieCharacters, generateMovieScenes, generateCharacterPortrait, generateVideo, requestVeoKey, checkVeoKey } from '../services/geminiService';
import { MovieProject, MovieCharacter, MovieScene } from '../types';

const MovieStudio: React.FC = () => {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Concept, 2: Casting, 3: Script, 4: Production
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Project State
    const [concept, setConcept] = useState('');
    const [project, setProject] = useState<Partial<MovieProject>>({});
    
    // Casting State
    const [generatingCharId, setGeneratingCharId] = useState<string | null>(null);

    // Production State
    const [renderingSceneId, setRenderingSceneId] = useState<string | null>(null);
    const [activePreview, setActivePreview] = useState<string | null>(null);

    // --- STEP 1: DEVELOPMENT ---
    const handleGeneratePremise = async () => {
        if (!concept) return;
        setIsLoading(true);
        setError(null);
        try {
            const premise = await generateMoviePremise(concept);
            setProject(prev => ({ ...prev, ...premise }));
            setStep(2);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    // --- STEP 2: CASTING ---
    const handleGenerateCast = async () => {
        if (!project.title) return;
        setIsLoading(true);
        try {
            const cast = await generateMovieCharacters(project);
            setProject(prev => ({ ...prev, characters: cast }));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGeneratePortrait = async (charId: string, desc: string) => {
        setGeneratingCharId(charId);
        try {
            const url = await generateCharacterPortrait(desc);
            setProject(prev => ({
                ...prev,
                characters: prev.characters?.map(c => c.id === charId ? { ...c, imageUrl: url } : c)
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setGeneratingCharId(null);
        }
    };

    // --- STEP 3: SCRIPTING ---
    const handleGenerateScenes = async () => {
        setIsLoading(true);
        try {
            const scenes = await generateMovieScenes(project, project.characters || []);
            setProject(prev => ({ ...prev, scenes: scenes }));
            setStep(4);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    // --- STEP 4: PRODUCTION ---
    const handleRenderScene = async (scene: MovieScene) => {
        setRenderingSceneId(scene.id);
        setError(null);
        try {
            // Check Veo Key
            const hasKey = await checkVeoKey();
            if (!hasKey) {
                await requestVeoKey();
            }

            // Construct prompt using Scene Description + Character Visuals
            let prompt = `Cinematic Shot, 4K. ${scene.slug}. ${scene.description}. Action: ${scene.action}.`;
            
            // Append visual context for characters in scene
            const charsInScene = project.characters?.filter(c => scene.charactersInvolved.includes(c.name));
            if (charsInScene && charsInScene.length > 0) {
                const charVisuals = charsInScene.map(c => `${c.name} looks like: ${c.visualDescription}`).join(". ");
                prompt += ` Characters: ${charVisuals}`;
            }

            const videoUrl = await generateVideo(prompt, '1080p', '16:9');
            
            if (videoUrl) {
                setProject(prev => ({
                    ...prev,
                    scenes: prev.scenes?.map(s => s.id === scene.id ? { ...s, status: 'completed', videoUrl: videoUrl } : s)
                }));
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setRenderingSceneId(null);
        }
    };

    return (
        <div className="min-h-full bg-[#0a0a0a] text-gray-100 p-8 font-sans animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-red-600 to-orange-600 p-3 rounded-xl shadow-lg shadow-red-900/20">
                        <Clapperboard size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            CineAI Studio
                        </h1>
                        <p className="text-sm text-gray-500">End-to-End AI Movie Production Engine</p>
                    </div>
                </div>
                
                {/* Progress Stepper */}
                <div className="flex items-center gap-4 bg-gray-900 p-1.5 rounded-xl border border-gray-800">
                    {[
                        { id: 1, label: 'Development', icon: Sparkles },
                        { id: 2, label: 'Casting', icon: User },
                        { id: 3, label: 'Screenplay', icon: FileText },
                        { id: 4, label: 'Production', icon: Video },
                    ].map((s) => (
                        <div 
                            key={s.id}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                step === s.id 
                                ? 'bg-red-600 text-white shadow-lg' 
                                : step > s.id 
                                    ? 'text-green-400 bg-green-900/10' 
                                    : 'text-gray-600'
                            }`}
                        >
                            <s.icon size={14} />
                            <span className="hidden md:inline">{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                {/* STEP 1: DEVELOPMENT */}
                {step === 1 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h2 className="text-4xl font-bold text-white leading-tight">
                                Turn your idea into a <span className="text-red-500">Blockbuster</span>.
                            </h2>
                            <p className="text-gray-400 text-lg">
                                Enter a concept, topic, or logline. CineAI will generate the full movie bible, characters, and screenplay automatically.
                            </p>
                            
                            <div className="relative">
                                <textarea 
                                    value={concept}
                                    onChange={(e) => setConcept(e.target.value)}
                                    className="w-full h-40 bg-gray-900 border border-gray-800 rounded-2xl p-6 text-xl text-white placeholder-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none shadow-inner transition-all"
                                    placeholder="e.g. A cyberpunk detective hunts a rogue android in Neo-Tokyo..."
                                />
                                <div className="absolute bottom-4 right-4 text-xs text-gray-600">
                                    AI Director Mode: ON
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl text-red-400 flex items-center gap-3">
                                    <AlertCircle size={18} /> {error}
                                </div>
                            )}

                            <button 
                                onClick={handleGeneratePremise}
                                disabled={isLoading || !concept}
                                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 text-lg shadow-xl shadow-red-900/20 transition-all transform active:scale-[0.99]"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
                                {isLoading ? 'Developing Concept...' : 'Greenlight Project'}
                            </button>
                        </div>
                        
                        <div className="hidden lg:flex justify-center">
                            <div className="relative w-96 h-[500px] bg-gray-900 rounded-2xl border-2 border-gray-800 shadow-2xl overflow-hidden flex items-center justify-center group">
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 z-10"></div>
                                <Film size={64} className="text-gray-700 opacity-20 group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute bottom-8 left-8 right-8 z-20">
                                    <div className="h-2 w-20 bg-red-600 mb-4"></div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Cinematic Vision</h3>
                                    <p className="text-sm text-gray-400">AI-powered pre-production workflow matching Hollywood standards.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: CASTING */}
                {step === 2 && (
                    <div className="space-y-8 animate-slide-up">
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2">{project.title}</h2>
                                    <p className="text-gray-400 max-w-2xl">{project.logline}</p>
                                </div>
                                <div className="text-right">
                                    <span className="bg-red-900/30 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/20 uppercase">
                                        {project.genre}
                                    </span>
                                </div>
                            </div>
                            
                            {!project.characters ? (
                                <div className="text-center py-12">
                                    <button 
                                        onClick={handleGenerateCast}
                                        disabled={isLoading}
                                        className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 mx-auto transition-all"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" /> : <User size={20} />}
                                        {isLoading ? 'Casting Call in Progress...' : 'Generate Cast List'}
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-gray-200">Main Cast</h3>
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => setStep(1)}
                                                className="text-gray-500 hover:text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                                            >
                                                <ArrowLeft size={16} /> Back
                                            </button>
                                            <button 
                                                onClick={() => setStep(3)}
                                                className="bg-white text-black hover:bg-gray-200 px-6 py-2 rounded-lg font-bold flex items-center gap-2"
                                            >
                                                Lock Cast & Write Script <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {project.characters.map((char) => (
                                            <div key={char.id} className="bg-black/40 border border-gray-800 rounded-xl p-4 flex gap-4 hover:border-gray-600 transition-colors group">
                                                <div 
                                                    className="w-24 h-32 bg-gray-800 rounded-lg shrink-0 overflow-hidden relative cursor-pointer"
                                                    onClick={() => handleGeneratePortrait(char.id, char.visualDescription)}
                                                >
                                                    {char.imageUrl ? (
                                                        <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 hover:bg-gray-700 transition-colors">
                                                            {generatingCharId === char.id ? (
                                                                <Loader2 className="animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <Camera size={20} className="mb-1" />
                                                                    <span className="text-[10px]">Gen Photo</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white text-lg">{char.name}</h4>
                                                    <p className="text-red-400 text-xs font-bold uppercase mb-2">{char.role}</p>
                                                    <p className="text-gray-400 text-sm line-clamp-3 mb-2">{char.visualDescription}</p>
                                                    <span className="text-xs text-gray-500 bg-gray-900 px-2 py-0.5 rounded">{char.voiceType}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 3 & 4: PRODUCTION */}
                {step >= 3 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                        
                        {/* LEFT: SCRIPT / SCENE LIST */}
                        <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-6 h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
                             <div className="flex items-center justify-between mb-6">
                                 <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                     <FileText size={20} className="text-red-500" /> Screenplay
                                 </h3>
                                 {/* Back button moved here for Step 3 */}
                                 {step === 3 && (
                                     <div className="flex gap-2">
                                         <button onClick={() => setStep(2)} className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
                                             <ArrowLeft size={12} /> Back
                                         </button>
                                         <button 
                                            onClick={handleGenerateScenes}
                                            disabled={isLoading}
                                            className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1"
                                         >
                                             {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                             Gen Scenes
                                         </button>
                                     </div>
                                 )}
                             </div>

                             {project.scenes && project.scenes.length > 0 ? (
                                 <div className="space-y-4">
                                     {project.scenes.map((scene) => (
                                         <div 
                                            key={scene.id} 
                                            className={`p-4 rounded-xl border transition-all cursor-pointer ${
                                                renderingSceneId === scene.id 
                                                ? 'bg-red-900/10 border-red-500/50' 
                                                : scene.status === 'completed'
                                                    ? 'bg-green-900/10 border-green-500/30'
                                                    : 'bg-black/30 border-gray-800 hover:bg-gray-800'
                                            }`}
                                            onClick={() => scene.videoUrl && setActivePreview(scene.videoUrl)}
                                         >
                                             <div className="flex justify-between items-start mb-2">
                                                 <span className="font-mono text-xs font-bold text-gray-500">SCENE {scene.number}</span>
                                                 {scene.status === 'completed' ? (
                                                     <CheckCircle2 size={14} className="text-green-500" />
                                                 ) : (
                                                     <div className="w-3 h-3 rounded-full bg-gray-700"></div>
                                                 )}
                                             </div>
                                             <h4 className="font-bold text-gray-200 text-sm mb-1 font-mono uppercase">{scene.slug}</h4>
                                             <p className="text-gray-400 text-xs line-clamp-2 mb-3">{scene.description}</p>
                                             
                                             <div className="flex items-center justify-between">
                                                 <div className="flex -space-x-1">
                                                     {scene.charactersInvolved && scene.charactersInvolved.map((c, i) => (
                                                         <div key={i} className="w-5 h-5 rounded-full bg-gray-700 border border-gray-900 flex items-center justify-center text-[8px] text-white">
                                                             {c[0]}
                                                         </div>
                                                     ))}
                                                 </div>
                                                 {scene.status !== 'completed' && (
                                                     <button 
                                                        onClick={(e) => { e.stopPropagation(); handleRenderScene(scene); }}
                                                        disabled={!!renderingSceneId}
                                                        className="text-[10px] bg-gray-700 hover:bg-white hover:text-black text-white px-2 py-1 rounded font-bold transition-colors flex items-center gap-1"
                                                     >
                                                         {renderingSceneId === scene.id ? <Loader2 size={10} className="animate-spin" /> : <Video size={10} />}
                                                         SHOOT
                                                     </button>
                                                 )}
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             ) : (
                                 <div className="text-center text-gray-600 py-10 italic">
                                     Scenes not generated yet.
                                 </div>
                             )}
                        </div>

                        {/* RIGHT: STUDIO MONITOR */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Monitor */}
                            <div className="aspect-video bg-black rounded-2xl border border-gray-800 relative shadow-2xl overflow-hidden flex items-center justify-center group">
                                {activePreview ? (
                                    <video 
                                        src={activePreview} 
                                        controls 
                                        className="w-full h-full object-contain"
                                        autoPlay
                                    />
                                ) : renderingSceneId ? (
                                    <div className="text-center">
                                        <Loader2 size={48} className="text-red-600 animate-spin mx-auto mb-4" />
                                        <h3 className="text-white font-bold text-xl animate-pulse">Filming Scene...</h3>
                                        <p className="text-gray-500 text-sm mt-2">Sending 4K prompts to Veo Engine</p>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-700">
                                        <Film size={64} className="mx-auto mb-4 opacity-20" />
                                        <p>Select a completed scene to preview</p>
                                    </div>
                                )}
                            </div>

                            {/* Control Deck */}
                            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-white">Production Actions</h3>
                                    {error && <span className="text-xs text-red-400">{error}</span>}
                                </div>
                                <div className="flex gap-4">
                                    <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                                        <Mic size={18} /> Add Voiceover
                                    </button>
                                    <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                                        <Play size={18} /> Compile Full Movie
                                    </button>
                                </div>
                                {step === 4 && (
                                    <div className="mt-4 border-t border-gray-800 pt-4">
                                        <button 
                                            onClick={() => setStep(3)} 
                                            className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-white text-sm py-2 transition-colors"
                                        >
                                            <ArrowLeft size={14} /> Back to Scene Selection
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default MovieStudio;
