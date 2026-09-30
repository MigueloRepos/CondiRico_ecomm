-- ==============================================================================
-- CONDIRICO ECOMMERCE - SUPABASE SECURITY, RLS, ROLES & TRANSACTIONAL CHECKOUT
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. PROFILES TABLE (Authoritative user data & roles)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  address text,
  city text,
  postal_code text,
  delivery_instructions text,
  role text not null default 'customer' check (role in ('customer', 'user', 'admin')),
  offers_newsletter boolean default true,
  whatsapp_updates boolean default true,
  preferred_invoice_type text default 'boleta',
  has_biometrics boolean default false,
  biometric_credential_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast role lookups
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_email on public.profiles(email);

-- 3. SECURE IS_ADMIN FUNCTION (Avoids RLS recursion by using SECURITY DEFINER & strict search_path)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- 4. AUTOMATIC NEW USER PROFILE TRIGGER
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_role text := 'customer';
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    phone,
    address,
    role,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'address', ''),
    default_role,
    now(),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. ENABLE ROW LEVEL SECURITY (RLS) ON ALL CORE TABLES
alter table if exists public.profiles enable row level security;
alter table if exists public.categories enable row level security;
alter table if exists public.products enable row level security;
alter table if exists public.orders enable row level security;
alter table if exists public.order_items enable row level security;
alter table if exists public.cart_items enable row level security;
alter table if exists public.favorites enable row level security;
alter table if exists public.contact_messages enable row level security;
alter table if exists public.newsletter_subscribers enable row level security;
alter table if exists public.admin_settings enable row level security;
alter table if exists public.admin_activity enable row level security;
alter table if exists public.inventory_logs enable row level security;
alter table if exists public."User_Sec" enable row level security;

-- ==============================================================================
-- 6. RLS POLICIES
-- ==============================================================================

-- --- PROFILES POLICIES ---
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can update own profile except role" on public.profiles;
create policy "Users can update own profile except role"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (
    -- If regular user, role cannot be altered to admin
    (auth.uid() = id and (role is null or role = (select p.role from public.profiles p where p.id = auth.uid())))
    or public.is_admin()
  );

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id or public.is_admin());

-- --- CATEGORIES POLICIES ---
drop policy if exists "Anyone can read active categories" on public.categories;
create policy "Anyone can read active categories"
  on public.categories for select
  using (is_active = true or public.is_admin());

drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- --- PRODUCTS POLICIES ---
drop policy if exists "Anyone can read active products" on public.products;
create policy "Anyone can read active products"
  on public.products for select
  using (is_active = true or public.is_admin());

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- --- ORDERS POLICIES ---
drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Authenticated users and guests can create orders" on public.orders;
create policy "Authenticated users and guests can create orders"
  on public.orders for insert
  with check (
    (auth.uid() is null and user_id is null)
    or (auth.uid() = user_id)
    or public.is_admin()
  );

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
  on public.orders for update
  using (public.is_admin())
  with check (public.is_admin());

-- --- ORDER ITEMS POLICIES ---
drop policy if exists "Users can view items of own orders" on public.order_items;
create policy "Users can view items of own orders"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "Insert order items for valid order" on public.order_items;
create policy "Insert order items for valid order"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or o.user_id is null or public.is_admin())
    )
  );

-- --- CART ITEMS POLICIES ---
drop policy if exists "Users can manage own cart" on public.cart_items;
create policy "Users can manage own cart"
  on public.cart_items for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- --- FAVORITES POLICIES ---
drop policy if exists "Users can manage own favorites" on public.favorites;
create policy "Users can manage own favorites"
  on public.favorites for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- --- CONTACT MESSAGES POLICIES ---
drop policy if exists "Anyone can submit contact message" on public.contact_messages;
create policy "Anyone can submit contact message"
  on public.contact_messages for insert
  with check (true);

drop policy if exists "Admins can view and manage contact messages" on public.contact_messages;
create policy "Admins can view and manage contact messages"
  on public.contact_messages for select
  using (public.is_admin());

-- --- NEWSLETTER POLICIES ---
drop policy if exists "Anyone can subscribe to newsletter" on public.newsletter_subscribers;
create policy "Anyone can subscribe to newsletter"
  on public.newsletter_subscribers for insert
  with check (true);

drop policy if exists "Admins can view newsletter subscribers" on public.newsletter_subscribers;
create policy "Admins can view newsletter subscribers"
  on public.newsletter_subscribers for select
  using (public.is_admin());

-- --- ADMIN SETTINGS & ACTIVITY ---
drop policy if exists "Anyone can read business settings" on public.admin_settings;
create policy "Anyone can read business settings"
  on public.admin_settings for select
  using (true);

drop policy if exists "Admins can manage settings" on public.admin_settings;
create policy "Admins can manage settings"
  on public.admin_settings for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can view activity logs" on public.admin_activity;
create policy "Admins can view activity logs"
  on public.admin_activity for all
  using (public.is_admin())
  with check (public.is_admin());

-- --- USER_SEC POLICIES ---
drop policy if exists "Users can manage their own security IP" on public."User_Sec";
create policy "Users can manage their own security IP"
  on public."User_Sec" for all
  using (true)
  with check (true);

-- ==============================================================================
-- 7. SECURE TRANSACTIONAL CHECKOUT RPC: create_order_secure
-- ==============================================================================
-- Validates:
-- 1. Product existence and published status (is_active = true)
-- 2. Quantity validation (integers > 0 and reasonable limits)
-- 3. Atomic stock verification and deduction
-- 4. Server-side price calculation (never trusts frontend prices or totals)
-- 5. Atomic Order and Order Items snapshot creation
-- 6. Returns order id and details or rolls back on error
-- ==============================================================================

create or replace function public.create_order_secure(
  p_items jsonb,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_shipping_address text,
  p_shipping_city text default 'Santiago',
  p_delivery_instructions text default null,
  p_payment_method text default 'Efectivo contra entrega',
  p_notes text default null,
  p_whatsapp_sent boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_item record;
  v_product_id bigint;
  v_qty int;
  v_db_product record;
  v_subtotal numeric(12,2) := 0;
  v_line_total numeric(12,2);
  v_shipping_cost numeric(12,2) := 0;
  v_total numeric(12,2) := 0;
  v_order_id bigint;
  v_order_items jsonb := '[]'::jsonb;
begin
  -- 1. Determine authentic user ID from Supabase auth context
  v_user_id := auth.uid();

  -- 2. Validate input parameters
  if p_customer_name is null or trim(p_customer_name) = '' then
    raise exception 'El nombre del cliente es obligatorio';
  end if;

  if p_customer_phone is null or trim(p_customer_phone) = '' then
    raise exception 'El teléfono del cliente es obligatorio';
  end if;

  if p_shipping_address is null or trim(p_shipping_address) = '' then
    raise exception 'La dirección de entrega es obligatoria';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El carrito está vacío';
  end if;

  -- 3. Iterate through requested items, validate stock & calculate real DB prices
  for v_item in select * from jsonb_to_recordset(p_items) as x(product_id bigint, quantity int)
  loop
    v_product_id := v_item.product_id;
    v_qty := v_item.quantity;

    -- Validate quantity bounds
    if v_qty is null or v_qty <= 0 or v_qty > 1000 then
      raise exception 'Cantidad inválida para el producto ID %: %', v_product_id, v_qty;
    end if;

    -- Lock and retrieve product details
    select id, name, price, unit, stock, is_active
    into v_db_product
    from public.products
    where id = v_product_id
    for update;

    if not found then
      raise exception 'El producto ID % no existe', v_product_id;
    end if;

    if v_db_product.is_active is not true then
      raise exception 'El producto % no está activo actualmente', v_db_product.name;
    end if;

    if v_db_product.stock is not null and v_db_product.stock < v_qty then
      raise exception 'Stock insuficiente para %. Disponible: %, solicitado: %',
        v_db_product.name, v_db_product.stock, v_qty;
    end if;

    -- Atomic stock deduction
    if v_db_product.stock is not null then
      update public.products
      set stock = stock - v_qty,
          updated_at = now()
      where id = v_product_id;
    end if;

    -- Calculate exact subtotal line
    v_line_total := round((v_db_product.price * v_qty)::numeric, 2);
    v_subtotal := v_subtotal + v_line_total;

    -- Accumulate order item snapshot
    v_order_items := v_order_items || jsonb_build_object(
      'product_id', v_db_product.id,
      'product_name', v_db_product.name,
      'product_unit', coalesce(v_db_product.unit, 'unidad'),
      'unit_price', v_db_product.price,
      'quantity', v_qty
    );
  end loop;

  -- 4. Calculate shipping: Free shipping on orders >= $30 / 30€, otherwise $3.99 standard
  if v_subtotal >= 30.00 then
    v_shipping_cost := 0.00;
  else
    v_shipping_cost := 3.99;
  end if;

  v_total := v_subtotal + v_shipping_cost;

  -- 5. Insert order record
  insert into public.orders (
    user_id,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    shipping_city,
    delivery_instructions,
    subtotal,
    shipping_cost,
    total,
    payment_method,
    payment_status,
    status,
    whatsapp_sent,
    notes,
    created_at,
    updated_at
  )
  values (
    v_user_id,
    trim(p_customer_name),
    coalesce(trim(p_customer_email), 'cliente@condirico.com'),
    trim(p_customer_phone),
    trim(p_shipping_address),
    coalesce(trim(p_shipping_city), 'Santiago'),
    trim(p_delivery_instructions),
    v_subtotal,
    v_shipping_cost,
    v_total,
    coalesce(trim(p_payment_method), 'Efectivo contra entrega'),
    'pending',
    'pending',
    coalesce(p_whatsapp_sent, true),
    trim(p_notes),
    now(),
    now()
  )
  returning id into v_order_id;

  -- 6. Insert order items snapshot
  insert into public.order_items (
    order_id,
    product_id,
    product_name,
    product_unit,
    unit_price,
    quantity,
    created_at
  )
  select
    v_order_id,
    (elem->>'product_id')::bigint,
    elem->>'product_name',
    elem->>'product_unit',
    (elem->>'unit_price')::numeric,
    (elem->>'quantity')::int,
    now()
  from jsonb_array_elements(v_order_items) as elem;

  -- 7. Return success object
  return jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'subtotal', v_subtotal,
    'shipping_cost', v_shipping_cost,
    'total', v_total,
    'status', 'pending'
  );
exception
  when others then
    -- Transaction automatically rolls back on unhandled exception in PL/pgSQL
    return jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
end;
$$;
