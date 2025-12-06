
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { ViralIdea } from "../types";

// --- Audio Decoding Utilities ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- WAV Header Utility for HTML5 Audio ---
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export const createWavBlobFromPcm = (base64Pcm: string): Blob => {
  const binaryString = atob(base64Pcm);
  const len = binaryString.length;
  const buffer = new ArrayBuffer(44 + len);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + len, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); 
  view.setUint16(22, 1, true); 
  view.setUint32(24, 24000, true); 
  view.setUint32(28, 24000 * 2, true); 
  view.setUint16(32, 2, true); 
  view.setUint16(34, 16, true); 
  writeString(view, 36, 'data');
  view.setUint32(40, len, true);

  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < len; i++) {
      bytes[44 + i] = binaryString.charCodeAt(i);
  }

  return new Blob([buffer], { type: 'audio/wav' });
};

// --- Helper for Robust JSON Parsing ---
const extractJson = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch (e) {
    let clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const firstCurly = clean.indexOf('{');
    const lastCurly = clean.lastIndexOf('}');
    const firstSquare = clean.indexOf('[');
    const lastSquare = clean.lastIndexOf(']');

    if (firstSquare !== -1 && lastSquare !== -1 && (firstCurly === -1 || firstSquare < firstCurly)) {
       clean = clean.substring(firstSquare, lastSquare + 1);
       try { return JSON.parse(clean); } catch (e) {}
    }
    
    if (firstCurly !== -1 && lastCurly !== -1 && lastCurly > firstCurly) {
        clean = clean.substring(firstCurly, lastCurly + 1);
        try {
            return JSON.parse(clean);
        } catch (innerE) {
            console.warn("Failed to parse cleaned JSON string", innerE);
        }
    }
    return null;
  }
};

// --- Helper: Concatenate Base64 Audio ---
function concatBase64Audio(audioParts: string[]): string {
    if (audioParts.length === 0) return "";
    
    const arrays = audioParts.map(part => {
        const binary = atob(part);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    });

    const totalLen = arrays.reduce((acc, curr) => acc + curr.length, 0);
    const combined = new Uint8Array(totalLen);

    let offset = 0;
    arrays.forEach(arr => {
        combined.set(arr, offset);
        offset += arr.length;
    });

    let binary = '';
    const len = combined.byteLength;
    const chunkSize = 32768; 
    for (let i = 0; i < len; i += chunkSize) {
        binary += String.fromCharCode.apply(null, combined.subarray(i, i + chunkSize) as unknown as number[]);
    }
    return btoa(binary);
}

function findVoiceForSpeaker(speakerName: string, map: Record<string, string>): string | undefined {
    if (!map) return undefined;
    if (map[speakerName]) return map[speakerName];
    const lowerName = speakerName.toLowerCase().trim();
    const mapKeys = Object.keys(map);
    const caseMatch = mapKeys.find(k => k.toLowerCase().trim() === lowerName);
    if (caseMatch) return map[caseMatch];
    const partial = mapKeys.find(k => k.toLowerCase().includes(lowerName) || lowerName.includes(k.toLowerCase()));
    if (partial) return map[partial];
    return undefined;
}

// --- API Functions ---

export const generateViralIdeas = async (topic: string, mode: 'standard' | 'super-viral'): Promise<ViralIdea[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
        You are a Viral Content Analyst and Strategist.
        ${mode === 'super-viral' 
            ? "TASK: Ignore previous inputs. Fetch the TOP 5 currently trending worldwide viral topics (News, Tech, Celeb, or Oddly Satisfying). Generate ideas based on these BREAKING trends." 
            : `TASK: Analyze the topic "${topic}" and generate 5 highly viral video ideas optimized for 2025 algorithms.`}

        Output pure JSON array of objects with fields:
        id, title, description, hook, targetAudience, platform, trendingSource, estimatedViews, viralScore (int), trendPrediction, retentionScenes (array), monetizationScore (int), competitionRisk, abTitles (array).
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { 
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        hook: { type: Type.STRING },
                        targetAudience: { type: Type.STRING },
                        platform: { type: Type.STRING },
                        trendingSource: { type: Type.STRING },
                        estimatedViews: { type: Type.STRING },
                        viralScore: { type: Type.INTEGER },
                        trendPrediction: { type: Type.STRING, enum: ['Rising', 'Stable', 'Falling'] },
                        retentionScenes: { type: Type.ARRAY, items: { type: Type.STRING } },
                        monetizationScore: { type: Type.INTEGER },
                        competitionRisk: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
                        abTitles: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        }
    });

    return extractJson(response.text) || [];
};

export const generateScript = async (
    topic: string, 
    videoType: string,
    tone: string, 
    language: string = 'English (US)',
    format: 'single' | 'podcast' = 'single',
    viralContext?: ViralIdea
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let prompt = '';
  
  if (viralContext) {
      prompt = `
        Create a VIRAL VIDEO SCRIPT optimized for ${viralContext.platform}.
        Topic: ${viralContext.title}
        Hook (First 3s): "${viralContext.hook}"
        Retention Strategy: Include these visual beats: ${viralContext.retentionScenes.join(', ')}.
        Tone: ${tone}. Language: ${language}.
        Format: ${format === 'podcast' ? 'Multi-Speaker' : 'Single Narrator'}.
      `;
  } else {
      prompt = format === 'podcast' 
      ? `Create a Multi-Speaker Script (${videoType}) about "${topic}". Tone: ${tone}. Language: ${language}. Use format: **SpeakerName:** Message.`
      : `Create a Video Script (${videoType}) about "${topic}". Tone: ${tone}. Language: ${language}.`;
  }

  const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
  return response.text || "Failed to generate script.";
};

export const generateVoiceover = async (text: string, primaryVoiceName: string = 'Kore', speakerMap?: Record<string, string>): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    if (speakerMap && Object.keys(speakerMap).length > 0) {
        const regex = /^\s*\**([A-Za-z0-9 _\-\(\)\.]+?)\**\s*:\s*(.*)/gm;
        const segments: { speaker: string, text: string }[] = [];
        const lines = text.split('\n');
        let currentSpeaker = 'Narrator';
        let currentBuffer = '';

        lines.forEach(line => {
            const speakerMatch = line.match(/^\s*\**([A-Za-z0-9 _\-\(\)\.]+?)\**\s*:\s*(.*)/);
            if (speakerMatch) {
                if (currentBuffer.trim()) {
                    segments.push({ speaker: currentSpeaker, text: currentBuffer.trim() });
                }
                currentSpeaker = speakerMatch[1].trim(); 
                currentBuffer = speakerMatch[2];
            } else {
                currentBuffer += ' ' + line;
            }
        });
        if (currentBuffer.trim()) {
            segments.push({ speaker: currentSpeaker, text: currentBuffer.trim() });
        }

        if (segments.length > 0) {
            const audioParts: string[] = [];
            for (const seg of segments) {
                let assignedVoice = findVoiceForSpeaker(seg.speaker, speakerMap);
                if (!assignedVoice) assignedVoice = primaryVoiceName || 'Kore';

                try {
                    const response = await ai.models.generateContent({
                        model: "gemini-2.5-flash-preview-tts",
                        contents: [{ parts: [{ text: seg.text }] }],
                        config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: assignedVoice } } } },
                    });
                    const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                    if (data) audioParts.push(data);
                } catch (e) {}
            }
            return concatBase64Audio(audioParts);
        }
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: primaryVoiceName } } } },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const generateClonePlan = async (reference: string, topic: string, mode: string): Promise<{ script: string, visual_prompt: string, audio_style: string, detected_language?: string }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        Analyze reference: "${reference}". Mode: ${mode}.
        Create a BLUEPRINT for a video about "${topic}".
        Detect language of reference and use it for the script.
        Return JSON: { "detected_language": "...", "script": "...", "visual_prompt": "...", "audio_style": "..." }
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    return extractJson(response.text) || { script: "Failed", visual_prompt: "Cinematic", audio_style: "Neutral" };
};

export const generateASMRPlan = async (topic: string, triggers: string, vibe: string, language: string): Promise<any> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        ASMR Video Director. Topic: ${topic}. Triggers: ${triggers}. Vibe: ${vibe}. Language: ${language}
        Generate JSON plan: { "language_used": "${language}", "asmr_script": "...", "visual_generation_instructions": "...", "background_music_and_sound_layer": "..." }
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return extractJson(response.text);
};

export const generateVideo = async (prompt: string, resolution: '720p'|'1080p' = '720p', aspectRatio: string = '16:9', startImage?: string): Promise<string | null> => {
    const attemptGeneration = async (retry: boolean): Promise<string | null> => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let apiRatio = aspectRatio === '1:1' || aspectRatio === '4:5' ? '9:16' : aspectRatio;
        
        const request: any = {
             model: 'veo-3.1-generate-preview',
             prompt: prompt,
             config: { numberOfVideos: 1, resolution, aspectRatio: apiRatio }
        };
        if (startImage) {
            const data = startImage.includes(',') ? startImage.split(',')[1] : startImage;
            request.image = { imageBytes: data, mimeType: 'image/jpeg' };
        }

        try {
            let operation = await ai.models.generateVideos(request);
            while (!operation.done) {
                await new Promise(r => setTimeout(r, 5000));
                operation = await ai.operations.getVideosOperation({ operation });
            }
            return `${operation.response?.generatedVideos?.[0]?.video?.uri}&key=${process.env.API_KEY}`;
        } catch (e: any) {
            const errorMessage = e.message || JSON.stringify(e);
            if (!retry && (errorMessage.includes("Requested entity was not found") || errorMessage.includes("404"))) {
                await requestVeoKey();
                return await attemptGeneration(true);
            }
            if (errorMessage.includes("Requested entity was not found")) {
                 throw new Error("Veo API Key Error: Please select a valid project with billing enabled.");
            }
            throw e;
        }
    };

    return attemptGeneration(false);
};

export const checkVeoKey = async (): Promise<boolean> => {
    if (window.aistudio && window.aistudio.hasSelectedApiKey) return await window.aistudio.hasSelectedApiKey();
    return true; 
};

export const requestVeoKey = async (): Promise<void> => {
    if (window.aistudio && window.aistudio.openSelectKey) await window.aistudio.openSelectKey();
};

export const generateThumbnailImage = async (topic: string, ratio: string = '16:9', lang: string = 'English', ref?: string | null): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let finalRatio = ratio === '4:5' ? '3:4' : ratio;
    
    // Quick prompt construction for thumbnail
    const visualPrompt = `YouTube Thumbnail about ${topic}. Language: ${lang}. High contrast, bold text, clickable. 4K quality.`;

    const request: any = {
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: visualPrompt + ` Aspect Ratio: ${ratio}` }] },
        config: { 
            responseModalities: [Modality.IMAGE],
            imageConfig: { aspectRatio: finalRatio as any, numberOfImages: 1 }
        }
    };

    if (ref) {
         const base64 = ref.includes(',') ? ref.split(',')[1] : ref;
         request.contents.parts.unshift({ inlineData: { mimeType: 'image/jpeg', data: base64 } });
    }

    try {
        const response = await ai.models.generateContent(request);
        const imgData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (imgData) return `data:image/jpeg;base64,${imgData}`;
        throw new Error("No image returned");
    } catch (e: any) {
        throw new Error(e.message || "Failed to generate thumbnail");
    }
};

// --- IMPLEMENTED SERVICES (Formerly Stubs) ---

export const generateAdScript = async (productName: string, description: string, audience: string): Promise<any> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        Write a video ad script for "${productName}". 
        Description: ${description}. Target Audience: ${audience}.
        Format: AIDA (Attention, Interest, Desire, Action).
        Return JSON: { "hook": "...", "body": "...", "cta": "...", "visual_prompt": "..." }
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return extractJson(response.text) || { hook: "Attention!", body: description, cta: "Buy Now", visual_prompt: "Product shot" };
};

export const generateSocialCampaign = async (title: string, desc: string): Promise<any> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        Create a social media campaign for video: "${title}" - ${desc}.
        Return JSON with keys: twitter (array of {text, hashtags}), linkedin (array), facebook ({text, hashtags}), reddit ({title, body}), email ({subject, body}).
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return extractJson(response.text) || {};
};

export const generateWalkthroughScript = async (type: string, description: string, amenities: string): Promise<any> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        Create a cinematic real estate walkthrough script.
        Property: ${type}. Desc: ${description}. Amenities: ${amenities}.
        Return JSON: { "title": "...", "musicMood": "...", "veoPrompt": "...", "scenes": [{ "type": "Wide/Pan", "movement": "...", "visual": "...", "audio": "..." }] }
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return extractJson(response.text) || { title: type, scenes: [] };
};

export const generateRealEstateVisuals = async (type: string, description: string, mode: string, refImage?: string | null): Promise<any> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Generate Concept Image
    const prompt = `Architectural concept for ${type}. ${description}. Mode: ${mode}. Photorealistic 4K render.`;
    
    let conceptImage = "";
    try {
        const req: any = {
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { responseModalities: [Modality.IMAGE], imageConfig: { numberOfImages: 1, aspectRatio: '16:9' } }
        };
        if(refImage) {
             const base64 = refImage.includes(',') ? refImage.split(',')[1] : refImage;
             req.contents.parts.unshift({ inlineData: { mimeType: 'image/jpeg', data: base64 } });
        }
        const res = await ai.models.generateContent(req);
        const data = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if(data) conceptImage = `data:image/jpeg;base64,${data}`;
    } catch(e) { console.warn("Visual gen failed", e); }

    return { floorPlan: conceptImage, conceptImage: conceptImage };
};

export const generateMoviePremise = async (concept: string): Promise<any> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Develop movie concept from: "${concept}". Return JSON: { "title": "...", "logline": "...", "synopsis": "...", "genre": "...", "style": "..." }`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return extractJson(response.text) || {};
};

export const generateMovieCharacters = async (project: any): Promise<any> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Create characters for movie "${project.title}": ${project.logline}. Return JSON array of objects: { "id": "char_1", "name": "...", "role": "...", "archetype": "...", "visualDescription": "...", "voiceType": "..." }`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { 
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        role: { type: Type.STRING },
                        archetype: { type: Type.STRING },
                        visualDescription: { type: Type.STRING },
                        voiceType: { type: Type.STRING }
                    }
                }
            }
        }
    });
    return extractJson(response.text) || [];
};

export const generateMovieScenes = async (project: any, characters: any[]): Promise<any> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const charNames = characters.map(c => c.name).join(', ');
    const prompt = `Write scenes for movie "${project.title}". Characters: ${charNames}. Return JSON array of objects: { "id": "sc_1", "number": 1, "slug": "INT. ROOM - DAY", "description": "...", "action": "...", "dialogueSnippet": "...", "charactersInvolved": ["Name"] }`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return extractJson(response.text) || [];
};

export const generateCharacterPortrait = async (desc: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Cinematic character portrait. ${desc}. High detail, 8k, dramatic lighting.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { responseModalities: [Modality.IMAGE], imageConfig: { numberOfImages: 1, aspectRatio: '3:4' } }
        });
        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return data ? `data:image/jpeg;base64,${data}` : "";
    } catch (e) { return ""; }
};

export const editThumbnailImage = async (imgBase64: string, action: string, additionalData?: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const cleanBase64 = imgBase64.includes(',') ? imgBase64.split(',')[1] : imgBase64;
    
    const parts: any[] = [
        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }
    ];

    let prompt = "";
    if (action === 'refine') {
        prompt = `Edit this image. ${additionalData}`;
    } else if (action === 'faceswap') {
        prompt = "Swap the face in the main image with the face provided in the second image. Maintain lighting and style.";
        if (additionalData) {
             const faceB64 = additionalData.includes(',') ? additionalData.split(',')[1] : additionalData;
             parts.push({ inlineData: { mimeType: 'image/jpeg', data: faceB64 } });
        }
    } else if (action === 'erase') {
        if (additionalData === 'MASKED_RED') {
             prompt = "Replace the red masked area in the image with the background to erase the object. Make it seamless.";
        } else {
             prompt = `Erase the ${additionalData} from this image and fill in the background seamlessly.`;
        }
    }
    
    parts.push({ text: prompt });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE] }
        });
        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return data ? `data:image/jpeg;base64,${data}` : imgBase64;
    } catch (e) { 
        throw e;
    }
};

export const playAudio = async (base64: string): Promise<void> => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();
};
