import React from 'react';
import clsx from 'clsx';
import {useHistory} from '@docusaurus/router';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import BlogPostItemContainer from '@theme/BlogPostItem/Container';
import BlogPostItemHeader from '@theme/BlogPostItem/Header';
import BlogPostItemContent from '@theme/BlogPostItem/Content';
import BlogPostItemFooter from '@theme/BlogPostItem/Footer';

function useContainerClassName() {
  const {isBlogPostPage} = useBlogPost();
  return !isBlogPostPage ? 'margin-bottom--xl blog-card-clickable' : undefined;
}

function isInteractiveTarget(target) {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest(
      'a,button,input,select,textarea,label,summary,[role="button"],[role="link"]',
    ),
  );
}

export default function BlogPostItem({children, className}) {
  const history = useHistory();
  const {metadata, isBlogPostPage} = useBlogPost();
  const containerClassName = useContainerClassName();

  const goToPost = (event) => {
    if (isBlogPostPage) {
      return;
    }

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    if (window.getSelection?.()?.toString()) {
      return;
    }

    if (isInteractiveTarget(event.target)) {
      return;
    }

    history.push(metadata.permalink);
  };

  const onKeyDown = (event) => {
    if (isBlogPostPage || isInteractiveTarget(event.target)) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      history.push(metadata.permalink);
    }
  };

  return (
    <BlogPostItemContainer
      className={clsx(containerClassName, className)}
      onClick={goToPost}
      onKeyDown={onKeyDown}
      tabIndex={isBlogPostPage ? undefined : 0}
      role={isBlogPostPage ? undefined : 'link'}>
      <BlogPostItemHeader />
      <BlogPostItemContent>{children}</BlogPostItemContent>
      <BlogPostItemFooter />
    </BlogPostItemContainer>
  );
}
