-- intake_logs.medicine_id had no ON DELETE behavior (default NO ACTION),
-- so deleting a medicine with any dose history -- which is nearly every
-- medicine, since generate_todays_doses() creates a pending row for it
-- every single day -- failed with a raw foreign-key-violation error rather
-- than succeeding. This was never exercised before now: nothing in the UI
-- called delete on a medicine with existing intake_logs until the "Remove
-- medicine" flow's confirm dialog made removing an established medicine (as
-- opposed to one added by mistake seconds ago) a realistic thing to do.
--
-- Cascading here means removing a medicine also removes its dose history
-- from History -- there's no meaningful "orphaned log for a medicine that
-- no longer exists" state to preserve instead (History.tsx renders
-- dose.medicine.name directly via the intake_logs -> medicines join, so a
-- log row with no medicine behind it would have nothing to display anyway).
alter table intake_logs
  drop constraint intake_logs_medicine_id_fkey,
  add constraint intake_logs_medicine_id_fkey
    foreign key (medicine_id) references medicines(id) on delete cascade;
