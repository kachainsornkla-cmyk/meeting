-- Seed pre-meeting reminder setting with default value (15 minutes)
insert into public.system_settings (key, value)
values ('reminder_before_minutes', '15'::jsonb)
on conflict (key) do nothing;

-- Drop and recreate INSERT policy to allow subadmins
drop policy if exists "Admins can insert system settings" on public.system_settings;
create policy "Admins can insert system settings"
  on public.system_settings for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin', 'subadmin')
    )
  );

-- Drop and recreate UPDATE policy to allow subadmins
drop policy if exists "Admins can update system settings" on public.system_settings;
create policy "Admins can update system settings"
  on public.system_settings for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin', 'subadmin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin', 'subadmin')
    )
  );
