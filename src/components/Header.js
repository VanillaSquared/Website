import Image from "next/image";
import Link from "next/link";

import discordIcon from "@cdn/discord.png";
import vsqLogo from "@cdn/vsq-logo-circle.png";
import Button from "@/components/Button";
import DocsNavigationSidebar from "@/components/DocsNavigationSidebar";
import NewsTagFilter from "@/components/NewsTagFilter";
import SearchBar from "@/components/SearchBar";
import ThemeToggle from "@/components/ThemeToggle";

export default function TopBar({ docsNavigation, newsTagFilter, search = {}, variant = "default" }) {
  const searchProps = {
    action: "/docs",
    placeholder: "Search documentation",
    previewEndpoint: "/api/docs/search",
    previewResultsKey: "results",
    previewTitleKey: "title",
    previewDescriptionKey: "description",
    previewHrefKey: "href",
    ...(search ?? {}),
  };

  return (
    <header className="sticky top-0 z-50 bg-[var(--vsq-surface-header)] backdrop-blur-xl after:pointer-events-none after:fixed after:top-16 after:left-0 after:right-0 after:h-px after:bg-[var(--vsq-border-header)]">
      <nav className="flex min-h-16 w-full items-center gap-3 px-4 py-3">
        <Link href="/" className="group flex shrink-0 items-center gap-2 text-base font-semibold tracking-wide text-soft transition-colors hover:text-muted">
          <Image src={vsqLogo} alt="Vanilla² logo" width={32} height={32} loading="eager" className="transition duration-200 group-hover:brightness-75" />
          <span>Vanilla²</span>
        </Link>
        {docsNavigation ? <DocsNavigationSidebar {...docsNavigation} /> : null}
        {variant === "news" ? <NewsTagFilter {...newsTagFilter} /> : null}
        <ThemeToggle />
        <Button
          href="https://discord.gg/pppHybq9xT"
          variant="blurple"
          size="iconButtonSm"
          external
          icon={discordIcon}
          iconClassName="h-3.5 w-4.5 object-contain"
          aria-label="Join the Vanilla² Discord server"
          className="shrink-0"
        />
        <div className="hidden w-full max-w-64 sm:block md:max-w-80">
          <SearchBar {...searchProps} />
        </div>
      </nav>
    </header>
  );
}
