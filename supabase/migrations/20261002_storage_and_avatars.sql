-- ==============================================================================
-- CONDIRICO ECOMMERCE - SUPABASE STORAGE FOR PRODUCTS & USER AVATARS
-- Migration: 20261002_storage_and_avatars.sql
-- ==============================================================================

-- 1. Ensure avatar_url column exists on public.profiles
alter table if exists public.profiles add column if not exists avatar_url text;

-- 2. Create storage buckets for products and user avatars (publicly readable)
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values 
      ('products', 'products', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']),
      ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
    on conflict (id) do update set
      public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

    -- Allow public read access on both buckets
    if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public Access Products') then
      create policy "Public Access Products" on storage.objects for select using (bucket_id = 'products');
    end if;

    if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public Access Avatars') then
      create policy "Public Access Avatars" on storage.objects for select using (bucket_id = 'avatars');
    end if;

    -- Allow insert/upload on products
    if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Allow Upload Products') then
      create policy "Allow Upload Products" on storage.objects for insert with check (bucket_id = 'products');
    end if;

    -- Allow insert/upload on avatars
    if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Allow Upload Avatars') then
      create policy "Allow Upload Avatars" on storage.objects for insert with check (bucket_id = 'avatars');
    end if;

    -- Allow update on products
    if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Allow Update Products') then
      create policy "Allow Update Products" on storage.objects for update using (bucket_id = 'products');
    end if;

    -- Allow update on avatars
    if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Allow Update Avatars') then
      create policy "Allow Update Avatars" on storage.objects for update using (bucket_id = 'avatars');
    end if;
  end if;
end $$;
