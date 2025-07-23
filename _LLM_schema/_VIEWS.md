# DATABASE VIEWS
Generated: 2025-07-23 12:15:16.189713+00

# error_analysis [VIEW]
subject text
topic text
question_text text
error_count bigint
students_with_errors bigint
---
📊 Dependencies:
TABLE: incorrect_answers
TABLE: lessons
TABLE: tasks
VIEW: error_analysis
---
📄 Definition:
```sql
 SELECT l.subject,
    l.topic,
    t.question_text,
    count(*) AS error_count,
    count(DISTINCT ia.user_id) AS students_with_errors
   FROM incorrect_answers ia
     JOIN tasks t ON ia.task_id = t.id
     JOIN lessons l ON ia.lesson_id = l.id
  GROUP BY l.subject, l.topic, t.question_text
  ORDER BY (count(*)) DESC;
```

# student_rankings [VIEW]
user_id uuid
username text
xp int
level int
streak int
rank bigint
---
📊 Dependencies:
TABLE: users
VIEW: student_rankings
---
📄 Definition:
```sql
 SELECT id AS user_id,
    username,
    xp,
    level,
    streak,
    dense_rank() OVER (ORDER BY xp DESC) AS rank
   FROM users u
  WHERE role = 'student'::user_role;
```
