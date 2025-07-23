# DATABASE VIEWS
Generated: 2025-07-23 13:18:15.30962+00

# geography_columns [VIEW]
f_table_catalog name
f_table_schema name
f_table_name name
f_geography_column name
coord_dimension int
srid int
type text
---
📊 Dependencies:
VIEW: geography_columns
---
📄 Definition:
```sql
 SELECT current_database() AS f_table_catalog,
    n.nspname AS f_table_schema,
    c.relname AS f_table_name,
    a.attname AS f_geography_column,
    postgis_typmod_dims(a.atttypmod) AS coord_dimension,
    postgis_typmod_srid(a.atttypmod) AS srid,
    postgis_typmod_type(a.atttypmod) AS type
   FROM pg_class c,
    pg_attribute a,
    pg_type t,
    pg_namespace n
  WHERE t.typname = 'geography'::name AND a.attisdropped = false AND a.atttypid = t.oid AND a.attrelid = c.oid AND c.relnamespace = n.oid AND (c.relkind = ANY (ARRAY['r'::"char", 'v'::"char", 'm'::"char", 'f'::"char", 'p'::"char"])) AND NOT pg_is_other_temp_schema(c.relnamespace) AND has_table_privilege(c.oid, 'SELECT'::text);
```

# geometry_columns [VIEW]
f_table_catalog varchar
f_table_schema name
f_table_name name
f_geometry_column name
coord_dimension int
srid int
type varchar
---
📊 Dependencies:
VIEW: geometry_columns
---
📋 Rules:
RULE: geometry_columns_delete (DELETE) INSTEAD
RULE: geometry_columns_insert (INSERT) INSTEAD
RULE: geometry_columns_update (UPDATE) INSTEAD
---
📄 Definition:
```sql
 SELECT current_database()::character varying(256) AS f_table_catalog,
    n.nspname AS f_table_schema,
    c.relname AS f_table_name,
    a.attname AS f_geometry_column,
    COALESCE(postgis_typmod_dims(a.atttypmod), sn.ndims, 2) AS coord_dimension,
    COALESCE(NULLIF(postgis_typmod_srid(a.atttypmod), 0), sr.srid, 0) AS srid,
    replace(replace(COALESCE(NULLIF(upper(postgis_typmod_type(a.atttypmod)), 'GEOMETRY'::text), st.type, 'GEOMETRY'::text), 'ZM'::text, ''::text), 'Z'::text, ''::text)::character varying(30) AS type
   FROM pg_class c
     JOIN pg_attribute a ON a.attrelid = c.oid AND NOT a.attisdropped
     JOIN pg_namespace n ON c.relnamespace = n.oid
     JOIN pg_type t ON a.atttypid = t.oid
     LEFT JOIN ( SELECT s.connamespace,
            s.conrelid,
            s.conkey,
            replace(split_part(s.consrc, ''''::text, 2), ')'::text, ''::text) AS type
           FROM ( SELECT pg_constraint.connamespace,
                    pg_constraint.conrelid,
                    pg_constraint.conkey,
                    pg_get_constraintdef(pg_constraint.oid) AS consrc
                   FROM pg_constraint) s
          WHERE s.consrc ~~* '%geometrytype(% = %'::text) st ON st.connamespace = n.oid AND st.conrelid = c.oid AND (a.attnum = ANY (st.conkey))
     LEFT JOIN ( SELECT s.connamespace,
            s.conrelid,
            s.conkey,
            replace(split_part(s.consrc, ' = '::text, 2), ')'::text, ''::text)::integer AS ndims
           FROM ( SELECT pg_constraint.connamespace,
                    pg_constraint.conrelid,
                    pg_constraint.conkey,
                    pg_get_constraintdef(pg_constraint.oid) AS consrc
                   FROM pg_constraint) s
          WHERE s.consrc ~~* '%ndims(% = %'::text) sn ON sn.connamespace = n.oid AND sn.conrelid = c.oid AND (a.attnum = ANY (sn.conkey))
     LEFT JOIN ( SELECT s.connamespace,
            s.conrelid,
            s.conkey,
            replace(replace(split_part(s.consrc, ' = '::text, 2), ')'::text, ''::text), '('::text, ''::text)::integer AS srid
           FROM ( SELECT pg_constraint.connamespace,
                    pg_constraint.conrelid,
                    pg_constraint.conkey,
                    pg_get_constraintdef(pg_constraint.oid) AS consrc
                   FROM pg_constraint) s
          WHERE s.consrc ~~* '%srid(% = %'::text) sr ON sr.connamespace = n.oid AND sr.conrelid = c.oid AND (a.attnum = ANY (sr.conkey))
  WHERE (c.relkind = ANY (ARRAY['r'::"char", 'v'::"char", 'm'::"char", 'f'::"char", 'p'::"char"])) AND NOT c.relname = 'raster_columns'::name AND t.typname = 'geometry'::name AND NOT pg_is_other_temp_schema(c.relnamespace) AND has_table_privilege(c.oid, 'SELECT'::text);
```

# v_events_detailed [VIEW]
id uuid
organizer_id uuid
title text
description text
event_type text
dance_style_id uuid
start_at timestamp
end_at timestamp
is_recurring bool
recurrence_rule jsonb
parent_event_id uuid
location_type text
location_name text
address text
city text
location_lat numeric
location_lng numeric
online_platform text
online_link text
website_url text
registration_url text
min_participants int
max_participants int
participant_count int
skill_level_min text
skill_level_max text
price numeric
currency text
early_bird_price numeric
early_bird_deadline date
requires_partner bool
age_min int
age_max int
status text
visibility text
created_at timestamp
updated_at timestamp
organizer_name text
organizer_photo text
organizer_verified bool
dance_style_name text
dance_style_category text
confirmed_participants bigint
review_count bigint
average_rating numeric
---
📊 Dependencies:
TABLE: dance_styles
TABLE: event_participants
TABLE: events
TABLE: reviews
TABLE: users
VIEW: v_events_detailed
---
📄 Definition:
```sql
 SELECT e.id,
    e.organizer_id,
    e.title,
    e.description,
    e.event_type,
    e.dance_style_id,
    e.start_at,
    e.end_at,
    e.is_recurring,
    e.recurrence_rule,
    e.parent_event_id,
    e.location_type,
    e.location_name,
    e.address,
    e.city,
    e.location_lat,
    e.location_lng,
    e.online_platform,
    e.online_link,
    e.website_url,
    e.registration_url,
    e.min_participants,
    e.max_participants,
    e.participant_count,
    e.skill_level_min,
    e.skill_level_max,
    e.price,
    e.currency,
    e.early_bird_price,
    e.early_bird_deadline,
    e.requires_partner,
    e.age_min,
    e.age_max,
    e.status,
    e.visibility,
    e.created_at,
    e.updated_at,
    u.name AS organizer_name,
    u.profile_photo_url AS organizer_photo,
    u.is_verified AS organizer_verified,
    ds.name AS dance_style_name,
    ds.category AS dance_style_category,
    count(DISTINCT ep.user_id) FILTER (WHERE ep.status = ANY (ARRAY['confirmed'::text, 'attended'::text])) AS confirmed_participants,
    count(DISTINCT r.id) AS review_count,
    avg(r.rating_overall)::numeric(3,2) AS average_rating
   FROM events e
     JOIN users u ON e.organizer_id = u.id
     LEFT JOIN dance_styles ds ON e.dance_style_id = ds.id
     LEFT JOIN event_participants ep ON e.id = ep.event_id
     LEFT JOIN reviews r ON e.id = r.event_id AND r.is_visible = true
  GROUP BY e.id, u.id, ds.id;
```

# v_matches [VIEW]
user1_id uuid
user2_id uuid
matched_at timestamp
---
📊 Dependencies:
TABLE: likes
VIEW: v_matches
---
📄 Definition:
```sql
 SELECT l1.from_user_id AS user1_id,
    l1.to_user_id AS user2_id,
    l1.created_at AS matched_at
   FROM likes l1
     JOIN likes l2 ON l1.from_user_id = l2.to_user_id AND l1.to_user_id = l2.from_user_id
  WHERE l1.from_user_id < l1.to_user_id;
```

# v_public_dancers [VIEW]
id uuid
name text
bio text
age int
height int
profile_photo_url text
location_lat numeric
location_lng numeric
city text
is_trainer bool
is_verified bool
created_at timestamp
dance_styles ARRAY
i_liked bool
liked_me bool
is_matched bool
---
📊 Dependencies:
TABLE: dance_styles
TABLE: likes
TABLE: user_dance_styles
TABLE: users
VIEW: v_matches
VIEW: v_public_dancers
---
📄 Definition:
```sql
 SELECT u.id,
    u.name,
    u.bio,
        CASE
            WHEN u.show_age THEN date_part('year'::text, age(u.birth_date::timestamp with time zone))::integer
            ELSE NULL::integer
        END AS age,
    u.height,
    u.profile_photo_url,
        CASE
            WHEN u.show_exact_location THEN u.location_lat
            ELSE NULL::numeric
        END AS location_lat,
        CASE
            WHEN u.show_exact_location THEN u.location_lng
            ELSE NULL::numeric
        END AS location_lng,
    u.city,
    u.is_trainer,
    u.is_verified,
    u.created_at,
    array_agg(DISTINCT jsonb_build_object('style_id', ds.id, 'style_name', ds.name, 'skill_level', uds.skill_level, 'is_teaching', uds.is_teaching)) FILTER (WHERE ds.id IS NOT NULL) AS dance_styles,
    (EXISTS ( SELECT 1
           FROM likes l
          WHERE l.from_user_id = auth.uid() AND l.to_user_id = u.id)) AS i_liked,
    (EXISTS ( SELECT 1
           FROM likes l
          WHERE l.from_user_id = u.id AND l.to_user_id = auth.uid())) AS liked_me,
    (EXISTS ( SELECT 1
           FROM v_matches m
          WHERE m.user1_id = auth.uid() AND m.user2_id = u.id OR m.user1_id = u.id AND m.user2_id = auth.uid())) AS is_matched
   FROM users u
     LEFT JOIN user_dance_styles uds ON u.id = uds.user_id
     LEFT JOIN dance_styles ds ON uds.dance_style_id = ds.id
  WHERE u.is_active = true AND u.is_banned = false AND u.visibility = 'public'::text AND u.id <> COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
  GROUP BY u.id;
```

# v_trainer_stats [VIEW]
trainer_id uuid
name text
total_events bigint
unique_students bigint
avg_participants numeric
total_revenue numeric
review_count bigint
average_rating numeric
teaching_styles ARRAY
---
📊 Dependencies:
TABLE: dance_styles
TABLE: event_participants
TABLE: events
TABLE: reviews
TABLE: user_dance_styles
TABLE: users
VIEW: v_trainer_stats
---
📄 Definition:
```sql
 SELECT u.id AS trainer_id,
    u.name,
    count(DISTINCT e.id) AS total_events,
    count(DISTINCT ep.user_id) AS unique_students,
    avg(e.participant_count)::numeric(5,2) AS avg_participants,
    sum(ep.paid_amount) AS total_revenue,
    count(DISTINCT r.id) AS review_count,
    avg(r.rating_overall)::numeric(3,2) AS average_rating,
    array_agg(DISTINCT ds.name) FILTER (WHERE uds.is_teaching = true) AS teaching_styles
   FROM users u
     LEFT JOIN events e ON u.id = e.organizer_id AND e.status = 'completed'::text
     LEFT JOIN event_participants ep ON e.id = ep.event_id AND ep.status = 'attended'::text
     LEFT JOIN reviews r ON u.id = r.reviewed_user_id AND r.is_visible = true
     LEFT JOIN user_dance_styles uds ON u.id = uds.user_id AND uds.is_teaching = true
     LEFT JOIN dance_styles ds ON uds.dance_style_id = ds.id
  WHERE u.is_trainer = true
  GROUP BY u.id;
```
