"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { HelpPage } from "@/types/content";
import styles from "@/styles/help.module.scss";

const SIZE_ROWS = [
  { size: "XS", chest: "86–91", waist: "71–76", hip: "86–91" },
  { size: "S", chest: "91–96", waist: "76–81", hip: "91–96" },
  { size: "M", chest: "96–101", waist: "81–86", hip: "96–101" },
  { size: "L", chest: "101–106", waist: "86–91", hip: "101–106" },
  { size: "XL", chest: "106–112", waist: "91–97", hip: "106–112" },
  { size: "XXL", chest: "112–118", waist: "97–103", hip: "112–118" },
];

type Props = {
  page: HelpPage | null;
  onClose: () => void;
};

function renderBody(body: string) {
  const blocks = body.split(/\n\n+/);
  return blocks.map((block, i) => {
    const lines = block.split("\n").filter(Boolean);
    const isList = lines.every((l) => /^[•\-]\s/.test(l.trim()) || /^\d+\./.test(l.trim()));
    if (isList) {
      return (
        <ul key={i} className={styles.list}>
          {lines.map((line, j) => (
            <li key={j}>{line.replace(/^[•\-]\s*/, "").replace(/^\d+\.\s*/, "")}</li>
          ))}
        </ul>
      );
    }
    if (lines.length > 1 && lines[0].endsWith("?")) {
      return (
        <div key={i}>
          {lines.map((line, j) =>
            j % 2 === 0 ? (
              <p key={j} className={styles.paragraph} style={{ fontWeight: 500, color: "#f5f5f5", marginBottom: "0.35rem" }}>
                {line}
              </p>
            ) : (
              <p key={j} className={styles.paragraph}>
                {line}
              </p>
            )
          )}
        </div>
      );
    }
    return (
      <p key={i} className={styles.paragraph}>
        {block}
      </p>
    );
  });
}

function SizeGuideExtras({
  caption,
  showMeasureDiagram,
}: {
  caption: string | null;
  showMeasureDiagram: boolean;
}) {
  return (
    <>
      {showMeasureDiagram && (
        <div className={styles.diagramWrap}>
          <div className={styles.measureDiagram}>
            <div className={styles.figure} aria-hidden>
              <span className={styles.figureLineChest} />
              <span className={styles.figureLineWaist} />
              <span className={styles.figureLineHip} />
              <span className={styles.figureLineLength} />
            </div>
            <div className={styles.figureLabels}>
              <p>Chest — fullest part, under arms</p>
              <p>Waist — natural waistline</p>
              <p>Hip — fullest part of seat</p>
              <p>Length — shoulder to hem / waist to ankle</p>
            </div>
          </div>
          {caption && <p className={styles.diagramCaption}>{caption}</p>}
        </div>
      )}
      <div className={styles.sizeChart}>
        <p className={styles.sizeChartTitle}>Size chart (cm)</p>
        <table className={styles.sizeTable}>
          <thead>
            <tr>
              <th>Size</th>
              <th>Chest</th>
              <th>Waist</th>
              <th>Hip</th>
            </tr>
          </thead>
          <tbody>
            {SIZE_ROWS.map((row) => (
              <tr key={row.size}>
                <td>{row.size}</td>
                <td>{row.chest}</td>
                <td>{row.waist}</td>
                <td>{row.hip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function HelpPageModal({ page, onClose }: Props) {
  useEffect(() => {
    if (!page) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [page, onClose]);

  if (!page) return null;

  const email = page.contact_email?.trim() || null;
  const showSizeExtras = page.slug === "size-guide";

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      onClick={onClose}
    >
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2 id="help-modal-title" className={styles.title}>
            {page.title}
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className={styles.body}>
          {renderBody(page.body)}
          {page.diagram_url && (
            <div className={styles.diagramWrap}>
              <img src={page.diagram_url} alt={page.diagram_caption ?? "Diagram"} className={styles.diagramImg} />
              {page.diagram_caption && <p className={styles.diagramCaption}>{page.diagram_caption}</p>}
            </div>
          )}
          {showSizeExtras && (
            <SizeGuideExtras
              caption={page.diagram_caption}
              showMeasureDiagram={!page.diagram_url}
            />
          )}
          {email && (
            <div className={styles.contactBlock}>
              <span className={styles.contactLabel}>Email</span>
              <a href={`mailto:${email}`} className={styles.contactEmail}>
                {email}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
