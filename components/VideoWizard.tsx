
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Wand2, Mic, Film, CheckCircle, Loader2, Play, Pause, Youtube, UploadCloud, AlertCircle, RefreshCw, Volume2, Users, Mic2, ChevronDown, User, Shuffle, ImagePlus, UserCircle2, Sparkles, ArrowRight, Settings2, ArrowLeft, TrendingUp, Zap, BarChart3, Target, DollarSign, Download, FileText, Home } from 'lucide-react';
import { generateScript, generateVoiceover, playAudio, generateVideo, checkVeoKey, requestVeoKey, generateThumbnailImage, createWavBlobFromPcm, generateViralIdeas } from '../services/geminiService';
import { ViralIdea, AppView } from '../types';

// Injecting prop to allow navigating back to dashboard
interface VideoWizardProps {
    onBack?: () => void;
}

const steps = [
  { id: 1, title: 'Concept', icon: Wand2 },
  { id: 2, title: 'Script', icon: CheckCircle },
  { id: 3, title: 'Voice', icon: Mic },
  { id: 4, title: 'Avatar', icon: UserCircle2 },
  { id: 5, title: 'Video', icon: Film },
  { id: 6, title: 'Publish', icon: UploadCloud },
];

const videoTypes = [
    { id: 'documentary', label: 'Documentary', defaultFormat: 'single' },
    { id: 'talking_avatar', label: 'Talking Avatar / Presenter', defaultFormat: 'single' },
    { id: 'educational', label: 'Educational / Tutorial', defaultFormat: 'single' },
    { id: 'podcast', label: 'Podcast / Interview', defaultFormat: 'podcast' },
    { id: 'vlog', label: 'Vlog / Personal Story', defaultFormat: 'single' },
    { id: 'news', label: 'News / Update', defaultFormat: 'single' },
    { id: 'motivational', label: 'Motivational / Speech', defaultFormat: 'single' },
    { id: 'review', label: 'Product Review', defaultFormat: 'single' },
    { id: 'story', label: 'Storytelling / Fiction', defaultFormat: 'single' },
    { id: 'panel', label: 'Panel Discussion', defaultFormat: 'podcast' },
    { id: 'commentary', label: 'Commentary / Reaction', defaultFormat: 'single' },
];

const LANGUAGES = {
    "International": [
        "English (US)", "English (UK)", "English (India)", "Spanish", "French", "German", 
        "Italian", "Portuguese", "Russian", "Japanese", "Korean", "Chinese (Mandarin)", 
        "Arabic", "Turkish", "Dutch", "Swedish", "Polish", "Indonesian", "Vietnamese", "Thai"
    ],
    "Indian Regional": [
        "Hindi", "Marathi", "Gujarati", "Tamil", "Telugu", "Kannada", "Malayalam", 
        "Bengali", "Punjabi", "Odia", "Assamese", "Urdu", "Sanskrit", "Bhojpuri", 
        "Haryanvi", "Rajasthani", "Konkani", "Maithili", "Kashmiri", "Sindhi", "Dogri", 
        "Manipuri", "Nepali"
    ]
};

interface VoiceDef {
    name: string;
    gender: 'Male' | 'Female';
    style: string;
}

const VOICE_DEFINITIONS: VoiceDef[] = [
    { name: 'Kore', gender: 'Female', style: 'Balanced & Natural' },
    { name: 'Puck', gender: 'Male', style: 'Energetic & Youthful' },
    { name: 'Charon', gender: 'Male', style: 'Deep & Authoritative' },
    { name: 'Aoede', gender: 'Female', style: 'Expressive & Warm' },
    { name: 'Zephyr', gender: 'Female', style: 'Calm & Soothing' },
    { name: 'Fenrir', gender: 'Male', style: 'Intense & Dramatic' },
    { name: 'Orus', gender: 'Male', style: 'Confident & Professional' },
    { name: 'Leda', gender: 'Female', style: 'Soft & Relaxed' },
    { name: 'Iapetus', gender: 'Male', style: 'Deep & Resonant' },
    { name: 'Erinome', gender: 'Female', style: 'Soft & Gentle' },
    { name: 'Alnilam', gender: 'Male', style: 'Neutral & Clear' },
    { name: 'Gacrux', gender: 'Female', style: 'Neutral & Professional' },
];

const VideoWizard: React.FC<VideoWizardProps> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [topic, setTopic] = useState('');
  const [videoType, setVideoType] = useState('documentary');
  const [tone, setTone] = useState('Informative/Professional');
  const [language, setLanguage] = useState('English (US)');
  const [format, setFormat] = useState<'single' | 'podcast'>('single');
  
  // Viral Engine State
  const [viralIdeas, setViralIdeas] = useState<ViralIdea[]>([]);
  const [selectedViralIdea, setSelectedViralIdea] = useState<ViralIdea | null>(null);
  
  // Voice Config State
  const [vocalMode, setVocalMode] = useState<'single' | 'multi'>('single');
  const [voiceName, setVoiceName] = useState('Kore'); // Default for single
  const [singleVoiceGender, setSingleVoiceGender] = useState<'Male' | 'Female'>('Female');
  
  // Multi-Speaker State
  const [detectedSpeakers, setDetectedSpeakers] = useState<string[]>([]);
  const [speakerVoiceMap, setSpeakerVoiceMap] = useState<Record<string, string>>({});
  const [speakerGenderMap, setSpeakerGenderMap] = useState<Record<string, 'Male' | 'Female'>>({});
  
  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Avatar State
  const [avatarMode, setAvatarMode] = useState<'upload' | 'generate'>('generate');
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [avatarDescription, setAvatarDescription] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Generated Content State
  const [script, setScript] = useState('');
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [veoError, setVeoError] = useState<string | null>(null);

  // --- Clean Up Audio Memory Leaks ---
  useEffect(() => {
      return () => {
          if (audioRef.current) {
              audioRef.current.pause();
              if (audioRef.current.src) {
                  URL.revokeObjectURL(audioRef.current.src);
              }
          }
      };
  }, []);

  // --- Helpers ---
  const detectSpeakers = (scriptText: string) => {
      // Robust Regex to find "**Name:**" or "Name:" or "Name (Role):" at start of lines
      const regex = /^\s*\**([A-Za-z0-9 _\-\(\)\.]+?)\**\s*:/gm;
      const matches = [...scriptText.matchAll(regex)];
      const uniqueSpeakers = [...new Set(matches.map(m => m[1].trim()))];
      
      setDetectedSpeakers(uniqueSpeakers);
      
      // Auto-switch mode if multiple speakers found
      if (uniqueSpeakers.length > 1) {
          setVocalMode('multi');
      } else {
          setVocalMode('single');
      }

      // Initialize maps if new speakers found
      if (uniqueSpeakers.length > 0) {
          const newVoiceMap: Record<string, string> = {};
          const newGenderMap: Record<string, 'Male' | 'Female'> = {};

          uniqueSpeakers.forEach((speaker, index) => {
              // Default Logic: Alternate Gender based on index for variety
              const defaultGender: 'Male' | 'Female' = index % 2 === 0 ? 'Male' : 'Female';
              newGenderMap[speaker] = defaultGender;
              
              // Find first voice that matches gender
              const availableVoices = VOICE_DEFINITIONS.filter(v => v.gender === defaultGender);
              const voice = availableVoices[index % availableVoices.length].name;
              newVoiceMap[speaker] = voice;
          });
          
          setSpeakerVoiceMap(prev => ({...prev, ...newVoiceMap}));
          setSpeakerGenderMap(prev => ({...prev, ...newGenderMap}));
      }
  };

  const randomizeCast = () => {
      const newVoiceMap: Record<string, string> = {};
      const newGenderMap: Record<string, 'Male' | 'Female'> = {};

      detectedSpeakers.forEach((speaker) => {
          const randomVoice = VOICE_DEFINITIONS[Math.floor(Math.random() * VOICE_DEFINITIONS.length)];
          newVoiceMap[speaker] = randomVoice.name;
          newGenderMap[speaker] = randomVoice.gender;
      });

      setSpeakerVoiceMap(newVoiceMap);
      setSpeakerGenderMap(newGenderMap);
  };

  const updateSpeakerGender = (speaker: string, gender: 'Male' | 'Female') => {
      setSpeakerGenderMap(prev => ({ ...prev, [speaker]: gender }));
      
      // Auto-switch voice to a valid one for the new gender
      const validVoices = VOICE_DEFINITIONS.filter(v => v.gender === gender);
      const randomValidVoice = validVoices[Math.floor(Math.random() * validVoices.length)];
      setSpeakerVoiceMap(prev => ({ ...prev, [speaker]: randomValidVoice.name }));
  };

  // Auto-detect when entering Step 2
  useEffect(() => {
      if (currentStep === 2) {
          detectSpeakers(script);
      }
  }, [currentStep, script]);

  // Handle Video Type Change
  const handleTypeChange = (typeId: string) => {
      setVideoType(typeId);
      const typeDef = videoTypes.find(t => t.id === typeId);
      if (typeDef) {
          setFormat(typeDef.defaultFormat as 'single' | 'podcast');
      }
  };

  // --- Viral Engine Handlers ---
  const handleGenerateViralIdeas = async (mode: 'standard' | 'super-viral') => {
      setIsLoading(true);
      setViralIdeas([]);
      try {
          const ideas = await generateViralIdeas(topic, mode);
          setViralIdeas(ideas);
      } catch (e) {
          console.error(e);
          alert("Failed to fetch viral ideas.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleSelectIdea = async (idea: ViralIdea) => {
      setSelectedViralIdea(idea);
      setTopic(idea.title); // Update main input for reference
      setIsLoading(true);
      try {
          // Generate script using viral context
          const generatedScript = await generateScript(idea.title, videoType, tone, language, format, idea);
          setScript(generatedScript);
          setCurrentStep(2);
      } catch (e) {
          console.error(e);
          alert("Failed to generate script.");
      } finally {
          setIsLoading(false);
      }
  };

  // --- Handlers ---

  const handleGenerateScript = async () => {
    if (!topic) return;
    
    setIsLoading(true);
    try {
      const generatedScript = await generateScript(topic, videoType, tone, language, format);
      setScript(generatedScript);
      setCurrentStep(2);
    } catch (e) {
      console.error(e);
      alert("Failed to generate script. Check API Key.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipToScript = () => {
      // Allow proceeding even if topic is empty, user will write script manually
      setCurrentStep(2);
  };

  const handleGenerateVoice = async () => {
    setIsLoading(true);
    try {
      // Logic: If Multi mode is selected AND we have speakers, use the map.
      // Otherwise use the single voice.
      const map = (vocalMode === 'multi' && detectedSpeakers.length > 0) ? speakerVoiceMap : undefined;
      const primaryVoice = vocalMode === 'single' ? voiceName : undefined;

      const audio = await generateVoiceover(script, primaryVoice, map);
      setAudioBase64(audio);
      setCurrentStep(3);
    } catch (e) {
      console.error(e);
      alert("Voice generation failed. Please ensure you selected a valid voice.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewAudio = useCallback(() => {
    if (!audioBase64) return;

    if (!audioRef.current) {
        // Convert PCM base64 to WAV Blob URL
        const wavBlob = createWavBlobFromPcm(audioBase64);
        const url = URL.createObjectURL(wavBlob);
        const audio = new Audio(url);
        
        audio.onended = () => setIsPlaying(false);
        audio.onpause = () => setIsPlaying(false);
        audio.onplay = () => setIsPlaying(true);
        
        audioRef.current = audio;
        audio.play();
    } else {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
    }
  }, [audioBase64, isPlaying]);

  const handleDownloadAudio = () => {
    if (!audioBase64) return;
    const wavBlob = createWavBlobFromPcm(audioBase64);
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voiceover-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerateAvatar = async () => {
      if (avatarMode === 'upload' && !avatarImage) return;
      if (avatarMode === 'generate' && !avatarDescription) return;

      setIsLoading(true);
      try {
          if (avatarMode === 'generate') {
              const avatarUrl = await generateThumbnailImage("Portrait of " + avatarDescription, "1:1");
              setAvatarImage(avatarUrl);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsLoading(false);
      }
  };

  const handleGenerateVideo = async () => {
    setIsLoading(true);
    setVeoError(null);
    try {
        const hasKey = await checkVeoKey();
        if (!hasKey) {
            await requestVeoKey();
        }

        let prompt = `Video about ${topic}. ${tone} tone. 1080p resolution.`;
        if (videoType === 'talking_avatar' && avatarImage) {
            prompt = `Talking head video of a character based on the provided image. They are speaking the following: "${script.substring(0, 100)}...". Maintain consistent face.`;
        }

        const url = await generateVideo(prompt, '1080p', '16:9', videoType === 'talking_avatar' ? avatarImage || undefined : undefined);
        if (url) {
            setVideoUrl(url);
        } else {
            throw new Error("No video URL returned");
        }
    } catch (e: any) {
        console.error(e);
        setVeoError(e.message || "Video generation failed.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-20">
      
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800 -z-10 rounded-full"></div>
        {steps.map((step) => {
            const isCompleted = step.id < currentStep;
            const isActive = step.id === currentStep;
            return (
                <div key={step.id} className={`flex flex-col items-center gap-2 transition-all duration-300 ${isActive ? 'scale-110' : 'opacity-70'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-colors ${
                        isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                        isActive ? 'bg-dark-950 border-brand-500 text-brand-500 shadow-[0_0_15px_rgba(20,184,166,0.5)]' : 
                        'bg-dark-900 border-gray-700 text-gray-500'
                    }`}>
                        {isCompleted ? <CheckCircle size={24} /> : <step.icon size={24} />}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-white' : 'text-gray-500'}`}>{step.title}</span>
                </div>
            );
        })}
      </div>

      {/* --- STEP 1: VIRAL CONCEPT ENGINE --- */}
      {currentStep === 1 && (
        <div className="bg-dark-800 border border-gray-800 rounded-2xl p-8 shadow-2xl space-y-8 relative">
            
            {/* Step 1 Header with Back to Dashboard */}
            <div className="flex justify-between items-start mb-4">
                <div className="text-center flex-1">
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                        <TrendingUp className="text-brand-500" /> Viral Video Ideas Generator
                    </h2>
                    <p className="text-gray-400">Identify trending hooks and generate high-retention concepts.</p>
                </div>
                {onBack && (
                    <button onClick={onBack} className="absolute top-8 right-8 text-gray-500 hover:text-white flex items-center gap-2 text-sm">
                        <Home size={16} /> Exit
                    </button>
                )}
            </div>
            
            {/* Input & Mode Selection */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-bold text-gray-400 mb-2 uppercase">Topic / Niche</label>
                        <textarea
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="w-full bg-dark-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none h-24 resize-none transition-all"
                            placeholder="e.g. Artificial Intelligence, Travel Hacks, Mystery Stories..."
                        />
                    </div>
                    <div className="w-full md:w-1/3 space-y-4">
                        <button 
                            onClick={() => handleGenerateViralIdeas('standard')}
                            disabled={isLoading || !topic}
                            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-900/20 transition-all"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />}
                            Generate Ideas
                        </button>
                        <button 
                            onClick={() => handleGenerateViralIdeas('super-viral')}
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 transition-all animate-pulse-slow"
                        >
                            <Zap size={18} fill="currentColor" />
                            AI Super Viral Mode
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Video Format</label>
                        <div className="relative">
                            <select 
                                value={videoType}
                                onChange={(e) => handleTypeChange(e.target.value)}
                                className="w-full bg-dark-900 border border-gray-700 rounded-xl px-4 py-3 text-white appearance-none focus:border-brand-500 outline-none"
                            >
                                {videoTypes.map((type) => (
                                    <option key={type.id} value={type.id}>{type.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Language</label>
                        <select 
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full bg-dark-900 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-brand-500"
                        >
                            <optgroup label="Top Languages">
                                {LANGUAGES.International.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                            </optgroup>
                            <optgroup label="Indian Languages">
                                {LANGUAGES["Indian Regional"].map(lang => <option key={lang} value={lang}>{lang}</option>)}
                            </optgroup>
                        </select>
                    </div>
                </div>
            </div>

            {/* Viral Ideas Results Grid */}
            {viralIdeas.length > 0 && (
                <div className="grid grid-cols-1 gap-6 animate-slide-up mt-8">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="text-yellow-400" /> Top Viral Opportunities
                    </h3>
                    {viralIdeas.map((idea, idx) => (
                        <div key={idx} className="bg-dark-950 border border-gray-700 rounded-xl p-6 hover:border-brand-500 transition-colors group relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-gray-800 text-xs px-3 py-1 rounded-bl-xl border-l border-b border-gray-700 font-mono text-gray-400">
                                {idea.platform}
                            </div>
                            
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-3">
                                    <h4 className="text-xl font-bold text-white group-hover:text-brand-400 transition-colors">{idea.title}</h4>
                                    <p className="text-gray-400 text-sm">{idea.description}</p>
                                    
                                    <div className="bg-brand-900/20 border border-brand-500/30 rounded-lg p-3">
                                        <p className="text-xs font-bold text-brand-400 uppercase mb-1">Hook (First 3 Sec)</p>
                                        <p className="text-white text-sm italic">"{idea.hook}"</p>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {idea.retentionScenes.slice(0, 2).map((scene, sIdx) => (
                                            <span key={sIdx} className="text-[10px] bg-dark-900 border border-gray-700 px-2 py-1 rounded text-gray-300">
                                                🎬 {scene}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="w-full md:w-48 flex flex-col gap-3 border-l border-gray-800 pl-6 border-t md:border-t-0 pt-4 md:pt-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500 uppercase font-bold">Viral Score</span>
                                        <span className={`text-sm font-bold ${idea.viralScore > 85 ? 'text-green-400' : 'text-yellow-400'}`}>{idea.viralScore}/100</span>
                                    </div>
                                    <div className="w-full bg-dark-900 rounded-full h-1.5">
                                        <div className={`h-full rounded-full ${idea.viralScore > 85 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${idea.viralScore}%` }}></div>
                                    </div>

                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-gray-500 uppercase font-bold">Views/Hr</span>
                                        <span className="text-sm font-bold text-white flex items-center gap-1"><BarChart3 size={12}/> {idea.estimatedViews}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500 uppercase font-bold">Monetization</span>
                                        <span className="text-sm font-bold text-green-400 flex items-center gap-1"><DollarSign size={12}/> {idea.monetizationScore}</span>
                                    </div>

                                    <button 
                                        onClick={() => handleSelectIdea(idea)}
                                        className="mt-auto w-full bg-white hover:bg-gray-200 text-black font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                                    >
                                        Use This Idea <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Action Bar: Auto-Generate vs Manual Skip - ALWAYS VISIBLE */}
            <div className="mt-8 border-t border-gray-800 pt-6">
                <div className="flex gap-4">
                     <button 
                        onClick={handleGenerateScript}
                        disabled={isLoading || !topic}
                        className="flex-1 bg-dark-700 hover:bg-dark-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading && !viralIdeas.length ? <Loader2 className="animate-spin" /> : <FileText size={18} />}
                        Auto-Write Script
                    </button>
                    <button 
                        onClick={handleSkipToScript}
                        className="flex-1 border border-gray-700 hover:bg-dark-800 text-gray-400 hover:text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                        Write Manually / Skip <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- STEP 2: SCRIPT & VOICE SELECT --- */}
      {currentStep === 2 && (
        <div className="bg-dark-800 border border-gray-800 rounded-2xl p-8 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <CheckCircle className="text-green-500" /> Review & Audio Setup
                </h2>
            </div>
            
            {/* --- AUDIO CONFIGURATION PANEL --- */}
            <div className="mb-6 bg-dark-950 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Settings2 size={18} className="text-brand-500" />
                    <h3 className="font-bold text-white text-sm uppercase tracking-wide">Voice Generation Settings</h3>
                </div>

                {/* Vocal Mode Switcher */}
                <div className="flex gap-4 mb-6">
                    <button 
                        onClick={() => setVocalMode('single')}
                        className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                            vocalMode === 'single' 
                            ? 'bg-brand-600 text-white border-brand-500 shadow-lg shadow-brand-900/20' 
                            : 'bg-dark-900 text-gray-400 border-gray-800 hover:bg-dark-800'
                        }`}
                    >
                        <Mic2 size={18} />
                        <div className="text-left">
                            <div className="text-sm font-bold">Single Narrator</div>
                            <div className="text-[10px] opacity-70">One voice reads entire script</div>
                        </div>
                    </button>
                    <button 
                        onClick={() => setVocalMode('multi')}
                        disabled={detectedSpeakers.length < 2}
                        className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                            vocalMode === 'multi' 
                            ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-900/20' 
                            : detectedSpeakers.length < 2 
                                ? 'bg-dark-900 text-gray-600 border-gray-800 cursor-not-allowed'
                                : 'bg-dark-900 text-gray-400 border-gray-800 hover:bg-dark-800'
                        }`}
                    >
                        <Users size={18} />
                        <div className="text-left">
                            <div className="text-sm font-bold">Multi-Speaker Cast</div>
                            <div className="text-[10px] opacity-70">
                                {detectedSpeakers.length < 2 ? "Requires dialogue in script" : "Distinct voice for each character"}
                            </div>
                        </div>
                    </button>
                </div>

                {/* MODE: MULTI SPEAKER */}
                {vocalMode === 'multi' && detectedSpeakers.length > 0 && (
                    <div className="animate-fade-in">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                Cast Members ({detectedSpeakers.length})
                            </h4>
                            <button onClick={randomizeCast} className="text-xs flex items-center gap-1 text-brand-400 hover:text-brand-300">
                                <Shuffle size={12}/> Shuffle Voices
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {detectedSpeakers.map((speaker, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-dark-900 p-3 rounded-lg border border-gray-800 shadow-sm">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${speakerGenderMap[speaker] === 'Male' ? 'bg-blue-900/30 text-blue-400' : 'bg-pink-900/30 text-pink-400'}`}>
                                        {speaker.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white mb-1 truncate">{speaker}</p>
                                        <div className="flex gap-2">
                                            <select 
                                                value={speakerGenderMap[speaker]} 
                                                onChange={(e) => updateSpeakerGender(speaker, e.target.value as 'Male'|'Female')}
                                                className="bg-dark-950 text-[10px] text-gray-400 border border-gray-700 rounded px-2 py-1 outline-none focus:border-brand-500"
                                            >
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                            <select 
                                                value={speakerVoiceMap[speaker]}
                                                onChange={(e) => setSpeakerVoiceMap(prev => ({...prev, [speaker]: e.target.value}))}
                                                className="bg-dark-950 text-[10px] text-white font-medium border border-gray-700 rounded px-2 py-1 outline-none focus:border-brand-500 flex-1"
                                            >
                                                {VOICE_DEFINITIONS.filter(v => v.gender === speakerGenderMap[speaker]).map(v => (
                                                    <option key={v.name} value={v.name}>{v.name} ({v.style})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* MODE: SINGLE SPEAKER */}
                {vocalMode === 'single' && (
                    <div className="animate-fade-in flex items-center gap-4 bg-dark-900 p-4 rounded-xl border border-gray-800">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0 ${singleVoiceGender === 'Male' ? 'bg-blue-900/30 text-blue-400' : 'bg-pink-900/30 text-pink-400'}`}>
                            <Mic2 size={24} />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Narrator Voice</label>
                            <div className="flex gap-3">
                                <select 
                                    value={singleVoiceGender} 
                                    onChange={(e) => {
                                        const g = e.target.value as 'Male' | 'Female';
                                        setSingleVoiceGender(g);
                                        const v = VOICE_DEFINITIONS.find(voice => voice.gender === g);
                                        if(v) setVoiceName(v.name);
                                    }}
                                    className="bg-dark-950 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-brand-500"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                                <select 
                                    value={voiceName}
                                    onChange={(e) => setVoiceName(e.target.value)}
                                    className="bg-dark-950 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-brand-500 flex-1"
                                >
                                    {VOICE_DEFINITIONS.filter(v => v.gender === singleVoiceGender).map(v => (
                                        <option key={v.name} value={v.name}>{v.name} - {v.style}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Review Script</label>
            <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="w-full h-[300px] bg-dark-900 border border-gray-700 rounded-xl p-6 text-white font-mono text-sm leading-relaxed focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none resize-none mb-6 custom-scrollbar"
                placeholder="Enter your script here..."
            />
            
            <div className="flex gap-4 mt-6">
                <button 
                    onClick={() => setCurrentStep(1)}
                    className="w-1/3 bg-dark-700 hover:bg-dark-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                    <ArrowLeft size={20} /> Back
                </button>
                <button 
                    onClick={handleGenerateVoice}
                    disabled={isLoading || !script}
                    className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-900/20 transition-all"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : <Mic size={20} />}
                    {isLoading ? 'Synthesizing Audio...' : 'Generate Voiceover'}
                </button>
            </div>
        </div>
      )}

      {/* --- STEP 3: VOICE --- */}
      {currentStep === 3 && (
        <div className="bg-dark-800 border border-gray-800 rounded-2xl p-8 shadow-2xl animate-slide-up text-center">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center justify-center gap-2">
                <Mic className="text-brand-500" /> Audio Studio
            </h2>
            
            <div className="bg-dark-900 rounded-2xl p-12 mb-8 border border-gray-700 relative overflow-hidden group">
                <div className="absolute inset-0 bg-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <div className="w-24 h-24 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand-500/30 relative">
                    {isPlaying ? (
                        <span className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></span>
                    ) : null}
                    <Volume2 size={40} className="text-white relative z-10" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">Audio Ready</h3>
                <p className="text-gray-400 mb-8 text-sm">High-quality AI voiceover generated successfully.</p>
                
                <div className="flex justify-center gap-4">
                    <button 
                        onClick={handlePreviewAudio}
                        className="bg-white text-dark-900 hover:bg-gray-200 px-8 py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                    >
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                        {isPlaying ? 'Pause Preview' : 'Play Preview'}
                    </button>
                    <button 
                         onClick={handleDownloadAudio}
                         className="bg-dark-800 text-white border border-gray-700 hover:bg-dark-700 px-8 py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                    >
                        <Download size={20} />
                        Download MP3
                    </button>
                </div>
            </div>

            <div className="flex gap-4">
                <button 
                    onClick={() => setCurrentStep(2)} 
                    className="flex-1 bg-dark-700 hover:bg-dark-600 text-white py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                    <ArrowLeft size={18} /> Back
                </button>
                <button 
                    onClick={() => setCurrentStep(videoType === 'talking_avatar' ? 4 : 5)} 
                    className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-brand-900/20 transition-all flex items-center justify-center gap-2"
                >
                    Next: {videoType === 'talking_avatar' ? 'Create Avatar' : 'Visuals'} <ArrowRight size={18} />
                </button>
            </div>
        </div>
      )}

      {/* --- STEP 4: AVATAR --- */}
      {currentStep === 4 && videoType === 'talking_avatar' && (
          <div className="bg-dark-800 border border-gray-800 rounded-2xl p-8 shadow-2xl animate-slide-up">
              <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <UserCircle2 className="text-pink-500" /> Talking Avatar Setup
                  </h2>
                  <div className="bg-dark-900 p-1 rounded-lg flex text-xs font-bold">
                      <button 
                        onClick={() => setAvatarMode('generate')}
                        className={`px-4 py-2 rounded-md transition-all ${avatarMode === 'generate' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'}`}
                      >
                          Generate AI
                      </button>
                      <button 
                        onClick={() => setAvatarMode('upload')}
                        className={`px-4 py-2 rounded-md transition-all ${avatarMode === 'upload' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'}`}
                      >
                          Upload Image
                      </button>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                      {avatarMode === 'generate' ? (
                          <div>
                              <label className="block text-sm font-bold text-gray-400 mb-2">Describe Avatar Appearance</label>
                              <textarea 
                                value={avatarDescription}
                                onChange={(e) => setAvatarDescription(e.target.value)}
                                className="w-full bg-dark-900 border border-gray-700 rounded-xl p-4 text-white h-32 resize-none focus:border-pink-500 outline-none"
                                placeholder="e.g. A professional news anchor in a modern studio, wearing a blue suit..."
                              />
                          </div>
                      ) : (
                          <div 
                            onClick={() => avatarInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-700 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:border-pink-500 hover:bg-dark-900 transition-colors"
                          >
                              <ImagePlus size={32} className="text-gray-500 mb-2" />
                              <p className="text-gray-400 text-sm">Click to upload face image</p>
                              <input 
                                ref={avatarInputRef}
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if(file) {
                                        const reader = new FileReader();
                                        reader.onload = () => setAvatarImage(reader.result as string);
                                        reader.readAsDataURL(file);
                                    }
                                }}
                              />
                          </div>
                      )}

                      <button 
                        onClick={handleGenerateAvatar}
                        disabled={isLoading || (avatarMode === 'generate' && !avatarDescription)}
                        className="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                      >
                          {isLoading ? <Loader2 className="animate-spin" /> : (avatarMode === 'generate' ? <Sparkles size={18} /> : <UploadCloud size={18} />)}
                          {avatarMode === 'generate' ? 'Generate Character' : 'Confirm Upload'}
                      </button>
                  </div>

                  <div className="flex justify-center">
                      <div className="relative w-64 h-64 bg-black rounded-2xl border-2 border-gray-800 overflow-hidden flex items-center justify-center shadow-2xl">
                          {avatarImage ? (
                              <img src={avatarImage} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                              <UserCircle2 size={64} className="text-gray-800" />
                          )}
                          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4">
                              <p className="text-white text-xs font-bold text-center">Target Character</p>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-800 flex justify-between items-center">
                  <button 
                    onClick={() => setCurrentStep(3)}
                    className="text-gray-500 hover:text-white flex items-center gap-2 px-4 py-2 transition-colors"
                  >
                      <ArrowLeft size={18} /> Back
                  </button>
                  <button 
                    onClick={() => setCurrentStep(5)}
                    disabled={!avatarImage}
                    className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      Continue to Video <ArrowRight size={18} />
                  </button>
              </div>
          </div>
      )}

      {/* --- STEP 5: VIDEO GENERATION --- */}
      {currentStep === 5 && (
        <div className="bg-dark-800 border border-gray-800 rounded-2xl p-8 shadow-2xl animate-slide-up text-center relative">
            {/* Back Button for Final Step */}
            <button 
                onClick={() => setCurrentStep(videoType === 'talking_avatar' ? 4 : 3)} 
                className="absolute top-8 left-8 text-gray-500 hover:text-white flex items-center gap-2 transition-colors"
            >
                <ArrowLeft size={18} /> Back
            </button>

            <h2 className="text-2xl font-bold text-white mb-4 flex items-center justify-center gap-2">
                <Film className="text-brand-500" /> Final Production
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Ready to render your {videoType} video using Google Veo (1080p).
            </p>

            <div className="flex justify-center mb-8">
                <button 
                    onClick={handleGenerateVideo}
                    disabled={isLoading || videoUrl !== null}
                    className="bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 text-white font-bold py-4 px-12 rounded-full text-lg shadow-xl shadow-brand-900/20 flex items-center gap-3 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
                    {isLoading ? 'Rendering Video...' : videoUrl ? 'Video Ready!' : 'Generate 4K Video'}
                </button>
            </div>

            {veoError && (
                <div className="max-w-md mx-auto mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-xl flex items-start gap-3 text-left">
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-red-200 text-sm font-bold mb-1">Generation Failed</p>
                        <p className="text-red-300 text-xs">{veoError}</p>
                        {veoError.includes('Key') && (
                            <button onClick={requestVeoKey} className="mt-2 text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded">
                                Select API Key
                            </button>
                        )}
                    </div>
                </div>
            )}

            {videoUrl && (
                <div className="max-w-3xl mx-auto animate-fade-in">
                    <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800 mb-6">
                        <video 
                            src={videoUrl} 
                            controls 
                            className="w-full h-full object-contain"
                            autoPlay
                        />
                    </div>
                    <div className="flex justify-center gap-4">
                        <button className="bg-dark-700 hover:bg-dark-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2">
                            <UploadCloud size={20} /> Download MP4
                        </button>
                        <button className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2">
                            <Youtube size={20} /> Publish to YouTube
                        </button>
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default VideoWizard;
