import Image from "next/image";
import Link from "next/link";

import { getAuthSubject } from "@/app/auth";
import vsqLogo from "@/assets/VSQLogo_circle.png";
import HeaderAuthButton from "@/components/AuthButton";
import SearchBar from "@/components/SearchBar";

export default async function TopBar({ search = {} }) {
  const searchProps = search ?? {};
  const subject = await getAuthSubject({ updateTokens: false });

  return (
    <header className="sticky top-0 z-50 bg-[var(--vsq-surface-header)] backdrop-blur-xl after:pointer-events-none after:fixed after:top-16 after:left-0 after:right-0 after:h-px after:bg-[var(--vsq-border-header)]">
      <nav className="flex min-h-16 w-full items-center gap-3 px-4 py-3">
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
        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2">
          <div className="w-full max-w-44 sm:max-w-64 md:max-w-80">
            <SearchBar {...searchProps} />
          </div>
          <HeaderAuthButton initialLoggedIn={Boolean(subject)} />
        </div>
      </nav>
    </header>
  );
}
