import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import GithubSlugger from "github-slugger";

const CONTENT_DIR = path.join(process.cwd(), "content", "posts");

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO 格式：YYYY-MM-DD 或 YYYY-MM-DDTHH:mm:ss
  lastModified: string; // ISO 格式
  tags: string[];
}

// 将 ISO 日期格式化成「2026 年 8 月 16 日」或「2026 年 8 月 16 日 14:30」。
// 仅当输入本身真实包含时间信息（T... 或 字符串含 `T`）时才显示时间部分。
// 对于 frontmatter 的纯日期（YYYY-MM-DD），永远不显示 00:00 / 08:00。
export function formatDate(iso: string): string {
  if (!iso) return "";
  const hasTime = /T\d/.test(iso);

  let d: Date;
  if (hasTime) {
    d = new Date(iso);
  } else {
    // 纯日期字符串。用 UTC 方式解析再读 UTC 字段，避免时区偏移把日搞乱
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return iso;
    d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    if (isNaN(d.getTime())) return iso;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getUTCFullYear()} 年 ${d.getUTCMonth() + 1} 月 ${d.getUTCDate()} 日`;
  }

  if (isNaN(d.getTime())) return iso;

  const pad = (n: number) => n.toString().padStart(2, "0");
  const parts: string[] = [];
  parts.push(`${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`);

  const h = d.getHours();
  const m = d.getMinutes();
  const s = d.getSeconds();
  if (s !== 0) {
    parts.push(`${pad(h)}:${pad(m)}:${pad(s)}`);
  } else if (m !== 0) {
    parts.push(`${pad(h)}:${pad(m)}`);
  } else if (h !== 0) {
    parts.push(`${pad(h)}:00`);
  }
  return parts.join(" ");
}


export interface Post extends PostMeta {
  content: string;
  raw: string;
}

function parsePostFromFile(filePath: string): Post {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content: frontmatterContent } = matter(raw);
  const stat = fs.statSync(filePath);

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
  // gray-matter 对 `date: 2026-08-16` 会解析成 Date (UTC 零点)，直接 String() 会带上本地时区偏移，
  // 导致展示时多出 08:00（中国时区）。这里把它统一转成纯日期 ISO（YYYY-MM-DD），不带时间。
  const published = normalizeDateInput(data.date) ?? fileDate ?? "1970-01-01";

  // 最后修改时间：取 fs.stat 的 mtime，并转成本地时区 ISO（秒级截断即可）
  const lastModified = new Date(stat.mtimeMs);
  const isoM = toLocalISO(lastModified);

  return {
    slug,
    title,
    description: data.description ?? "",
    date: published,
    lastModified: isoM,
    tags: data.tags ?? [],
    content,
    raw,
  };
}

function toLocalISO(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = d.getFullYear();
  const mon = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const m = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${year}-${mon}-${day}T${h}:${m}:${s}`;
}

// 统一 frontmatter 的日期为 YYYY-MM-DD（无时间信息），避免 gray-matter 将
// `date: 2026-08-16` 解析为 UTC Date 后再 String() 产生本地时区偏移（多出 08:00 等）。
function normalizeDateInput(input: unknown): string | undefined {
  if (input == null) return undefined;
  if (input instanceof Date) {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${input.getUTCFullYear()}-${pad(input.getUTCMonth() + 1)}-${pad(input.getUTCDate())}`;
  }
  if (typeof input !== "string") return String(input);
  const s = input.trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})(?:T|Z| |$)/);
  if (m) return m[1];
  return s;
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

