# conversation_participants
conversation_id uuid NOT NULL PK
user_id uuid NOT NULL PK
unread_count int DEFAULT 0
last_read_at timestamp
is_archived bool DEFAULT false
is_muted bool DEFAULT false
joined_at timestamp DEFAULT now()
---
conversation_id → conversations.id ON DELETE CASCADE
user_id → users.id ON DELETE CASCADE

# conversations
id uuid NOT NULL DEFAULT uuid_generate_v4() PK
created_at timestamp DEFAULT now()
last_message_at timestamp
last_message_preview text

# dance_styles
id uuid NOT NULL DEFAULT uuid_generate_v4() PK
name text NOT NULL
category text
description text
is_active bool DEFAULT true
created_at timestamp DEFAULT now()
---
UNQ: dance_styles_name_key (name)
CHK: dance_styles_category_check ((category = ANY (ARRAY['ballroom'::text, 'latin'::text, 'street'::text, 'folk'::text, 'other'::text])))

# event_participants
id uuid NOT NULL DEFAULT uuid_generate_v4() PK
event_id uuid NOT NULL
user_id uuid NOT NULL
status text DEFAULT 'registered'::text
paid_amount numeric DEFAULT 0
payment_status text DEFAULT 'pending'::text
payment_method text
partner_id uuid
notes text
registered_at timestamp DEFAULT now()
confirmed_at timestamp
cancelled_at timestamp
---
event_id → events.id ON DELETE CASCADE
partner_id → users.id
user_id → users.id
---
IDX: idx_event_participants_event_id (btree (event_id))
IDX: idx_event_participants_status (btree (status))
IDX: idx_event_participants_user_id (btree (user_id))
UNQ: event_participants_event_id_user_id_key (event_id, user_id)
CHK: event_participants_payment_status_check ((payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'refunded'::text])))
CHK: event_participants_status_check ((status = ANY (ARRAY['registered'::text, 'confirmed'::text, 'waitlist'::text, 'attended'::text, 'cancelled'::text])))

# events
id uuid NOT NULL DEFAULT uuid_generate_v4() PK
organizer_id uuid NOT NULL
title text NOT NULL
description text
event_type text NOT NULL
dance_style_id uuid
start_at timestamp NOT NULL
end_at timestamp NOT NULL
is_recurring bool DEFAULT false
recurrence_rule jsonb
parent_event_id uuid
location_type text NOT NULL
location_name text
address text
city text
location_lat numeric
location_lng numeric
online_platform text
online_link text
website_url text
registration_url text
min_participants int DEFAULT 1
max_participants int
participant_count int DEFAULT 0
skill_level_min text
skill_level_max text
price numeric DEFAULT 0
currency text DEFAULT 'PLN'::text
early_bird_price numeric
early_bird_deadline date
requires_partner bool DEFAULT false
age_min int
age_max int
status text DEFAULT 'draft'::text
visibility text DEFAULT 'public'::text
created_at timestamp DEFAULT now()
updated_at timestamp DEFAULT now()
---
dance_style_id → dance_styles.id
organizer_id → users.id
parent_event_id → events.id
---
IDX: idx_events_dance_style_id (btree (dance_style_id))
IDX: idx_events_organizer_id (btree (organizer_id))
IDX: idx_events_start_at (btree (start_at))
IDX: idx_events_status (btree (status))
CHK: events_event_type_check ((event_type = ANY (ARRAY['lesson'::text, 'workshop'::text, 'social'::text, 'competition'::text, 'performance'::text])))
CHK: events_location_type_check ((location_type = ANY (ARRAY['physical'::text, 'online'::text, 'hybrid'::text])))
CHK: events_skill_level_max_check ((skill_level_max = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text, 'professional'::text])))
CHK: events_skill_level_min_check ((skill_level_min = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text, 'professional'::text])))
CHK: events_status_check ((status = ANY (ARRAY['draft'::text, 'published'::text, 'cancelled'::text, 'completed'::text])))
CHK: events_visibility_check ((visibility = ANY (ARRAY['public'::text, 'private'::text, 'unlisted'::text])))

# favorite_profiles
id uuid NOT NULL DEFAULT uuid_generate_v4() PK
user_id uuid NOT NULL
favorite_user_id uuid NOT NULL
created_at timestamp DEFAULT now()
---
favorite_user_id → users.id ON DELETE CASCADE
user_id → users.id ON DELETE CASCADE
---
UNQ: favorite_profiles_user_id_favorite_user_id_key (user_id, favorite_user_id)
CHK: favorite_profiles_check ((user_id <> favorite_user_id))

# likes
id uuid NOT NULL DEFAULT uuid_generate_v4() PK
from_user_id uuid NOT NULL
to_user_id uuid NOT NULL
created_at timestamp DEFAULT now()
---
from_user_id → users.id ON DELETE CASCADE
to_user_id → users.id ON DELETE CASCADE
---
IDX: idx_likes_from_user_id (btree (from_user_id))
IDX: idx_likes_to_user_id (btree (to_user_id))
UNQ: likes_from_user_id_to_user_id_key (from_user_id, to_user_id)
CHK: likes_check ((from_user_id <> to_user_id))

# message_reads
message_id uuid NOT NULL PK
user_id uuid NOT NULL PK
read_at timestamp DEFAULT now()
---
message_id → messages.id ON DELETE CASCADE
user_id → users.id ON DELETE CASCADE

# messages
id uuid NOT NULL DEFAULT uuid_generate_v4() PK
conversation_id uuid NOT NULL
sender_id uuid NOT NULL
content text NOT NULL
is_edited bool DEFAULT false
edited_at timestamp
is_deleted bool DEFAULT false
deleted_at timestamp
created_at timestamp DEFAULT now()
---
conversation_id → conversations.id ON DELETE CASCADE
sender_id → users.id
---
IDX: idx_messages_conversation_id (btree (conversation_id))
IDX: idx_messages_created_at (btree (created_at))

# reviews
id uuid NOT NULL DEFAULT uuid_generate_v4() PK
reviewer_id uuid NOT NULL
reviewed_user_id uuid
event_id uuid
rating_overall int NOT NULL
rating_teaching int
rating_atmosphere int
rating_organization int
content text
is_visible bool DEFAULT true
is_verified_booking bool DEFAULT false
created_at timestamp DEFAULT now()
updated_at timestamp DEFAULT now()
---
event_id → events.id
reviewed_user_id → users.id
reviewer_id → users.id
---
IDX: idx_reviews_event_id (btree (event_id))
IDX: idx_reviews_reviewed_user_id (btree (reviewed_user_id))
UNQ: reviews_reviewer_id_reviewed_user_id_event_id_key (reviewer_id, reviewed_user_id, event_id)
CHK: reviews_rating_atmosphere_check (((rating_atmosphere >= 1) AND (rating_atmosphere <= 5)))
CHK: reviews_rating_organization_check (((rating_organization >= 1) AND (rating_organization <= 5)))
CHK: reviews_rating_overall_check (((rating_overall >= 1) AND (rating_overall <= 5)))
CHK: reviews_rating_teaching_check (((rating_teaching >= 1) AND (rating_teaching <= 5)))

# spatial_ref_sys
srid int NOT NULL
auth_name varchar
auth_srid int
srtext varchar
proj4text varchar

# user_dance_styles
id uuid NOT NULL DEFAULT uuid_generate_v4() PK
user_id uuid NOT NULL
dance_style_id uuid NOT NULL
skill_level text NOT NULL
years_experience int
is_teaching bool DEFAULT false
created_at timestamp DEFAULT now()
updated_at timestamp DEFAULT now()
---
dance_style_id → dance_styles.id ON DELETE CASCADE
user_id → users.id ON DELETE CASCADE
---
UNQ: user_dance_styles_user_id_dance_style_id_key (user_id, dance_style_id)
CHK: user_dance_styles_skill_level_check ((skill_level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text, 'professional'::text])))

# user_photos
id uuid NOT NULL DEFAULT uuid_generate_v4() PK
user_id uuid NOT NULL
photo_url text NOT NULL
thumbnail_url text
caption text
is_primary bool DEFAULT false
order_index int DEFAULT 0
created_at timestamp DEFAULT now()
---
user_id → users.id ON DELETE CASCADE

# user_reports
id uuid NOT NULL DEFAULT uuid_generate_v4() PK
reporter_id uuid NOT NULL
reported_user_id uuid
reported_event_id uuid
reason text NOT NULL
description text
status text DEFAULT 'pending'::text
resolution_notes text
resolved_by uuid
resolved_at timestamp
created_at timestamp DEFAULT now()
---
reported_event_id → events.id
reported_user_id → users.id
reporter_id → users.id
resolved_by → users.id
---
CHK: user_reports_reason_check ((reason = ANY (ARRAY['spam'::text, 'fake_profile'::text, 'inappropriate_content'::text, 'harassment'::text, 'other'::text])))
CHK: user_reports_status_check ((status = ANY (ARRAY['pending'::text, 'reviewing'::text, 'resolved'::text, 'dismissed'::text])))

# users
id uuid NOT NULL PK
email text NOT NULL
name text NOT NULL
bio text
profile_photo_url text
birth_date date
height int
location_lat numeric
location_lng numeric
city text
search_radius_km int DEFAULT 50
is_trainer bool DEFAULT false
is_school_owner bool DEFAULT false
is_verified bool DEFAULT false
is_active bool DEFAULT true
is_banned bool DEFAULT false
show_age bool DEFAULT true
show_exact_location bool DEFAULT false
visibility text DEFAULT 'public'::text
last_seen_at timestamp
created_at timestamp DEFAULT now()
updated_at timestamp DEFAULT now()
location_earth cube
---
IDX: idx_users_city (btree (city))
IDX: idx_users_is_trainer (btree (is_trainer) WHERE (is_trainer = true))
IDX: idx_users_location (gist (location_earth))
UNQ: users_email_key (email)
CHK: users_visibility_check ((visibility = ANY (ARRAY['public'::text, 'friends'::text, 'private'::text])))
