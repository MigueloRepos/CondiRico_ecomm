-- ==============================================================================
-- CONDIRICO ECOMMERCE - REMOVE UNAUTHORIZED IP BLOCKING
-- Migration: 20261002_remove_ip_blocking.sql
-- ==============================================================================

-- 1. Drop any legacy IP security or block tables if they exist
DROP TABLE IF EXISTS public."User_Sec" CASCADE;
DROP TABLE IF EXISTS public.ip_blacklist CASCADE;
DROP TABLE IF EXISTS public.ip_whitelist CASCADE;
DROP TABLE IF EXISTS public.blocked_ips CASCADE;

-- 2. Drop any legacy IP blocking RPC functions
DROP FUNCTION IF EXISTS public.check_ip_block(text) CASCADE;
DROP FUNCTION IF EXISTS public.is_ip_allowed(text) CASCADE;
DROP FUNCTION IF EXISTS public.block_ip_address(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.unblock_ip_address(text) CASCADE;

-- 3. Confirm open public access to standard storefront and authentication
-- All legitimate customers can register, log in, browse, and checkout without IP restrictions.
