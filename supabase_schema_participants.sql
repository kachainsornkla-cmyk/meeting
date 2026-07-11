-- Add participants_count column to public.bookings
alter table public.bookings 
add column if not exists participants_count integer not null default 1 check (participants_count > 0);
