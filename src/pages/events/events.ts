// src/pages/events/events.ts
import { DanceStyle, User, Dancer } from "../dancers/dancers";

// Event type
export interface Event {
  id: string;
  organizer_id: string;
  event_category: 'lesson' | 'workshop' | 'outdoor' | 'party' | 'course';
  event_format: 'individual' | 'couple' | 'group' | 'open';
  title: string;
  description?: string;
  dance_style_id?: string;
  start_datetime: string;
  end_datetime: string;
  is_recurring: boolean;
  recurrence_rule?: any; // JSONB
  parent_event_id?: string;
  location_type: 'address' | 'online' | 'client_location';
  location_name?: string;
  address?: string;
  city?: string;
  location_lat?: number;
  location_lng?: number;
  online_platform?: string;
  online_link?: string;
  min_participants: number;
  max_participants?: number;
  current_participants: number;
  skill_level_required?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  skill_level_max?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  age_min?: number;
  age_max?: number;
  price_amount?: number;
  price_currency: string;
  price_per?: string;
  early_bird_discount?: number;
  early_bird_deadline?: string;
  requires_partner: boolean;
  provides_partner: boolean;
  visibility: string;
  status: string;
  cancellation_policy?: string;
  tags?: string[];
  requirements?: string[];
  what_to_expect?: string;
  created_at: string;
  updated_at: string;
  // Relations
  dance_styles?: DanceStyle;
  users?: User & {
    dancers?: Dancer[];
    dance_schools?: DanceSchool[];
  };
  event_participants?: EventParticipant[];
}

// Event participant type
export interface EventParticipant {
  id: string;
  event_id: string;
  event_type: 'lesson' | 'workshop' | 'party' | 'outdoor' | 'course';
  participant_id: string;
  partner_id?: string;
  status: 'registered' | 'confirmed' | 'cancelled' | 'attended';
  payment_status?: string;
  registered_at: string;
  confirmed_at?: string;
  cancelled_at?: string;
  attended_at?: string;
  notes?: string;
  booking_type?: string;
  booking_notes?: string;
  skill_level_declared?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  is_first_time?: boolean;
  referred_by?: string;
  discount_applied?: number;
  total_paid?: number;
  payment_method?: string;
  invoice_requested?: boolean;
}

// Dance School type (for events)
export interface DanceSchool {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  logo_url?: string;
  location_lat: number;
  location_lng: number;
  address: string;
  city: string;
  postal_code?: string;
  phone?: string;
  website?: string;
  email_contact?: string;
  facebook_url?: string;
  instagram_url?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}