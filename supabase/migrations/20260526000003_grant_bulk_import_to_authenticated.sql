-- L3: Grant authenticated users EXECUTE on bulk_import_exam_sessions_safe so the
-- admin browser UI can call it via supabase.rpc(). The function itself performs
-- an internal admin role check, so the grant is safe.

GRANT EXECUTE ON FUNCTION public.bulk_import_exam_sessions_safe(JSONB) TO authenticated;
