import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { getAllPosts, getPost, getAdjacentPosts, extractToc, formatDate } from "../../lib/posts";
import Toc from "../../components/Toc";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

const mdxOptions = {
  mdxOptions: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeSlug, rehypeHighlight, rehypeKatex],
  },
};

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    notFound();
  }

  const { prev, next } = getAdjacentPosts(slug);
  const toc = extractToc(post.content);

  const pubDay = new Date(post.date);
  const modDay = new Date(post.lastModified);
  const updatedLater = modDay.getTime() > pubDay.getTime() + 12 * 3600 * 1000;

  return (
    <div className="mx-auto max-w-7xl px-8 py-12">
      <div className="flex gap-10">
        <div className="min-w-0 flex-1 max-w-4xl">
          <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
            <time title="发布时间">📅 发布 · {formatDate(post.date)}</time>
            {updatedLater && (
              <>
                <span className="text-neutral-700">·</span>
                <time title="最后修改时间">✏️ 更新 · {formatDate(post.lastModified)}</time>
              </>
            )}
            {post.tags.length > 0 && (
              <>
                <span className="text-neutral-700">·</span>
                <span>🏷️ {post.tags.join(" / ")}</span>
              </>
            )}
          </div>

          <article className="prose prose-invert max-w-none">
            <MDXRemote source={post.content} options={mdxOptions} />
          </article>

          <nav className="mt-16 flex items-center justify-between border-t border-neutral-800 pt-8">
            {prev ? (
              <Link
                href={`/posts/${prev.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 px-5 py-3 transition-colors hover:border-neutral-600 hover:bg-neutral-900"
              >
                <span className="text-neutral-600 group-hover:text-neutral-400">←</span>
                <div className="text-left">
                  <div className="text-xs text-neutral-500">上一篇</div>
                  <div className="text-sm font-medium text-neutral-300">
                    {prev.title}
                  </div>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {next ? (
              <Link
                href={`/posts/${next.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 px-5 py-3 transition-colors hover:border-neutral-600 hover:bg-neutral-900 text-right"
              >
                <div>
                  <div className="text-xs text-neutral-500">下一篇</div>
                  <div className="text-sm font-medium text-neutral-300">
                    {next.title}
                  </div>
                </div>
                <span className="text-neutral-600 group-hover:text-neutral-400">→</span>
              </Link>
            ) : (
              <div />
            )}
          </nav>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              ← 返回首页
            </Link>
          </div>
        </div>

        <Toc items={toc} />
      </div>
    </div>
  );
}
