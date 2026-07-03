-- Add INSERT policy for admins to enable UPSERT queries on system_settings
drop policy if exists "Admins can insert system settings" on public.system_settings;
create policy "Admins can insert system settings"
  on public.system_settings for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Double check and ensure UPDATE policy works properly
drop policy if exists "Admins can update system settings" on public.system_settings;
create policy "Admins can update system settings"
  on public.system_settings for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
