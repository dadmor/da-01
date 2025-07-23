UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
       raw_user_meta_data,
       '{role}',
       '"new_role"',
       true
     )
WHERE id = '...';