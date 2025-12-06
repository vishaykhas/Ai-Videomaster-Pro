
import React, { useState, useEffect } from 'react';
import { Zap, Mail, Lock, User as UserIcon, ArrowRight, Loader2, ShieldAlert, Key, CheckCircle, RefreshCw, AlertCircle, PlayCircle } from 'lucide-react';
import { User, ModuleId } from '../types';
import { checkDeviceEligibility, registerDeviceToUser, captureDeviceFingerprint } from '../services/deviceService';
import { getAllModules } from '../services/licenseService';

interface AuthScreenProps {
  onLogin: (user: User, rememberMe: boolean) => void;
  onRedeemLicense: (code: string) => boolean;
}

interface UserRecord {
    email: string;
    password: string; // stored as b64 for demo
    name: string;
    plan: 'free' | 'pro';
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onRedeemLicense }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Forgot Password State
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStep, setResetStep] = useState<'email' | 'password' | 'success'>('email');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoadingReset, setIsLoadingReset] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Lock State
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState<string | null>(null);
  const [lockOwner, setLockOwner] = useState<string | null>(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // --- Mock DB Helpers ---
  const getUsersDB = (): Record<string, UserRecord> => {
      try {
          return JSON.parse(localStorage.getItem('videomaster_users_db') || '{}');
      } catch {
          return {};
      }
  };

  const saveUserToDB = (record: UserRecord) => {
      const db = getUsersDB();
      db[record.email.toLowerCase()] = record;
      localStorage.setItem('videomaster_users_db', JSON.stringify(db));
  };

  useEffect(() => {
    // Log simulated capture on mount
    captureDeviceFingerprint();
    
    // Check for saved credentials for "Remember Me" functionality
    const savedEmail = localStorage.getItem('videomaster_saved_email');
    const savedPassword = localStorage.getItem('videomaster_saved_password'); // Demo only
    
    if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
    }
    
    if (savedPassword) {
        try {
            // Simple decode for demo purposes
            setPassword(atob(savedPassword));
        } catch (e) {
            console.error("Failed to decode saved password");
        }
    }
  }, []);

  const handleDemoLogin = () => {
      setIsLoading(true);
      setTimeout(() => {
          const demoUser: User = {
              name: "Demo Guest",
              email: "demo@videomaster.com",
              plan: 'pro',
              credits: 500,
              isAdmin: false,
              allowedModules: [ModuleId.VIDEO_GEN, ModuleId.THUMBNAIL, ModuleId.TRAFFIC, ModuleId.ADS]
          };
          // Register device to allow access to demo user
          registerDeviceToUser(demoUser.email, true);
          onLogin(demoUser, false);
      }, 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setUnlockError(null);
    setAuthError(null);
    
    const trimmedEmail = email.trim();

    // Simulate API Authentication Delay
    setTimeout(() => {
      const db = getUsersDB();
      const lowerEmail = trimmedEmail.toLowerCase();
      const isAdmin = lowerEmail === 'admin@videomaster.com';

      // --- Validation Logic ---
      if (isLogin) {
          const userRecord = db[lowerEmail];

          if (isAdmin) {
              // If Admin has a record (meaning they reset password or signed up explicitly), validate it.
              // If no record exists, we allow default admin access (demo convenience)
              if (userRecord && userRecord.password !== btoa(password)) {
                  setAuthError("Invalid password.");
                  setIsLoading(false);
                  return;
              }
          } else {
              // Normal user validation
              if (!userRecord) {
                  setAuthError("User not found. Please sign up.");
                  setIsLoading(false);
                  return;
              }
              // Validate Password (simple base64 comparison for demo)
              if (userRecord.password !== btoa(password)) {
                  setAuthError("Invalid password. Please try again.");
                  setIsLoading(false);
                  return;
              }
          }
      } else {
          // Signup
          if (db[lowerEmail] && !isAdmin) {
              setAuthError("Account already exists with this email.");
              setIsLoading(false);
              return;
          }
      }

      // 1. Check Device Restrictions (after credential check passes)
      const eligibility = checkDeviceEligibility(trimmedEmail);

      if (!eligibility.allowed && !isAdmin) {
          setIsLoading(false);
          setIsLocked(true);
          setLockReason(eligibility.reason || "Device Restricted");
          setLockOwner(eligibility.ownerEmail || "Another User");
          return;
      }

      // Success - Prepare User Data
      let displayName = name;
      const userRecord = db[lowerEmail];
      
      if (isLogin) {
        if (isAdmin) {
            displayName = userRecord?.name || "Admin User";
        } else {
            displayName = userRecord.name;
        }

        // Handle Remember Me - Credential Persistence
        if (rememberMe) {
            localStorage.setItem('videomaster_saved_email', trimmedEmail);
            localStorage.setItem('videomaster_saved_password', btoa(password)); 
        } else {
            localStorage.removeItem('videomaster_saved_email');
            localStorage.removeItem('videomaster_saved_password');
        }
      } else {
          // Register new user in Mock DB
          if (!isAdmin) {
              saveUserToDB({
                  email: lowerEmail,
                  name: name,
                  password: btoa(password),
                  plan: 'free'
              });
          }
          // Also auto-save credentials if they just signed up (optional UX choice)
          if (rememberMe) {
              localStorage.setItem('videomaster_saved_email', trimmedEmail);
              localStorage.setItem('videomaster_saved_password', btoa(password));
          }
      }

      const newUser: User = {
          name: displayName,
          email: trimmedEmail,
          plan: isAdmin ? 'pro' : (db[lowerEmail]?.plan || 'free'), 
          credits: 1000,
          isAdmin: isAdmin,
          allowedModules: isAdmin ? getAllModules().map(m => m.id) : [ModuleId.VIDEO_GEN, ModuleId.THUMBNAIL]
      };

      // Register device on successful login/signup
      registerDeviceToUser(trimmedEmail, isAdmin);

      setIsLoading(false);
      onLogin(newUser, rememberMe);
    }, 1000);
  };

  // --- Simulated Google Login Handler ---
  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    setAuthError(null);

    // Simulate network/popup delay
    setTimeout(() => {
      // MOCK Google Response
      const mockGoogleUser = {
          email: "demo.google@gmail.com",
          name: "Demo Google User",
          token: "mock_google_token_123"
      };

      const db = getUsersDB();
      const lowerEmail = mockGoogleUser.email.toLowerCase();

      // 1. Check Device Restrictions
      // Even for Google login, we must enforce the 1-device rule
      const eligibility = checkDeviceEligibility(lowerEmail);

      if (!eligibility.allowed) {
          setIsGoogleLoading(false);
          setIsLocked(true);
          setLockReason(eligibility.reason || "Device Restricted");
          setLockOwner(eligibility.ownerEmail || "Another User");
          return;
      }

      // 2. Auto-Register or Login
      let userPlan: 'free' | 'pro' = 'free';

      if (db[lowerEmail]) {
          // User exists
          userPlan = db[lowerEmail].plan;
      } else {
          // New User (Auto-signup)
          saveUserToDB({
              email: lowerEmail,
              name: mockGoogleUser.name,
              password: btoa('google_oauth_placeholder'), // Placeholder password
              plan: 'free'
          });
      }

      // 3. Construct User Object
      const finalUser: User = {
          name: mockGoogleUser.name,
          email: lowerEmail,
          plan: userPlan,
          credits: 1000,
          isAdmin: false,
          allowedModules: [ModuleId.VIDEO_GEN, ModuleId.THUMBNAIL]
      };

      // 4. Register Device
      registerDeviceToUser(lowerEmail, userPlan === 'pro');

      setIsGoogleLoading(false);
      onLogin(finalUser, true); // Always "remember" social logins by default in this demo

    }, 1500);
  };

  // Step 1: Submit Email for Reset
  const handleResetEmailSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoadingReset(true);
      setResetError(null);
      
      const trimmedEmail = resetEmail.trim();

      setTimeout(() => {
          if (!trimmedEmail) {
              setResetError("Please enter a valid email address.");
              setIsLoadingReset(false);
              return;
          }

          setIsLoadingReset(false);
          setResetStep('password'); 
      }, 1000);
  };

  // Step 2: Submit New Password
  const handleNewPasswordSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword !== confirmPassword) {
          setResetError("Passwords do not match");
          return;
      }
      
      const trimmedEmail = resetEmail.trim();
      
      setIsLoadingReset(true);
      setTimeout(() => {
          const lowerEmail = trimmedEmail.toLowerCase();
          const isAdmin = lowerEmail === 'admin@videomaster.com';
          const db = getUsersDB();
          
          if (db[lowerEmail]) {
              // Update existing
              db[lowerEmail].password = btoa(newPassword);
          } else {
              // Infer a name from the email if we don't have one
              const inferredName = lowerEmail.split('@')[0];
              const capitalName = inferredName.charAt(0).toUpperCase() + inferredName.slice(1);

              db[lowerEmail] = {
                  email: lowerEmail,
                  name: capitalName, 
                  password: btoa(newPassword),
                  plan: isAdmin ? 'pro' : 'free'
              };
          }

          localStorage.setItem('videomaster_users_db', JSON.stringify(db));

          // If the user had this email saved in "Remember Me", update that too
          const savedEmail = localStorage.getItem('videomaster_saved_email');
          if (savedEmail?.toLowerCase() === lowerEmail) {
              localStorage.setItem('videomaster_saved_password', btoa(newPassword));
          }
          
          setIsLoadingReset(false);
          setResetStep('success');
      }, 1500);
  };

  const handleUnlockWithLicense = () => {
      if (!licenseKey) return;
      setIsLoading(true);
      
      const trimmedEmail = email.trim();

      setTimeout(() => {
        const success = onRedeemLicense(licenseKey);
        if (success) {
            registerDeviceToUser(trimmedEmail, true);

            const db = getUsersDB();
            const lowerEmail = trimmedEmail.toLowerCase();
            let displayName = name;

            if (!db[lowerEmail]) {
                 saveUserToDB({
                     email: lowerEmail,
                     name: name || 'Pro User',
                     password: btoa(password || 'temp1234'), 
                     plan: 'pro'
                 });
            } else {
                db[lowerEmail].plan = 'pro';
                localStorage.setItem('videomaster_users_db', JSON.stringify(db));
                displayName = db[lowerEmail].name;
            }

            const newUser: User = {
                name: displayName,
                email: trimmedEmail,
                plan: 'pro',
                credits: 999999, // Unlimited
                isAdmin: false,
                allowedModules: getAllModules().map(m => m.id)
            };
            
            onLogin(newUser, true); 
        } else {
            setIsLoading(false);
            setUnlockError("Invalid License Key. Please try again.");
        }
      }, 1000);
  };

  // RENDER: LOCKED SCREEN
  if (isLocked) {
      return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-red-900/10 rounded-full blur-[150px]"></div>
            </div>

            <div className="w-full max-w-md bg-dark-900/90 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 shadow-2xl z-10 relative animate-fade-in text-center">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center border border-red-500/50">
                        <ShieldAlert className="w-8 h-8 text-red-500" />
                    </div>
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
                <p className="text-gray-400 mb-6">
                    This device is already registered to <span className="text-white font-mono bg-dark-800 px-1 rounded">{lockOwner}</span>. 
                    <br/><br/>
                    Our policy limits usage to <strong>One Device per Free Account</strong> to prevent abuse.
                </p>

                <div className="bg-dark-800 border border-gray-700 rounded-xl p-5 mb-6">
                    <h3 className="text-brand-400 font-bold mb-2 flex items-center justify-center gap-2">
                        <Key size={16} /> Upgrade to Unlock
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">
                        Enter a Pro License Key to register this device with a new account.
                    </p>
                    
                    <input 
                        type="text" 
                        value={licenseKey}
                        onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        className="w-full bg-dark-950 border border-gray-700 rounded-lg p-3 text-center text-white font-mono tracking-widest mb-3 focus:border-brand-500 outline-none uppercase"
                    />

                    {unlockError && (
                        <p className="text-red-400 text-xs mb-3">{unlockError}</p>
                    )}

                    <button 
                        onClick={handleUnlockWithLicense}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg transition-all"
                    >
                        {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Activate Pro & Unlock'}
                    </button>
                </div>

                <button 
                    onClick={() => {
                        setIsLocked(false);
                        setEmail(lockOwner || '');
                        setIsLogin(true);
                    }}
                    className="text-sm text-gray-500 hover:text-white underline"
                >
                    Login with existing account instead
                </button>
            </div>
        </div>
      );
  }

  // RENDER: FORGOT PASSWORD SCREEN
  if (isForgotPassword) {
      return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-md bg-dark-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl z-10 relative animate-fade-in">
                <div className="text-center mb-8">
                     <div className="flex justify-center mb-6">
                        <div className="w-12 h-12 bg-dark-800 rounded-xl flex items-center justify-center border border-gray-700">
                            {resetStep === 'success' ? <CheckCircle className="w-6 h-6 text-green-500" /> : <RefreshCw className="w-6 h-6 text-brand-500" />}
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        {resetStep === 'email' && 'Reset Password'}
                        {resetStep === 'password' && 'Create New Password'}
                        {resetStep === 'success' && 'Password Updated'}
                    </h1>
                    <p className="text-gray-400 text-sm">
                        {resetStep === 'email' && "Enter your email address to verify your account."}
                        {resetStep === 'password' && "Create a strong password for your account."}
                        {resetStep === 'success' && "Your password has been successfully reset."}
                    </p>
                </div>

                {resetStep === 'success' ? (
                    <div className="space-y-4">
                        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4 flex flex-col items-center gap-2 text-center">
                            <p className="text-green-200 font-medium">You can now log in</p>
                            <p className="text-xs text-green-300/70">Please use your new password to access your account.</p>
                        </div>
                        <button 
                            onClick={() => {
                                setIsForgotPassword(false);
                                setResetStep('email');
                                setResetEmail('');
                                setNewPassword('');
                                setConfirmPassword('');
                                setPassword(''); 
                                setResetError(null);
                            }}
                            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-900/20"
                        >
                            Back to Sign In
                        </button>
                    </div>
                ) : (
                    <>
                        {resetError && (
                            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-2">
                                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                                <p className="text-sm text-red-200">{resetError}</p>
                            </div>
                        )}

                        {resetStep === 'email' && (
                            <form onSubmit={handleResetEmailSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="reset-email" className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Email Address</label>
                                    <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        id="reset-email"
                                        type="email"
                                        required
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        className="w-full bg-dark-950 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                                        placeholder="you@example.com"
                                    />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoadingReset}
                                    className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-900/20"
                                >
                                    {isLoadingReset ? <Loader2 className="animate-spin" size={20} /> : 'Verify Email'}
                                </button>
                            </form>
                        )}

                        {resetStep === 'password' && (
                             <form onSubmit={handleNewPasswordSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="new-password" className="block text-xs font-medium text-gray-400 uppercase tracking-wider">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            id="new-password"
                                            type="password"
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-dark-950 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="confirm-password" className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            id="confirm-password"
                                            type="password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-dark-950 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoadingReset}
                                    className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-900/20"
                                >
                                    {isLoadingReset ? <Loader2 className="animate-spin" size={20} /> : 'Update Password'}
                                </button>
                             </form>
                        )}

                        <button 
                            type="button"
                            onClick={() => {
                                setIsForgotPassword(false);
                                setResetStep('email');
                                setResetEmail('');
                                setNewPassword('');
                                setConfirmPassword('');
                                setResetError(null);
                            }}
                            className="w-full text-gray-500 hover:text-white text-sm py-2 transition-colors mt-2"
                        >
                            Cancel
                        </button>
                    </>
                )}
            </div>
        </div>
      );
  }

  // RENDER: MAIN AUTH SCREEN
  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-dark-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl z-10 relative animate-fade-in">
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Zap className="w-7 h-7 text-white fill-current" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-400 text-sm">
            {isLogin
              ? 'Enter your credentials to access your workspace'
              : 'Get started with 1000 free credits today'}
          </p>
        </div>
        
        {authError && (
            <div className="mb-6 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-2 animate-fade-in">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                <p className="text-sm text-red-200">{authError}</p>
            </div>
        )}

        {/* Demo Login Button (Added for Tester Convenience) */}
        <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 border border-gray-600 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-3 transition-all mb-3 group"
        >
            <PlayCircle size={18} className="text-green-400 group-hover:text-green-300" />
            Quick Demo Access
        </button>

        {/* Google Login Button */}
        <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
            className="w-full bg-dark-800 hover:bg-dark-700 border border-gray-700 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-3 transition-all mb-6"
        >
            {isGoogleLoading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </>
            )}
        </button>

        <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-800"></div>
            <span className="text-xs text-gray-500 font-medium uppercase">Or continue with email</span>
            <div className="flex-1 h-px bg-gray-800"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" method="POST" action="#">
          {!isLogin && (
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-dark-950 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-dark-950 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                placeholder="you@example.com"
                autoComplete="username" 
                name="email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-dark-950 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                placeholder="••••••••"
                autoComplete="current-password"
                name="password"
              />
            </div>
          </div>

          {isLogin && (
             <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                   <input 
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-700 bg-dark-950 text-brand-600 focus:ring-brand-500/20 focus:ring-offset-0 cursor-pointer accent-brand-600" 
                   />
                   <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">Remember me</span>
                </label>
                <button 
                    type="button" 
                    onClick={() => {
                        // Pre-fill email for convenience, trimming ensures cleanliness
                        setResetEmail(email.trim()); 
                        setIsForgotPassword(true);
                    }}
                    className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors"
                >
                    Forgot password?
                </button>
             </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-900/20 mt-4"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={18} />
                </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-800 text-center">
          <p className="text-gray-400 text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                  setIsLogin(!isLogin);
                  setAuthError(null);
              }}
              className="text-brand-400 hover:text-brand-300 font-medium ml-1"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
