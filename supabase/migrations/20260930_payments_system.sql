-- ==============================================================================
-- CONDIRICO ECOMMERCE - PROFESSIONAL PAYMENTS SYSTEM (PAYPAL, STRIPE, GOOGLE PAY)
-- Migration: 20260930_payments_system.sql
-- ==============================================================================

-- 1. MODIFY ORDERS TABLE (Add payment columns safely if not present)
alter table if exists public.orders 
  add column if not exists payment_provider text,
  add column if not exists payment_id text,
  add column if not exists paid_at timestamptz,
  add column if not exists currency text default 'USD';

-- Add index on payment_id and payment_status
create index if not exists idx_orders_payment_status on public.orders(payment_status);
create index if not exists idx_orders_payment_id on public.orders(payment_id);
create index if not exists idx_orders_payment_provider on public.orders(payment_provider);

-- 2. CREATE PAYMENTS TABLE
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id bigint not null references public.orders(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  provider text not null check (provider in ('paypal', 'stripe', 'google_pay')),
  provider_payment_id text,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'USD',
  status text not null default 'pending' check (
    status in ('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded')
  ),
  idempotency_key text unique,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

-- 3. CREATE PERFORMANCE & AUDIT INDEXES
create index if not exists idx_payments_order_id on public.payments(order_id);
create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_payments_provider on public.payments(provider);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_payments_provider_payment_id on public.payments(provider_payment_id);
create index if not exists idx_payments_idempotency_key on public.payments(idempotency_key);
create index if not exists idx_payments_created_at on public.payments(created_at desc);

-- 4. ENABLE ROW LEVEL SECURITY
alter table public.payments enable row level security;

-- 5. RLS POLICIES FOR PAYMENTS
-- Users can view only their own payments; Admins can view all payments
drop policy if exists "Users can view own payments" on public.payments;
create policy "Users can view own payments"
  on public.payments for select
  using (
    auth.uid() = user_id 
    or public.is_admin()
  );

-- Only Admins or Service Role / Edge Functions can update payments
drop policy if exists "Admins can update payments" on public.payments;
create policy "Admins can update payments"
  on public.payments for update
  using (public.is_admin())
  with check (public.is_admin());

-- Insertion policy (Users or Edge Functions inserting initial pending record)
drop policy if exists "Service and users can create pending payments" on public.payments;
create policy "Service and users can create pending payments"
  on public.payments for insert
  with check (
    auth.uid() = user_id 
    or user_id is null 
    or public.is_admin()
  );

-- 6. RPC: SECURE SERVER-SIDE ORDER & PAYMENT CREATION
-- Validates stock, calculates server price, creates order and payment atomically
create or replace function public.create_secure_payment_order(
  p_items jsonb,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_shipping_address text,
  p_shipping_city text default 'Santiago',
  p_delivery_instructions text default null,
  p_payment_provider text default 'stripe',
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
  v_product record;
  v_subtotal numeric(12,2) := 0;
  v_shipping numeric(12,2) := 0;
  v_total numeric(12,2) := 0;
  v_order_id bigint;
  v_payment_id uuid;
  v_user_id uuid := auth.uid();
  v_existing_payment record;
begin
  -- 1. Check idempotency if key provided
  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    select p.id, p.order_id, p.status, p.amount into v_existing_payment
    from public.payments p
    where p.idempotency_key = p_idempotency_key;

    if found then
      return jsonb_build_object(
        'success', true,
        'order_id', v_existing_payment.order_id,
        'payment_id', v_existing_payment.id,
        'total', v_existing_payment.amount,
        'is_idempotent_replay', true
      );
    end if;
  end if;

  -- 2. Validate items
  if p_items is null or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('success', false, 'error', 'El carrito está vacío.');
  end if;

  -- 3. Calculate authoritative server subtotal & verify stock
  for v_item in select * from jsonb_to_recordset(p_items) as (productId int, product_id int, quantity int) loop
    declare
      v_pid int := coalesce(v_item.productId, v_item.product_id);
    begin
      select id, name, price, stock, is_active into v_product
      from public.products
      where id = v_pid;

      if not found or v_product.is_active = false then
        return jsonb_build_object('success', false, 'error', 'Producto no disponible en catálogo.');
      end if;

      if v_product.stock < v_item.quantity then
        return jsonb_build_object('success', false, 'error', 'Stock insuficiente para ' || v_product.name);
      end if;

      v_subtotal := v_subtotal + (v_product.price * v_item.quantity);
    end;
  end loop;

  -- Free shipping over $30
  if v_subtotal >= 30.00 then
    v_shipping := 0;
  else
    v_shipping := 3.50;
  end if;

  v_total := v_subtotal + v_shipping;

  -- 4. Create Order in database
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
    payment_provider,
    status,
    currency,
    created_at,
    updated_at
  )
  values (
    v_user_id,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_shipping_address,
    coalesce(p_shipping_city, 'Santiago'),
    p_delivery_instructions,
    v_subtotal,
    v_shipping,
    v_total,
    case 
      when p_payment_provider = 'paypal' then 'PayPal'
      when p_payment_provider = 'google_pay' then 'Google Pay'
      else 'Tarjeta (Stripe)'
    end,
    'pending',
    p_payment_provider,
    'pending',
    'USD',
    now(),
    now()
  )
  returning id into v_order_id;

  -- 5. Insert order items & reduce stock safely
  for v_item in select * from jsonb_to_recordset(p_items) as (productId int, product_id int, quantity int) loop
    declare
      v_pid int := coalesce(v_item.productId, v_item.product_id);
    begin
      select id, name, price into v_product from public.products where id = v_pid;

      insert into public.order_items (
        order_id,
        product_id,
        product_name,
        unit_price,
        quantity,
        subtotal
      )
      values (
        v_order_id,
        v_pid,
        v_product.name,
        v_product.price,
        v_item.quantity,
        (v_product.price * v_item.quantity)
      );

      -- Deduct stock
      update public.products
      set stock = greatest(0, stock - v_item.quantity)
      where id = v_pid;
    end;
  end loop;

  -- 6. Create payment record in pending state
  insert into public.payments (
    order_id,
    user_id,
    provider,
    amount,
    currency,
    status,
    idempotency_key,
    created_at,
    updated_at
  )
  values (
    v_order_id,
    v_user_id,
    p_payment_provider,
    v_total,
    'USD',
    'pending',
    p_idempotency_key,
    now(),
    now()
  )
  returning id into v_payment_id;

  return jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'payment_id', v_payment_id,
    'subtotal', v_subtotal,
    'shipping', v_shipping,
    'total', v_total,
    'currency', 'USD'
  );
exception when others then
  return jsonb_build_object('success', false, 'error', SQLERRM);
end;
$$;

-- 7. RPC: CONFIRM PAYMENT ATOMICALLY (Called by Edge Functions & Webhooks)
create or replace function public.confirm_payment_transaction(
  p_order_id bigint,
  p_provider text,
  p_provider_payment_id text,
  p_amount numeric,
  p_currency text default 'USD',
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_payment record;
begin
  -- 1. Find order
  select * into v_order from public.orders where id = p_order_id;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Pedido no encontrado.');
  end if;

  -- 2. Verify amount matches
  if v_order.total <> p_amount then
    return jsonb_build_object(
      'success', false, 
      'error', 'El monto no coincide con el total del pedido.'
    );
  end if;

  -- 3. Update or Insert payment record
  update public.payments
  set 
    status = 'paid',
    provider_payment_id = p_provider_payment_id,
    paid_at = now(),
    updated_at = now(),
    metadata = coalesce(metadata, '{}'::jsonb) || p_metadata
  where order_id = p_order_id and provider = p_provider;

  if not found then
    insert into public.payments (
      order_id,
      user_id,
      provider,
      provider_payment_id,
      amount,
      currency,
      status,
      paid_at,
      metadata,
      created_at,
      updated_at
    )
    values (
      p_order_id,
      v_order.user_id,
      p_provider,
      p_provider_payment_id,
      p_amount,
      p_currency,
      'paid',
      now(),
      p_metadata,
      now(),
      now()
    );
  end if;

  -- 4. Update order status
  update public.orders
  set 
    payment_status = 'paid',
    status = 'confirmed',
    payment_provider = p_provider,
    payment_id = p_provider_payment_id,
    paid_at = now(),
    updated_at = now()
  where id = p_order_id;

  return jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'payment_status', 'paid',
    'order_status', 'confirmed',
    'paid_at', now()
  );
exception when others then
  return jsonb_build_object('success', false, 'error', SQLERRM);
end;
$$;
