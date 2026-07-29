-- Fixes for get_advisors findings raised against 20260727194235_menu_schema.sql.
--
-- 1. public_bucket_allows_listing (WARN): the SELECT policy on
--    storage.objects for the menu-images bucket let anon list every file
--    in the bucket. The bucket is already public, so direct object-URL
--    reads (what next/image will use) work without any RLS policy at
--    all; the extra policy only added an unneeded listing capability.
--    Dropped in favor of the bucket's public flag alone.

drop policy if exists "menu images are publicly readable" on storage.objects;

-- 2 & 3. anon/authenticated_security_definer_function_executable (WARN):
--    public.rls_auto_enable() is a Supabase-provisioned event trigger
--    function (it auto-enables RLS on newly created public tables),
--    not something added by this project's migrations. It's SECURITY
--    DEFINER and, like any function, got PUBLIC EXECUTE by default on
--    creation, so it showed up as callable via
--    /rest/v1/rpc/rls_auto_enable. Its `returns event_trigger` signature
--    means Postgres already refuses to run it outside the event trigger
--    system if called directly, but revoking EXECUTE closes the
--    advisory properly instead of relying on that.

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
