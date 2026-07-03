-- Create system settings table
create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default now() not null
);

-- Seed default notification roles value
insert into public.system_settings (key, value)
values ('notify_new_booking_roles', '["admin", "subadmin", "admin booking"]'::jsonb)
on conflict (key) do update set value = excluded.value;

-- Enable RLS
alter table public.system_settings enable row level security;

-- Policies
drop policy if exists "Anyone can read system settings" on public.system_settings;
create policy "Anyone can read system settings"
  on public.system_settings for select
  to authenticated
  using (true);

drop policy if exists "Admins can update system settings" on public.system_settings;
create policy "Admins can update system settings"
  on public.system_settings for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
