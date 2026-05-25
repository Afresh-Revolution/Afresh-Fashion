export type CartLineItem = {
  id: string;
  product_id: string;
  slug: string;
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  image_url: string | null;
  image_urls: string[];
  stock_quantity: number;
};

export type CartResponse = {
  id: string;
  item_count: number;
  subtotal_amount: number;
  currency_code: string;
  items: CartLineItem[];
};

export type CheckoutForm = {
  email: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
  customer_notes?: string;
};

export type OrderSummary = {
  id: string;
  order_number: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  status: string;
  payment_method: string | null;
  payment_status: string;
  subtotal_amount: number;
  shipping_amount: number;
  total_amount: number;
  currency_code: string;
  shipping_address: Record<string, string> | null;
  customer_notes: string | null;
  items: {
    id: string;
    product_name: string;
    product_slug: string | null;
    product_image_url: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];
};
