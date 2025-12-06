import { LicenseKey, ProductPackage, ModuleId, User } from '../types';

// --- Default Configuration ---
const DEFAULT_PACKAGES: ProductPackage[] = [
    {
        id: 'pkg_full_suite',
        name: 'AI Video Master - Ultimate Suite',
        description: 'All-in-one access to every module.',
        price: 97,
        isActive: true,
        includedModules: [
            ModuleId.VIDEO_GEN, ModuleId.ASMR, ModuleId.CLONER, 
            ModuleId.MOVIE, ModuleId.WALKTHROUGH, ModuleId.ADS, 
            ModuleId.THUMBNAIL, ModuleId.TRAFFIC
        ]
    },
    {
        id: 'pkg_starter',
        name: 'Creator Starter Kit',
        description: 'Basic video generation and thumbnails.',
        price: 27,
        isActive: true,
        includedModules: [
            ModuleId.VIDEO_GEN, ModuleId.THUMBNAIL
        ]
    },
    {
        id: 'pkg_traffic',
        name: 'Viral Traffic Bundle',
        description: 'Video Cloner + Auto Traffic Engine.',
        price: 47,
        isActive: true,
        includedModules: [
            ModuleId.CLONER, ModuleId.TRAFFIC
        ]
    }
];

// --- Storage Helpers ---
const getPackages = (): ProductPackage[] => {
    const stored = localStorage.getItem('aivmp_packages');
    return stored ? JSON.parse(stored) : DEFAULT_PACKAGES;
};

const savePackages = (pkgs: ProductPackage[]) => {
    localStorage.setItem('aivmp_packages', JSON.stringify(pkgs));
};

const getLicenses = (): LicenseKey[] => {
    const stored = localStorage.getItem('aivmp_licenses');
    return stored ? JSON.parse(stored) : [];
};

const saveLicenses = (keys: LicenseKey[]) => {
    localStorage.setItem('aivmp_licenses', JSON.stringify(keys));
};

// --- Core Logic ---

export const getAllModules = () => [
    { id: ModuleId.VIDEO_GEN, name: 'AI Video Generator' },
    { id: ModuleId.ASMR, name: 'ASMR Engine' },
    { id: ModuleId.CLONER, name: 'Video Cloner' },
    { id: ModuleId.MOVIE, name: 'CineAI Movie Studio' },
    { id: ModuleId.WALKTHROUGH, name: 'Walkthrough Engine' },
    { id: ModuleId.ADS, name: 'Video Ads Maker' },
    { id: ModuleId.THUMBNAIL, name: 'Thumbnail Studio' },
    { id: ModuleId.TRAFFIC, name: 'Auto Traffic Engine' },
];

export const createPackage = (pkg: ProductPackage) => {
    const current = getPackages();
    savePackages([...current, pkg]);
    return pkg;
};

export const updatePackage = (pkg: ProductPackage) => {
    const current = getPackages();
    savePackages(current.map(p => p.id === pkg.id ? pkg : p));
};

export const deletePackage = (id: string) => {
    const current = getPackages();
    savePackages(current.filter(p => p.id !== id));
};

export const listPackages = () => getPackages();

export const generateLicenseKey = (packageId: string, email: string, expiryDays: number = 365): LicenseKey => {
    const packages = getPackages();
    const pkg = packages.find(p => p.id === packageId);
    
    if (!pkg) throw new Error("Invalid Package ID");

    // Generate AIVMP-XXXX format
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const segment = () => Array(4).fill(0).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    const code = `AIVMP-${segment()}-${segment()}-${segment()}`;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    const newKey: LicenseKey = {
        code,
        status: 'active',
        generatedForEmail: email,
        packageId: pkg.id,
        modules: pkg.includedModules, // Snapshot permission
        createdAt: new Date(),
        expiresAt: expiryDate,
        deviceCount: 0
    };

    const licenses = getLicenses();
    saveLicenses([...licenses, newKey]);
    
    return newKey;
};

export const validateLicense = (code: string, email: string): { valid: boolean; userUpdates?: Partial<User>; error?: string } => {
    const licenses = getLicenses();
    const key = licenses.find(k => k.code === code);

    if (!key) return { valid: false, error: 'License key not found.' };
    if (key.status !== 'active') return { valid: false, error: 'License is revoked or expired.' };
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) return { valid: false, error: 'License has expired.' };
    
    // In a real app, we'd strictly enforce email matching, but for flexibility in demo:
    // if (key.generatedForEmail.toLowerCase() !== email.toLowerCase()) return { valid: false, error: 'License email mismatch.' };

    // Update key usage (simulated)
    key.deviceCount += 1;
    saveLicenses(licenses.map(k => k.code === code ? key : k));

    return {
        valid: true,
        userUpdates: {
            plan: 'pro',
            activePackageId: key.packageId,
            allowedModules: key.modules,
            licenseExpiry: key.expiresAt
        }
    };
};

export const listLicenses = () => getLicenses();

// --- Webhook Simulation (WarriorPlus / JVZoo) ---
export const processWebhook = (payload: any) => {
    // Simulating parsing a generic IPN/Webhook payload
    // Expected format: { product_id, customer_email, transaction_id ... }
    
    const productId = payload.product_id || payload.item_number;
    const email = payload.customer_email || payload.payer_email;
    
    if (!email) throw new Error("No email found in webhook");

    // Map External Product ID to Internal Package
    // For demo, we'll just auto-assign the 'Full Suite' if no map found
    const packages = getPackages();
    // Simple logic: if payload has 'traffic', give traffic bundle, etc.
    let targetPkg = packages[0]; // Default full suite
    
    if (payload.product_name?.toLowerCase().includes('starter')) targetPkg = packages.find(p => p.id === 'pkg_starter') || targetPkg;
    if (payload.product_name?.toLowerCase().includes('traffic')) targetPkg = packages.find(p => p.id === 'pkg_traffic') || targetPkg;

    return generateLicenseKey(targetPkg.id, email);
};
