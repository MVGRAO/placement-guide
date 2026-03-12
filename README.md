# University Placement Guide

Documentation portal built with Docusaurus for placement preparation.

## Tech Stack

- Docusaurus (JavaScript)
- Markdown docs and blog posts
- GitHub for version control
- Vercel for hosting

## Project Structure

```text
placement-guide
|- blog
|  |- dsa-preparation.md
|  |- sql-interview.md
|- docs
|  |- dsa
|  |  |- arrays.md
|  |  |- strings.md
|  |- sql
|  |  |- sql-basics.md
|  |- java
|  |  |- core-java.md
|  |- core-cs
|  |  |- os.md
|  |  |- cn.md
|  |- fullstack
|  |  |- mern.md
|  |- aiml
|  |  |- ml-basics.md
|  |- resume
|  |  |- resume-preparation.md
|  |- interview
|     |- interview-preparation.md
|- docusaurus.config.js
|- sidebars.js
|- vercel.json
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run start
```

3. Open `http://localhost:3000`.

## Production Build

```bash
npm run build
npm run serve
```

## Deploy to Vercel

1. Install Vercel CLI:

```bash
npm install -g vercel
```

2. Login:

```bash
vercel login
```

3. Deploy preview:

```bash
vercel
```

4. Deploy production:

```bash
vercel --prod
```

## Add New Documentation Page

1. Create a new Markdown file in the correct `docs/<subject>/` folder.
2. Add front matter:

```md
---
title: Topic Name
sidebar_position: 3
---
```

3. Add the document id in `sidebars.js` under the right category.
4. Run `npm run start` and verify.

## Add New Blog Post

1. Create a new Markdown file in `blog/`.
2. Add front matter:

```md
---
slug: your-post-slug
title: Your Post Title
authors: [placement-team]
tags: [placement]
---
```

3. Write the content in Markdown.
4. Run `npm run start` to preview.

## Contributor Workflow

1. Create a branch.
2. Make Markdown updates.
3. Run `npm run build` to verify there are no build errors.
4. Commit and open a pull request.

