import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, onAuthStateChange } from '@/lib/supabase';
import { tts } from '@/lib/tts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateUser: (updates: any) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        tts.speakSuccess(`Welcome back, ${user.user_metadata?.name || 'User'}!`);
      } else {
        tts.speak('You have been signed out.');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        tts.speakError(`Sign in failed: ${result.error || 'Unknown error'}`);
        return { error: new Error(result.error || 'Sign in failed') };
      }

      // Set the session in Supabase client for consistency
      if (result.session) {
        await supabase.auth.setSession(result.session);
      }

      tts.speakSuccess('Successfully signed in!');
      return { error: null };
    } catch (error: any) {
      tts.speakError('An unexpected error occurred during sign in.');
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, userData }),
      });

      const result = await response.json();

      if (!response.ok) {
        tts.speakError(`Sign up failed: ${result.error || 'Unknown error'}`);
        return { error: new Error(result.error || 'Sign up failed') };
      }

      // Set the session in Supabase client for consistency
      if (result.session) {
        await supabase.auth.setSession(result.session);
      }

      tts.speakSuccess('Account created successfully!');
      return { error: null };
    } catch (error: any) {
      tts.speakError('An unexpected error occurred during sign up.');
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const result = await response.json();
        tts.speakError(`Sign out failed: ${result.error || 'Unknown error'}`);
        throw new Error(result.error || 'Sign out failed');
      }

      // Also sign out from Supabase client
      await supabase.auth.signOut();
      tts.speak('You have been signed out.');
    } catch (error) {
      tts.speakError('An unexpected error occurred during sign out.');
      throw error;
    }
  };

  const updateUser = async (updates: any) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) {
        tts.speakError(`Update failed: ${error.message}`);
        return { error };
      }

      tts.speakSuccess('Profile updated successfully!');
      return { error: null };
    } catch (error) {
      tts.speakError('An unexpected error occurred during update.');
      return { error };
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
