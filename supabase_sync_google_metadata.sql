-- 1. Update the handle_new_user trigger function to populate avatar_url
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first_user boolean;
begin
  select not exists (select 1 from public.profiles) into is_first_user;

  insert into public.profiles (id, full_name, role, email, updated_at, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    case when is_first_user then 'admin' else 'user' end,
    new.email,
    now(),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  )
  on conflict (id) do update set
    full_name = coalesce(
      excluded.full_name,
      public.profiles.full_name
    ),
    avatar_url = coalesce(
      excluded.avatar_url,
      public.profiles.avatar_url
    ),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- 2. Create trigger function for auth.users updates (to sync OAuth details on subsequent logins)
create or replace function public.handle_update_user()
returns trigger as $$
begin
  update public.profiles
  set
    full_name = coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      public.profiles.full_name
    ),
    avatar_url = coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      public.profiles.avatar_url
    ),
    updated_at = now()
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

-- 3. Bind the update trigger to auth.users table
drop trigger if exists on_auth_user_updated on auth.users;

create trigger on_auth_user_updated
  after update on auth.users
  for each row
  when (old.raw_user_meta_data is distinct from new.raw_user_meta_data)
  execute procedure public.handle_update_user();
