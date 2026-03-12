// @ts-check

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.

 @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */
const sidebars = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'DSA',
      items: ['dsa/arrays', 'dsa/strings'],
    },
    {
      type: 'category',
      label: 'SQL',
      items: ['sql/sql-basics'],
    },
    {
      type: 'category',
      label: 'Java',
      items: ['java/core-java'],
    },
    {
      type: 'category',
      label: 'Core CS',
      items: ['core-cs/os', 'core-cs/cn'],
    },
    {
      type: 'category',
      label: 'Full Stack',
      items: ['fullstack/mern'],
    },
    {
      type: 'category',
      label: 'AI / ML',
      items: ['aiml/ml-basics'],
    },
    {
      type: 'category',
      label: 'Resume Preparation',
      items: ['resume/resume-preparation'],
    },
    {
      type: 'category',
      label: 'Interview Preparation',
      items: ['interview/interview-preparation'],
    },
  ],
};

export default sidebars;
