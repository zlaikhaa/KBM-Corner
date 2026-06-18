import { useState, useEffect } from 'react';
import { createClient } from './utils/supabase/client';
import { api } from './lib/api';
import { saveUserProfile, getUserProfile } from './lib/storage';
import { AuthForm } from './components/AuthForm';
import { StudentDashboard } from './components/StudentDashboard';
import { TutorDashboard } from './components/TutorDashboard';
import { CommitteeDashboard } from './components/CommitteeDashboard';
import { EnhancedAdminDashboard } from './components/EnhancedAdminDashboard';
import { ResetPasswordForm } from './components/ResetPasswordForm';
import { ServerErrorScreen } from './components/ServerErrorScreen';
import { EmailVerificationDialog } from './components/EmailVerificationDialog';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import clubLogo from 'figma:asset/ade13b6fb51eb9b3ff7200cf4269cebe703dd1ea.png';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [pendingVerificationData, setPendingVerificationData] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    checkSession();
    checkPasswordReset();
  }, []);

  const checkPasswordReset = () => {
    // Check if URL has reset password parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'true') {
      setIsResettingPassword(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        setUser(session.user);
        api.setAccessToken(session.access_token);
        api.setCurrentUser(session.user.id); // Set current user ID
        console.log('Access token set in checkSession');
        
        // Get user role from localStorage or user metadata
        const storedRole = localStorage.getItem(`user_role_${session.user.id}`);
        const metadataRole = session.user.user_metadata?.role;
        const role = storedRole || metadataRole || 'student';
        
        setUserRole(role);
        console.log('User role loaded:', role);

        // Ensure user profile exists in localStorage
        let userProfile = getUserProfile(session.user.id);
        if (!userProfile) {
          const verified = localStorage.getItem(`user_verified_${session.user.id}`) === 'true' || role === 'student' || role === 'admin';
          userProfile = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || localStorage.getItem(`user_name_${session.user.id}`) || 'User',
            role: role as any,
            membershipLevel: role === 'student' ? (parseInt(localStorage.getItem(`user_membership_level_${session.user.id}`) || '1')) : 0,
            verified: verified,
            verificationStatus: verified ? 'approved' as const : 'pending' as const,
            membershipExpiry: localStorage.getItem(`user_membership_expiry_${session.user.id}`) || undefined,
            createdAt: session.user.created_at || new Date().toISOString(),
          };
          saveUserProfile(session.user.id, userProfile);
          console.log('Created user profile in checkSession:', userProfile);
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      // Hardcoded admin login
      if (email === 'utmmandarinclub@gmail.com' && password === 'admin123') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          api.setAccessToken(data.session.access_token);
          api.setCurrentUser(data.user.id); // Set current user ID
          setUser(data.user);
          setUserRole('admin');
          localStorage.setItem(`user_role_${data.user.id}`, 'admin');
          
          // Save admin profile to localStorage so it shows in admin dashboard
          const adminProfile = {
            id: data.user.id,
            email: email,
            name: data.user.user_metadata?.name || 'Admin',
            role: 'admin' as const,
            membershipLevel: 0,
            verified: true,
            verificationStatus: 'approved' as const,
            createdAt: data.user.created_at || new Date().toISOString(),
          };
          saveUserProfile(data.user.id, adminProfile);
          
          return;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Provide more helpful error messages
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials or sign up if you don\'t have an account yet.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email before logging in. Check your inbox for the verification code.');
        }
        throw error;
      }

      if (data.session) {
        api.setAccessToken(data.session.access_token);
        api.setCurrentUser(data.user.id); // Set current user ID
        
        // Get role from localStorage or user metadata
        const storedRole = localStorage.getItem(`user_role_${data.user.id}`);
        const metadataRole = data.user.user_metadata?.role;
        const storedVerified = localStorage.getItem(`user_verified_${data.user.id}`);
        
        const role = storedRole || metadataRole || 'student';
        const verified = storedVerified !== null ? storedVerified === 'true' : true;
        
        // Check if user is verified (for committee members and tutors)
        if ((role === 'committee' || role === 'tutor') && !verified) {
          await supabase.auth.signOut();
          throw new Error('Your account is pending admin verification. Please wait for approval.');
        }
        
        // Ensure user profile exists in localStorage
        let userProfile = getUserProfile(data.user.id);
        if (!userProfile) {
          // Create profile if it doesn't exist
          userProfile = {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || localStorage.getItem(`user_name_${data.user.id}`) || 'User',
            role: role as any,
            membershipLevel: role === 'student' ? (parseInt(localStorage.getItem(`user_membership_level_${data.user.id}`) || '1')) : 0,
            verified: verified,
            verificationStatus: verified ? 'approved' as const : 'pending' as const,
            membershipExpiry: localStorage.getItem(`user_membership_expiry_${data.user.id}`) || undefined,
            createdAt: data.user.created_at || new Date().toISOString(),
          };
          saveUserProfile(data.user.id, userProfile);
        }
        
        setUser(data.user);
        setUserRole(role);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  };

  const handleSignup = async (email: string, password: string, name: string, role?: string) => {
    try {
      const userRole = role || 'student';
      
      // Create auth user with Supabase - this will send verification email automatically
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            role: userRole,
          },
          emailRedirectTo: undefined,
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Store pending verification data (no code stored - Supabase handles it)
      setPendingVerificationEmail(email);
      setPendingVerificationData({
        userId: authData.user.id,
        name: name,
        role: userRole,
        password: password,
      });

      // Sign out the user immediately - they need to verify email first
      await supabase.auth.signOut();

      // Show email verification dialog
      setShowEmailVerification(true);

      toast.success('Verification Email Sent!', {
        description: `Please check your email at ${email} for the 6-digit verification code.\n\nNote: If email is not configured in Supabase, check the browser console for the code.`,
        duration: 10000,
      });

      // Development fallback: Log instructions
      console.log('\n══════════════════════════════════════════════════════════');
      console.log('📧 VERIFICATION EMAIL SENT');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`Email: ${email}`);
      console.log('\n✅ NEXT STEPS:');
      console.log('1. Check your email inbox for verification code');
      console.log('2. Check spam/junk folder if not in inbox');
      console.log('3. Look for email from Supabase');
      console.log('4. Enter the 6-digit code in the dialog');
      console.log('\n⚠️ EMAIL NOT ARRIVING?');
      console.log('• Ensure "Confirm email" is enabled in Supabase Dashboard');
      console.log('• Go to: Authentication → Providers → Email → Confirm email (ON)');
      console.log('• Check SUPABASE_EMAIL_TROUBLESHOOTING.md for help');
      console.log('\n💡 DEVELOPMENT TIP:');
      console.log('If Supabase email is not configured, you can check the');
      console.log('Supabase Auth logs or configure SMTP settings.');
      console.log('═══════════════════════════════════════════════════════════\n');

      return {
        success: true,
        requiresEmailVerification: true,
        message: 'Please check your email for the verification code.'
      };
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Signup failed');
    }
  };

  const handleEmailVerification = async (code: string) => {
    try {
      if (!pendingVerificationData) {
        throw new Error('No pending verification data');
      }

      // Verify the OTP code with Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email: pendingVerificationEmail,
        token: code,
        type: 'signup',
      });

      if (error) {
        // Provide more helpful error messages
        if (error.message.includes('expired') || error.message.includes('invalid')) {
          throw new Error('Verification code has expired or is invalid. Please click "Resend Code" to get a new one.');
        }
        throw error;
      }
      
      if (!data.user) throw new Error('Verification failed');

      const { userId, name, role, password } = pendingVerificationData;

      // Create complete user profile object
      const userProfile = {
        id: userId,
        email: pendingVerificationEmail,
        name: name,
        role: role as 'student' | 'committee' | 'tutor',
        membershipLevel: role === 'student' ? 1 : 0,
        verified: role === 'committee' || role === 'tutor' ? false : true,
        verificationStatus: (role === 'committee' || role === 'tutor' ? 'pending' : 'approved') as 'pending' | 'approved' | 'rejected',
        createdAt: new Date().toISOString(),
      };

      // Save complete user profile to localStorage
      saveUserProfile(userId, userProfile);

      // Store user data in localStorage (backend will auto-create profile on first access)
      localStorage.setItem(`user_role_${userId}`, role);
      localStorage.setItem(`user_name_${userId}`, name);
      localStorage.setItem(`user_email_verified_${userId}`, 'true');
      
      // Committee members and tutors need admin verification
      if (role === 'committee' || role === 'tutor') {
        localStorage.setItem(`user_verified_${userId}`, 'false');
        localStorage.setItem(`user_verification_status_${userId}`, 'pending');
        
        // Sign out immediately since they need admin verification
        await supabase.auth.signOut();
        
        // Close verification dialog and show success message
        setShowEmailVerification(false);
        setPendingVerificationEmail('');
        setPendingVerificationData(null);
        
        toast.success('Email Verified!', {
          description: `Your ${role === 'committee' ? 'committee member' : 'tutor'} account is now pending admin verification. You'll be able to login once an admin approves your account.`,
          duration: 8000,
        });
        
        // Return successfully without throwing error
        return;
      } else {
        // Students are auto-approved
        localStorage.setItem(`user_verified_${userId}`, 'true');
        localStorage.setItem(`user_verification_status_${userId}`, 'approved');
        localStorage.setItem(`user_membership_level_${userId}`, '1');
        
        // Close verification dialog
        setShowEmailVerification(false);
        setPendingVerificationEmail('');
        setPendingVerificationData(null);
        
        toast.success('Email Verified!', {
          description: 'Your account has been activated. Welcome!',
        });
        
        // Sign in the verified student
        await handleLogin(pendingVerificationEmail, password);
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      throw new Error(error.message || 'Verification failed. Please check your code and try again.');
    }
  };

  const handleResendVerificationCode = async () => {
    try {
      if (!pendingVerificationEmail) {
        throw new Error('No email address found');
      }

      // Resend OTP using Supabase - this will send a new code via email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingVerificationEmail,
      });

      if (error) throw error;

      toast.success('Verification Code Resent!', {
        description: `A new verification code has been sent to ${pendingVerificationEmail}. Please check your email.`,
        duration: 8000,
      });
    } catch (error: any) {
      console.error('Resend verification error:', error);
      throw new Error(error.message || 'Failed to resend verification code');
    }
  };

  const handleCancelVerification = () => {
    setShowEmailVerification(false);
    setPendingVerificationEmail('');
    setPendingVerificationData(null);
    
    toast.info('Verification Cancelled', {
      description: 'You can sign up again when ready.',
    });
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
      api.setAccessToken(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <img src={clubLogo} alt="UTM Mandarin Club" className="w-16 h-16 object-contain mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show password reset form if user clicked email link
  if (isResettingPassword) {
    return (
      <ResetPasswordForm 
        onComplete={() => {
          setIsResettingPassword(false);
          handleLogout();
        }} 
      />
    );
  }

  if (!user) {
    return (
      <>
        <AuthForm onLogin={handleLogin} onSignup={handleSignup} />
        <EmailVerificationDialog
          open={showEmailVerification}
          email={pendingVerificationEmail}
          onVerify={handleEmailVerification}
          onResend={handleResendVerificationCode}
          onCancel={handleCancelVerification}
        />
        
        <Toaster position="top-center" richColors />
      </>
    );
  }

  // Route based on user role
  if (userRole === 'admin') {
    return (
      <>
        <EnhancedAdminDashboard user={user} onLogout={handleLogout} />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  if (userRole === 'tutor') {
    return (
      <>
        <TutorDashboard user={user} onLogout={handleLogout} />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  if (userRole === 'committee') {
    return (
      <>
        <CommitteeDashboard user={user} onLogout={handleLogout} />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  // Default to student dashboard
  return (
    <>
      <StudentDashboard user={user} onLogout={handleLogout} />
      <Toaster position="top-center" richColors />
    </>
  );
}