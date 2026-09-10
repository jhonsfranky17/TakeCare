-- Replaces email magic-link auth with a "pick your name" flow backed by
-- Supabase anonymous sign-in: the app signs a device in anonymously with no
-- user interaction, then that device claims one family_members row (tap your
-- name once, remembered on that device from then on -- no email, ever).
--
-- family_members.auth_user_id is no longer required at insert time: rows can
-- exist "unclaimed" (auth_user_id null) so they show up in the picker, or so
-- someone can pre-add a family member who hasn't opened the app yet.

alter table family_members
  alter column auth_user_id drop not null;

-- Existing rows were claimed by real email-based auth.users identities under
-- the old flow. Email auth is going away, so those identities are no longer
-- meaningful -- unclaim everyone (names/relationships are preserved) so each
-- real person re-picks themselves on their own device under the new flow.
update family_members set auth_user_id = null;

-- family_members: readable by any authenticated (anonymous sessions count)
-- user, not just members already linked -- the picker has to show names
-- before the viewer has claimed one. Only name/relationship are exposed,
-- which was already the bar set by patients_select_authenticated.
drop policy "family_members_select" on family_members;
create policy "family_members_select"
  on family_members for select
  to authenticated
  using (true);

-- A signed-in (anonymous) device may create either its own claimed row (the
-- "not listed? add yourself" path) or an unclaimed placeholder for someone
-- else (pre-adding a family member from the Family screen before they've
-- ever opened the app).
drop policy "family_members_insert_self" on family_members;
create policy "family_members_insert"
  on family_members for insert
  to authenticated
  with check (auth_user_id = auth.uid() or auth_user_id is null);

-- Editing your own already-claimed row (e.g. changing your name) stays
-- separate from claiming an unclaimed one -- two permissive policies, each
-- covering one case, rather than one policy trying to cover both.
create policy "family_members_claim"
  on family_members for update
  to authenticated
  using (auth_user_id is null)
  with check (auth_user_id = auth.uid());
