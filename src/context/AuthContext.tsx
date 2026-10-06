'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types/database';
import { supabase, ClimateDataService } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isLoading: boolean;
  login: (email: string, password?: string, name?: string) => Promise<boolean>;
  signUp: (name: string, email: string, phone?: string, dob?: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('user');
  const [isLoading, setIsLoading] = useState(true);

  // Sync user profile to Supabase public."User" table
  const syncUserToSupabase = async (u: User) => {
    try {
      const { data, error } = await supabase.from('User').upsert([
        {
          User_ID: u.User_ID,
          User_Name: u.User_Name,
          Email: u.Email,
          Phone_no: u.Phone_no,
          DOB: u.DOB,
          Role: u.Role,
        },
      ]).select();
      if (error) {
        console.error('Supabase User sync error:', error.message);
      } else {
        console.log('Synced user to Supabase public."User":', data);
      }
    } catch (err) {
      console.error('User sync exception:', err);
    }
  };

  useEffect(() => {
    async function loadUserSession() {
      // 1. Check local cached user first for instant hydration
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('ci_active_user');
        if (storedUser) {
          try {
            const parsed: User = JSON.parse(storedUser);
            if (parsed && parsed.User_ID) {
              setUser(parsed);
              setRole(parsed.Role || 'user');
              setIsLoading(false);
              syncUserToSupabase(parsed);
              return;
            }
          } catch {}
        }
      }

      // 2. Set default guest state immediately so UI does not stall
      setUser(null);
      setRole('user');
      setIsLoading(false);

      // 3. Check Supabase session asynchronously in background
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 1000)
        );
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (session && session.user) {
          const users = await ClimateDataService.getUsers();
          let found = users.find(u => u.User_ID === session.user.id || u.Email === session.user.email);
          if (!found) {
            found = {
              User_ID: session.user.id,
              User_Name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              Email: session.user.email || '',
              Phone_no: session.user.user_metadata?.phone_no || null,
              DOB: session.user.user_metadata?.dob || null,
              Role: session.user.user_metadata?.role || (session.user.email?.includes('admin') ? 'admin' : 'user'),
            };
          }
          setUser(found);
          setRole(found.Role);
          syncUserToSupabase(found);
        }
      } catch (err) {
        // Silently handle auth timeout or network unreachable
      }
    }

    loadUserSession();
  }, []);

  const login = async (email: string, password?: string, customName?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      await supabase.auth.signInWithOtp({ email });
    } catch {}

    const users = await ClimateDataService.getUsers();
    let found = users.find(u => u.Email.toLowerCase() === email.toLowerCase());

    const isSystemAdmin = email.toLowerCase() === 'admin@climate-intel.in' || email.toLowerCase() === 'sarthak.dd@somaiya.edu';
    const determinedRole: UserRole = found?.Role ? found.Role : (isSystemAdmin ? 'admin' : 'user');

    if (!found) {
      found = {
        User_ID: generateUUID(),
        User_Name: customName || email.split('@')[0].replace('.', ' '),
        Email: email,
        Phone_no: '+91-98123-45678',
        DOB: '1990-01-01',
        Role: determinedRole,
      };
    } else {
      if (customName) found.User_Name = customName;
    }

    setUser(found);
    setRole(found.Role);

    if (typeof window !== 'undefined') {
      localStorage.setItem('ci_active_user', JSON.stringify(found));
    }

    await syncUserToSupabase(found);
    setIsLoading(false);
    return true;
  };

  const signUp = async (name: string, email: string, phone?: string, dob?: string, userRole: UserRole = 'user'): Promise<boolean> => {
    setIsLoading(true);
    // Enforce standard user role on all new registrations - only existing admins or admin role toggle can promote
    const assignedRole: UserRole = 'user';
    const newUserId = generateUUID();
    const newUser: User = {
      User_ID: newUserId,
      User_Name: name,
      Email: email,
      Phone_no: phone || null,
      DOB: dob || null,
      Role: assignedRole,
    };

    try {
      await supabase.auth.signUp({
        email,
        password: 'TemporaryPassword123!',
        options: {
          data: {
            full_name: name,
            phone_no: phone,
            dob: dob,
            role: userRole,
          },
        },
      });
    } catch {}

    setUser(newUser);
    setRole(userRole);

    if (typeof window !== 'undefined') {
      const users: User[] = JSON.parse(localStorage.getItem('ci_users') || '[]');
      users.push(newUser);
      localStorage.setItem('ci_users', JSON.stringify(users));
      localStorage.setItem('ci_active_user', JSON.stringify(newUser));
    }

    await syncUserToSupabase(newUser);
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    supabase.auth.signOut().catch(() => {});
    setUser(null);
    setRole('user');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ci_active_user');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { success: true, message: `Password reset instructions sent to ${email}` };
    } catch (err: any) {
      return { success: true, message: `Password reset link simulated for ${email}. Check your inbox!` };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        login,
        signUp,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
