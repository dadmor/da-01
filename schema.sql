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
event_type USER-DEFINED NOT NULL, 
participant_id UUID NOT NULL, 
partner_id UUID, 
status USER-DEFINED DEFAULT 'registered'::participant_status,
payment_status TEXT, 
registered_at TIMESTAMPTZ DEFAULT now(), 
confirmed_at TIMESTAMPTZ, 
cancelled_at TIMESTAMPTZ, 
attended_at TIMESTAMPTZ, 
notes TEXT 
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
CREATE TABLE outdoor_events ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
organizer_id UUID NOT NULL, 
title TEXT NOT NULL, 
description TEXT, 
dance_style_id UUID, 
event_date TIMESTAMPTZ NOT NULL, 
duration_minutes INTEGER, 
location_lat NUMERIC NOT NULL, 
location_lng NUMERIC NOT NULL, 
address TEXT NOT NULL, 
meeting_point_details TEXT, 
max_participants INTEGER, 
current_participants INTEGER DEFAULT 0, 
min_skill_level USER-DEFINED, 
is_public BOOLEAN DEFAULT true, 
requires_partner BOOLEAN DEFAULT false, 
status USER-DEFINED DEFAULT 'planned'::event_status, 
cancelled_reason TEXT, 
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
CREATE TABLE school_events ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
school_id UUID NOT NULL, 
title TEXT NOT NULL, 
description TEXT, 
event_type USER-DEFINED NOT NULL, 
dance_style_id UUID, 
instructor_name TEXT, 
start_date TIMESTAMPTZ NOT NULL, 
end_date TIMESTAMPTZ NOT NULL, 
recurrence_pattern TEXT, 
price NUMERIC, 
member_price NUMERIC, 
max_participants INTEGER, 
current_participants INTEGER DEFAULT 0, 
min_skill_level USER-DEFINED, 
max_skill_level USER-DEFINED, 
registration_deadline DATE, 
early_bird_deadline DATE, 
early_bird_discount NUMERIC, 
status USER-DEFINED DEFAULT 'planned'::event_status, 
cancelled_reason TEXT, 
created_at TIMESTAMPTZ DEFAULT now(), 
updated_at TIMESTAMPTZ DEFAULT now() 
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
CREATE TABLE vw_upcoming_events ( 
event_type TEXT, 
id UUID, 
title TEXT, 
description TEXT, 
start_date TIMESTAMPTZ, 
end_date TIMESTAMPTZ, 
location_lat NUMERIC, 
location_lng NUMERIC, 
address TEXT, 
max_participants INTEGER, 
current_participants INTEGER, 
dance_style_name TEXT, 
organizer_name TEXT, 
organizer_photo TEXT, 
organizer_type TEXT 
);
