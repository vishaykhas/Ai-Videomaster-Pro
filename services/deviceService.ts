
// Simulated Device Fingerprinting Service
// In a real application, this would interact with a backend to validate IP, Headers, and Device Tokens.

const STORAGE_KEY = 'videomaster_device_id';
const REGISTRY_KEY = 'videomaster_device_registry';

interface DeviceRegistry {
  [deviceId: string]: {
    email: string;
    timestamp: number;
    isPro: boolean;
  };
}

// Helper to get or create a unique device ID
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem(STORAGE_KEY);
  if (!deviceId) {
    // Generate a random UUID-like string
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(STORAGE_KEY, deviceId);
  }
  return deviceId;
};

// Simulates capturing hardware details (IMEI/IP)
// Browsers cannot access IMEI, so this is a simulation for the requirement.
export const captureDeviceFingerprint = () => {
  const deviceId = getDeviceId();
  const screenRes = `${window.screen.width}x${window.screen.height}`;
  const userAgent = navigator.userAgent;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Simulate IP capture
  const mockIP = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  const mockIMEI = `35${Math.floor(Math.random() * 10000000000000)}`;

  // Log removed per user request to clean up console output
  // console.log("[Security] Capturing Device Fingerprint:", { ... });

  return { deviceId, mockIP, mockIMEI };
};

// Check if the device is allowed to login/register with this email
export const checkDeviceEligibility = (email: string): { allowed: boolean; reason?: string; ownerEmail?: string } => {
  const deviceId = getDeviceId();
  const registryRaw = localStorage.getItem(REGISTRY_KEY);
  const registry: DeviceRegistry = registryRaw ? JSON.parse(registryRaw) : {};

  const record = registry[deviceId];

  // If no record exists for this device, it's free to claim
  if (!record) {
    return { allowed: true };
  }

  // If the email matches the registered owner, allow access
  if (record.email.toLowerCase() === email.toLowerCase()) {
    return { allowed: true };
  }

  // If device is registered to someone else, BLOCK
  return { 
    allowed: false, 
    reason: 'DEVICE_LOCKED',
    ownerEmail: record.email
  };
};

// Register the device to a user
export const registerDeviceToUser = (email: string, isPro: boolean = false) => {
  const deviceId = getDeviceId();
  const registryRaw = localStorage.getItem(REGISTRY_KEY);
  const registry: DeviceRegistry = registryRaw ? JSON.parse(registryRaw) : {};

  // Capture fingerprint logs
  captureDeviceFingerprint();

  // Update or Create record
  // Note: If it was locked, this function implies an overwrite (e.g., after Pro upgrade)
  registry[deviceId] = {
    email: email.toLowerCase(),
    timestamp: Date.now(),
    isPro
  };

  localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
};
