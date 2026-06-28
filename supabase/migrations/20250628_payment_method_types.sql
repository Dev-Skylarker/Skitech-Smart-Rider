-- Expand payment_methods.method_type to match the app UI.
-- Run this in the Supabase SQL editor if inserts fail with a 400/check constraint error.

ALTER TABLE public.payment_methods
  DROP CONSTRAINT IF EXISTS payment_methods_method_type_check;

ALTER TABLE public.payment_methods
  ADD CONSTRAINT payment_methods_method_type_check
  CHECK (method_type IN (
    'mpesa',
    'send_money',
    'till',
    'paybill',
    'bank',
    'pochi_la_biashara',
    'other'
  ));
