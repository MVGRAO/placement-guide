import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Subject-Wise Roadmaps',
    description:
      'Prepare with structured tracks across DSA, SQL, Java, Core CS, Full Stack, and AI / ML.',
  },
  {
    title: 'Daily Blog Updates',
    description:
      'Seniors can share quick daily updates about interview rounds, patterns, and revision goals.',
  },
  {
    title: 'Markdown First',
    description:
      'Contributors only need to edit Markdown files to publish new guides. No frontend coding required.',
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

