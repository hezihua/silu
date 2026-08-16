"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { TocItem } from "../lib/posts";

function flatten(items: TocItem[]): { id: string; text: string; depth: 1 | 2 | 3 }[] {
  const out: { id: string; text: string; depth: 1 | 2 | 3 }[] = [];
  for (const item of items) {
    out.push({ id: item.id, text: item.text, depth: item.depth });
    out.push(...flatten(item.children));
  }
  return out;
}

export default function Toc({ items }: { items: TocItem[] }) {
  const flat = flatten(items);
  const allIds = flat.map((t) => t.id);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (allIds.length === 0) return;

    // 获取所有有 id 的标题元素
    const headings = allIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);

    if (headings.length === 0) return;

    // 初始设置第一个
    setActiveId(headings[0].id);

    // IntersectionObserver 确定当前可视区域里最靠上的那个
    const visibility = new Map<string, boolean>();
    headings.forEach((h) => visibility.set(h.id, false));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          visibility.set(e.target.id, e.isIntersecting);
        }

        // 找到最顶部的一个"可见的"标题
        let topVisibleId: string | null = null;
        let top = Infinity;
        for (const h of headings) {
          if (!visibility.get(h.id)) continue;
          const rect = h.getBoundingClientRect();
          if (rect.top >= 0 && rect.top < top) {
            top = rect.top;
            topVisibleId = h.id;
          }
        }
        if (topVisibleId) {
          setActiveId(topVisibleId);
        } else {
          // 没有标题可见（可能还没滚到或滚过了），取距离顶部最近的
          let closestId = headings[0].id;
          let closest = Infinity;
          for (const h of headings) {
            const rect = h.getBoundingClientRect();
            const dist = Math.abs(rect.top - 80);
            if (dist < closest) {
              closest = dist;
              closestId = h.id;
            }
          }
          setActiveId(closestId);
        }
      },
      {
        // 稍微给顶部留一点偏移（避开 header 遮挡）
        rootMargin: "-100px 0px -60% 0px",
        threshold: [0, 1],
      }
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [allIds.join(",")]);

  if (flat.length === 0) return null;

  const renderTree = (list: TocItem[]) => (
    <ul className="space-y-0.5">
      {list.map((item) => (
        <li key={item.id}>
          <Link
            href={`#${item.id}`}
            onClick={(e) => {
              const el = document.getElementById(item.id);
              if (el) {
                e.preventDefault();
                const headerOffset = 72;
                const y = el.getBoundingClientRect().top + window.scrollY - headerOffset;
                window.scrollTo({ top: y, behavior: "smooth" });
                history.replaceState(null, "", `#${item.id}`);
              }
            }}
            className={`block rounded-md transition-colors ${
              activeId === item.id
                ? "bg-neutral-800 text-neutral-100 font-medium"
                : "text-neutral-500 hover:text-neutral-300"
            } ${
              item.depth === 1
                ? "px-2.5 py-1.5 text-xs"
                : item.depth === 2
                  ? "ml-3 px-2 py-1 text-[11px]"
                  : "ml-6 px-2 py-1 text-[11px] text-neutral-600"
            }`}
          >
            {item.text}
          </Link>
          {item.children.length > 0 && renderTree(item.children)}
        </li>
      ))}
    </ul>
  );

  return (
    <aside className="hidden xl:block w-64 shrink-0">
      <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 scrollbar-hide">
        <div className="mb-2 px-2 text-[10px] font-medium uppercase tracking-wider text-neutral-600">
          目录
        </div>
        {renderTree(items)}
      </div>
    </aside>
  );
}
