CREATE TABLE chat_conversations ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
participant1_id UUID NOT NULL, 
participant2_id UUID NOT NULL, 
last_message_at TIMESTAMPTZ, 
is_active BOOLEAN DEFAULT true, 
created_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE chat_messages ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
conversation_id UUID NOT NULL, 
sender_id UUID NOT NULL, 
message_text TEXT NOT NULL, 
is_read BOOLEAN DEFAULT false, 
read_at TIMESTAMPTZ, 
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
phone TEXT, 
website TEXT, 
is_verified BOOLEAN DEFAULT false, 
is_active BOOLEAN DEFAULT true, 
created_at TIMESTAMPTZ DEFAULT now(), 
updated_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE dance_styles ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
name TEXT NOT NULL, 
category TEXT, 
description TEXT, 
created_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE dancer_dance_styles ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
dancer_id UUID NOT NULL, 
dance_style_id UUID NOT NULL, 
skill_level USER-DEFINED NOT NULL, 
years_experience INTEGER, 
created_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE dancer_photos ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
dancer_id UUID NOT NULL, 
photo_url TEXT NOT NULL, 
is_primary BOOLEAN DEFAULT false, 
order_index INTEGER DEFAULT 0, 
created_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE dancers ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
user_id UUID NOT NULL, 
name TEXT NOT NULL, 
bio TEXT, 
birth_date DATE, 
profile_photo_url TEXT, 
location_lat NUMERIC, 
location_lng NUMERIC, 
location_address TEXT, 
search_radius_km INTEGER DEFAULT 50, 
is_active BOOLEAN DEFAULT true, 
created_at TIMESTAMPTZ DEFAULT now(), 
updated_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE event_participants ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
event_id UUID NOT NULL, 
event_type USER-DEFINED NOT NULL, 
participant_id UUID NOT NULL, 
status USER-DEFINED DEFAULT 'registered'::participant_status,
registered_at TIMESTAMPTZ DEFAULT now() 
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
CREATE TABLE matches ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
dancer1_id UUID NOT NULL, 
dancer2_id UUID NOT NULL, 
dancer1_status USER-DEFINED DEFAULT 'pending'::match_status, 
dancer2_status USER-DEFINED DEFAULT 'pending'::match_status, 
is_match BOOLEAN, 
matched_at TIMESTAMPTZ, 
created_at TIMESTAMPTZ DEFAULT now(), 
updated_at TIMESTAMPTZ DEFAULT now() 
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
location_lat NUMERIC NOT NULL, 
location_lng NUMERIC NOT NULL, 
address TEXT NOT NULL, 
max_participants INTEGER, 
is_public BOOLEAN DEFAULT true, 
status USER-DEFINED DEFAULT 'planned'::event_status, 
created_at TIMESTAMPTZ DEFAULT now(), 
updated_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE school_dance_styles ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
school_id UUID NOT NULL, 
dance_style_id UUID NOT NULL, 
created_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE school_events ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
school_id UUID NOT NULL, 
title TEXT NOT NULL, 
description TEXT, 
event_type USER-DEFINED NOT NULL, 
dance_style_id UUID, 
start_date TIMESTAMPTZ NOT NULL, 
end_date TIMESTAMPTZ NOT NULL, 
price NUMERIC, 
max_participants INTEGER, 
registration_deadline DATE, 
status USER-DEFINED DEFAULT 'planned'::event_status, 
created_at TIMESTAMPTZ DEFAULT now(), 
updated_at TIMESTAMPTZ DEFAULT now() 
);
CREATE TABLE school_photos ( 
id UUID NOT NULL DEFAULT uuid_generate_v4(), 
school_id UUID NOT NULL, 
photo_url TEXT NOT NULL, 
caption TEXT, 
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
CREATE TABLE users ( 
id UUID NOT NULL, 
email TEXT NOT NULL, 
user_type USER-DEFINED NOT NULL, 
created_at TIMESTAMPTZ DEFAULT now(), 
updated_at TIMESTAMPTZ DEFAULT now() 
);
