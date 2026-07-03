import Image from "next/image";
import Link from "next/link";

import { auth } from "@/app/actions";
import settingsIcon from "@/assets/icons/settings.svg";
import vsqLogo from "@/assets/VSQLogo_circle.png";
import Button from "@/components/Button";
import SearchBar from "@/components/SearchBar";

export default async function TopBar({ search = {} }) {
  const searchProps = search ?? {};
  const subject = await auth();

  return (
    <header className="sticky top-0 z-50 border-b border-[#262626]/70 bg-[#171717]/75 backdrop-blur-xl">
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
          {subject ? (
            <Button
              href="/settings"
              size="icon"
              variant="tertiary"
              icon={settingsIcon}
              aria-label="Settings"
            />
          ) : (
            <Button href="/login" variant="tertiary" size="sm" className="h-9 min-w-20 shrink-0 px-4">
              Login
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
