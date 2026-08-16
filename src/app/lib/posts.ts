import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import GithubSlugger from "github-slugger";

const CONTENT_DIR = path.join(process.cwd(), "content", "posts");

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
}

export interface Post extends PostMeta {
  content: string;
  raw: string;
}

function parsePostFromFile(filePath: string): Post {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content: frontmatterContent } = matter(raw);

  const baseName = path.basename(filePath, ".md");
  // 文件名支持 "YYYY-MM-DD-slug" 或 "NN-slug" 前缀，前缀会被剥离作为排序与 slug
  const prefixMatch = baseName.match(/^(\d{4}-\d{2}-\d{2}-|\d+-)(.+)$/);
  const slug = prefixMatch ? prefixMatch[2] : baseName;

  let title: string = data.title ?? "";
  let content = frontmatterContent;

  // 没有 frontmatter title 时，从正文第一个 H1 提取标题，并从正文中移除该行
  // 这样作者可以直接用 "# 标题" 开头，无需写 frontmatter
  if (!title) {
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) {
      title = h1Match[1].trim();
      content = content.replace(/^#\s+.+\n?/m, "");
    } else {
      title = slug;
    }
  }

  const fileDate = prefixMatch?.[1]?.match(/^(\d{4}-\d{2}-\d{2})-/)?.[1];

  return {
    slug,
    title,
    description: data.description ?? "",
    date: data.date ? String(data.date) : fileDate ?? "1970-01-01",
    tags: data.tags ?? [],
    content,
    raw,
  };
}

function readAllPosts(): Post[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const mdFiles = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const posts = mdFiles.map((file) =>
    parsePostFromFile(path.join(CONTENT_DIR, file))
  );

  // 按日期倒序
  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return posts;
}

export function getAllPosts(): PostMeta[] {
  return readAllPosts().map(({ content: _content, raw: _raw, ...meta }) => meta);
}

export function getPost(slug: string): Post | undefined {
  return readAllPosts().find((p) => p.slug === slug);
}

export function getAdjacentPosts(
  slug: string
): { prev: PostMeta | null; next: PostMeta | null } {
  const posts = readAllPosts();
  const index = posts.findIndex((p) => p.slug === slug);
  if (index === -1) return { prev: null, next: null };
  // 列表按日期倒序：上一篇 = 索引更小（更新）；下一篇 = 索引更大（更旧）
  return {
    prev: index > 0 ? stripBody(posts[index - 1]) : null,
    next: index < posts.length - 1 ? stripBody(posts[index + 1]) : null,
  };
}

function stripBody(post: Post): PostMeta {
  const { content: _content, raw: _raw, ...meta } = post;
  return meta;
}

export interface TocItem {
  id: string;
  text: string;
  depth: 1 | 2 | 3;
  children: TocItem[];
}

// 从 Markdown 正文中提取 H1-H3，生成带 id 的 TOC 树；slug 规则与 rehype-slug 对齐（github-slugger）
export function extractToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger();
  const lines = markdown.split("\n");
  const flat: { id: string; text: string; depth: 1 | 2 | 3 }[] = [];
  const usedIds = new Set<string>();

  let inCode = false;
  for (const line of lines) {
    // 跳过代码块
    if (line.trim().startsWith("```")) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;

    const m = line.match(/^(#{1,3})\s+(.+)$/);
    if (!m) continue;
    const depth = m[1].length as 1 | 2 | 3;
    let text = m[2].trim();

    // 去除行尾 # 以及 Markdown 格式（如 **粗体**、`代码`、[链接](url)、![图片](url)）
    text = text.replace(/\s*#+\s*$/, "");
    text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
    text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
    text = text.replace(/`([^`]+)`/g, "$1");
    text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
    text = text.replace(/\*([^*]+)\*/g, "$1");
    text = text.replace(/_([^_]+)_/g, "$1");
    text = text.trim();

    if (!text) continue;

    // 与 rehype-slug 一致：slugger.slug(text, true) 保持大小写
    let id = slugger.slug(text, true);
    // 去重（理论上同一篇内相同标题少见，但 rehype-slug 会自动去重）
    if (usedIds.has(id)) {
      let i = 2;
      while (usedIds.has(`${id}-${i}`)) i++;
      id = `${id}-${i}`;
    }
    usedIds.add(id);

    flat.push({ id, text, depth });
  }

  // 构造树
  const root: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const node of flat) {
    const newItem: TocItem = { ...node, children: [] };
    while (stack.length > 0 && stack[stack.length - 1].depth >= node.depth) {
      stack.pop();
    }
    if (stack.length === 0) {
      root.push(newItem);
    } else {
      stack[stack.length - 1].children.push(newItem);
    }
    stack.push(newItem);
  }

  return root;
}

