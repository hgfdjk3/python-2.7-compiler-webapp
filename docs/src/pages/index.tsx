import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import AtomLogo from '@site/static/img/Atom.svg';

export default function Home(): React.ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title="Atom - פלטפורמת התזמון וגרף הידע האוניברסלית"
      description="פלטפורמה אוניברסלית לניהול תהליכים אוטומטיים, מיפוי נתונים בגרף ידע וחיבור סוכני AI בעזרת שרתי MCP">
      
      {/* Centered Premium Hero Section */}
      <div className="hero-container" style={{ flexGrow: 1, display: 'flex', alignItems: 'center', borderBottom: 'none' }}>
        <div className="container">
          <AtomLogo className="hero-logo" />
          <h1 className="hero-title" style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>
            מערכת התזמונים וגרף הידע שלכם
          </h1>
          <p className="hero-subtitle" style={{ fontSize: '1.25rem', margin: '0 auto 2.5rem auto' }}>
            הכירו את <strong>Atom</strong>. מוח מרכזי אחד המאפשר לחבר את כל הכלים הארגוניים שלכם לגרף ידע אינטראקטיבי, לבצע אוטומציות ותזמונים מורכבים, ולהרחיב את היכולות בעזרת פרוטוקול MCP עבור סוכני בינה מלאכותית.
          </p>
          <div className="hero-buttons">
            <Link
              className="button-primary"
              to="/docs/developers/intro">
              התחילו כמפתחים
            </Link>
            <Link
              className="button-secondary"
              to="/docs/users/intro">
              מדריך למשתמשים
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
