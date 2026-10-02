-- ==============================================================================
-- CONDIRICO ECOMMERCE - PRODUCT REVIEWS SYSTEM
-- Migration: 20261001_product_reviews.sql
-- ==============================================================================

-- 1. Create product_reviews table
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null,
  user_email text,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null check (char_length(trim(comment)) >= 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_product_user_review unique (product_id, user_id)
);

-- 2. Performance Indexes
create index if not exists idx_product_reviews_product_id on public.product_reviews(product_id);
create index if not exists idx_product_reviews_user_id on public.product_reviews(user_id);
create index if not exists idx_product_reviews_created_at on public.product_reviews(created_at desc);
create index if not exists idx_product_reviews_rating on public.product_reviews(rating);

-- 3. Enable Row Level Security (RLS)
alter table public.product_reviews enable row level security;

-- 4. RLS Policies
-- Everyone (logged in or guest) can read published reviews
drop policy if exists "Anyone can read product reviews" on public.product_reviews;
create policy "Anyone can read product reviews"
  on public.product_reviews for select
  using (true);

-- Only authenticated users can submit reviews for themselves
drop policy if exists "Authenticated users can create own reviews" on public.product_reviews;
create policy "Authenticated users can create own reviews"
  on public.product_reviews for insert
  with check (auth.uid() = user_id);

-- Review authors can update their own reviews
drop policy if exists "Users can update own reviews" on public.product_reviews;
create policy "Users can update own reviews"
  on public.product_reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Review authors or Admins can delete reviews
drop policy if exists "Users and admins can delete reviews" on public.product_reviews;
create policy "Users and admins can delete reviews"
  on public.product_reviews for delete
  using (auth.uid() = user_id or public.is_admin());

-- 5. Optional RPC to update average rating on products table
create or replace function public.sync_product_rating(p_product_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_avg_rating numeric(3,2);
  v_count integer;
begin
  select coalesce(avg(rating), 5.0), count(*)
  into v_avg_rating, v_count
  from public.product_reviews
  where product_id = p_product_id;

  if v_count > 0 then
    update public.products
    set rating = round(v_avg_rating, 1)
    where id = p_product_id;
  end if;
end;
$$;
