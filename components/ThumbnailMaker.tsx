
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, History, Trash2, RefreshCw, Loader2, Monitor, Smartphone, Download, Maximize2, AlertCircle, Square, RectangleVertical, Copy, Undo, Redo, X, ChevronLeft, ChevronRight, ImagePlus, TrendingUp, Activity, Type, UserCircle, Smile, Eraser, Wand2, Palette, Move, MousePointer2, Bold, Edit2 } from 'lucide-react';
import { generateThumbnailImage, editThumbnailImage } from '../services/geminiService';

interface ThumbnailHistoryItem {
    id: string;
    topic: string;
    imageUrl: string;
    language: string;
    aspectRatio: string;
    createdAt: Date;
    ctrScore: number; 
}

interface TextOverlay {
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: string; // 'normal' | 'bold'
}

// Extensive Font List for Thumbnails (Updated with Indian & Int'l Fonts)
const FONT_OPTIONS = [
    // --- English / Latin Display ---
    "Abril Fatface", "Anton", "Archivo Black", "Bangers", "Bebas Neue", "Cabin", "Cairo", 
    "Catamaran", "Caveat", "Comfortaa", "Comic Neue", "Concert One", "Cookie", "Courgette", 
    "Creepster", "Dancing Script", "Dosis", "Eb Garamond", "Exo 2", "Fjalla One", "Francois One", 
    "Fredoka One", "Gloria Hallelujah", "Great Vibes", "Heebo", "Hind", "Impact", "Indie Flower", 
    "Josefin Sans", "Kanit", "Kaushan Script", "Lato", "Lilita One", "Lobster", "Lora", 
    "Merriweather", "Monoton", "Montserrat", "Mukta", "Noto Sans", "Nunito", "Open Sans", 
    "Orbitron", "Oswald", "Oxygen", "Pacifico", "Patrick Hand", "Permanent Marker", 
    "Playfair Display", "Poppins", "Press Start 2P", "Prompt", "PT Sans", "PT Serif", 
    "Quicksand", "Raleway", "Righteous", "Roboto", "Roboto Condensed", "Rubik", "Russo One", 
    "Sacramento", "Satisfy", "Shadows Into Light", "Signika", "Special Elite", "Teko", 
    "Titillium Web", "Ubuntu", "Varela Round", "Work Sans", "Yanone Kaffeesatz", "Zilla Slab",
    
    // --- Indian Languages ---
    "Rozha One", "Kalam", "Tiro Devanagari Hindi", // Hindi / Marathi
    "Shrikhand", "Baloo Bhai 2", // Gujarati
    "Kavoon", "Baloo Thambi 2", // Tamil
    "Ramabhadra", "Baloo 2", // Telugu
    "Baloo Tamma 2", // Kannada
    "Galada", "Baloo Da 2", // Bengali
    "Baloo Paaji 2", // Punjabi

    // --- International ---
    "Noto Sans Arabic", // Arabic
    "Noto Sans JP", // Japanese
    "Noto Sans KR" // Korean
];

const ThumbnailMaker: React.FC = () => {
    // --- Core State ---
    const [topic, setTopic] = useState('');
    const [language, setLanguage] = useState('English (US)');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [ctrScore, setCtrScore] = useState<number | null>(null);
    const [history, setHistory] = useState<ThumbnailHistoryItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const faceInputRef = useRef<HTMLInputElement>(null); // Specific ref for face upload
    const editorImageRef = useRef<HTMLImageElement>(null); // Ref for the image in editor
    const maskCanvasRef = useRef<HTMLCanvasElement>(null); // Ref for mask drawing

    // --- Editor Modal State ---
    const [viewingItem, setViewingItem] = useState<ThumbnailHistoryItem | null>(null);
    const [activeTool, setActiveTool] = useState<'none' | 'text' | 'faceswap' | 'sticker' | 'refine' | 'erase'>('none');
    const [isEditingAI, setIsEditingAI] = useState(false); // Loading state for Refine/FaceSwap
    const [overlays, setOverlays] = useState<TextOverlay[]>([]);
    const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    
    // Editor Specific Config (Defaults)
    const [textConfig, setTextConfig] = useState({ 
        color: '#ffffff', 
        fontSize: 48, 
        fontFamily: 'Impact',
        fontWeight: 'bold'
    });
    const [faceSwapImage, setFaceSwapImage] = useState<string | null>(null);
    const [refinePrompt, setRefinePrompt] = useState('');
    const [erasePrompt, setErasePrompt] = useState('');
    
    // Drawing/Masking State
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(30);
    const [hasDrawnMask, setHasDrawnMask] = useState(false);

    // --- UNDO / REDO HISTORY STATE ---
    const [pastStates, setPastStates] = useState<{imageUrl: string, overlays: TextOverlay[]}[]>([]);
    const [futureStates, setFutureStates] = useState<{imageUrl: string, overlays: TextOverlay[]}[]>([]);

    // --- Load History with Hydration ---
    useEffect(() => {
        try {
            const saved = localStorage.getItem('thumbnail_history');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    // HYDRATION FIX: Convert string dates back to Date objects
                    const hydrated = parsed.map((item: any) => ({
                        ...item,
                        createdAt: new Date(item.createdAt)
                    }));
                    setHistory(hydrated);
                }
            }
        } catch (e) {
            console.warn("Failed to load history", e);
        }
    }, []);

    // --- Save History ---
    useEffect(() => {
        try {
            const limitedHistory = history.slice(0, 10);
            localStorage.setItem('thumbnail_history', JSON.stringify(limitedHistory));
        } catch (e) {
            console.warn("Quota exceeded for history");
        }
    }, [history]);

    // --- Canvas Resize Sync ---
    useEffect(() => {
        if (activeTool === 'erase' && maskCanvasRef.current && editorImageRef.current) {
            const canvas = maskCanvasRef.current;
            const img = editorImageRef.current;
            // Match resolution to natural image size for quality mask
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            // Clear previous context
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            setHasDrawnMask(false);
        }
    }, [activeTool, viewingItem]);

    // --- UNDO / REDO LOGIC ---
    const saveState = () => {
        if (!viewingItem) return;
        // Push current state to past
        setPastStates(prev => [...prev, {
            imageUrl: viewingItem.imageUrl,
            overlays: JSON.parse(JSON.stringify(overlays))
        }]);
        // Clear future since we diverged
        setFutureStates([]);
    };

    const undo = () => {
        if (pastStates.length === 0 || !viewingItem) return;
        const previous = pastStates[pastStates.length - 1];
        const newPast = pastStates.slice(0, -1);
        
        // Push current to future
        setFutureStates(prev => [{
            imageUrl: viewingItem.imageUrl,
            overlays: JSON.parse(JSON.stringify(overlays))
        }, ...prev]);
        
        // Restore
        setViewingItem(prev => prev ? { ...prev, imageUrl: previous.imageUrl } : null);
        setOverlays(previous.overlays);
        setPastStates(newPast);

        // Update main history list if image URL changed
        if (previous.imageUrl !== viewingItem.imageUrl) {
             setHistory(prev => prev.map(item => item.id === viewingItem.id ? { ...item, imageUrl: previous.imageUrl } : item));
        }
    };

    const redo = () => {
        if (futureStates.length === 0 || !viewingItem) return;
        const next = futureStates[0];
        const newFuture = futureStates.slice(1);
        
        // Push current to past
        setPastStates(prev => [...prev, {
            imageUrl: viewingItem.imageUrl,
            overlays: JSON.parse(JSON.stringify(overlays))
        }]);
        
        // Restore
        setViewingItem(prev => prev ? { ...prev, imageUrl: next.imageUrl } : null);
        setOverlays(next.overlays);
        setFutureStates(newFuture);

        // Update main history list if image URL changed
        if (next.imageUrl !== viewingItem.imageUrl) {
             setHistory(prev => prev.map(item => item.id === viewingItem.id ? { ...item, imageUrl: next.imageUrl } : item));
        }
    };

    // --- Handlers ---
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) {
                setError("Image size should be less than 4MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setReferenceImage(reader.result as string);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFaceSwapUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setFaceSwapImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    // --- Drawing Logic (Eraser Mask) ---
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        draw(e); // Draw initial point
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !maskCanvasRef.current || !editorImageRef.current) return;
        const canvas = maskCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Calculate Scale (Canvas Resolution vs CSS Display Size)
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        ctx.lineWidth = brushSize * scaleX; // Scale brush relative to image
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(255, 0, 0, 1)'; // Solid Red Mask
        
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        setHasDrawnMask(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        if (maskCanvasRef.current) {
            const ctx = maskCanvasRef.current.getContext('2d');
            ctx?.beginPath(); // Reset path
        }
    };

    const clearMask = () => {
        if (maskCanvasRef.current) {
            const ctx = maskCanvasRef.current.getContext('2d');
            ctx?.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
            setHasDrawnMask(false);
        }
    };

    const getMaskedImageBase64 = async (): Promise<string | null> => {
        if (!editorImageRef.current || !maskCanvasRef.current) return null;
        
        const img = editorImageRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if(!ctx) return null;

        // 1. Draw original image
        ctx.drawImage(img, 0, 0);
        
        // 2. Draw red mask on top
        ctx.drawImage(maskCanvasRef.current, 0, 0);
        
        return canvas.toDataURL('image/jpeg');
    };

    const handleGenerate = async () => {
        if (!topic) return;
        setIsGenerating(true);
        setGeneratedImage(null);
        setCtrScore(null);
        setError(null);

        try {
            const imageUrl = await generateThumbnailImage(topic, aspectRatio, language, referenceImage);
            if (!imageUrl) throw new Error("No image data returned.");

            setGeneratedImage(imageUrl);
            const simulatedCtr = Math.floor(Math.random() * (99 - 85) + 85);
            setCtrScore(simulatedCtr);

            const newItem: ThumbnailHistoryItem = {
                id: Date.now().toString(),
                topic: topic,
                imageUrl: imageUrl,
                language: language,
                aspectRatio: aspectRatio,
                createdAt: new Date(),
                ctrScore: simulatedCtr
            };
            setHistory(prev => [newItem, ...prev]);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to generate thumbnail.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAiEdit = async (action: 'refine' | 'faceswap' | 'erase') => {
        if (!viewingItem) return;
        if (action === 'faceswap' && !faceSwapImage) return;
        
        saveState(); // Save state before AI edit
        setIsEditingAI(true);
        setError(null); // Clear prev errors
        
        try {
            let additionalData = undefined;
            let sourceImage = viewingItem.imageUrl;

            if (action === 'refine') {
                additionalData = refinePrompt;
            } else if (action === 'faceswap') {
                additionalData = faceSwapImage || undefined;
            } else if (action === 'erase') {
                // Check if using Mask Mode or Text Mode
                if (hasDrawnMask) {
                    const maskedImage = await getMaskedImageBase64();
                    if (maskedImage) {
                        sourceImage = maskedImage;
                        additionalData = 'MASKED_RED'; // Special flag for service
                    }
                } else if (erasePrompt) {
                    additionalData = erasePrompt;
                } else {
                     throw new Error("Please describe what to erase or use the brush to paint over it.");
                }
            }
            
            const newImageUrl = await editThumbnailImage(sourceImage, action, additionalData);
            
            // Update the viewing item with the new image
            const updatedItem = { ...viewingItem, imageUrl: newImageUrl };
            setViewingItem(updatedItem);
            
            // Update history
            setHistory(prev => prev.map(item => item.id === viewingItem.id ? updatedItem : item));
            
            // UX: Reset tool state
            setActiveTool('none'); 
            setFaceSwapImage(null); 
            setRefinePrompt(''); 
            setErasePrompt(''); 
            clearMask(); 
        } catch (e: any) {
            // Clean Error Display
            let cleanMsg = e.message || "Unknown error";
            // Try to extract message if it's buried in a "Error: ..." string
            cleanMsg = cleanMsg.replace(/^Error:\s*/i, "").trim();
            
            setError(cleanMsg);
        } finally {
            setIsEditingAI(false);
        }
    };

    const addTextOverlay = () => {
        saveState();
        const id = Date.now().toString();
        const newOverlay: TextOverlay = {
            id: id,
            text: "DOUBLE CLICK TO EDIT",
            x: 50,
            y: 50,
            color: textConfig.color,
            fontSize: textConfig.fontSize,
            fontFamily: textConfig.fontFamily,
            fontWeight: textConfig.fontWeight
        };
        setOverlays([...overlays, newOverlay]);
        setSelectedOverlayId(id); // Auto-select new text
    };

    const updateSelectedOverlay = (key: keyof TextOverlay, value: any) => {
        if (selectedOverlayId) {
            setOverlays(prev => prev.map(o => o.id === selectedOverlayId ? { ...o, [key]: value } : o));
        } else {
            // If nothing selected, just update default config
            if (key in textConfig) {
                setTextConfig(prev => ({ ...prev, [key]: value }));
            }
        }
    };

    // Compositing Download Function
    const handleDownloadComposite = async () => {
        if (!viewingItem || !editorImageRef.current) return;
        setIsDownloading(true);

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not get canvas context");

            // 1. Setup Image
            const img = new Image();
            img.crossOrigin = "anonymous"; // Fix for tainted canvas
            img.src = viewingItem.imageUrl;
            await new Promise((resolve, reject) => { 
                img.onload = resolve; 
                img.onerror = reject;
            });

            // Set canvas to full resolution of the image
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            // Draw background
            ctx.drawImage(img, 0, 0);

            // 2. Calculate Scale Factor (Screen pixels vs Image pixels)
            const displayWidth = editorImageRef.current.width;
            const scaleFactor = img.naturalWidth / displayWidth;

            // 3. Draw Overlays
            overlays.forEach(overlay => {
                // Scale coordinates and size
                const x = overlay.x * scaleFactor;
                const y = overlay.y * scaleFactor;
                const fontSize = overlay.fontSize * scaleFactor;

                ctx.save();
                
                // Font Settings
                const weight = overlay.fontWeight === 'bold' ? 'bold' : 'normal';
                ctx.font = `${weight} ${fontSize}px "${overlay.fontFamily}", sans-serif`;
                ctx.fillStyle = overlay.color;
                ctx.textBaseline = 'top'; // Matches DOM default

                // Mimic the text-shadow effect (Stroke)
                ctx.strokeStyle = 'black';
                ctx.lineWidth = Math.max(2, fontSize / 15); // Dynamic stroke width
                ctx.lineJoin = 'round';
                ctx.miterLimit = 2;
                
                // Draw Stroke
                ctx.strokeText(overlay.text, x, y);
                // Draw Fill
                ctx.fillText(overlay.text, x, y);

                ctx.restore();
            });

            // 4. Trigger Download
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `thumbnail-${viewingItem.id}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (e) {
            console.error("Download failed", e);
            alert("Failed to generate composite download. Tainted canvas may be preventing export.");
        } finally {
            setIsDownloading(false);
        }
    };

    // Derived state for toolbar values
    const activeOverlay = overlays.find(o => o.id === selectedOverlayId);
    const currentFont = activeOverlay?.fontFamily || textConfig.fontFamily;
    const currentColor = activeOverlay?.color || textConfig.color;
    const currentFontSize = activeOverlay?.fontSize || textConfig.fontSize;
    const currentText = activeOverlay?.text || "";
    const currentWeight = activeOverlay?.fontWeight || textConfig.fontWeight;

    const clearHistory = () => {
        if (window.confirm("Are you sure?")) {
            setHistory([]);
            localStorage.removeItem('thumbnail_history');
        }
    };

    const ratioOptions = [
        { id: '16:9', label: '16:9 (YouTube)', icon: Monitor },
        { id: '9:16', label: '9:16 (Shorts)', icon: Smartphone },
        { id: '1:1', label: '1:1 (Post)', icon: Square },
        { id: '4:5', label: '4:5 (Portrait)', icon: RectangleVertical },
    ];

    const CtrBadge = ({ score, size = 'normal' }: { score: number, size?: 'normal' | 'large' }) => {
        const colorClass = score >= 90 ? 'text-green-400 border-green-500/50' : score >= 80 ? 'text-yellow-400 border-yellow-500/50' : 'text-red-400 border-red-500/50';
        const bgClass = score >= 90 ? 'bg-green-950/80' : score >= 80 ? 'bg-yellow-950/80' : 'bg-red-950/80';
        
        if (size === 'large') {
            return (
                <div className={`absolute top-4 right-4 ${bgClass} backdrop-blur-md border ${colorClass} px-4 py-2 rounded-xl flex items-center gap-3 shadow-xl z-20 animate-bounce-in`}>
                    <div className={`p-2 rounded-full bg-black/40 ${colorClass.split(' ')[0]}`}>
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-300 uppercase font-bold tracking-wider">Predictability Score</p>
                        <div className="flex items-baseline gap-1">
                            <p className={`text-3xl font-bold ${colorClass.split(' ')[0]}`}>{score}%</p>
                            <span className="text-xs text-gray-400 font-medium">CTR</span>
                        </div>
                    </div>
                </div>
            );
        }

        return (
             <div className={`absolute top-2 right-2 ${bgClass} backdrop-blur-sm border ${colorClass} px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-lg z-10`}>
                <Activity size={12} className={colorClass.split(' ')[0]} />
                <span className={`text-xs font-bold ${colorClass.split(' ')[0]}`}>{score}% CTR</span>
            </div>
        );
    };

    // --- MAIN RENDER ---
    return (
        <div className="min-h-full bg-[#0f111a] text-white p-6 md:p-10 font-sans animate-fade-in relative">
            {/* Header */}
            <div className="max-w-7xl mx-auto flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Sparkles size={18} className="text-white" />
                    </div>
                    <h1 className="text-xl font-medium text-gray-200">AI Thumbnail Studio</h1>
                </div>
                <div className="flex items-center gap-4 text-gray-400 text-sm">
                    <span className="bg-gray-800 px-3 py-1 rounded-full text-xs border border-gray-700 flex items-center gap-2">
                         <Monitor size={12} /> Device: Web
                    </span>
                    <button className="hover:text-white transition-colors" onClick={() => window.location.reload()}>
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                
                {/* LEFT COLUMN: INPUTS */}
                <div className="bg-[#161b2c] border border-gray-800 rounded-2xl p-8 shadow-lg">
                    <h2 className="text-2xl font-bold text-fuchsia-400 mb-8">1. Describe Your Thumbnail</h2>
                    
                    <div className="space-y-6">
                        {/* Topic Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Thumbnail Topic or Title</label>
                            <div className="relative">
                                <textarea 
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    className="w-full h-32 bg-[#0f111a] border border-gray-700 rounded-xl p-4 pr-12 text-white placeholder-gray-600 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none resize-none transition-all"
                                    placeholder="e.g. How to become a millionaire in 1 year"
                                />
                                <div className="absolute bottom-3 right-3">
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleImageUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 bg-[#23293b] hover:bg-[#2a3044] border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-all"
                                        title="Upload Reference Image"
                                    >
                                        <ImagePlus size={18} />
                                    </button>
                                </div>
                                {referenceImage && (
                                    <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/50 p-1 rounded border border-gray-700">
                                        <img src={referenceImage} className="w-8 h-8 rounded object-cover" alt="ref" />
                                        <button onClick={() => setReferenceImage(null)} className="text-red-400 hover:text-red-300 p-1"><X size={12}/></button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Language */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Language for Text</label>
                            <div className="relative">
                                <select 
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full bg-[#0f111a] border border-gray-700 rounded-xl p-4 text-white outline-none appearance-none focus:border-fuchsia-500 transition-all cursor-pointer"
                                >
                                    <optgroup label="Global Languages">
                                        <option>English (US)</option>
                                        <option>Spanish</option>
                                        <option>French</option>
                                        <option>German</option>
                                        <option>Hindi</option>
                                        <option>Arabic</option>
                                        <option>Japanese</option>
                                        <option>Chinese</option>
                                    </optgroup>
                                    <optgroup label="Indian Languages">
                                        <option>Hindi</option>
                                        <option>Marathi</option>
                                        <option>Tamil</option>
                                        <option>Telugu</option>
                                        <option>Bengali</option>
                                        <option>Gujarati</option>
                                        <option>Malayalam</option>
                                        <option>Kannada</option>
                                        <option>Punjabi</option>
                                    </optgroup>
                                </select>
                            </div>
                        </div>

                        {/* Aspect Ratio */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Aspect Ratio</label>
                            <div className="grid grid-cols-2 gap-3">
                                {ratioOptions.map((opt) => (
                                    <button 
                                        key={opt.id}
                                        onClick={() => setAspectRatio(opt.id)}
                                        className={`py-3 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                            aspectRatio === opt.id 
                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30' 
                                            : 'bg-[#23293b] text-gray-400 hover:bg-[#2a3044]'
                                        }`}
                                    >
                                        <opt.icon size={16} /> {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl flex items-start gap-3 animate-fade-in">
                                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                                <div className="flex-1"><p className="text-red-300 text-sm">{error}</p></div>
                            </div>
                        )}

                        {/* Generate Button */}
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating || !topic}
                            className="w-full mt-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-fuchsia-900/20 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={20} fill="currentColor" />}
                            {isGenerating ? 'Generating Magic...' : 'Generate Thumbnail'}
                        </button>
                    </div>
                </div>

                {/* RIGHT COLUMN: RESULT */}
                <div className="bg-[#161b2c] border border-gray-800 rounded-2xl p-8 shadow-lg flex flex-col">
                    <h2 className="text-2xl font-bold text-fuchsia-400 mb-8">2. Your AI-Generated Result</h2>
                    
                    <div 
                        className={`flex-1 flex items-center justify-center bg-[#0f111a] rounded-xl border-2 border-dashed border-gray-800 overflow-hidden relative group min-h-[300px] ${generatedImage ? 'cursor-pointer hover:border-fuchsia-500 transition-colors' : 'p-4'}`}
                        onClick={() => {
                            if (generatedImage) {
                                setViewingItem({
                                    id: 'current',
                                    topic: topic,
                                    imageUrl: generatedImage,
                                    language: language,
                                    aspectRatio: aspectRatio,
                                    createdAt: new Date(),
                                    ctrScore: ctrScore || 88
                                });
                                setOverlays([]); // Reset overlays for new edit
                                setSelectedOverlayId(null);
                                setPastStates([]); // Reset history
                                setFutureStates([]);
                            }
                        }}
                    >
                        {generatedImage ? (
                            <div className={`relative w-full h-full flex items-center justify-center max-h-[600px]`}>
                                <img src={generatedImage} alt="Generated Thumbnail" className="max-w-full max-h-full object-contain shadow-2xl" />
                                {ctrScore && <CtrBadge score={ctrScore} size="large" />}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-full text-white">
                                        <Maximize2 size={32} />
                                        <span className="block text-xs mt-1 font-bold">EDIT</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-600 p-8">
                                {isGenerating ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader2 size={48} className="animate-spin text-fuchsia-500" />
                                        <p className="text-gray-400 animate-pulse">Creating your masterpiece...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 bg-[#1c2236] rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Sparkles size={32} className="opacity-20" />
                                        </div>
                                        <p>Enter a topic and click generate to see the result here.</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* HISTORY SECTION */}
            <div className="max-w-7xl mx-auto mt-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-200 flex items-center gap-2">
                        <History size={20} className="text-fuchsia-500" /> Recent History
                    </h3>
                    {history.length > 0 && (
                        <button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-300 underline">
                            Clear History
                        </button>
                    )}
                </div>
                
                {history.length === 0 ? (
                    <div className="text-center py-12 border border-gray-800 rounded-xl bg-[#161b2c] text-gray-500 text-sm">
                        No recent thumbnails found.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {history.map((item) => (
                            <div 
                                key={item.id} 
                                className="bg-[#161b2c] border border-gray-800 rounded-xl overflow-hidden group hover:border-fuchsia-500 transition-all cursor-pointer relative"
                                onClick={() => {
                                    setViewingItem(item);
                                    setOverlays([]);
                                    setSelectedOverlayId(null);
                                    setPastStates([]);
                                    setFutureStates([]);
                                }}
                            >
                                <div className="aspect-video bg-[#0f111a] relative">
                                    <img src={item.imageUrl} alt={item.topic} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    <CtrBadge score={item.ctrScore || 85} />
                                </div>
                                <div className="p-3">
                                    <p className="text-xs text-gray-400 line-clamp-1 font-medium group-hover:text-white">{item.topic}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-[10px] text-gray-500">
                                            {item.language} • {item.createdAt ? item.createdAt.toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- EDITOR MODAL --- */}
            {viewingItem && (
                <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md animate-fade-in">
                    
                    {/* TOOLBAR */}
                    <div className="h-16 bg-[#161b2c] border-b border-gray-800 flex items-center justify-between px-6">
                        <div className="flex items-center gap-4">
                            <button 
                                className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors flex items-center gap-2" 
                                onClick={handleDownloadComposite}
                                disabled={isDownloading}
                            >
                                {isDownloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                                {isDownloading && <span className="text-xs">Saving...</span>}
                            </button>
                            <button className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors" onClick={() => navigator.clipboard.writeText(viewingItem.topic)}>
                                <Copy size={20} />
                            </button>
                            <div className="h-6 w-px bg-gray-700 mx-2"></div>

                            {/* UNDO / REDO */}
                            <button onClick={undo} disabled={pastStates.length === 0} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 transition-colors" title="Undo">
                                <Undo size={20} />
                            </button>
                            <button onClick={redo} disabled={futureStates.length === 0} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 transition-colors" title="Redo">
                                <Redo size={20} />
                            </button>

                            <div className="h-6 w-px bg-gray-700 mx-2"></div>
                            
                            {/* Editor Tools */}
                            <button 
                                onClick={() => setActiveTool(activeTool === 'refine' ? 'none' : 'refine')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${activeTool === 'refine' ? 'bg-fuchsia-600 text-white' : 'bg-fuchsia-600/20 text-fuchsia-400 hover:bg-fuchsia-600/30'}`}
                            >
                                <Wand2 size={16} />
                                Refine
                            </button>
                            <button 
                                onClick={() => setActiveTool(activeTool === 'faceswap' ? 'none' : 'faceswap')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${activeTool === 'faceswap' ? 'bg-fuchsia-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                            >
                                <UserCircle size={16} /> Face Swap
                            </button>
                            <button 
                                onClick={() => setActiveTool(activeTool === 'erase' ? 'none' : 'erase')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${activeTool === 'erase' ? 'bg-fuchsia-600 text-white' : 'bg-fuchsia-600/20 text-fuchsia-400 hover:bg-fuchsia-600/30'}`}
                            >
                                <Eraser size={16} />
                                Eraser
                            </button>
                            <button 
                                onClick={() => setActiveTool(activeTool === 'text' ? 'none' : 'text')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${activeTool === 'text' ? 'bg-fuchsia-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                            >
                                <Type size={16} /> Text
                            </button>
                            <button 
                                onClick={() => setActiveTool(activeTool === 'sticker' ? 'none' : 'sticker')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${activeTool === 'sticker' ? 'bg-fuchsia-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                            >
                                <Smile size={16} /> Sticker
                            </button>
                        </div>
                        <button onClick={() => setViewingItem(null)} className="bg-red-600/80 p-2 rounded-lg text-white hover:bg-red-600 transition-colors"><X size={24} /></button>
                    </div>
                    
                    {/* Editor Error Message */}
                    {error && (
                         <div className="bg-red-900/90 border-b border-red-500/50 px-6 py-2 flex items-center justify-center gap-2 animate-fade-in absolute w-full top-16 z-40">
                             <AlertCircle size={16} className="text-red-300" />
                             <p className="text-white text-sm font-medium">{error}</p>
                             <button onClick={() => setError(null)} className="ml-4 text-white/60 hover:text-white"><X size={14}/></button>
                         </div>
                    )}

                    {/* SUB-TOOLBAR (Contextual) */}
                    {activeTool !== 'none' && (
                        <div className="h-16 bg-[#0f111a] border-b border-gray-800 flex items-center px-6 gap-6 animate-slide-down relative z-30">
                            {activeTool === 'refine' && (
                                <div className="flex items-center gap-4 w-full">
                                     <div className="flex items-center gap-2 flex-1">
                                        <Edit2 size={16} className="text-fuchsia-400" />
                                        <input 
                                            type="text" 
                                            value={refinePrompt}
                                            onChange={(e) => setRefinePrompt(e.target.value)}
                                            placeholder="Describe changes (e.g. 'Make it darker', 'Add blue fire')"
                                            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm w-full focus:border-fuchsia-500 outline-none"
                                            onFocus={saveState}
                                        />
                                     </div>
                                     <button 
                                        onClick={() => handleAiEdit('refine')}
                                        disabled={isEditingAI}
                                        className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 whitespace-nowrap"
                                    >
                                        {isEditingAI ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                        {isEditingAI ? 'Refining...' : 'Apply Changes'}
                                    </button>
                                </div>
                            )}
                            {activeTool === 'erase' && (
                                <div className="flex items-center gap-4 w-full">
                                        <div className="flex items-center gap-3 border-r border-gray-700 pr-4 mr-2">
                                             <span className="text-xs text-gray-400 font-bold">Brush</span>
                                             <input 
                                                type="range" 
                                                min="10" 
                                                max="100" 
                                                value={brushSize} 
                                                onChange={(e) => setBrushSize(Number(e.target.value))} 
                                                className="w-24 accent-fuchsia-500"
                                             />
                                             <button 
                                                onClick={clearMask} 
                                                className="text-xs text-red-400 hover:text-white underline ml-2"
                                                disabled={!hasDrawnMask}
                                             >
                                                 Clear
                                             </button>
                                        </div>

                                        <div className="flex items-center gap-2 flex-1">
                                            <input 
                                                type="text" 
                                                value={erasePrompt}
                                                onChange={(e) => setErasePrompt(e.target.value)}
                                                placeholder="Or type what to erase (e.g. 'lamp')"
                                                className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm w-full focus:border-fuchsia-500 outline-none"
                                                disabled={hasDrawnMask}
                                                onFocus={saveState}
                                            />
                                        </div>
                                        
                                        <button 
                                            onClick={() => handleAiEdit('erase')}
                                            disabled={isEditingAI || (!erasePrompt.trim() && !hasDrawnMask)}
                                            className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 whitespace-nowrap"
                                        >
                                            {isEditingAI ? <Loader2 className="animate-spin" size={16} /> : <Eraser size={16} />}
                                            {isEditingAI ? 'Erasing...' : 'Magic Erase'}
                                        </button>
                                </div>
                            )}
                            {activeTool === 'faceswap' && (
                                <div className="flex items-center gap-4 w-full">
                                    <div className="flex items-center gap-3 bg-gray-800 p-1.5 rounded-lg pr-4">
                                        <button 
                                            onClick={() => faceInputRef.current?.click()}
                                            className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded text-xs font-medium"
                                        >
                                            Upload Face
                                        </button>
                                        <input 
                                            ref={faceInputRef}
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleFaceSwapUpload} 
                                            className="hidden"
                                        />
                                        {faceSwapImage ? (
                                            <div className="flex items-center gap-2">
                                                <img src={faceSwapImage} className="w-8 h-8 rounded-full object-cover border border-fuchsia-500" alt="Face" />
                                                <button onClick={() => setFaceSwapImage(null)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-500 italic">No face selected</span>
                                        )}
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleAiEdit('faceswap')}
                                        disabled={!faceSwapImage || isEditingAI}
                                        className="ml-auto bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all"
                                    >
                                        {isEditingAI ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />} 
                                        {isEditingAI ? 'Swapping Face...' : 'Swap Face Now'}
                                    </button>
                                </div>
                            )}
                            {activeTool === 'text' && (
                                <div className="flex items-center gap-4 w-full">
                                    <input 
                                        type="text" 
                                        value={currentText} 
                                        onChange={(e) => updateSelectedOverlay('text', e.target.value)}
                                        placeholder={selectedOverlayId ? "Edit text content..." : "Select text to edit"}
                                        className="bg-gray-800 text-white p-2 rounded text-sm border border-gray-700 w-48"
                                        disabled={!selectedOverlayId}
                                        onFocus={saveState}
                                    />
                                    {/* FONT SELECTOR WITH 50+ FONTS */}
                                    <select 
                                        value={currentFont} 
                                        onChange={(e) => { saveState(); updateSelectedOverlay('fontFamily', e.target.value); }} 
                                        className="bg-gray-800 text-white p-2 rounded text-sm border border-gray-700 max-w-[150px]"
                                        style={{ fontFamily: currentFont }}
                                    >
                                        {FONT_OPTIONS.map(font => (
                                            <option key={font} value={font} style={{fontFamily: font}}>
                                                {font}
                                            </option>
                                        ))}
                                    </select>

                                    {/* BOLD BUTTON */}
                                    <button 
                                        onClick={() => { saveState(); updateSelectedOverlay('fontWeight', currentWeight === 'bold' ? 'normal' : 'bold'); }}
                                        className={`p-2 rounded border ${currentWeight === 'bold' ? 'bg-fuchsia-600 border-fuchsia-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`}
                                        title="Toggle Bold"
                                    >
                                        <Bold size={16} />
                                    </button>

                                    <input 
                                        type="color" 
                                        value={currentColor} 
                                        onMouseDown={saveState}
                                        onChange={(e) => updateSelectedOverlay('color', e.target.value)} 
                                        className="h-8 w-8 rounded cursor-pointer bg-transparent" 
                                    />
                                    <input 
                                        type="range" 
                                        min="20" 
                                        max="200" 
                                        value={currentFontSize}
                                        onMouseDown={saveState}
                                        onChange={(e) => updateSelectedOverlay('fontSize', Number(e.target.value))} 
                                        className="w-32" 
                                    />
                                    <button onClick={addTextOverlay} className="ml-auto bg-fuchsia-600 text-white px-6 py-2 rounded-lg font-bold text-sm">+ Add Text</button>
                                </div>
                            )}
                             {activeTool === 'sticker' && (
                                <div className="flex items-center gap-2 w-full overflow-x-auto py-2">
                                    {['🔥', '💰', '🚀', '😱', '🔴', '✅', '❌', '⭐', '💯', '👀', '💡', '🎉', '⚡', '🛑', '👋', '👇', '👆'].map(emoji => (
                                        <button key={emoji} onClick={() => {
                                            saveState();
                                            const id = Date.now().toString();
                                            setOverlays([...overlays, { id, text: emoji, x: 100, y: 100, color: '#fff', fontSize: 80, fontFamily: 'Arial', fontWeight: 'normal' }]);
                                            setSelectedOverlayId(id);
                                        }} className="text-2xl p-2 hover:bg-white/10 rounded transition-colors">{emoji}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* EDITOR CANVAS */}
                    <div 
                        className="flex-1 bg-black/50 flex items-center justify-center p-10 overflow-hidden relative"
                        onClick={() => setSelectedOverlayId(null)} // Deselect on BG click
                    >
                        <div className="relative shadow-2xl inline-block">
                            <img 
                                ref={editorImageRef}
                                src={viewingItem.imageUrl} 
                                alt="Editing" 
                                className="max-h-[70vh] object-contain rounded-sm"
                                style={{ pointerEvents: 'none' }}
                            />
                            
                            {/* Mask Canvas for Erase Tool */}
                            {activeTool === 'erase' && (
                                <canvas 
                                    ref={maskCanvasRef}
                                    className="absolute inset-0 z-30 cursor-crosshair touch-none w-full h-full"
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                />
                            )}

                            {/* Render Overlays */}
                            {overlays.map((overlay) => (
                                <div
                                    key={overlay.id}
                                    style={{
                                        position: 'absolute',
                                        left: overlay.x,
                                        top: overlay.y,
                                        color: overlay.color,
                                        fontSize: `${overlay.fontSize}px`,
                                        fontFamily: overlay.fontFamily,
                                        fontWeight: overlay.fontWeight,
                                        textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                                        cursor: 'move',
                                        userSelect: 'none',
                                        whiteSpace: 'nowrap',
                                        zIndex: 20,
                                        border: selectedOverlayId === overlay.id ? '2px dashed #d946ef' : 'none',
                                        padding: '4px'
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation(); // Stop from deselecting
                                        setSelectedOverlayId(overlay.id);
                                    }}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        saveState(); // Capture state before drag
                                        setSelectedOverlayId(overlay.id);
                                        const startX = e.clientX - overlay.x;
                                        const startY = e.clientY - overlay.y;
                                        const handleMouseMove = (moveEvent: MouseEvent) => {
                                            const newX = moveEvent.clientX - startX;
                                            const newY = moveEvent.clientY - startY;
                                            setOverlays(prev => prev.map(o => o.id === overlay.id ? { ...o, x: newX, y: newY } : o));
                                        };
                                        const handleMouseUp = () => {
                                            document.removeEventListener('mousemove', handleMouseMove);
                                            document.removeEventListener('mouseup', handleMouseUp);
                                        };
                                        document.addEventListener('mousemove', handleMouseMove);
                                        document.addEventListener('mouseup', handleMouseUp);
                                    }}
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        saveState();
                                        const newText = prompt("Edit Text:", overlay.text);
                                        if (newText !== null) {
                                            setOverlays(prev => prev.map(o => o.id === overlay.id ? { ...o, text: newText } : o));
                                        }
                                    }}
                                >
                                    {overlay.text}
                                    {/* Robust Delete Button for Stickers/Text */}
                                    {selectedOverlayId === overlay.id && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                saveState();
                                                setOverlays(prev => prev.filter(o => o.id !== overlay.id));
                                                setSelectedOverlayId(null);
                                            }}
                                            className="absolute -top-4 -right-4 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm shadow-md hover:bg-red-600 z-50 border border-white"
                                            title="Remove"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThumbnailMaker;
