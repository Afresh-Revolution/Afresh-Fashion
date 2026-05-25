-- Checkout & payments migration
-- In Supabase: select ALL lines below, then click Run.
-- Success = Results tab shows: Migration 005 complete

DROP FUNCTION IF EXISTS afresh_add_column_if_missing(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION afresh_add_column_if_missing(
  p_table TEXT,
  p_column TEXT,
  p_definition TEXT
) RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = p_table
  ) THEN
    RETURN 'skip (no table): ' || p_table;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = p_table AND column_name = p_column
  ) THEN
    RETURN 'skip (exists): ' || p_table || '.' || p_column;
  END IF;
  EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', p_table, p_column, p_definition);
  RETURN 'ok: ' || p_table || '.' || p_column;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'error: ' || p_table || '.' || p_column || ' — ' || SQLERRM;
END;
$$;

DO $migrate_005$
BEGIN
  PERFORM afresh_add_column_if_missing('orders', 'payment_method', 'TEXT');
  PERFORM afresh_add_column_if_missing('orders', 'payment_status', 'TEXT NOT NULL DEFAULT ''unpaid''');
  PERFORM afresh_add_column_if_missing('orders', 'paystack_reference', 'TEXT');
  PERFORM afresh_add_column_if_missing('orders', 'phone', 'TEXT');
  PERFORM afresh_add_column_if_missing('orders', 'full_name', 'TEXT');
  PERFORM afresh_add_column_if_missing('orders', 'customer_notes', 'TEXT');
  PERFORM afresh_add_column_if_missing('orders', 'expected_delivery_at', 'TIMESTAMPTZ');
  PERFORM afresh_add_column_if_missing('orders', 'delivery_message', 'TEXT');
  PERFORM afresh_add_column_if_missing('orders', 'manual_paid_at', 'TIMESTAMPTZ');
  PERFORM afresh_add_column_if_missing('order_items', 'product_image_url', 'TEXT');
  PERFORM afresh_add_column_if_missing('order_items', 'product_slug', 'TEXT');
END
$migrate_005$;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_placed_at ON orders(placed_at DESC);

SELECT 'Migration 005 complete — checkout & payment columns ready' AS status, NOW() AS completed_at;
