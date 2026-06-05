import { Skeleton } from "@/components/Skeleton";
import sk from "@/styles/skeleton.module.scss";
import styles from "@/styles/admin.module.scss";

export function AdminPanelSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className={`${styles.contentPanel} ${sk.adminPanel}`} aria-busy="true" aria-label="Loading content">
      <Skeleton className={sk.adminBtn} />
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className={`${styles.contentCard} ${sk.adminCard}`}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <Skeleton className={sk.adminLabel} />
              <Skeleton className={sk.adminInput} />
            </div>
            <div className={styles.field}>
              <Skeleton className={sk.adminLabel} />
              <Skeleton className={sk.adminInput} />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <Skeleton className={sk.adminLabel} />
              <Skeleton className={sk.adminTextarea} />
            </div>
            <div className={styles.field}>
              <Skeleton className={sk.adminLabel} />
              <Skeleton className={sk.adminInput} />
            </div>
          </div>
          <Skeleton className={sk.adminMedia} />
          <div className={sk.adminActions}>
            <Skeleton className={sk.adminActionBtn} />
            <Skeleton className={sk.adminActionBtn} />
            <Skeleton className={sk.adminActionBtn} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminHeroSkeleton() {
  return (
    <div className={`${styles.contentPanel} ${sk.adminPanel}`} aria-busy="true" aria-label="Loading hero">
      <div className={styles.panel}>
        <Skeleton style={{ width: "8rem", height: "0.875rem", marginBottom: "0.75rem" }} />
        <Skeleton style={{ width: "100%", maxWidth: "28rem", height: "0.75rem", marginBottom: "1.5rem" }} />
        <div className={styles.formGrid}>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <Skeleton className={sk.adminLabel} />
            <Skeleton className={sk.adminInput} />
          </div>
          <div className={styles.field}>
            <Skeleton className={sk.adminLabel} />
            <Skeleton className={sk.adminInput} />
          </div>
          <div className={styles.field}>
            <Skeleton className={sk.adminLabel} />
            <Skeleton className={sk.adminInput} />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <Skeleton className={sk.adminLabel} />
            <Skeleton className={sk.adminTextarea} />
          </div>
        </div>
        <Skeleton className={sk.adminMedia} style={{ maxWidth: "100%", height: "12rem", marginTop: "1rem" }} />
      </div>
    </div>
  );
}

export function AdminOrdersSkeleton() {
  return (
    <div className={styles.contentPanel} aria-busy="true" aria-label="Loading orders">
      <div className={styles.panel}>
        <Skeleton style={{ width: "14rem", height: "0.875rem", marginBottom: "1.5rem" }} />
        <div className={`${sk.adminTableRow} ${sk.adminTableHeader}`}>
          <Skeleton style={{ height: "0.625rem" }} />
          <Skeleton style={{ height: "0.625rem" }} />
          <Skeleton style={{ height: "0.625rem" }} />
          <Skeleton style={{ height: "0.625rem" }} />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={sk.adminTableRow}>
            <Skeleton style={{ height: "0.875rem" }} />
            <Skeleton style={{ height: "0.875rem" }} />
            <Skeleton style={{ height: "0.875rem" }} />
            <Skeleton style={{ height: "1.75rem" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminStatsSkeleton() {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={styles.statCard}>
          <Skeleton className={sk.adminStatValue} />
          <Skeleton style={{ width: "5rem", height: "0.625rem" }} />
        </div>
      ))}
    </>
  );
}

export function AdminVipSkeleton() {
  return (
    <div className={`${styles.vipPanel} ${sk.adminVipGrid}`} aria-busy="true" aria-label="Loading VIP data">
      {[1, 2].map((i) => (
        <div key={i} className={styles.panel}>
          <Skeleton style={{ width: "10rem", height: "0.875rem", marginBottom: "1.25rem" }} />
          {[1, 2, 3].map((j) => (
            <Skeleton key={j} style={{ width: "100%", height: "3.5rem", marginBottom: "0.75rem" }} />
          ))}
        </div>
      ))}
    </div>
  );
}
