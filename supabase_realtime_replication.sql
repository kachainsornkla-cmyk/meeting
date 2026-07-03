-- Enable Supabase Realtime replication for notifications table
alter publication supabase_realtime add table public.notifications;
