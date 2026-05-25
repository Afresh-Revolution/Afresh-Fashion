import Link from "next/link";
import styles from "./offline.module.scss";

export const metadata = {
  title: "Offline — AfrESH Fashion",
};

export default function OfflinePage() {
  return (
    <main className={styles.main}>
      <p className={styles.label}>AfrESH Fashion</p>
      <h1 className={styles.title}>You&apos;re offline</h1>
      <p className={styles.text}>
        Reconnect to explore collections, shop the drop, and stay with the movement.
      </p>
      <Link href="/" className={styles.btn}>
        Try again
      </Link>
    </main>
  );
}
