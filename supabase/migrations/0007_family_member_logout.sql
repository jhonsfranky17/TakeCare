-- Logout, in this app, means releasing this device's claim on its
-- family_members row (auth_user_id back to null) -- there's no email/
-- password to sign out of, so "log back in" is just re-picking the same
-- now-unclaimed row from the WhoAreYou dropdown. That's what keeps logout
-- from producing a duplicate entry: the row is reused, never recreated.
--
-- Neither existing UPDATE policy covers this transition:
--   family_members_update_self: auth.uid() -> auth.uid() (editing your own row)
--   family_members_claim:       null       -> auth.uid() (claiming)
-- This adds the missing third leg: auth.uid() -> null (releasing).
create policy "family_members_release"
  on family_members for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id is null);
