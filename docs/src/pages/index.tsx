import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import AtomLogo from '@site/static/img/Atom.svg';
import styles from './index.module.css';

export default function Home(): React.ReactNode {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout title="Atom Docs" description="תיעוד רשמי של פלטפורמת Atom">
      <main className={styles.hero}>
        {/* Logo */}
        <AtomLogo
          width={96}
          height={96}
          className={styles.logo}
          role="img"
          aria-label="Atom logo"
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
