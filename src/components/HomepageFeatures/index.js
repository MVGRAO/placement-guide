import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Structured Learning Paths',
    description:
      'Follow curated preparation tracks across DSA, SQL, Java, Core CS, Full Stack, and AI / ML.',
  },
  {
    title: 'Interview Insights',
    description:
      'Access regular updates on interview patterns, coding rounds, and revision priorities shared by seniors.',
  },
  {
    title: 'Simple Content Workflow',
    description:
      'Contributors can publish guides quickly through Markdown without requiring frontend development changes.',
  },
];

function Feature({title, description}) {
  return (
    <div className={clsx('col col--4', styles.featureCard)}>
      <div className={styles.card}>
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
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
