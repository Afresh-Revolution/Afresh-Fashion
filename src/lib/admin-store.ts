export interface VipSignup {
  email: string;
  joinedAt: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  price: string;
  category: string;
  status: "published" | "draft";
  stock: number;
}

export interface DropSettings {
  title: string;
  subtitle: string;
  pieces: number;
  dropDate: string;
}

const VIP_KEY = "afresh_vip_signups";
const PRODUCTS_KEY = "afresh_admin_products";
const DROP_KEY = "afresh_drop_settings";

const DEFAULT_PRODUCTS: AdminProduct[] = [
  { id: "1", name: "Heritage Bomber", price: "₦185,000", category: "outerwear", status: "published", stock: 24 },
  { id: "2", name: "Neo Lagos Tee", price: "₦65,000", category: "tops", status: "published", stock: 120 },
  { id: "3", name: "Saheli Trousers", price: "₦120,000", category: "bottoms", status: "published", stock: 18 },
  { id: "4", name: "Identity Chain", price: "₦95,000", category: "accessories", status: "published", stock: 45 },
];

const DEFAULT_DROP: DropSettings = {
  title: "Ancestral Code",
  subtitle: 'The "Ancestral Code" Capsule — 50 Pieces Worldwide',
  pieces: 50,
  dropDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getVipSignups(): VipSignup[] {
  return read<VipSignup[]>(VIP_KEY, []);
}

export function addVipSignup(email: string) {
  const list = getVipSignups();
  if (list.some((s) => s.email === email)) return list;
  const next = [{ email, joinedAt: new Date().toISOString() }, ...list];
  write(VIP_KEY, next);
  return next;
}

export function getProducts(): AdminProduct[] {
  return read<AdminProduct[]>(PRODUCTS_KEY, DEFAULT_PRODUCTS);
}

export function saveProducts(products: AdminProduct[]) {
  write(PRODUCTS_KEY, products);
}

export function getDropSettings(): DropSettings {
  return read<DropSettings>(DROP_KEY, DEFAULT_DROP);
}

export function saveDropSettings(settings: DropSettings) {
  write(DROP_KEY, settings);
}
