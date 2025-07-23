# ENUM TYPES
task_type: (single_choice, multiple_choice, true_false, fill_blank)
user_role: (student, teacher, admin)

# articles
id uuid NOT NULL DEFAULT uuid_generate_v4() PK
lesson_id uuid NOT NULL
title text NOT NULL
content text NOT NULL
sort_order int NOT NULL DEFAULT 0
created_at timestamp NOT NULL DEFAULT now()
---
lesson_id → lessons.id ON DELETE CASCADE
---
IDX: idx_articles_lesson_id (btree (lesson_id))

# badge_criteria
id uuid NOT NULL DEFAULT uuid_generate_v4() PK
badge_id uuid NOT NULL
criteria_type text NOT NULL
criteria_value int NOT NULL
created_at timestamp NOT NULL DEFAULT now()
---
badge_id → badges.id ON DELETE CASCADE
---
IDX: idx_badge_criteria_badge_id (btree (badge_id))
IDX: idx_badge_criteria_type (btree (criteria_type))
UNQ: badge_criteria_badge_id_criteria_type_key (badge_id, criteria_type)
CHK: badge_criteria_criteria_type_check ((criteria_type = ANY (ARRAY['level'::text, 'streak'::text, 'xp'::text])))
CHK: badge_criteria_criteria_value_check ((criteria_value > 0))

# badges
id uuid NOT NULL DEFAULT uuid_generate_v4() PK
name text NOT NULL
description text
icon_url text

# class_enrollments
id uuid NOT NULL DEFAULT uuid_generate_v4() PK
user_id uuid NOT NULL
class_id uuid NOT NULL
enrolled_at timestamp NOT NULL DEFAULT now()
left_at timestamp
---
class_id → classes.id ON DELETE CASCADE
user_id → users.id ON DELETE CASCADE
---
IDX: idx_class_enrollments_class (btree (class_id))
IDX: idx_class_enrollments_user (btree (user_id))
UNQ: class_enrollments_user_id_class_id_enrolled_at_key (user_id, class_id, enrolled_at)

# class_lessons
class_id uuid NOT NULL PK
lesson_id uuid NOT NULL PK
---
class_id → classes.id ON DELETE CASCADE
lesson_id → lessons.id ON DELETE CASCADE
---
IDX: idx_class_lessons_class (btree (class_id))
IDX: idx_class_lessons_lesson (btree (lesson_id))

# classes
id uuid NOT NULL DEFAULT uuid_generate_v4() PK
name text NOT NULL
education_year int NOT NULL
grade text NOT NULL
created_at timestamp NOT NULL DEFAULT now()

# incorrect_answers
id uuid NOT NULL DEFAULT uuid_generate_v4() PK
user_id uuid NOT NULL
task_id uuid NOT NULL
lesson_id uuid NOT NULL
given_answer text NOT NULL
created_at timestamp NOT NULL DEFAULT now()
---
lesson_id → lessons.id ON DELETE CASCADE
task_id → tasks.id ON DELETE CASCADE
user_id → users.id ON DELETE CASCADE
---
IDX: idx_incorrect_answers_created_at (btree (created_at))
IDX: idx_incorrect_answers_lesson_id (btree (lesson_id))
IDX: idx_incorrect_answers_task_id (btree (task_id))
IDX: idx_incorrect_answers_user_id (btree (user_id))

# lessons
id uuid NOT NULL DEFAULT uuid_generate_v4() PK
title text NOT NULL
description text
author_id uuid NOT NULL
subject text
education_level text
grade text
topic text
created_at timestamp NOT NULL DEFAULT now()
---
author_id → users.id ON DELETE CASCADE
---
IDX: idx_lessons_author_id (btree (author_id))

# progress
id uuid NOT NULL DEFAULT uuid_generate_v4() PK
user_id uuid NOT NULL
lesson_id uuid NOT NULL
score int NOT NULL
total_tasks int NOT NULL
correct_tasks int NOT NULL
attempts_count int NOT NULL DEFAULT 1
streak_bonus int NOT NULL DEFAULT 0
completed_at timestamp NOT NULL DEFAULT now()
---
lesson_id → lessons.id ON DELETE CASCADE
user_id → users.id ON DELETE CASCADE
---
IDX: idx_progress_lesson_id (btree (lesson_id))
IDX: idx_progress_user_id (btree (user_id))
IDX: idx_progress_user_lesson ([UNIQUE] btree (user_id, lesson_id))
UNQ: progress_user_id_lesson_id_key (user_id, lesson_id)

# tasks
id uuid NOT NULL DEFAULT uuid_generate_v4() PK
lesson_id uuid NOT NULL
article_id uuid
type task_type NOT NULL
question_text text NOT NULL
options jsonb
correct_answer text NOT NULL
explanation text
xp_reward int NOT NULL
created_at timestamp NOT NULL DEFAULT now()
---
article_id → articles.id ON DELETE CASCADE
lesson_id → lessons.id ON DELETE CASCADE
---
IDX: idx_tasks_article_id (btree (article_id))
IDX: idx_tasks_lesson_id (btree (lesson_id))

# user_badges
id uuid NOT NULL DEFAULT uuid_generate_v4() PK
user_id uuid NOT NULL
badge_id uuid NOT NULL
awarded_at timestamp NOT NULL DEFAULT now()
---
badge_id → badges.id ON DELETE CASCADE
user_id → users.id ON DELETE CASCADE
---
IDX: idx_user_badges_badge_id (btree (badge_id))
IDX: idx_user_badges_user_id (btree (user_id))
UNQ: user_badges_user_id_badge_id_key (user_id, badge_id)

# users
id uuid NOT NULL PK
email text NOT NULL
username text
role user_role NOT NULL
avatar_url text
xp int NOT NULL DEFAULT 0
level int NOT NULL DEFAULT 1
streak int NOT NULL DEFAULT 0
created_at timestamp NOT NULL DEFAULT now()
---
UNQ: users_email_key (email)
