-- Ensure metering_events.org_id is uuid (matches org.id)
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'metering_events'
      and column_name = 'org_id'
      and data_type = 'text'
  ) then
    alter table public.metering_events
      alter column org_id type uuid
      using nullif(org_id, '')::uuid;
  end if;
exception
  when undefined_table then
    -- metering_events not created yet; ignore.
    null;
end $$;

