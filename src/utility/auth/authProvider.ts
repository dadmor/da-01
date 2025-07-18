// utility/auth/authProvider.ts

import { AuthBindings } from "@refinedev/core";
import { supabaseClient } from "..";
import { parseSupabaseError, getErrorMessage, AuthError } from "./authErrors";

// Typ użytkownika z tabeli public.users
export interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  city?: string;
  postal_code?: string;
  name?: string;
  street_address?: string;
  operator_id?: string;
}

export const authProvider: AuthBindings = {
  login: async ({ email, password, providerName }) => {
    try {
      // OAuth login
      if (providerName) {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
          provider: providerName,
        });
        
        if (error) {
          return { success: false, error: parseSupabaseError(error) };
        }
        
        return { success: true, redirectTo: data?.url };
      }

      // Email/password login
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { success: false, error: parseSupabaseError(error) };
      }

      // Pobierz użytkownika z public.users
      const { data: userData } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      return { 
        success: true, 
        redirectTo: `/${userData?.role}` || "/" 
      };
    } catch (error) {
      return { success: false, error: parseSupabaseError(error) };
    }
  },

  register: async ({ email, password, role, operator_id }) => {
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { 
          data: { 
            role,
            ...(operator_id && { operator_id }),
          } 
        },
      });

      if (error) {
        return { success: false, error: parseSupabaseError(error) };
      }
      
      if (!data?.user) {
        return {
          success: false,
          error: new AuthError(
            getErrorMessage('registration_failed'),
            "registration_failed",
            400
          ),
        };
      }

      // Sprawdź czy to nowy użytkownik
      const isNewUser = data.user.identities && data.user.identities.length > 0;
      
      if (!isNewUser) {
        return {
          success: false,
          error: new AuthError(
            getErrorMessage('user_already_exists'),
            "user_already_exists",
            409
          ),
        };
      }

      return { 
        success: true, 
        user: data.user, 
        session: data.session 
      };
    } catch (error) {
      return { success: false, error: parseSupabaseError(error) };
    }
  },

  forgotPassword: async ({ email }) => {
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      
      if (error) {
        return { success: false, error: parseSupabaseError(error) };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: parseSupabaseError(error) };
    }
  },

  updatePassword: async ({ password }) => {
    try {
      const { error } = await supabaseClient.auth.updateUser({ password });
      
      if (error) {
        return { success: false, error: parseSupabaseError(error) };
      }
      
      return { success: true, redirectTo: "/" };
    } catch (error) {
      return { success: false, error: parseSupabaseError(error) };
    }
  },

  logout: async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) {
        return { success: false, error: parseSupabaseError(error) };
      }
      
      return { 
        success: true, 
        redirectTo: "/login"
      };
    } catch (error) {
      return { success: false, error: parseSupabaseError(error) };
    }
  },

  onError: async (error) => {
    return { error: parseSupabaseError(error) };
  },

  check: async () => {
    try {
      const { data } = await supabaseClient.auth.getSession();
      return { authenticated: !!data.session };
    } catch (error) {
      return { 
        authenticated: false, 
        error: parseSupabaseError(error) 
      };
    }
  },

  getPermissions: async () => {
    try {
      const { data: authData, error: authError } = await supabaseClient.auth.getUser();
      
      if (authError || !authData?.user) {
        console.error("Error getting auth user:", parseSupabaseError(authError));
        return null;
      }
      
      // Pobierz rolę z tabeli public.users
      const { data: userData, error: userError } = await supabaseClient
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single();
        
      if (userError) {
        console.error("Error getting user role:", parseSupabaseError(userError));
        return null;
      }
      
      return userData?.role || null;
    } catch (error) {
      console.error("Error in getPermissions:", parseSupabaseError(error));
      return null;
    }
  },

  getIdentity: async () => {
    try {
      const { data: authData, error: authError } = await supabaseClient.auth.getUser();
      
      if (authError || !authData?.user) {
        console.error("Error getting auth user:", parseSupabaseError(authError));
        return null;
      }
      
      // Pobierz pełne dane użytkownika z public.users
      const { data: userData, error: userError } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();
        
      if (userError) {
        console.error("Error getting user data:", parseSupabaseError(userError));
        return null;
      }
      
      // Dodaj timestamp żeby React Query wiedział że to nowe dane
      return {
        ...userData,
        _timestamp: Date.now()
      } as User & { _timestamp: number };
    } catch (error) {
      console.error("Error in getIdentity:", parseSupabaseError(error));
      return null;
    }
  },
};