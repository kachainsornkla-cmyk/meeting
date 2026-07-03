-- 1. Create a table for profiles linked to Auth Users
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  email text
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- 2. Create a table for Rooms
create table public.rooms (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  capacity integer not null,
  location text not null,
  amenities text[] default '{}'::text[] not null,
  image_url text,
  is_active boolean default true not null
);

-- Enable RLS for rooms
alter table public.rooms enable row level security;

-- 3. Create a table for Bookings
create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  room_id uuid references public.rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  purpose text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  rejection_reason text
);

-- Enable RLS for bookings
alter table public.bookings enable row level security;

-- --- SECURITY POLICIES (RLS) ---

-- Profiles Policies
create policy "Public profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Admins can update all profiles"
  on public.profiles for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Rooms Policies
create policy "Rooms are viewable by authenticated users"
  on public.rooms for select
  to authenticated
  using (is_active = true or exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

create policy "Admins can perform all actions on rooms"
  on public.rooms for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Bookings Policies
create policy "Bookings are viewable by authenticated users"
  on public.bookings for select
  to authenticated
  using (true);

create policy "Users can insert bookings for themselves"
  on public.bookings for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own bookings"
  on public.bookings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins can manage all bookings"
  on public.bookings for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- --- AUTOMATIC PROFILE CREATION ON SIGNUP ---

-- Trigger function to insert profile when auth user is created
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first_user boolean;
begin
  -- If it's the very first user in profiles, make them an admin automatically for setup convenience.
  -- Otherwise, make them a normal user.
  select not exists (select 1 from public.profiles) into is_first_user;

  insert into public.profiles (id, full_name, role, email, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when is_first_user then 'admin' else 'user' end,
    new.email,
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to run function on signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- --- INITIAL ROOM SEED DATA ---
insert into public.rooms (name, capacity, location, amenities, image_url)
values
  ('Room A - Executive Boardroom', 12, 'Building A, 4th Floor', array['Projector', 'Whiteboard', 'Video Conference', 'Sound System'], 'https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&w=800&q=80'),
  ('Room B - Creative Hub', 6, 'Building A, 2nd Floor', array['TV Screen', 'Glass Whiteboard', 'Beanbags'], 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'),
  ('Room C - Focus Pod', 4, 'Building B, 1st Floor', array['TV Screen', 'Whiteboard'], 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80');
