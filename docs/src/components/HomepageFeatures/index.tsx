import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  icon: ReactNode;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'מנוע תזמונים אוניברסלי',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--ifm-color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
        <path d="M8 14h.01"></path>
        <path d="M12 14h.01"></path>
        <path d="M16 14h.01"></path>
        <path d="M8 18h.01"></path>
        <path d="M12 18h.01"></path>
        <path d="M16 18h.01"></path>
      </svg>
    ),
    description: (
      <>
        תזמון וסנכרון משימות מורכבות, ניהול לוחות זמנים ארגוניים בזמן אמת,
        ואוטומציות מתקדמות הניתנות להגדרה פשוטה.
      </>
    ),
  },
  {
    title: 'גרף ידע דינמי',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--atom-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"></circle>
        <circle cx="6" cy="12" r="3"></circle>
        <circle cx="18" cy="19" r="3"></circle>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
      </svg>
    ),
    description: (
      <>
        מיפוי קשרים, ישויות ותהליכים בארגון לתוך מוח מרכזי אחד,
        המאפשר ניווט מהיר, תחקור נתונים והבנת ההקשר המלא של המידע.
      </>
    ),
  },
  {
    title: 'הרחבות שרתי MCP',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--ifm-color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
        <line x1="12" y1="2" x2="12" y2="22"></line>
      </svg>
    ),
    description: (
      <>
        חיבור ישיר של מודלי בינה מלאכותית (LLMs) לבצע פעולות, לקרוא ולכתוב
        מידע באמצעות פרוטוקול Model Context Protocol המאובטח והמתקדם.
      </>
    ),
  },
];

function Feature({title, icon, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4 margin-bottom--lg')}>
      <div className="card text--center h-100 flex flex-col justify-between items-center">
        <div className="margin-bottom--md" style={{ color: 'var(--ifm-color-primary)', display: 'flex', justifyContent: 'center' }}>
          {icon}
        </div>
        <div>
          <Heading as="h3" className="margin-bottom--sm font-bold" style={{ fontFamily: 'var(--ifm-heading-font-family)' }}>
            {title}
          </Heading>
          <p className="text-muted" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): React.ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
