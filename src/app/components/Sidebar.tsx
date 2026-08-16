"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface PostMeta {
  slug: string;
  title: string;
  date: string;
}

export default function Sidebar({ posts }: { posts: PostMeta[] }) {
  const pathname = usePathname();
  const currentSlug =
    pathname.match(/^\/posts\/([^/]+)/)?.[1] ?? null;

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-72 flex-col border-r border-neutral-800 bg-neutral-950">
      <div className="border-b border-neutral-800 p-5">
        <Link href="/" className="block">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400"></span>
            <span className="text-xs text-neutral-500 uppercase tracking-wider">
              siLu
            </span>
          </div>
          <h1 className="text-lg font-semibold text-neutral-100">思录</h1>
          <p className="mt-1 text-xs text-neutral-500">
            个人博客 · 记录思考与笔记
          </p>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="mb-2 px-2 text-[10px] font-medium uppercase tracking-wider text-neutral-600">
          文章列表
        </div>

        {posts.length === 0 ? (
          <div className="px-3 py-2 text-[11px] text-neutral-600">
            暂无文章
          </div>
        ) : (
          <ul className="space-y-0.5">
            {posts.map((post) => {
              const active = currentSlug === post.slug;
              return (
                <li key={post.slug}>
                  <Link
                    href={`/posts/${post.slug}`}
                    className={`block rounded-md px-2.5 py-2 text-xs transition-colors ${
                      active
                        ? "bg-neutral-800 text-neutral-100 font-medium"
                        : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
                    }`}
                  >
                    <div className="truncate">{post.title}</div>
                    <div className="text-[10px] text-neutral-600 mt-0.5">
                      {post.date}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <div className="border-t border-neutral-800 p-4">
        <a
          href="https://github.com/hezihua"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <span>GitHub</span>
          <span>↗</span>
        </a>
      </div>
    </aside>
  );
}
