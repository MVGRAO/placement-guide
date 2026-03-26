import React from 'react';
import FeedbackModal from '@site/src/components/FeedbackModal';

export default function Root({children}) {
  return (
    <>
      {children}
      <FeedbackModal />
    </>
  );
}
