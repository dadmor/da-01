# export db schema
bash _LLM_schema/scripts/export_schema.sh _LLM_schema/_SCHEMA.md

# export trigers and functions
bash _LLM_schema/scripts/export_logic.sh _LLM_schema/_LOGIC.md

# export views
bash _LLM_schema/scripts/export_views.sh _LLM_schema/_VIEWS.md

# export rls
bash _LLM_schema/scripts/export_rls.sh _LLM_schema/_RLS.md