-- Applied to production on 2026-09-11.
--
-- The rest of the settings CRUD work needed no schema change: is_active
-- already existed on schools, departments, offices, grade_scale and
-- leave_types, and every one of those tables already had a *_write_admin
-- policy with cmd = ALL, which covers UPDATE and DELETE.
--
-- This is the only addition: an office must not report to itself. The UI and
-- the server action both prevent it, but the constraint makes it impossible
-- regardless of how the row is written.

alter table public.offices drop constraint if exists offices_no_self_report;
alter table public.offices add constraint offices_no_self_report
  check (reports_to_office_id is distinct from id);
