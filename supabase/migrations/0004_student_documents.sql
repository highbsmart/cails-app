-- Applied to production on 2026-09-11 as 'documents_allow_student_entity'.
--
-- Student Records needed no new tables: public.students, its RLS policies
-- (VIEW_STAFF to read, MANAGE_ACADEMIC_STRUCTURE to write, with a
-- department-scoped variant) and student_course_registrations already existed
-- and were simply unused by the app.
--
-- The only change was to let documents be filed against a student, and to let
-- a student see their own.

alter table public.documents drop constraint if exists documents_entity_type_check;
alter table public.documents add constraint documents_entity_type_check
  check (entity_type in ('general','staff','student','leave','accreditation','memo','task'));
