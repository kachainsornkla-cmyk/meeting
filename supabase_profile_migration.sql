-- 1. Add new columns to public.profiles table
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists learning_group text;
alter table public.profiles add column if not exists work_group text;
alter table public.profiles add column if not exists position text;
alter table public.profiles add column if not exists academic_standing text;
alter table public.profiles add column if not exists advisor_role text;
alter table public.profiles add column if not exists responsible_room text;
alter table public.profiles add column if not exists phone text;

-- 2. Create a bucket for user avatars in Supabase Storage
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 3. Set up Storage Security Policies (RLS) for the avatars bucket
-- 3.1 Allow anyone to read avatar images
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- 3.2 Allow authenticated users to upload their own avatar
create policy "Users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- 3.3 Allow authenticated users to update their own avatar
create policy "Users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- 3.4 Allow authenticated users to delete their own avatar
create policy "Users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
