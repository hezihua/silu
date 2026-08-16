import Link from "next/link";
import { getAllPosts, formatDate } from "./lib/posts";

export default function Home() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-4xl px-8 py-12">
      <section className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-100">
          思录
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          个人博客 · 记录学习与思考的痕迹
        </p>
      </section>

      {posts.length === 0 ? (
        <p className="text-neutral-500">还没有文章，去 content/posts/ 下写一篇吧。</p>
      ) : (
        <ul className="space-y-8">
          {posts.map((post, idx) => (
            <li key={post.slug}>
              <Link
                href={`/posts/${post.slug}`}
                className="group block rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 transition-colors hover:border-neutral-600 hover:bg-neutral-900"
              >
                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                  <span className="tabular-nums font-semibold text-neutral-400 group-hover:text-neutral-200">
                    #{(idx + 1).toString().padStart(2, "0")}
                  </span>
                  <span className="text-neutral-700">·</span>
                  <time title="发布时间">📅 发布 · {formatDate(post.date)}</time>
                  {(() => {
                    const pubDay = new Date(post.date);
                    const modDay = new Date(post.lastModified);
                    // 如果更新日期 > 发布日期（或发布没有时间信息），则显示更新时间
                    const updatedLater = modDay.getTime() > pubDay.getTime() + 12 * 3600 * 1000;
                    if (!updatedLater) return null;
                    return (
                      <>
                        <span className="text-neutral-700">·</span>
                        <time title="最后修改时间" className="text-neutral-500">
                          ✏️ 更新 · {formatDate(post.lastModified)}
                        </time>
                      </>
                    );
                  })()}
                  {post.tags.length > 0 && (
                    <>
                      <span className="text-neutral-700">·</span>
                      <span>{post.tags.join(" / ")}</span>
                    </>
                  )}
                </div>
                <h2 className="mt-2 text-lg font-semibold text-neutral-100 group-hover:text-white">
                  {post.title}
                </h2>
                {post.description && (
                  <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                    {post.description}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
