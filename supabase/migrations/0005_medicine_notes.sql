-- Optional free-text note per medicine (e.g. "take with food", "the small
-- white one") -- shown on both the Medicines list and today's dose card,
-- since the latter is where it's most useful (at the moment of taking it).
alter table medicines
  add column notes text;
