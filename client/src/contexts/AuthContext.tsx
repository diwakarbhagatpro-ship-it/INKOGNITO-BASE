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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        tts.speakError(`Sign in failed: ${error.message}`);
        return { error };
      }

      // Create or update user profile in our database
      if (data.user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError && profileError.code === 'PGRST116') {
            // User doesn't exist in our database, create them
            const { error: createError } = await supabase
              .from('users')
              .insert({
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name || data.user.email,
                role: data.user.user_metadata?.role || 'blind_user',
                preferences: {
                  ttsEnabled: true,
                  highContrast: false,
                  fontSize: 'medium',
                }
              });

            if (createError) {
              console.error('Error creating user profile:', createError);
            }
          }
        } catch (profileError) {
          console.error('Error handling user profile:', profileError);
        }
      }

      tts.speakSuccess('Successfully signed in!');
      return { error: null };
    } catch (error) {
      tts.speakError('An unexpected error occurred during sign in.');
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (error) {
        tts.speakError(`Sign up failed: ${error.message}`);
        return { error };
      }

      // Create user profile in our database
      if (data.user) {
        try {
          const { error: createError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email,
              name: userData.name,
              role: userData.role || 'blind_user',
              phone_number: userData.phoneNumber,
              location: userData.location,
              languages: userData.languages || [],
              preferences: userData.preferences || {
                ttsEnabled: true,
                highContrast: false,
                fontSize: 'medium',
              }
            });

          if (createError) {
            console.error('Error creating user profile:', createError);
            tts.speakError('Account created but profile setup failed. Please contact support.');
          }
        } catch (profileError) {
          console.error('Error creating user profile:', profileError);
        }
      }

      tts.speakSuccess('Account created successfully! Please check your email to verify your account.');
      return { error: null };
    } catch (error) {
      tts.speakError('An unexpected error occurred during sign up.');
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        tts.speakError(`Sign out failed: ${error.message}`);
        throw error;
      }
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
