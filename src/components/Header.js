import Image from "next/image";
import Link from "next/link";

import settingsIcon from "@/assets/icons/settings.svg";
import vsqLogo from "@/assets/VSQLogo_circle.png";
import Button from "@/components/Button";
import SearchBar from "@/components/SearchBar";

export default function TopBar({ search = {} }) {
  const searchProps = search ?? {};

  return (
    <header className="sticky top-0 z-50 border-b border-divider bg-background">
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
        <div className="ml-auto flex items-center gap-2">
          <div className="w-44 sm:w-64 md:w-80">
            <SearchBar {...searchProps} />
          </div>
          <Button
            href="/settings"
            size="icon"
            variant="search"
            border={false}
            icon={settingsIcon}
            aria-label="Settings"
          />
        </div>
      </nav>
    </header>
  );
}
