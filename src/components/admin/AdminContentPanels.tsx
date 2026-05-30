"use client";

import { useCallback, useEffect, useState } from "react";
import MediaUpload from "@/components/admin/MediaUpload";
import type {
  AboutSection,
  CinematicSection,
  CinematicVideo,
  CollectionItem,
  CollaboratorItem,
  CommunityItem,
  ContentStatus,
  DropSection,
  EditorialItem,
  HeroSection,
  LookbookItem,
  ProductItem,
} from "@/types/content";
import styles from "@/styles/admin.module.scss";

type Notify = (msg: string) => void;

type AboutStatRow = {
  id: string;
  value_numeric: number | null;
  is_symbolic: boolean;
  symbol_text: string | null;
  label: string;
  sort_order: number;
  status: ContentStatus;
};

type AboutSectionRow = AboutSection & { status: ContentStatus };

type DropRow = DropSection & { id: string; status: ContentStatus; is_active: boolean };

type HeroRow = HeroSection & { status: ContentStatus };

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const text = await res.text();
  let data: { error?: string };
  try {
    data = JSON.parse(text) as { error?: string };
  } catch {
    throw new Error(
      res.ok
        ? "Invalid server response"
        : `Server error (${res.status}). Stop the dev server, delete the .next folder, and run npm run dev again.`
    );
  }
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

function StatusSelect({
  value,
  onChange,
}: {
  value: ContentStatus;
  onChange: (s: ContentStatus) => void;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as ContentStatus)} className={styles.statusSelect}>
      <option value="draft">draft</option>
      <option value="published">published</option>
      <option value="archived">archived</option>
    </select>
  );
}

function ItemActions({
  onSave,
  onDelete,
  onToggle,
  status,
}: {
  onSave: () => void;
  onDelete: () => void;
  onToggle: () => void;
  status: ContentStatus;
}) {
  return (
    <div className={styles.itemActions}>
      <button type="button" className={styles.btnSmall} onClick={onSave}>
        Save
      </button>
      <button type="button" className={styles.btnSmall} onClick={onToggle}>
        {status === "published" ? "Unpublish" : "Publish"}
      </button>
      <button type="button" className={styles.btnSmall} onClick={onDelete}>
        Delete
      </button>
    </div>
  );
}

export function CollectionsPanel({ notify }: { notify: Notify }) {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await api<CollectionItem[]>("/api/admin/collections"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    const created = await api<CollectionItem>("/api/admin/collections", {
      method: "POST",
      body: JSON.stringify({
        chapter: "Chapter",
        title: "New Collection",
        description: "",
        status: "draft",
        sort_order: items.length,
      }),
    });
    setItems((prev) => [...prev, created]);
    notify("Collection added");
  };

  const save = async (item: CollectionItem) => {
    const updated = await api<CollectionItem>(`/api/admin/collections/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify(item),
    });
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    notify("Collection saved");
  };

  const remove = async (id: string) => {
    await api(`/api/admin/collections/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
    notify("Collection removed");
  };

  const toggle = async (item: CollectionItem) => {
    const status: ContentStatus = item.status === "published" ? "draft" : "published";
    await save({ ...item, status });
  };

  if (loading) return <p className={styles.empty}>Loading…</p>;

  return (
    <div className={styles.contentPanel}>
      <div className={styles.actions} style={{ marginTop: 0 }}>
        <button type="button" className={styles.btnPrimary} onClick={() => void add()}>
          Add collection
        </button>
      </div>
      {items.map((item) => (
        <div key={item.id} className={styles.contentCard}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Chapter</label>
              <input
                value={item.chapter}
                onChange={(e) =>
                  setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, chapter: e.target.value } : i)))
                }
              />
            </div>
            <div className={styles.field}>
              <label>Title</label>
              <input
                value={item.title}
                onChange={(e) =>
                  setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, title: e.target.value } : i)))
                }
              />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Description</label>
              <textarea
                rows={3}
                value={item.description}
                onChange={(e) =>
                  setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, description: e.target.value } : i)))
                }
              />
            </div>
            <div className={styles.field}>
              <label>Sort order</label>
              <input
                type="number"
                value={item.sort_order}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((i) => (i.id === item.id ? { ...i, sort_order: Number(e.target.value) } : i))
                  )
                }
              />
            </div>
            <div className={styles.field}>
              <label>Status</label>
              <StatusSelect
                value={item.status}
                onChange={(status) => setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status } : i)))}
              />
            </div>
          </div>
          <MediaUpload
            folder="collections"
            currentUrl={item.image_url}
            onUploaded={(url) => setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, image_url: url } : i)))}
          />
          <ItemActions
            status={item.status}
            onSave={() => void save(item)}
            onDelete={() => void remove(item.id)}
            onToggle={() => void toggle(item)}
          />
        </div>
      ))}
    </div>
  );
}

export function LookbookPanel({ notify }: { notify: Notify }) {
  const [items, setItems] = useState<LookbookItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api<LookbookItem[]>("/api/admin/lookbook").then(setItems).finally(() => setLoading(false));
  }, []);

  const add = async () => {
    const created = await api<LookbookItem>("/api/admin/lookbook", {
      method: "POST",
      body: JSON.stringify({ label: `Look ${String(items.length + 1).padStart(2, "0")}`, sort_order: items.length }),
    });
    setItems((prev) => [...prev, created]);
    notify("Look added");
  };

  const save = async (item: LookbookItem) => {
    const updated = await api<LookbookItem>(`/api/admin/lookbook/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify(item),
    });
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    notify("Look saved");
  };

  if (loading) return <p className={styles.empty}>Loading…</p>;

  return (
    <div className={styles.contentPanel}>
      <div className={styles.actions} style={{ marginTop: 0 }}>
        <button type="button" className={styles.btnPrimary} onClick={() => void add()}>
          Add look
        </button>
      </div>
      {items.map((item) => (
        <div key={item.id} className={styles.contentCard}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Label</label>
              <input
                value={item.label}
                onChange={(e) =>
                  setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, label: e.target.value } : i)))
                }
              />
            </div>
            <div className={styles.field}>
              <label>Sort</label>
              <input
                type="number"
                value={item.sort_order}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((i) => (i.id === item.id ? { ...i, sort_order: Number(e.target.value) } : i))
                  )
                }
              />
            </div>
            <div className={styles.field}>
              <label>Status</label>
              <StatusSelect
                value={item.status}
                onChange={(status) => setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status } : i)))}
              />
            </div>
          </div>
          <MediaUpload
            folder="lookbook"
            currentUrl={item.image_url}
            onUploaded={(url) => setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, image_url: url } : i)))}
          />
          <ItemActions
            status={item.status}
            onSave={() => void save(item)}
            onDelete={async () => {
              await api(`/api/admin/lookbook/${item.id}`, { method: "DELETE" });
              setItems((prev) => prev.filter((i) => i.id !== item.id));
              notify("Look removed");
            }}
            onToggle={() =>
              void save({ ...item, status: item.status === "published" ? "draft" : "published" })
            }
          />
        </div>
      ))}
    </div>
  );
}

export function ShopPanel({ notify }: { notify: Notify }) {
  const [items, setItems] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<ProductItem[]>("/api/admin/products"),
      api<{ slug: string; name: string }[]>("/api/admin/categories"),
    ])
      .then(([products, cats]) => {
        setItems(products);
        setCategories(cats);
      })
      .finally(() => setLoading(false));
  }, []);

  const add = async () => {
    const created = await api<ProductItem>("/api/admin/products", {
      method: "POST",
      body: JSON.stringify({
        name: "New Product",
        slug: `product-${Date.now()}`,
        category_slug: "tops",
        price_amount: 0,
        status: "draft",
        sort_order: items.length,
        swatches: ["#0A0A0A"],
      }),
    });
    setItems((prev) => [...prev, created]);
    notify("Product added");
  };

  const save = async (item: ProductItem) => {
    const updated = await api<ProductItem>(`/api/admin/products/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        ...item,
        badge: item.badge === "new" ? "new" : item.badge === "limited" ? "limited" : "none",
      }),
    });
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    notify("Product saved");
  };

  if (loading) return <p className={styles.empty}>Loading…</p>;

  return (
    <div className={styles.contentPanel}>
      <div className={styles.actions} style={{ marginTop: 0 }}>
        <button type="button" className={styles.btnPrimary} onClick={() => void add()}>
          Add product
        </button>
      </div>
      {items.map((item) => (
        <div key={item.id} className={styles.contentCard}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Name</label>
              <input
                value={item.name}
                onChange={(e) =>
                  setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, name: e.target.value } : i)))
                }
              />
            </div>
            <div className={styles.field}>
              <label>Slug</label>
              <input
                value={item.slug}
                onChange={(e) =>
                  setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, slug: e.target.value } : i)))
                }
              />
            </div>
            <div className={styles.field}>
              <label>Category</label>
              <select
                value={item.category_slug}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((i) => (i.id === item.id ? { ...i, category_slug: e.target.value } : i))
                  )
                }
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label>Price (NGN)</label>
              <input
                type="number"
                value={item.price_amount}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((i) => (i.id === item.id ? { ...i, price_amount: Number(e.target.value) } : i))
                  )
                }
              />
            </div>
            <div className={styles.field}>
              <label>Stock</label>
              <input
                type="number"
                value={item.stock_quantity}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((i) => (i.id === item.id ? { ...i, stock_quantity: Number(e.target.value) } : i))
                  )
                }
              />
            </div>
            <div className={styles.field}>
              <label>Badge</label>
              <select
                value={item.badge}
                onChange={(e) =>
                  setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, badge: e.target.value } : i)))
                }
              >
                <option value="none">none</option>
                <option value="new">new</option>
                <option value="limited">limited</option>
              </select>
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Swatches (comma-separated hex)</label>
              <input
                value={item.swatches.join(", ")}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((i) =>
                      i.id === item.id
                        ? {
                            ...i,
                            swatches: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          }
                        : i
                    )
                  )
                }
              />
            </div>
            <div className={styles.field}>
              <label>Status</label>
              <StatusSelect
                value={item.status}
                onChange={(status) => setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status } : i)))}
              />
            </div>
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label>Product images (auto-slides every 3s when multiple)</label>
            {(item.image_urls?.length ?? 0) > 0 && (
              <div className={styles.productImagesGrid}>
                {(item.image_urls ?? []).map((url, idx) => (
                  <div key={`${url}-${idx}`} className={styles.productImageThumb}>
                    <img src={url} alt="" />
                    <button
                      type="button"
                      className={styles.btnSmall}
                      onClick={() =>
                        setItems((prev) =>
                          prev.map((i) => {
                            if (i.id !== item.id) return i;
                            const image_urls = i.image_urls.filter((_, j) => j !== idx);
                            return { ...i, image_urls, image_url: image_urls[0] ?? null };
                          })
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            <MediaUpload
              folder="products"
              label="Add image to gallery"
              onUploaded={(url) =>
                setItems((prev) =>
                  prev.map((i) => {
                    if (i.id !== item.id) return i;
                    const image_urls = [...(i.image_urls ?? []), url];
                    return { ...i, image_urls, image_url: i.image_url ?? url };
                  })
                )
              }
            />
          </div>
          <ItemActions
            status={item.status}
            onSave={() => void save(item)}
            onDelete={async () => {
              await api(`/api/admin/products/${item.id}`, { method: "DELETE" });
              setItems((prev) => prev.filter((i) => i.id !== item.id));
              notify("Product removed");
            }}
            onToggle={() =>
              void save({ ...item, status: item.status === "published" ? "draft" : "published" })
            }
          />
        </div>
      ))}
    </div>
  );
}

export function CommunityPanel({ notify }: { notify: Notify }) {
  const [items, setItems] = useState<CommunityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api<CommunityItem[]>("/api/admin/community").then(setItems).finally(() => setLoading(false));
  }, []);

  const add = async () => {
    const created = await api<CommunityItem>("/api/admin/community", {
      method: "POST",
      body: JSON.stringify({ handle: "@new", sort_order: items.length }),
    });
    setItems((prev) => [...prev, created]);
    notify("Post added");
  };

  const save = async (item: CommunityItem) => {
    const updated = await api<CommunityItem>(`/api/admin/community/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify(item),
    });
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    notify("Post saved");
  };

  if (loading) return <p className={styles.empty}>Loading…</p>;

  return (
    <div className={styles.contentPanel}>
      <div className={styles.actions} style={{ marginTop: 0 }}>
        <button type="button" className={styles.btnPrimary} onClick={() => void add()}>
          Add community post
        </button>
      </div>
      {items.map((item) => (
        <div key={item.id} className={styles.contentCard}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Handle</label>
              <input
                value={item.handle}
                onChange={(e) =>
                  setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, handle: e.target.value } : i)))
                }
              />
            </div>
            <div className={styles.field}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={item.is_featured}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((i) => (i.id === item.id ? { ...i, is_featured: e.target.checked } : i))
                    )
                  }
                />
                Featured
              </label>
            </div>
            <div className={styles.field}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={item.is_large_tile}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((i) => (i.id === item.id ? { ...i, is_large_tile: e.target.checked } : i))
                    )
                  }
                />
                Large tile
              </label>
            </div>
            <div className={styles.field}>
              <label>Status</label>
              <StatusSelect
                value={item.status}
                onChange={(status) => setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status } : i)))}
              />
            </div>
          </div>
          <MediaUpload
            folder="community"
            currentUrl={item.image_url}
            onUploaded={(url) => setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, image_url: url } : i)))}
          />
          <ItemActions
            status={item.status}
            onSave={() => void save(item)}
            onDelete={async () => {
              await api(`/api/admin/community/${item.id}`, { method: "DELETE" });
              setItems((prev) => prev.filter((i) => i.id !== item.id));
              notify("Post removed");
            }}
            onToggle={() =>
              void save({ ...item, status: item.status === "published" ? "draft" : "published" })
            }
          />
        </div>
      ))}
    </div>
  );
}

export function CollaboratorsPanel({ notify }: { notify: Notify }) {
  const [items, setItems] = useState<CollaboratorItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api<CollaboratorItem[]>("/api/admin/collaborators").then(setItems).finally(() => setLoading(false));
  }, []);

  const add = async () => {
    const created = await api<CollaboratorItem>("/api/admin/collaborators", {
      method: "POST",
      body: JSON.stringify({ name: "New Collaborator", role: "Role", sort_order: items.length }),
    });
    setItems((prev) => [...prev, created]);
    notify("Collaborator added");
  };

  const save = async (item: CollaboratorItem) => {
    const updated = await api<CollaboratorItem>(`/api/admin/collaborators/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify(item),
    });
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    notify("Collaborator saved");
  };

  if (loading) return <p className={styles.empty}>Loading…</p>;

  return (
    <div className={styles.contentPanel}>
      <div className={styles.actions} style={{ marginTop: 0 }}>
        <button type="button" className={styles.btnPrimary} onClick={() => void add()}>
          Add collaborator
        </button>
      </div>
      {items.map((item) => (
        <div key={item.id} className={styles.contentCard}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Name</label>
              <input
                value={item.name}
                onChange={(e) =>
                  setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, name: e.target.value } : i)))
                }
              />
            </div>
            <div className={styles.field}>
              <label>Role</label>
              <input
                value={item.role}
                onChange={(e) =>
                  setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, role: e.target.value } : i)))
                }
              />
            </div>
            <div className={styles.field}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={item.is_wide_tile}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((i) => (i.id === item.id ? { ...i, is_wide_tile: e.target.checked } : i))
                    )
                  }
                />
                Wide tile
              </label>
            </div>
            <div className={styles.field}>
              <label>Status</label>
              <StatusSelect
                value={item.status}
                onChange={(status) => setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status } : i)))}
              />
            </div>
          </div>
          <MediaUpload
            folder="collaborators"
            currentUrl={item.avatar_url}
            onUploaded={(url) =>
              setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, avatar_url: url } : i)))
            }
          />
          <ItemActions
            status={item.status}
            onSave={() => void save(item)}
            onDelete={async () => {
              await api(`/api/admin/collaborators/${item.id}`, { method: "DELETE" });
              setItems((prev) => prev.filter((i) => i.id !== item.id));
              notify("Collaborator removed");
            }}
            onToggle={() =>
              void save({ ...item, status: item.status === "published" ? "draft" : "published" })
            }
          />
        </div>
      ))}
    </div>
  );
}

export function EditorialPanel({ notify }: { notify: Notify }) {
  const [items, setItems] = useState<EditorialItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api<EditorialItem[]>("/api/admin/editorial").then(setItems).finally(() => setLoading(false));
  }, []);

  const add = async () => {
    const created = await api<EditorialItem>("/api/admin/editorial", {
      method: "POST",
      body: JSON.stringify({
        layout: "card",
        tag: "Tag",
        title: "New Article",
        sort_order: items.length,
      }),
    });
    setItems((prev) => [...prev, created]);
    notify("Article added");
  };

  const save = async (item: EditorialItem) => {
    const updated = await api<EditorialItem>(`/api/admin/editorial/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify(item),
    });
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    notify("Article saved");
  };

  if (loading) return <p className={styles.empty}>Loading…</p>;

  return (
    <div className={styles.contentPanel}>
      <div className={styles.actions} style={{ marginTop: 0 }}>
        <button type="button" className={styles.btnPrimary} onClick={() => void add()}>
          Add article
        </button>
      </div>
      {items.map((item) => (
        <div key={item.id} className={styles.contentCard}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Layout</label>
              <select
                value={item.layout}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((i) =>
                      i.id === item.id ? { ...i, layout: e.target.value as EditorialItem["layout"] } : i
                    )
                  )
                }
              >
                <option value="featured">featured</option>
                <option value="card">card</option>
                <option value="mini">mini</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Tag</label>
              <input
                value={item.tag}
                onChange={(e) =>
                  setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, tag: e.target.value } : i)))
                }
              />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Title</label>
              <input
                value={item.title}
                onChange={(e) =>
                  setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, title: e.target.value } : i)))
                }
              />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Excerpt</label>
              <textarea
                rows={2}
                value={item.excerpt ?? ""}
                onChange={(e) =>
                  setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, excerpt: e.target.value } : i)))
                }
              />
            </div>
            <div className={styles.field}>
              <label>Meta</label>
              <input
                value={item.meta_text ?? ""}
                onChange={(e) =>
                  setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, meta_text: e.target.value } : i)))
                }
              />
            </div>
            <div className={styles.field}>
              <label>Status</label>
              <StatusSelect
                value={item.status}
                onChange={(status) => setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status } : i)))}
              />
            </div>
          </div>
          <MediaUpload
            folder="editorial"
            currentUrl={item.image_url}
            onUploaded={(url) => setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, image_url: url } : i)))}
          />
          <ItemActions
            status={item.status}
            onSave={() => void save(item)}
            onDelete={async () => {
              await api(`/api/admin/editorial/${item.id}`, { method: "DELETE" });
              setItems((prev) => prev.filter((i) => i.id !== item.id));
              notify("Article removed");
            }}
            onToggle={() =>
              void save({ ...item, status: item.status === "published" ? "draft" : "published" })
            }
          />
        </div>
      ))}
    </div>
  );
}

export function CinematicPanel({ notify }: { notify: Notify }) {
  const [section, setSection] = useState<CinematicSection | null>(null);
  const [videos, setVideos] = useState<CinematicVideo[]>([]);
  const [activeVideo, setActiveVideo] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<CinematicSection | null>("/api/admin/cinematic"),
      api<CinematicVideo[]>("/api/admin/cinematic-videos"),
    ])
      .then(([s, v]) => {
        setSection(s);
        setVideos(v);
      })
      .finally(() => setLoading(false));
  }, []);

  const saveSection = async () => {
    if (!section) return;
    const updated = await api<CinematicSection>("/api/admin/cinematic", {
      method: "PATCH",
      body: JSON.stringify(section),
    });
    setSection(updated);
    notify("Cinematic section saved");
  };

  const addVideo = async () => {
    try {
      const created = await api<CinematicVideo>("/api/admin/cinematic-videos", {
        method: "POST",
        body: JSON.stringify({ title: "Film", status: "draft", sort_order: videos.length }),
      });
      setActiveVideo(videos.length);
      setVideos((prev) => [...prev, created]);
      notify("Video slot added — upload a landscape video below");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not add video slot");
    }
  };

  const saveVideo = async (item: CinematicVideo) => {
    if (!item.video_url) {
      notify("Upload a video before saving");
      return;
    }
    try {
      const updated = await api<CinematicVideo>(`/api/admin/cinematic-videos/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: item.title,
          video_url: item.video_url,
          poster_url: item.poster_url,
          sort_order: item.sort_order,
          status: item.status,
        }),
      });
      setVideos((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      notify("Video saved");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not save video");
    }
  };

  if (loading) return <p className={styles.empty}>Loading…</p>;

  const current = videos[activeVideo];

  return (
    <div className={styles.contentPanel}>
      {section && (
        <div className={styles.contentCard}>
          <p className={styles.panelTitle}>Quote & poster</p>
          <div className={styles.formGrid}>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Quote</label>
              <textarea
                rows={2}
                value={section.quote}
                onChange={(e) => setSection({ ...section, quote: e.target.value })}
              />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Attribution</label>
              <input
                value={section.attribution}
                onChange={(e) => setSection({ ...section, attribution: e.target.value })}
              />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Play button toast</label>
              <input
                value={section.toast_message}
                onChange={(e) => setSection({ ...section, toast_message: e.target.value })}
              />
            </div>
          </div>
          <MediaUpload
            folder="cinematic"
            currentUrl={section.image_url}
            onUploaded={(url) => setSection({ ...section, image_url: url })}
          />
          <div className={styles.actions}>
            <button type="button" className={styles.btnPrimary} onClick={() => void saveSection()}>
              Save section
            </button>
          </div>
        </div>
      )}

      <div className={styles.contentCard}>
        <p className={styles.panelTitle}>Landscape videos (max 100MB each)</p>
        <div className={styles.actions} style={{ marginTop: 0 }}>
          <button type="button" className={styles.btnPrimary} onClick={() => void addVideo()}>
            Add video slot
          </button>
        </div>
        {videos.length === 0 && (
          <p className={styles.empty} style={{ marginTop: "1rem" }}>
            No landscape videos yet. Add a slot, then upload a file (max 100MB).
          </p>
        )}
        {videos.length > 0 && (
          <div className={styles.videoTabs}>
            {videos.map((v, i) => (
              <button
                key={v.id}
                type="button"
                className={`${styles.navItem} ${activeVideo === i ? styles.navItemActive : ""}`}
                onClick={() => setActiveVideo(i)}
              >
                {v.title || `Video ${i + 1}`}
              </button>
            ))}
          </div>
        )}
        {current && (
          <>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>Title</label>
                <input
                  value={current.title ?? ""}
                  onChange={(e) =>
                    setVideos((prev) =>
                      prev.map((i) => (i.id === current.id ? { ...i, title: e.target.value } : i))
                    )
                  }
                />
              </div>
              <div className={styles.field}>
                <label>Status</label>
                <StatusSelect
                  value={current.status}
                  onChange={(status) =>
                    setVideos((prev) => prev.map((i) => (i.id === current.id ? { ...i, status } : i)))
                  }
                />
              </div>
            </div>
            <MediaUpload
              folder="cinematic/videos"
              kind="video"
              label="Video file"
              currentUrl={current.video_url || undefined}
              onUploaded={(url) =>
                setVideos((prev) => prev.map((i) => (i.id === current.id ? { ...i, video_url: url } : i)))
              }
            />
            <MediaUpload
              folder="cinematic/posters"
              label="Poster (optional)"
              currentUrl={current.poster_url}
              onUploaded={(url) =>
                setVideos((prev) => prev.map((i) => (i.id === current.id ? { ...i, poster_url: url } : i)))
              }
            />
            <ItemActions
              status={current.status}
              onSave={() => void saveVideo(current)}
              onDelete={async () => {
                await api(`/api/admin/cinematic-videos/${current.id}`, { method: "DELETE" });
                setVideos((prev) => prev.filter((i) => i.id !== current.id));
                setActiveVideo(0);
                notify("Video removed");
              }}
              onToggle={() =>
                void saveVideo({
                  ...current,
                  status: current.status === "published" ? "draft" : "published",
                })
              }
            />
          </>
        )}
      </div>
    </div>
  );
}

export function AboutPanel({ notify }: { notify: Notify }) {
  const [section, setSection] = useState<AboutSectionRow | null>(null);
  const [stats, setStats] = useState<AboutStatRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ section: AboutSectionRow | null; stats: AboutStatRow[] }>("/api/admin/about");
      setSection(data.section);
      setStats(data.stats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveSection = async () => {
    if (!section) return;
    const updated = await api<AboutSectionRow>("/api/admin/about", {
      method: "PATCH",
      body: JSON.stringify(section),
    });
    setSection(updated);
    notify("About section saved");
  };

  const saveStat = async (stat: AboutStatRow) => {
    const updated = await api<AboutStatRow>(`/api/admin/about/stats/${stat.id}`, {
      method: "PATCH",
      body: JSON.stringify(stat),
    });
    setStats((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    notify("Stat saved");
  };

  const addStat = async () => {
    const created = await api<AboutStatRow>("/api/admin/about/stats", {
      method: "POST",
      body: JSON.stringify({
        label: "New metric",
        value_numeric: 0,
        is_symbolic: false,
        sort_order: stats.length,
        status: "draft",
      }),
    });
    setStats((prev) => [...prev, created]);
    notify("Stat added");
  };

  if (loading) return <p className={styles.empty}>Loading…</p>;
  if (!section) return <p className={styles.empty}>About section not found in database.</p>;

  return (
    <div className={styles.contentPanel}>
      <div className={styles.panel}>
        <p className={styles.panelTitle}>Manifesto copy (#about)</p>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label>Section label</label>
            <input
              value={section.section_label}
              onChange={(e) => setSection({ ...section, section_label: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label>Status</label>
            <StatusSelect value={section.status} onChange={(status) => setSection({ ...section, status })} />
          </div>
          <div className={styles.field}>
            <label>Heading line 1</label>
            <input
              value={section.heading_line_1}
              onChange={(e) => setSection({ ...section, heading_line_1: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label>Heading line 2</label>
            <input
              value={section.heading_line_2}
              onChange={(e) => setSection({ ...section, heading_line_2: e.target.value })}
            />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label>Lead paragraph</label>
            <textarea
              value={section.lead_paragraph}
              onChange={(e) => setSection({ ...section, lead_paragraph: e.target.value })}
            />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label>Body paragraph 1</label>
            <textarea
              value={section.body_paragraph_1}
              onChange={(e) => setSection({ ...section, body_paragraph_1: e.target.value })}
            />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label>Body paragraph 2</label>
            <textarea
              value={section.body_paragraph_2}
              onChange={(e) => setSection({ ...section, body_paragraph_2: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label>CTA label</label>
            <input
              value={section.cta_label}
              onChange={(e) => setSection({ ...section, cta_label: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label>CTA link</label>
            <input
              value={section.cta_href}
              onChange={(e) => setSection({ ...section, cta_href: e.target.value })}
            />
          </div>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.btnPrimary} onClick={() => void saveSection()}>
            Save manifesto
          </button>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHeaderRow}>
          <p className={styles.panelTitle}>Stats row</p>
          <button type="button" className={styles.btnGhost} onClick={() => void addStat()}>
            Add stat
          </button>
        </div>
        {stats.map((stat) => (
          <div key={stat.id} className={styles.contentCard}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>Label</label>
                <input
                  value={stat.label}
                  onChange={(e) =>
                    setStats((prev) => prev.map((s) => (s.id === stat.id ? { ...s, label: e.target.value } : s)))
                  }
                />
              </div>
              <div className={styles.field}>
                <label>Sort order</label>
                <input
                  type="number"
                  value={stat.sort_order}
                  onChange={(e) =>
                    setStats((prev) =>
                      prev.map((s) => (s.id === stat.id ? { ...s, sort_order: Number(e.target.value) } : s))
                    )
                  }
                />
              </div>
              <div className={styles.field}>
                <label>Type</label>
                <select
                  value={stat.is_symbolic ? "symbolic" : "numeric"}
                  onChange={(e) => {
                    const symbolic = e.target.value === "symbolic";
                    setStats((prev) =>
                      prev.map((s) =>
                        s.id === stat.id
                          ? {
                              ...s,
                              is_symbolic: symbolic,
                              symbol_text: symbolic ? s.symbol_text ?? "∞" : null,
                              value_numeric: symbolic ? null : s.value_numeric ?? 0,
                            }
                          : s
                      )
                    );
                  }}
                >
                  <option value="numeric">Number</option>
                  <option value="symbolic">Symbol (∞ etc.)</option>
                </select>
              </div>
              {stat.is_symbolic ? (
                <div className={styles.field}>
                  <label>Symbol</label>
                  <input
                    value={stat.symbol_text ?? ""}
                    onChange={(e) =>
                      setStats((prev) =>
                        prev.map((s) => (s.id === stat.id ? { ...s, symbol_text: e.target.value } : s))
                      )
                    }
                  />
                </div>
              ) : (
                <div className={styles.field}>
                  <label>Value</label>
                  <input
                    type="number"
                    value={stat.value_numeric ?? 0}
                    onChange={(e) =>
                      setStats((prev) =>
                        prev.map((s) =>
                          s.id === stat.id ? { ...s, value_numeric: Number(e.target.value) } : s
                        )
                      )
                    }
                  />
                </div>
              )}
              <div className={styles.field}>
                <label>Status</label>
                <StatusSelect
                  value={stat.status}
                  onChange={(status) =>
                    setStats((prev) => prev.map((s) => (s.id === stat.id ? { ...s, status } : s)))
                  }
                />
              </div>
            </div>
            <ItemActions
              status={stat.status}
              onSave={() => void saveStat(stat)}
              onDelete={async () => {
                await api(`/api/admin/about/stats/${stat.id}`, { method: "DELETE" });
                setStats((prev) => prev.filter((s) => s.id !== stat.id));
                notify("Stat removed");
              }}
              onToggle={() =>
                void saveStat({ ...stat, status: stat.status === "published" ? "draft" : "published" })
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DropPanel({ notify }: { notify: Notify }) {
  const [drop, setDrop] = useState<DropRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDrop(await api<DropRow | null>("/api/admin/drops"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!drop) return;
    const updated = await api<DropRow>("/api/admin/drops", {
      method: "PATCH",
      body: JSON.stringify(drop),
    });
    setDrop(updated);
    notify("Next drop saved");
  };

  const createDefault = () => {
    setDrop({
      id: "",
      section_label: "Limited Edition",
      heading: "NEXT DROP",
      title: "Ancestral Code",
      subtitle: 'The "Ancestral Code" Capsule — 50 Pieces Worldwide',
      pieces_worldwide: 50,
      drop_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      background_url: null,
      cta_primary_label: "Get Early Access",
      cta_secondary_label: "Unlock Private Collection",
      footnote: "Invite-only • VIP members get 24hr early access",
      status: "published",
      is_active: true,
    });
  };

  if (loading) return <p className={styles.empty}>Loading…</p>;

  if (!drop) {
    return (
      <div className={styles.panel}>
        <p className={styles.empty}>No active drop in the database yet.</p>
        <div className={styles.actions}>
          <button type="button" className={styles.btnPrimary} onClick={createDefault}>
            Configure next drop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.contentPanel}>
      <div className={styles.panel}>
        <p className={styles.panelTitle}>Next drop (#drops)</p>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label>Section label</label>
            <input
              value={drop.section_label}
              onChange={(e) => setDrop({ ...drop, section_label: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label>Status</label>
            <StatusSelect value={drop.status} onChange={(status) => setDrop({ ...drop, status })} />
          </div>
          <div className={styles.field}>
            <label>Heading</label>
            <input value={drop.heading} onChange={(e) => setDrop({ ...drop, heading: e.target.value })} />
          </div>
          <div className={styles.field}>
            <label>Capsule title (internal)</label>
            <input value={drop.title} onChange={(e) => setDrop({ ...drop, title: e.target.value })} />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label>Subtitle (shown on site)</label>
            <input value={drop.subtitle} onChange={(e) => setDrop({ ...drop, subtitle: e.target.value })} />
          </div>
          <div className={styles.field}>
            <label>Pieces worldwide</label>
            <input
              type="number"
              min={1}
              value={drop.pieces_worldwide}
              onChange={(e) => setDrop({ ...drop, pieces_worldwide: Number(e.target.value) })}
            />
          </div>
          <div className={styles.field}>
            <label>Drop date & time</label>
            <input
              type="datetime-local"
              value={toDatetimeLocal(drop.drop_at)}
              onChange={(e) =>
                setDrop({ ...drop, drop_at: new Date(e.target.value).toISOString() })
              }
            />
          </div>
          <div className={styles.field}>
            <label>Primary CTA</label>
            <input
              value={drop.cta_primary_label}
              onChange={(e) => setDrop({ ...drop, cta_primary_label: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label>Secondary CTA</label>
            <input
              value={drop.cta_secondary_label}
              onChange={(e) => setDrop({ ...drop, cta_secondary_label: e.target.value })}
            />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label>Footnote</label>
            <input value={drop.footnote} onChange={(e) => setDrop({ ...drop, footnote: e.target.value })} />
          </div>
        </div>
        <MediaUpload
          folder="drops"
          label="Background image"
          currentUrl={drop.background_url}
          onUploaded={(url) => setDrop({ ...drop, background_url: url })}
        />
        <div className={styles.actions}>
          <button type="button" className={styles.btnPrimary} onClick={() => void save()}>
            Save next drop
          </button>
        </div>
      </div>
    </div>
  );
}

export function HeroPanel({ notify }: { notify: Notify }) {
  const [hero, setHero] = useState<HeroRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ section: HeroRow | null }>("/api/admin/hero");
      if (data.section) setHero(data.section);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!hero) return;
    const updated = await api<HeroRow>("/api/admin/hero", {
      method: "PATCH",
      body: JSON.stringify(hero),
    });
    setHero({ ...updated, status: updated.status as ContentStatus });
    notify("Hero saved — slideshow updates on the site");
  };

  if (loading) return <p className={styles.empty}>Loading hero…</p>;
  if (!hero) return <p className={styles.empty}>Hero section not found in database.</p>;

  const urls = hero.background_urls ?? [];

  return (
    <div className={styles.contentPanel}>
      <div className={styles.panel}>
        <p className={styles.panelTitle}>Landing hero</p>
        <p className={styles.panelHint}>
          Background images rotate every 5 seconds on the homepage. Add several for a cinematic slideshow.
        </p>
        <div className={styles.formGrid}>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label>Tagline</label>
            <input value={hero.tagline} onChange={(e) => setHero({ ...hero, tagline: e.target.value })} />
          </div>
          <div className={styles.field}>
            <label>Title</label>
            <input value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} />
          </div>
          <div className={styles.field}>
            <label>Season label</label>
            <input value={hero.side_label} onChange={(e) => setHero({ ...hero, side_label: e.target.value })} />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label>Subtitle</label>
            <textarea
              rows={3}
              value={hero.subtitle}
              onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label>Primary CTA label</label>
            <input
              value={hero.cta_primary_label}
              onChange={(e) => setHero({ ...hero, cta_primary_label: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label>Primary CTA link</label>
            <input
              value={hero.cta_primary_href}
              onChange={(e) => setHero({ ...hero, cta_primary_href: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label>Secondary CTA label</label>
            <input
              value={hero.cta_secondary_label}
              onChange={(e) => setHero({ ...hero, cta_secondary_label: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label>Secondary CTA link</label>
            <input
              value={hero.cta_secondary_href}
              onChange={(e) => setHero({ ...hero, cta_secondary_href: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label>Scroll label</label>
            <input
              value={hero.scroll_label}
              onChange={(e) => setHero({ ...hero, scroll_label: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label>Status</label>
            <StatusSelect
              value={hero.status}
              onChange={(status) => setHero({ ...hero, status })}
            />
          </div>
        </div>

        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label>Background slideshow ({urls.length} image{urls.length === 1 ? "" : "s"})</label>
          {urls.length > 0 && (
            <div className={styles.productImagesGrid}>
              {urls.map((url, idx) => (
                <div key={`${url}-${idx}`} className={styles.productImageThumb}>
                  <img src={url} alt="" />
                  <div className={styles.thumbActions}>
                    <button
                      type="button"
                      className={styles.btnSmall}
                      disabled={idx === 0}
                      onClick={() => {
                        const next = [...urls];
                        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                        setHero({ ...hero, background_urls: next });
                      }}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={styles.btnSmall}
                      disabled={idx === urls.length - 1}
                      onClick={() => {
                        const next = [...urls];
                        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                        setHero({ ...hero, background_urls: next });
                      }}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className={styles.btnSmall}
                      onClick={() =>
                        setHero({
                          ...hero,
                          background_urls: urls.filter((_, j) => j !== idx),
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <MediaUpload
            folder="hero"
            label="Add background image"
            onUploaded={(url) =>
              setHero({
                ...hero,
                background_urls: [...urls, url],
              })
            }
          />
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.btnPrimary} onClick={() => void save()}>
            Save hero
          </button>
        </div>
      </div>
    </div>
  );
}

type HelpPageRow = {
  slug: string;
  title: string;
  body: string;
  diagram_url: string | null;
  diagram_caption: string | null;
  contact_email: string | null;
  sort_order: number;
  status: ContentStatus;
};

const HELP_SLUG_ORDER = [
  "shipping-returns",
  "size-guide",
  "contact-us",
  "faq",
  "privacy-policy",
] as const;

export function HelpPanel({ notify }: { notify: Notify }) {
  const [pages, setPages] = useState<HelpPageRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api<HelpPageRow[]>("/api/admin/help-pages");
      const bySlug = Object.fromEntries(list.map((p) => [p.slug, p]));
      setPages(
        HELP_SLUG_ORDER.map(
          (slug) =>
            bySlug[slug] ?? {
              slug,
              title: slug,
              body: "",
              diagram_url: null,
              diagram_caption: null,
              contact_email: slug === "contact-us" ? "info@afreshfashion.com" : null,
              sort_order: 0,
              status: "draft" as ContentStatus,
            }
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (page: HelpPageRow) => {
    const updated = await api<HelpPageRow>(`/api/admin/help-pages/${page.slug}`, {
      method: "PATCH",
      body: JSON.stringify(page),
    });
    setPages((prev) => prev.map((p) => (p.slug === page.slug ? { ...p, ...updated } : p)));
    notify(`${page.title} saved`);
  };

  if (loading) return <p className={styles.empty}>Loading help pages…</p>;

  return (
    <div className={styles.contentPanel}>
      <p className={styles.panelHint}>
        Footer Help links open these popups on the site. Contact Us uses the email below. Size Guide
        shows a built-in chart plus any diagram you upload.
      </p>
      {pages.map((page) => (
        <div key={page.slug} className={styles.panel}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}>
            <p className={styles.panelTitle} style={{ marginBottom: 0 }}>
              {page.title}
            </p>
            <StatusSelect
              value={page.status}
              onChange={(status) =>
                setPages((prev) => prev.map((p) => (p.slug === page.slug ? { ...p, status } : p)))
              }
            />
          </div>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Title</label>
              <input
                value={page.title}
                onChange={(e) =>
                  setPages((prev) =>
                    prev.map((p) => (p.slug === page.slug ? { ...p, title: e.target.value } : p))
                  )
                }
              />
            </div>
            {page.slug === "contact-us" && (
              <div className={styles.field}>
                <label>Contact email</label>
                <input
                  type="email"
                  value={page.contact_email ?? ""}
                  onChange={(e) =>
                    setPages((prev) =>
                      prev.map((p) =>
                        p.slug === page.slug ? { ...p, contact_email: e.target.value } : p
                      )
                    )
                  }
                />
              </div>
            )}
            {page.slug === "size-guide" && (
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label>Diagram caption</label>
                <input
                  value={page.diagram_caption ?? ""}
                  onChange={(e) =>
                    setPages((prev) =>
                      prev.map((p) =>
                        p.slug === page.slug ? { ...p, diagram_caption: e.target.value } : p
                      )
                    )
                  }
                />
              </div>
            )}
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Content</label>
              <textarea
                rows={12}
                value={page.body}
                onChange={(e) =>
                  setPages((prev) =>
                    prev.map((p) => (p.slug === page.slug ? { ...p, body: e.target.value } : p))
                  )
                }
              />
              <p className={styles.panelHint} style={{ marginTop: "0.5rem", marginBottom: 0 }}>
                Separate paragraphs with a blank line. Use • for bullet lines.
              </p>
            </div>
          </div>
          {page.slug === "size-guide" && (
            <>
              {page.diagram_url && (
                <div className={styles.mediaPreview}>
                  <img src={page.diagram_url} alt="" />
                </div>
              )}
              <MediaUpload
                folder="help"
                label="Size guide diagram (optional — replaces default illustration when set)"
                onUploaded={(url) =>
                  setPages((prev) =>
                    prev.map((p) => (p.slug === page.slug ? { ...p, diagram_url: url } : p))
                  )
                }
              />
              {page.diagram_url && (
                <button
                  type="button"
                  className={styles.btnSmall}
                  onClick={() =>
                    setPages((prev) =>
                      prev.map((p) =>
                        p.slug === page.slug ? { ...p, diagram_url: null } : p
                      )
                    )
                  }
                >
                  Remove diagram
                </button>
              )}
            </>
          )}
          <div className={styles.actions}>
            <button type="button" className={styles.btnPrimary} onClick={() => void save(page)}>
              Save {page.title}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

type OrderRow = {
  id: string;
  order_number: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  status: string;
  payment_method: string | null;
  payment_status: string;
  total_amount: number;
  placed_at: string;
};

export function OrdersPanel({ notify }: { notify: Notify }) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<import("@/types/cart").OrderSummary | null>(null);
  const [deliveryAt, setDeliveryAt] = useState("");
  const [deliveryMsg, setDeliveryMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api<OrderRow[]>("/api/admin/orders?payment_status=awaiting_confirmation");
      setOrders(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openOrder = async (id: string) => {
    setSelected(id);
    const d = await api<import("@/types/cart").OrderSummary>(`/api/admin/orders/${id}`);
    setDetail(d);
    setDeliveryAt("");
    setDeliveryMsg("");
  };

  const confirm = async () => {
    if (!selected) return;
    await api(`/api/admin/orders/${selected}`, {
      method: "PATCH",
      body: JSON.stringify({
        action: "confirm_manual",
        expected_delivery_at: deliveryAt,
        delivery_message: deliveryMsg,
      }),
    });
    notify("Order confirmed — customer emailed");
    setSelected(null);
    setDetail(null);
    void load();
  };

  if (loading) return <p className={styles.empty}>Loading orders…</p>;

  return (
    <div className={styles.contentPanel}>
      <div className={styles.panel}>
        <p className={styles.panelTitle}>Awaiting payment confirmation</p>
        {orders.length === 0 ? (
          <p className={styles.empty}>No manual payments pending.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.order_number}</td>
                    <td>
                      {o.full_name}
                      <br />
                      <span style={{ color: "#888" }}>{o.email}</span>
                    </td>
                    <td>₦{o.total_amount.toLocaleString("en-NG")}</td>
                    <td>
                      <button type="button" className={styles.btnSmall} onClick={() => void openOrder(o.id)}>
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detail && selected && (
        <div className={styles.panel}>
          <p className={styles.panelTitle}>Confirm {detail.order_number}</p>
          <p className={styles.panelHint}>
            {detail.full_name} · {detail.phone} · {detail.email}
          </p>
          <ul style={{ listStyle: "none", margin: "0 0 1rem", padding: 0, color: "#BFC0C0", fontSize: "0.8125rem" }}>
            {detail.items.map((i) => (
              <li key={i.id} style={{ padding: "0.35rem 0" }}>
                {i.product_name} × {i.quantity} — ₦{i.line_total.toLocaleString("en-NG")}
              </li>
            ))}
          </ul>
          <div className={styles.formGrid}>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Expected delivery (date & time) *</label>
              <input
                type="datetime-local"
                value={deliveryAt}
                onChange={(e) => setDeliveryAt(e.target.value)}
              />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Delivery message to customer *</label>
              <textarea
                value={deliveryMsg}
                onChange={(e) => setDeliveryMsg(e.target.value)}
                placeholder="Courier, tracking, what to expect…"
              />
            </div>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.btnPrimary} onClick={() => void confirm()}>
              Confirm &amp; email customer
            </button>
            <button type="button" className={styles.btnGhost} onClick={() => setSelected(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
