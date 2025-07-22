CREATE TABLE chat_conversations ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
participant1_id UUID NOT NULL, 
participant2_id UUID NOT NULL, 
last_message_at TIMESTAMPTZ, 
last_message_preview TEXT, 
participant1_unread_count INTEGER DEFAULT 0, 
participant2_unread_count INTEGER DEFAULT 0, 
is_archived_by_participant1 BOOLEAN DEFAULT false, 
is_archived_by_participant2 BOOLEAN DEFAULT false, 
is_blocked_by_participant1 BOOLEAN DEFAULT false, 
is_blocked_by_participant2 BOOLEAN DEFAULT false, 
created_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE chat_messages ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
conversation_id UUID NOT NULL, 
sender_id UUID NOT NULL, 
message_text TEXT NOT NULL, 
is_read BOOLEAN DEFAULT false, 
read_at TIMESTAMPTZ, 
is_edited BOOLEAN DEFAULT false, 
edited_at TIMESTAMPTZ, 
is_deleted BOOLEAN DEFAULT false, 
deleted_at TIMESTAMPTZ, 
created_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE dance_schools ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
user_id UUID NOT NULL, 
name TEXT NOT NULL, 
description TEXT, 
logo_url TEXT, 
location_lat NUMERIC NOT NULL, 
location_lng NUMERIC NOT NULL, 
address TEXT NOT NULL, 
city TEXT NOT NULL, 
postal_code TEXT, 
phone TEXT, 
website TEXT, 
email_contact TEXT, 
facebook_url TEXT, 
instagram_url TEXT, 
is_verified BOOLEAN DEFAULT false, 
is_active BOOLEAN DEFAULT true, 
created_at TIMESTAMPTZ DEFAULT now(), 
updated_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE dance_styles ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
name TEXT NOT NULL, 
category TEXT NOT NULL, 
description TEXT, 
is_active BOOLEAN DEFAULT true, 
created_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE dancer_dance_styles ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
dancer_id UUID NOT NULL, 
dance_style_id UUID NOT NULL, 
skill_level USER-DEFINED NOT NULL, 
years_experience INTEGER, 
is_teaching BOOLEAN DEFAULT false, 
created_at TIMESTAMPTZ DEFAULT now(), 
updated_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE dancer_photos ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
dancer_id UUID NOT NULL, 
photo_url TEXT NOT NULL, 
thumbnail_url TEXT, 
caption TEXT, 
is_primary BOOLEAN DEFAULT false, 
order_index INTEGER DEFAULT 0, 
created_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE dancers ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
user_id UUID NOT NULL, 
name TEXT NOT NULL, 
bio TEXT, 
birth_date DATE NOT NULL, 
profile_photo_url TEXT, 
location_lat NUMERIC, 
location_lng NUMERIC, 
location_address TEXT, 
city TEXT, 
search_radius_km INTEGER DEFAULT 50, 
visibility USER-DEFINED DEFAULT 'public'::visibility_level, 
show_age BOOLEAN DEFAULT true, 
show_exact_location BOOLEAN DEFAULT false, 
is_active BOOLEAN DEFAULT true, 
created_at TIMESTAMPTZ DEFAULT now(), 
updated_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE event_participants ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
event_id UUID NOT NULL, 
participant_id UUID NOT NULL, 
partner_id UUID, 
status USER-DEFINED DEFAULT 'registered'::participant_status,
payment_status TEXT, 
registered_at TIMESTAMPTZ DEFAULT now(), 
confirmed_at TIMESTAMPTZ, 
cancelled_at TIMESTAMPTZ, 
attended_at TIMESTAMPTZ, 
notes TEXT, 
booking_type TEXT DEFAULT 'participant'::text, 
booking_notes TEXT, 
skill_level_declared USER-DEFINED, 
is_first_time BOOLEAN DEFAULT false, 
referred_by UUID, 
discount_applied NUMERIC DEFAULT 0, 
total_paid NUMERIC, 
payment_method TEXT, 
invoice_requested BOOLEAN DEFAULT false 
);
CREATE TABLE events ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
organizer_id UUID NOT NULL, 
event_category TEXT NOT NULL, 
event_format TEXT NOT NULL, 
title TEXT NOT NULL, 
description TEXT, 
dance_style_id UUID, 
start_datetime TIMESTAMPTZ NOT NULL, 
end_datetime TIMESTAMPTZ NOT NULL, 
is_recurring BOOLEAN DEFAULT false, 
recurrence_rule JSONB, 
parent_event_id UUID, 
location_type TEXT NOT NULL, 
location_name TEXT, 
address TEXT, 
city TEXT, 
location_lat NUMERIC, 
location_lng NUMERIC, 
online_platform TEXT, 
online_link TEXT, 
min_participants INTEGER DEFAULT 1, 
max_participants INTEGER, 
current_participants INTEGER DEFAULT 0, 
skill_level_required USER-DEFINED, 
skill_level_max USER-DEFINED, 
age_min INTEGER, 
age_max INTEGER, 
price_amount NUMERIC, 
price_currency TEXT DEFAULT 'PLN'::text, 
price_per TEXT, 
early_bird_discount NUMERIC, 
early_bird_deadline DATE, 
requires_partner BOOLEAN DEFAULT false, 
provides_partner BOOLEAN DEFAULT false, 
visibility TEXT DEFAULT 'public'::text, 
status TEXT DEFAULT 'active'::text, 
cancellation_policy TEXT, 
tags TEXT[], 
requirements TEXT[], 
what_to_expect TEXT, 
created_at TIMESTAMPTZ DEFAULT now(), 
updated_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE favorite_profiles ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
user_id UUID NOT NULL, 
favorite_user_id UUID NOT NULL, 
created_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE geography_columns ( 
f_table_catalog NAME, 
f_table_schema NAME, 
f_table_name NAME, 
f_geography_column NAME, 
coord_dimension INTEGER, 
srid INTEGER, 
type TEXT 
);
CREATE TABLE geometry_columns ( 
f_table_catalog CHARACTER VARYING, 
f_table_schema NAME, 
f_table_name NAME, 
f_geometry_column NAME, 
coord_dimension INTEGER, 
srid INTEGER, 
type CHARACTER VARYING 
);
CREATE TABLE lesson_packages ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
trainer_id UUID NOT NULL, 
name TEXT NOT NULL, 
description TEXT, 
lesson_count INTEGER NOT NULL, 
valid_days INTEGER NOT NULL, 
price NUMERIC NOT NULL, 
price_per_lesson NUMERIC, 
savings_amount NUMERIC, 
dance_styles TEXT[], 
max_students INTEGER DEFAULT 1, 
is_active BOOLEAN DEFAULT true, 
created_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE likes ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
from_dancer_id UUID NOT NULL, 
to_dancer_id UUID NOT NULL, 
created_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE matches_view ( 
dancer1_id UUID, 
dancer2_id UUID, 
liked_at TIMESTAMPTZ, 
matched_at TIMESTAMPTZ, 
is_match BOOLEAN 
);
CREATE TABLE music_preferences ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
dancer_id UUID NOT NULL, 
genre TEXT, 
artist TEXT, 
spotify_uri TEXT, 
created_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE package_usage ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
package_id UUID NOT NULL, 
event_id UUID NOT NULL, 
used_by UUID NOT NULL, 
used_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE purchased_packages ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
package_id UUID NOT NULL, 
buyer_id UUID NOT NULL, 
lessons_total INTEGER NOT NULL, 
lessons_used INTEGER DEFAULT 0, 
lessons_remaining INTEGER, 
purchased_at TIMESTAMPTZ DEFAULT now(), 
valid_until DATE NOT NULL, 
amount_paid NUMERIC NOT NULL, 
payment_method TEXT, 
invoice_number TEXT, 
shared_with TEXT[] DEFAULT '{}'::uuid[], 
is_active BOOLEAN DEFAULT true 
);
CREATE TABLE reviews ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
reviewer_id UUID NOT NULL, 
reviewed_id UUID NOT NULL, 
event_id UUID, 
review_type TEXT NOT NULL, 
rating_overall INTEGER NOT NULL, 
rating_teaching INTEGER, 
rating_communication INTEGER, 
rating_punctuality INTEGER, 
rating_atmosphere INTEGER, 
review_text TEXT, 
pros TEXT[], 
cons TEXT[], 
would_recommend BOOLEAN, 
is_verified_booking BOOLEAN DEFAULT false, 
response_text TEXT, 
response_at TIMESTAMPTZ, 
is_visible BOOLEAN DEFAULT true, 
moderation_status TEXT DEFAULT 'pending'::text, 
moderation_notes TEXT, 
created_at TIMESTAMPTZ DEFAULT now(), 
updated_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE school_dance_styles ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
school_id UUID NOT NULL, 
dance_style_id UUID NOT NULL, 
instructor_count INTEGER DEFAULT 1, 
created_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE school_photos ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
school_id UUID NOT NULL, 
photo_url TEXT NOT NULL, 
thumbnail_url TEXT, 
caption TEXT, 
is_featured BOOLEAN DEFAULT false, 
order_index INTEGER DEFAULT 0, 
created_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE spatial_ref_sys ( 
srid INTEGER NOT NULL, 
auth_name CHARACTER VARYING, 
auth_srid INTEGER, 
srtext CHARACTER VARYING, 
proj4text CHARACTER VARYING 
);
CREATE TABLE trainer_profiles ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
user_id UUID NOT NULL, 
stage_name TEXT, 
bio_professional TEXT, 
years_experience INTEGER, 
specialization_styles TEXT[], 
teaching_levels TEXT[], 
certifications JSONB, 
education JSONB, 
achievements TEXT[], 
video_presentation_url TEXT, 
gallery_urls TEXT[], 
available_cities TEXT[], 
max_travel_distance_km INTEGER, 
travel_fee_per_km NUMERIC, 
offers_online BOOLEAN DEFAULT false, 
offers_home_visits BOOLEAN DEFAULT false, 
offers_workshops BOOLEAN DEFAULT true, 
offers_choreography BOOLEAN DEFAULT false, 
offers_wedding_dance BOOLEAN DEFAULT false, 
price_range_min NUMERIC, 
price_range_max NUMERIC, 
price_notes TEXT, 
languages TEXT[] DEFAULT '{Polish}'::text[], 
is_verified BOOLEAN DEFAULT false, 
verified_at TIMESTAMPTZ, 
rating_average NUMERIC, 
rating_count INTEGER DEFAULT 0, 
instagram_handle TEXT, 
facebook_url TEXT, 
youtube_channel TEXT, 
tiktok_handle TEXT, 
created_at TIMESTAMPTZ DEFAULT now(), 
updated_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE user_reports ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
reporter_id UUID NOT NULL, 
reported_user_id UUID NOT NULL, 
reason TEXT NOT NULL, 
description TEXT, 
status TEXT DEFAULT 'pending'::text, 
reviewed_at TIMESTAMPTZ, 
reviewed_by UUID, 
created_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE users ( 
id UUID NOT NULL, 
email TEXT NOT NULL, 
user_type USER-DEFINED NOT NULL, 
is_active BOOLEAN DEFAULT true, 
is_banned BOOLEAN DEFAULT false, 
last_seen_at TIMESTAMPTZ, 
created_at TIMESTAMPTZ DEFAULT now(), 
updated_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE vw_public_dancers ( 
id UUID, 
name TEXT, 
bio TEXT, 
age INTEGER, 
profile_photo_url TEXT, 
location_lat NUMERIC, 
location_lng NUMERIC, 
city TEXT, 
created_at TIMESTAMPTZ, 
dance_styles TEXT[] 
);
CREATE TABLE vw_trainer_stats ( 
trainer_id UUID, 
user_id UUID, 
total_lessons BIGINT, 
unique_students BIGINT, 
avg_participants NUMERIC, 
total_revenue NUMERIC, 
rating_average NUMERIC, 
rating_count INTEGER 
);
CREATE TABLE vw_trainer_upcoming_lessons ( 
id UUID, 
trainer_id UUID, 
title TEXT, 
start_datetime TIMESTAMPTZ, 
end_datetime TIMESTAMPTZ, 
location_type TEXT, 
address TEXT, 
current_participants INTEGER, 
max_participants INTEGER, 
price_amount NUMERIC, 
confirmed_students BIGINT 
);
