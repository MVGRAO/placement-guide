import React, {useEffect, useRef, useState} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

const DEFAULT_FEEDBACK_FORM_URL =
  'https://forms.gle/usGbUhznCuHqcEBp9';

function getFeedbackFormUrl(customFields) {
  const configuredUrl = customFields?.feedbackFormUrl;

  return typeof configuredUrl === 'string' && configuredUrl.trim().length > 0
    ? configuredUrl
    : DEFAULT_FEEDBACK_FORM_URL;
}

export default function FeedbackModal() {
  const {siteConfig} = useDocusaurusContext();
  const [isOpen, setIsOpen] = useState(true);
  const formButtonRef = useRef(null);
  const feedbackFormUrl = getFeedbackFormUrl(siteConfig.customFields);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    formButtonRef.current?.focus();
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={styles.overlay}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          setIsOpen(false);
        }
      }}
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        aria-describedby="feedback-modal-description"
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={() => setIsOpen(false)}
          aria-label="Close feedback modal"
        >
          X
        </button>
        <span className={styles.badge}>Feedback Request</span>
        <h2 id="feedback-modal-title" className={styles.title}>
          Help Improve This Placement Platform
        </h2>
        <p id="feedback-modal-description" className={styles.description}>
          Tell us what is useful, what is missing, and what should be improved
          for RGUKT students. The form opens in a new tab and takes about two
          minutes.
        </p>
        <div className={styles.actions}>
          <a
            ref={formButtonRef}
            className={`button button--primary ${styles.primaryButton}`}
            href={feedbackFormUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Feedback Form
          </a>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setIsOpen(false)}
          >
            Maybe Later
          </button>
        </div>
        <p className={styles.note}>
          This prompt appears on each fresh visit so users can easily share
          feedback.
        </p>
      </div>
    </div>
  );
}
