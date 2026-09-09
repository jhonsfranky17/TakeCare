-- Family members now enter their own name and relationship to the patient
-- at sign-up time (see Onboarding screen), instead of the name being
-- derived from their email prefix. Nullable: existing rows created before
-- this change keep their auto-derived name with no relationship set.
alter table family_members
  add column relationship text;
