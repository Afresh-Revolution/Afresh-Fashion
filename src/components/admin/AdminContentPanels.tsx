"use client";

import { useCallback, useEffect, useState } from "react";
import MediaUpload from "@/components/admin/MediaUpload";
import type {
  CinematicSection,
  CinematicVideo,
  CollectionItem,
  CollaboratorItem,
  CommunityItem,
  ContentStatus,
  EditorialItem,
  LookbookItem,
  ProductItem,
} from "@/types/content";
import styles from "@/styles/admin.module.scss";

type Notify = (msg: string) => void;

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json();
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
          <MediaUpload
            folder="products"
            currentUrl={item.image_url}
            onUploaded={(url) => setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, image_url: url } : i)))}
          />
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
    notify("Upload a landscape video first, then save the entry");
    const created = await api<CinematicVideo>("/api/admin/cinematic-videos", {
      method: "POST",
      body: JSON.stringify({ title: "Film", video_url: "", status: "draft", sort_order: videos.length }),
    });
    setVideos((prev) => [...prev, created]);
  };

  const saveVideo = async (item: CinematicVideo) => {
    if (!item.video_url) {
      notify("Add a video URL before saving");
      return;
    }
    const updated = await api<CinematicVideo>(`/api/admin/cinematic-videos/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify(item),
    });
    setVideos((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    notify("Video saved");
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
