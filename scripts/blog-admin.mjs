import http from 'node:http';
import path from 'node:path';
import {promises as fs} from 'node:fs';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const blogDir = path.join(repoRoot, 'blog');
const authorsFile = path.join(blogDir, 'authors.yml');
const tagsFile = path.join(blogDir, 'tags.yml');
const defaultPort = Number(process.env.BLOG_ADMIN_PORT ?? 4321);

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return character;
    }
  });
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/['".,()/\\]+/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function stripYamlQuotes(value) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseYamlMap(contents) {
  const entries = [];
  let current = null;

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.replace(/\t/g, '  ');

    if (!line.trim()) {
      continue;
    }

    if (!line.startsWith(' ') && line.endsWith(':')) {
      if (current) {
        entries.push(current);
      }

      current = {
        key: line.slice(0, -1).trim(),
        fields: {},
      };
      continue;
    }

    const fieldMatch = line.match(/^\s{2}([a-zA-Z0-9_]+):\s*(.*)$/);

    if (fieldMatch && current) {
      current.fields[fieldMatch[1]] = stripYamlQuotes(fieldMatch[2]);
    }
  }

  if (current) {
    entries.push(current);
  }

  return entries;
}

async function readYamlMap(filePath) {
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    return parseYamlMap(fileContents);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

async function loadPortalData() {
  const [authors, tags] = await Promise.all([
    readYamlMap(authorsFile),
    readYamlMap(tagsFile),
  ]);

  return {
    authors: authors.map((author) => ({
      key: author.key,
      name: author.fields.name || author.key,
      title: author.fields.title || '',
      imageUrl: author.fields.image_url || '',
    })),
    tags: tags.map((tag) => ({
      key: tag.key,
      label: tag.fields.label || tag.key,
      description: tag.fields.description || '',
    })),
  };
}

function renderAuthorEntry(author) {
  const lines = [
    `${author.key}:`,
    `  name: ${yamlString(author.name)}`,
  ];

  if (author.title) {
    lines.push(`  title: ${yamlString(author.title)}`);
  }

  if (author.imageUrl) {
    lines.push(`  image_url: ${yamlString(author.imageUrl)}`);
  }

  return lines.join('\n');
}

async function appendAuthor(author) {
  const entry = renderAuthorEntry(author);

  let prefix = '';

  try {
    const existingContents = await fs.readFile(authorsFile, 'utf8');
    prefix = existingContents.endsWith('\n') ? '\n' : '\n\n';
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  await fs.appendFile(authorsFile, `${prefix}${entry}\n`, 'utf8');
}

function buildMarkdown({title, slug, authorKey, tags, summary, content}) {
  const lines = [
    '---',
    `slug: ${slug}`,
    `title: ${yamlString(title)}`,
    'authors:',
    `  - ${authorKey}`,
  ];

  if (tags.length > 0) {
    lines.push('tags:');
    for (const tag of tags) {
      lines.push(`  - ${tag}`);
    }
  }

  lines.push('---', '');

  if (summary) {
    lines.push(summary.trim(), '', '<!--truncate-->', '');
  }

  lines.push(content.trim(), '');

  return lines.join('\n');
}

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function buildFormPage({authors, tags}) {
  const authorOptions = authors
    .map((author) => {
      const subtitle = author.title ? ` (${author.title})` : '';
      return `<option value="${escapeHtml(author.key)}">${escapeHtml(
        `${author.name}${subtitle}`,
      )}</option>`;
    })
    .join('');

  const tagCheckboxes = tags
    .map(
      (tag) => `
        <label class="checkbox">
          <input type="checkbox" name="tags" value="${escapeHtml(tag.key)}" />
          <span>
            <strong>${escapeHtml(tag.label)}</strong>
            <small>${escapeHtml(tag.key)}</small>
          </span>
        </label>
      `,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Placement Guide Blog Admin</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f6f3ef;
        --panel: #ffffff;
        --ink: #2f2a27;
        --muted: #665f58;
        --line: #ded6ce;
        --brand: #7c1f1b;
        --brand-soft: #f8e9e7;
        --success: #0f6d41;
        --error: #a12622;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(124, 31, 27, 0.08), transparent 30%),
          linear-gradient(180deg, #faf7f3 0%, var(--bg) 100%);
        color: var(--ink);
      }

      main {
        max-width: 1040px;
        margin: 0 auto;
        padding: 2.5rem 1.25rem 3rem;
      }

      .hero {
        margin-bottom: 1.5rem;
      }

      .hero h1 {
        margin: 0 0 0.5rem;
        font-size: clamp(2rem, 4vw, 3rem);
        color: #611916;
      }

      .hero p {
        margin: 0;
        max-width: 760px;
        color: var(--muted);
        line-height: 1.6;
      }

      .grid {
        display: grid;
        grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
        gap: 1.25rem;
      }

      .panel {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 20px;
        padding: 1.25rem;
        box-shadow: 0 18px 45px rgba(49, 29, 22, 0.07);
      }

      form {
        display: grid;
        gap: 1rem;
      }

      .two-col {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
      }

      label {
        display: grid;
        gap: 0.45rem;
        font-weight: 600;
      }

      input,
      select,
      textarea,
      button {
        font: inherit;
      }

      input,
      select,
      textarea {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: #fffdfb;
        color: var(--ink);
        padding: 0.9rem 1rem;
      }

      textarea {
        min-height: 160px;
        resize: vertical;
      }

      .small {
        min-height: 100px;
      }

      .note,
      .status {
        border-radius: 16px;
        padding: 0.95rem 1rem;
        line-height: 1.55;
      }

      .note {
        background: #fbfaf8;
        border: 1px solid var(--line);
        color: var(--muted);
      }

      .status {
        display: none;
        border: 1px solid transparent;
        white-space: pre-line;
      }

      .status.success {
        display: block;
        background: #edf8f2;
        color: var(--success);
        border-color: #c8ead8;
      }

      .status.error {
        display: block;
        background: #fdeeee;
        color: var(--error);
        border-color: #f4c9c7;
      }

      .tag-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 0.75rem;
      }

      .checkbox {
        display: flex;
        align-items: flex-start;
        gap: 0.7rem;
        padding: 0.85rem 0.9rem;
        border-radius: 14px;
        border: 1px solid var(--line);
        background: #fffdfb;
        font-weight: 500;
      }

      .checkbox input {
        width: auto;
        margin-top: 0.15rem;
      }

      .checkbox span {
        display: grid;
        gap: 0.15rem;
      }

      .checkbox small {
        color: var(--muted);
      }

      .author-fields {
        display: none;
        gap: 1rem;
      }

      .author-fields.visible {
        display: grid;
      }

      .actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        flex-wrap: wrap;
      }

      button {
        border: 0;
        border-radius: 999px;
        padding: 0.95rem 1.4rem;
        background: var(--brand);
        color: white;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 10px 22px rgba(124, 31, 27, 0.22);
      }

      .ghost {
        background: transparent;
        color: var(--brand);
        border: 1px solid rgba(124, 31, 27, 0.25);
        box-shadow: none;
      }

      h2 {
        margin: 0 0 1rem;
        color: #611916;
      }

      ul {
        margin: 0;
        padding-left: 1.15rem;
        line-height: 1.7;
        color: var(--muted);
      }

      code {
        font-family: Consolas, monospace;
        background: #f6efeb;
        padding: 0.12rem 0.35rem;
        border-radius: 6px;
      }

      @media (max-width: 880px) {
        .grid,
        .two-col {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <h1>Local Blog Form</h1>
        <p>
          This keeps your existing markdown workflow. Submitting this form creates a new post inside
          <code>blog/</code> and only updates <code>blog/authors.yml</code> when you add a new author.
        </p>
      </section>

      <div class="grid">
        <section class="panel">
          <form id="blogForm">
            <div class="two-col">
              <label>
                Post title
                <input type="text" name="title" required />
              </label>
              <label>
                Slug (optional)
                <input type="text" name="slug" placeholder="placement-journey-by-someone" />
              </label>
            </div>

            <label>
              Publish date
              <input type="date" name="date" value="${escapeHtml(getTodayDateString())}" required />
            </label>

            <div class="two-col">
              <label>
                Author source
                <select name="authorMode" id="authorMode">
                  <option value="existing">Use existing author</option>
                  <option value="new">Create new author</option>
                </select>
              </label>
              <label>
                Existing author
                <select name="existingAuthorKey" id="existingAuthorKey">
                  ${authorOptions || '<option value="">No authors yet</option>'}
                </select>
              </label>
            </div>

            <div class="author-fields" id="authorFields">
              <div class="two-col">
                <label>
                  New author key
                  <input type="text" name="newAuthorKey" placeholder="likhitha-bhavani" />
                </label>
                <label>
                  Author name
                  <input type="text" name="newAuthorName" placeholder="Likhitha Bhavani" />
                </label>
              </div>

              <div class="two-col">
                <label>
                  Author title
                  <input type="text" name="newAuthorTitle" placeholder="N200556" />
                </label>
                <label>
                  Author image URL (optional)
                  <input type="url" name="newAuthorImageUrl" placeholder="https://..." />
                </label>
              </div>
            </div>

            <div>
              <label>Tags</label>
              <div class="tag-grid">
                ${tagCheckboxes || '<p class="note">No predefined tags found in blog/tags.yml.</p>'}
              </div>
            </div>

            <label>
              Extra tags (comma separated)
              <input type="text" name="customTags" placeholder="off-campus, experience, tips" />
            </label>

            <label>
              Intro / summary (optional)
              <textarea class="small" name="summary" placeholder="This becomes the preview text before the truncate marker."></textarea>
            </label>

            <label>
              Blog content (Markdown)
              <textarea name="content" required placeholder="Write the full story in Markdown here..."></textarea>
            </label>

            <div class="actions">
              <button type="submit">Create blog post</button>
              <button type="button" class="ghost" id="fillSlug">Auto-fill slug from title</button>
            </div>
          </form>

          <div id="status" class="status" role="status" aria-live="polite"></div>
        </section>

        <aside class="panel">
          <h2>How It Works</h2>
          <ul>
            <li>Open this local page with <code>npm run admin</code>.</li>
            <li>Fill the form and submit.</li>
            <li>A markdown file is created in <code>blog/</code>.</li>
            <li>If you created a new author, the form appends it to <code>blog/authors.yml</code>.</li>
            <li>Review the generated file, then commit and push to publish.</li>
          </ul>
          <div class="note" style="margin-top: 1rem;">
            This is local-only. It does not publish directly from the browser and it does not replace GitHub Pages.
          </div>
        </aside>
      </div>
    </main>

    <script>
      const form = document.getElementById('blogForm');
      const statusBox = document.getElementById('status');
      const authorMode = document.getElementById('authorMode');
      const authorFields = document.getElementById('authorFields');
      const slugButton = document.getElementById('fillSlug');
      const titleInput = form.elements.title;
      const slugInput = form.elements.slug;

      function toSlug(value) {
        return value
          .toLowerCase()
          .trim()
          .replace(/&/g, ' and ')
          .replace(/['".,()/\\\\]+/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }

      function syncAuthorMode() {
        const isNewAuthor = authorMode.value === 'new';
        authorFields.classList.toggle('visible', isNewAuthor);
      }

      function setStatus(type, message) {
        statusBox.className = 'status ' + type;
        statusBox.textContent = message;
      }

      authorMode.addEventListener('change', syncAuthorMode);
      syncAuthorMode();

      slugButton.addEventListener('click', () => {
        slugInput.value = toSlug(titleInput.value);
      });

      form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const body = new URLSearchParams(new FormData(form));

        setStatus('success', 'Creating blog post...');

        try {
          const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            },
            body: body.toString(),
          });

          const payload = await response.json();

          if (!response.ok) {
            throw new Error(payload.error || 'Unable to create blog post.');
          }

          setStatus(
            'success',
            'Blog post created successfully.\\n\\nFile: ' +
              payload.file +
              '\\nPermalink: ' +
              payload.permalink +
              '\\n\\nReview the file, then commit and push it.',
          );

          form.reset();
          form.elements.date.value = '${escapeHtml(getTodayDateString())}';
          authorMode.value = 'existing';
          syncAuthorMode();
        } catch (error) {
          setStatus('error', error.message);
        }
      });
    </script>
  </body>
</html>`;
}

function collectBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    request.on('data', (chunk) => {
      chunks.push(chunk);
    });

    request.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });

    request.on('error', reject);
  });
}

function sendHtml(response, html) {
  response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
  response.end(html);
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {'Content-Type': 'application/json; charset=utf-8'});
  response.end(JSON.stringify(payload));
}

async function createBlogPost(formData) {
  const title = formData.get('title')?.trim() || '';
  const providedSlug = formData.get('slug')?.trim() || '';
  const date = formData.get('date')?.trim() || getTodayDateString();
  const content = formData.get('content')?.trim() || '';
  const summary = formData.get('summary')?.trim() || '';
  const authorMode = formData.get('authorMode')?.trim() || 'existing';
  const existingAuthorKey = formData.get('existingAuthorKey')?.trim() || '';
  const customTagsInput = formData.get('customTags')?.trim() || '';

  if (!title) {
    throw new Error('Post title is required.');
  }

  if (!content) {
    throw new Error('Blog content is required.');
  }

  const slug = slugify(providedSlug || title);

  if (!slug) {
    throw new Error('A valid slug could not be generated from the title.');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Publish date must use YYYY-MM-DD format.');
  }

  const portalData = await loadPortalData();
  const existingAuthors = new Map(portalData.authors.map((author) => [author.key, author]));

  let authorKey = existingAuthorKey;

  if (authorMode === 'new') {
    const newAuthorKey = slugify(formData.get('newAuthorKey')?.trim() || '');
    const newAuthorName = formData.get('newAuthorName')?.trim() || '';
    const newAuthorTitle = formData.get('newAuthorTitle')?.trim() || '';
    const newAuthorImageUrl = formData.get('newAuthorImageUrl')?.trim() || '';

    if (!newAuthorKey) {
      throw new Error('New author key is required.');
    }

    if (!newAuthorName) {
      throw new Error('Author name is required for a new author.');
    }

    if (existingAuthors.has(newAuthorKey)) {
      throw new Error(
        `Author key "${newAuthorKey}" already exists. Choose "Use existing author" instead.`,
      );
    }

    await appendAuthor({
      key: newAuthorKey,
      name: newAuthorName,
      title: newAuthorTitle,
      imageUrl: newAuthorImageUrl,
    });

    authorKey = newAuthorKey;
  }

  if (!authorKey || !existingAuthors.has(authorKey)) {
    if (authorMode !== 'new') {
      throw new Error('Choose an existing author or create a new one.');
    }
  }

  const selectedTags = formData
    .getAll('tags')
    .map((tag) => slugify(tag))
    .filter(Boolean);

  const customTags = customTagsInput
    .split(',')
    .map((tag) => slugify(tag))
    .filter(Boolean);

  const tags = unique([...selectedTags, ...customTags]);
  const fileName = `${date}-${slug}.md`;
  const filePath = path.join(blogDir, fileName);

  try {
    await fs.access(filePath);
    throw new Error(
      `A blog file already exists for ${fileName}. Change the date or slug and try again.`,
    );
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  const markdown = buildMarkdown({
    title,
    slug,
    authorKey,
    tags,
    summary,
    content,
  });

  await fs.writeFile(filePath, markdown, 'utf8');

  return {
    file: path.relative(repoRoot, filePath).replace(/\\/g, '/'),
    permalink: `/blog/${slug}`,
  };
}

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

  if (request.method === 'GET' && url.pathname === '/') {
    const portalData = await loadPortalData();
    sendHtml(response, buildFormPage(portalData));
    return;
  }

  if (request.method === 'GET' && url.pathname === '/health') {
    sendJson(response, 200, {status: 'ok'});
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/posts') {
    try {
      const rawBody = await collectBody(request);
      const formData = new URLSearchParams(rawBody);
      const result = await createBlogPost(formData);
      sendJson(response, 201, result);
    } catch (error) {
      sendJson(response, 400, {error: error.message || 'Unable to create blog post.'});
    }
    return;
  }

  sendJson(response, 404, {error: 'Not found'});
}

async function startServer(port = defaultPort) {
  const server = http.createServer((request, response) => {
    handleRequest(request, response).catch((error) => {
      sendJson(response, 500, {error: error.message || 'Unexpected server error.'});
    });
  });

  await new Promise((resolve) => {
    server.listen(port, resolve);
  });

  console.log(`Blog admin is running at http://localhost:${port}`);
  console.log('Submit the form to create markdown files in blog/.');

  return server;
}

function isDirectExecution() {
  return process.argv[1] && path.resolve(process.argv[1]) === __filename;
}

if (isDirectExecution()) {
  startServer().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export {startServer, createBlogPost, loadPortalData};
