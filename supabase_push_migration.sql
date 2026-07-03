-- Create push subscriptions table
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table public.push_subscriptions enable row level security;

-- Policies
drop policy if exists "Users can manage their own subscriptions" on public.push_subscriptions;
create policy "Users can manage their own subscriptions"
  on public.push_subscriptions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
