-- 1. Drop existing role check constraint if it exists
alter table public.profiles drop constraint if exists profiles_role_check;

-- 2. Create updated check constraint supporting new roles
alter table public.profiles add constraint profiles_role_check check (
  role in ('user', 'admin', 'subadmin', 'admin booking', 'teacher', 'Housekeeper')
);
