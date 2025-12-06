
export interface VideoProject {
  id: string;
  title: string;
  keyword: string;
  status: 'draft' | 'scripting' | 'voicing' | 'rendering' | 'completed' | 'uploaded';
  script?: string;
  audioUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  createdAt: Date;
  stats?: {
    views: number;
    likes: number;
  };
}

export interface VideoGenerationConfig {
  topic: string;
  tone: string;
  duration: 'short' | 'medium' | 'long';
  voice: 'male' | 'female';
}

export interface ViralIdea {
  id: string;
  title: string;
  description: string;
  hook: string;
  targetAudience: string;
  platform: string;
  trendingSource: string;
  estimatedViews: string;
  viralScore: number;
  trendPrediction: 'Rising' | 'Stable' | 'Falling';
  retentionScenes: string[];
  monetizationScore: number;
  competitionRisk: 'Low' | 'Medium' | 'High';
  abTitles: string[];
}

export enum ModuleId {
  VIDEO_GEN = 'module_video_gen',
  ASMR = 'module_asmr',
  CLONER = 'module_cloner',
  MOVIE = 'module_movie',
  WALKTHROUGH = 'module_walkthrough',
  ADS = 'module_ads',
  THUMBNAIL = 'module_thumbnail',
  TRAFFIC = 'module_traffic'
}

export interface ProductPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  includedModules: ModuleId[];
  isActive: boolean;
}

export interface User {
  name: string;
  email: string;
  plan: 'free' | 'pro' | 'enterprise';
  credits: number;
  isAdmin?: boolean;
  activePackageId?: string;
  allowedModules: ModuleId[]; // Explicit list of what they can access
  licenseExpiry?: Date;
}

export interface PricingConfig {
  basePrice: number;
  discountPercent: number;
  isSaleActive: boolean;
  buyLink: string; 
}

export interface LicenseKey {
  code: string; // AIVMP-XXXX...
  status: 'active' | 'expired' | 'revoked';
  generatedForEmail: string;
  packageId: string;
  modules: ModuleId[]; // Snapshot of modules at time of generation
  createdAt: Date;
  expiresAt?: Date;
  deviceCount: number;
}

export interface ThumbnailLayer {
  id: string;
  type: 'text' | 'image' | 'shape' | 'gradient';
  content: string; // Text content or Image URL
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation: number;
  scale: number;
  zIndex: number;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
    fontWeight?: string;
    stroke?: string;
    strokeWidth?: number;
    shadow?: string;
    shadowBlur?: number;
    opacity?: number;
    borderRadius?: number;
    gradientDirection?: string;
  };
}

export interface ThumbnailProject {
  id: string;
  title: string;
  topic: string;
  layers: ThumbnailLayer[];
  backgroundUrl: string | null;
  createdAt: Date;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  CREATE_WIZARD = 'CREATE_WIZARD',
  VIDEO_ADS_MAKER = 'VIDEO_ADS_MAKER',
  THUMBNAIL_MAKER = 'THUMBNAIL_MAKER',
  AUTO_TRAFFIC = 'AUTO_TRAFFIC',
  WALKTHROUGH_MAKER = 'WALKTHROUGH_MAKER',
  MOVIE_STUDIO = 'MOVIE_STUDIO',
  VIDEO_CLONER = 'VIDEO_CLONER',
  ASMR_GENERATOR = 'ASMR_GENERATOR',
  PROJECTS = 'PROJECTS',
  SETTINGS = 'SETTINGS',
  ADMIN = 'ADMIN'
}

// --- Movie Studio Types ---
export interface MovieCharacter {
  id: string;
  name: string;
  role: string; // Protagonist, Antagonist, etc.
  archetype: string;
  visualDescription: string;
  voiceType: string;
  imageUrl?: string; // Generated Portrait
}

export interface MovieScene {
  id: string;
  number: number;
  slug: string; // INT. LAB - NIGHT
  description: string;
  action: string;
  dialogueSnippet: string;
  charactersInvolved: string[];
  status: 'scripted' | 'rendering' | 'completed';
  videoUrl?: string;
}

export interface MovieProject {
  id: string;
  title: string;
  logline: string;
  synopsis: string;
  genre: string;
  style: string;
  characters: MovieCharacter[];
  scenes: MovieScene[];
  createdAt: Date;
}

// --- Auto Traffic Types ---

export type SocialPlatform = 
  | 'youtube' 
  | 'twitter' 
  | 'linkedin' 
  | 'reddit' 
  | 'pinterest' 
  | 'medium' 
  | 'wordpress' 
  | 'telegram' 
  | 'email'
  | 'tumblr'
  | 'quora'
  | 'mix'
  | 'flipboard'
  | 'vk'
  | 'mastodon'
  | 'discord'
  | 'facebook'
  | 'instagram'
  | 'substack'
  | 'revue'
  | 'blogger'
  | 'ghost'
  | 'hackernews'
  | 'producthunt'
  | 'indiehackers'
  | 'scoopit'
  | 'triberr'
  | 'ello'
  | 'folkd'
  | 'pearltrees'
  | 'diigo'
  | 'googlediscover'
  | 'googlenews'
  | 'whatsapp';

export interface ConnectedAccount {
  id: string;
  platform: SocialPlatform;
  name: string;
  handle?: string; // @username
  avatar?: string;
  status: 'connected' | 'disconnected' | 'expired';
  connectedAt: Date;
}

export interface SocialContent {
  platform: SocialPlatform;
  text: string;
  subject?: string; // For email/blog title
  mediaUrl?: string;
  hashtags?: string[];
  link?: string;
}

export interface PlatformJob {
  id: string;
  campaignId: string;
  platform: SocialPlatform;
  status: 'pending' | 'scheduled' | 'published' | 'failed';
  scheduledTime: Date;
  content: SocialContent;
  analytics?: {
    impressions: number;
    clicks: number;
    engagements: number;
  };
  errorLog?: string;
}

export interface TrafficCampaign {
  id: string;
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  thumbnailUrl: string;
  description?: string;
  status: 'draft' | 'active' | 'completed' | 'paused';
  createdAt: Date;
  jobs: PlatformJob[];
  totalClicks?: number;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    webkitAudioContext: typeof AudioContext;
    aistudio?: AIStudio;
  }
}