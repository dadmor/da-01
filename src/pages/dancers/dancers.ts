// src/pages/dancers/dancers.ts
// User identity type
export interface UserIdentity {
    id: string;
    email: string;
    user_type: 'dancer' | 'school' | 'visitor';
  }
  
  // Dance style types
  export interface DanceStyle {
    id: string;
    name: string;
    category: string;
    description?: string;
    is_active: boolean;
    created_at: string;
  }
  
  export interface DancerDanceStyle {
    id: string;
    dancer_id: string;
    dance_style_id: string;
    skill_level: 'beginner' | 'intermediate' | 'advanced' | 'professional';
    years_experience?: number;
    is_teaching: boolean;
    created_at: string;
    updated_at: string;
    dance_styles?: DanceStyle;
  }
  
  // User type
  export interface User {
    id: string;
    email: string;
    user_type: 'dancer' | 'school' | 'visitor';
    is_active: boolean;
    is_banned: boolean;
    last_seen_at?: string;
    created_at: string;
    updated_at: string;
  }
  
  // Dancer type
  export interface Dancer {
    id: string;
    user_id: string;
    name: string;
    bio?: string;
    birth_date: string;
    profile_photo_url?: string;
    location_lat?: number;
    location_lng?: number;
    location_address?: string;
    city?: string;
    search_radius_km: number;
    visibility: 'public' | 'private';
    show_age: boolean;
    show_exact_location: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    // Relations
    dancer_dance_styles?: DancerDanceStyle[];
    users?: User;
  }
  
  // Like type
  export interface Like {
    id: string;
    from_dancer_id: string;
    to_dancer_id: string;
    created_at: string;
  }
  
  // Dancer Photo type
  export interface DancerPhoto {
    id: string;
    dancer_id: string;
    photo_url: string;
    thumbnail_url?: string;
    caption?: string;
    is_primary: boolean;
    order_index: number;
    created_at: string;
  }
  
  // Music Preference type
  export interface MusicPreference {
    id: string;
    dancer_id: string;
    genre?: string;
    artist?: string;
    spotify_uri?: string;
    created_at: string;
  }