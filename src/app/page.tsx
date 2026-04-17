import Link from "next/link";
import styles from "./create/create.module.css";

export default function Home() {
  return (
    <div className={`${styles.wrap} ${styles.homeWrap}`}>
      <header className={styles.hero}>
        <div className={styles.logo}>
          <span className={styles.brandSmall}>Postcard Remix™</span>
          <span className={styles.version}>v0.52</span>
          <h1>REMIX</h1>
        </div>
      </header>

      <p className={styles.path}>
        ~/src/postcard-remix <span className={styles.sep}>›</span>{" "}
        <span className={styles.hl}>home</span>
      </p>

      <section className={styles.panel} style={{ marginBottom: 20 }}>
        <div className={styles.panelTitle}>
          Make a Music Postcard <div className={styles.stripes} />
        </div>
        <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.6, color: "var(--ink)" }}>
          Search for a YouTube song (or share a playlist URL), pair it with a GIPHY GIF or your own
          photo, scribble a short note on the back, and share a short link.
        </p>
        <div className={styles.shareRow}>
          <Link href="/create" className={`${styles.btn} ${styles.btnPrimary}`} style={{ textAlign: "center", textDecoration: "none" }}>
            CREATE AN E-CARD
          </Link>
        </div>
      </section>

      <section className={styles.stepsGrid}>
        {[
          { n: "1", title: "Pick a Song", desc: "Search YouTube or paste a playlist URL." },
          { n: "2", title: "Add a GIF or Photo", desc: "Search GIPHY or upload your own image." },
          { n: "3", title: "Share a Short Link", desc: "We generate a URL that renders your card." },
        ].map((s) => (
          <div key={s.n} className={`${styles.panel} ${styles.stepPanel}`}>
            <div className={`${styles.panelTitle} ${styles.stepTitle}`}>
              {s.n} · {s.title} <div className={styles.stripes} />
            </div>
            <p className={styles.stepDesc}>{s.desc}</p>
          </div>
        ))}
      </section>

      <footer className={styles.keys}>
        <span>Built for sharing. Cards may expire.</span>
      </footer>
    </div>
  );
}
