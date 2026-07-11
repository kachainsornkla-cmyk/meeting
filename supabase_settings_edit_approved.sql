-- Seed default role permissions for editing/cancelling approved bookings
insert into public.system_settings (key, value)
values ('edit_approved_booking_roles', '["admin", "subadmin", "admin booking"]'::jsonb)
on conflict (key) do nothing;
