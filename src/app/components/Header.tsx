import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-8 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400"></span>
          <span className="text-sm font-semibold tracking-wide text-neutral-100">
            思录
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-xs text-neutral-500">
          <Link href="/" className="hover:text-neutral-300 transition-colors">
            首页
          </Link>
          <a
            href="https://github.com/hezihua"
            target="_blank"
            rel="noreferrer"
            className="hover:text-neutral-300 transition-colors"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
