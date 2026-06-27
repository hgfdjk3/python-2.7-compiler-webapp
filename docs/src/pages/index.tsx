import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './index.module.css';

export default function Home(): React.ReactNode {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout title="Atom Docs" description="תיעוד רשמי של פלטפורמת Atom">
      <main className={styles.hero}>
        {/* Logo */}
        <ThemedImage
          alt="Atom logo"
          className={styles.logo}
          style={{ width: 96, height: 96 }}
          sources={{
            light: useBaseUrl('/img/Atom-light.svg'),
            dark: useBaseUrl('/img/Atom.svg'),
          }}
        />

        {/* Heading */}
        <h1 className={styles.title}>Atom</h1>

        {/* Short tagline */}
        <p className={styles.subtitle}>
          הדרך הקלה ביותר לאטמט את המשימות החזרתיות והידניות בעבודה
        </p>

        {/* Primary CTAs */}
        <div className={styles.actions}>
          <Link className={styles.btnPrimary} to="/docs/users/intro">
            תחילת עבודה
          </Link>
          <Link className={styles.btnSecondary} to="/docs/developers/intro">
            מפתחים
          </Link>
        </div>

        {/* Quick-nav links */}
        <nav className={styles.links} aria-label="קישורים מהירים">
          <Link to="/docs/about">עלינו</Link>
          <span className={styles.dot} />
          <Link to="/blog">בלוג</Link>
          <span className={styles.dot} />
          <Link to="/docs/users/intro">מדריך למשתמשים</Link>
          <span className={styles.dot} />
          <Link to="/docs/developers/intro">מדריך למפתחים</Link>
        </nav>
      </main>
    </Layout>
  );
}
