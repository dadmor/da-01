# FUNCTIONS

SELECT 
    routine_schema,
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition
FROM information_schema.routines
WHERE routine_name LIKE 'fn_%'
    AND routine_schema = 'public'  -- lub inny schemat
ORDER BY routine_name;


# TRIGGERS 

SELECT 
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_schema,
    event_object_table,
    action_timing,
    action_orientation,
    action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE 'trg_%'
    AND trigger_schema = 'public'  -- lub inny schemat
ORDER BY event_object_table, trigger_name;