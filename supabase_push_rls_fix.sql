-- Fix RLS Policies for push_subscriptions table
-- To deliver Web Push notifications, the user performing the action (e.g. user booking a room, or admin approving a booking) 
-- needs to select the target user's push subscription keys. The old policy restricted SELECT strictly to auth.uid() = user_id, 
-- which blocked all cross-user push alerts.

-- 1. Drop existing restrict-all policies
drop policy if exists "Users can manage their own subscriptions" on public.push_subscriptions;
drop policy if exists "Users can view all push subscriptions" on public.push_subscriptions;
drop policy if exists "Users can manage their own push subscriptions" on public.push_subscriptions;

-- 2. Create select policy allowing any authenticated user to view push subscriptions
-- (Required so that when User A bookings a room, User A's API can fetch Admin B's subscription endpoint and VAPID keys to send push)
create policy "Users can view all push subscriptions"
  on public.push_subscriptions for select
  to authenticated
  using (true);

-- 3. Create separate insert, update, and delete policy restricted only to the owner
create policy "Users can manage their own push subscriptions"
  on public.push_subscriptions for insert update delete
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
