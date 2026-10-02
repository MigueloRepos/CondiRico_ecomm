-- ==============================================================================
-- CONDIRICO ECOMMERCE - PHONE AUTHENTICATION & LOOKUP SUPPORT
-- Migration: 20261002_phone_auth_support.sql
-- ==============================================================================

-- 1. Index phone on profiles for fast lookups
create index if not exists idx_profiles_phone on public.profiles(phone);

-- 2. Function to search profile by phone (normalizing numbers by stripping non-digits)
create or replace function public.get_profile_by_phone(lookup_phone text)
returns table (
  id uuid,
  email text,
  full_name text,
  phone text,
  role text,
  has_biometrics boolean
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  cleaned_lookup text;
begin
  -- Strip all non-digit characters except leading plus
  cleaned_lookup := regexp_replace(lookup_phone, '[^\d]', '', 'g');

  return query
  select 
    p.id,
    p.email,
    p.full_name,
    p.phone,
    p.role,
    coalesce(p.has_biometrics, false) as has_biometrics
  from public.profiles p
  where 
    p.phone is not null 
    and (
      p.phone = lookup_phone
      or regexp_replace(p.phone, '[^\d]', '', 'g') = cleaned_lookup
      or regexp_replace(p.phone, '[^\d]', '', 'g') like '%' || cleaned_lookup
      or cleaned_lookup like '%' || regexp_replace(p.phone, '[^\d]', '', 'g')
    )
  limit 1;
end;
$$;

-- Grant execution to anon and authenticated
grant execute on function public.get_profile_by_phone(text) to anon, authenticated;
