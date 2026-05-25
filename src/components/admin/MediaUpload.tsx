"use client";

import { useRef, useState } from "react";
import styles from "@/styles/admin.module.scss";

type Props = {
  folder: string;
  kind?: "image" | "video";
  label?: string;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
};

export default function MediaUpload({ folder, kind = "image", label, currentUrl, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const accept =
    kind === "video" ? "video/mp4,video/webm,video/quicktime" : "image/jpeg,image/png,image/webp,image/gif";

  const handleFile = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);
      form.append("kind", kind);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onUploaded(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.mediaUpload}>
      {label && <label>{label}</label>}
      {currentUrl && (
        <div className={styles.mediaPreview}>
          {kind === "video" ? (
            <video src={currentUrl} controls muted playsInline />
          ) : (
            <img src={currentUrl} alt="" />
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className={styles.btnGhost}
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "Uploading…" : kind === "video" ? "Upload video (max 100MB)" : "Upload image"}
      </button>
      {error && <p className={styles.uploadError}>{error}</p>}
    </div>
  );
}
