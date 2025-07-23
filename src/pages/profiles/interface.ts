export interface UserRecord {
    id: string;
    email: string;
    name: string;
    bio?: string;
    profile_photo_url?: string;
    birth_date?: string;
    height?: number;
    location_lat?: number;
    location_lng?: number;
    city?: string;
    search_radius_km?: number;
    is_trainer?: boolean;
    is_school_owner?: boolean;
    is_verified?: boolean;
    is_active?: boolean;
    is_banned?: boolean;
    show_age?: boolean;
    show_exact_location?: boolean;
    visibility?: string;
    last_seen_at?: string;
    created_at: string;
    updated_at: string;
  }

export interface DanceStyle {
    id: string;
    name: string;
    category?: string;
    description?: string;
    is_active?: boolean;
    created_at: string;
}

export interface UserDanceStyle {
    id: string;
    user_id: string;
    dance_style_id: string;
    skill_level: 'beginner' | 'intermediate' | 'advanced' | 'professional';
    years_experience?: number;
    is_teaching?: boolean;
    created_at: string;
    updated_at: string;
    dance_style?: DanceStyle;
}