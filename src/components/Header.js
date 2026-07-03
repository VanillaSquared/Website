import Image from "next/image";
import Link from "next/link";

import vsqLogo from "@/assets/VSQLogo_circle.png";

export default function TopBar({ items = [], search = null }) {
  return (
    <header className="sticky top-0 z-50 border-b border-divider bg-background">
      <nav className="mx-auto flex min-h-16 max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <Link
          href="/"
          className="group flex items-center gap-2 text-base font-semibold tracking-wide text-soft transition-colors hover:text-muted"
        >
          <Image
            src={vsqLogo}
            alt="Vanilla² logo"
            width={32}
            height={32}
            className="transition duration-200 group-hover:brightness-75"
          />
          <span>Vanilla²</span>
        </Link>
        {search ? (
          <div className="order-last w-full flex-1 sm:order-none sm:max-w-md">
            {search}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-soft">
          {items.map((item, index) => (
            <div key={index} className="flex items-center">
              {item}
            </div>
          ))}
        </div>
      </nav>
    </header>
  );
}
