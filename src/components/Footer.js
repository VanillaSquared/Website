import Link from "@/components/Link";
import packageJson from "../../package.json";

export default function Footer() {
  return (
    <footer className="bg-background px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col flex-wrap items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-subtle">
          © Vanilla² (VSQ)
          <span className="ml-1 text-xs">V{packageJson.version}</span>
        </p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-subtle">
          <Link
            href="/license/mod"
            className="transition-colors hover:text-soft"
          >
            Mod License
          </Link>
          <Link
            href="/license/website"
            className="transition-colors hover:text-soft"
          >
            Website License
          </Link>
          <Link
            href="https://github.com/VanillaSquared/"
            className="transition-colors hover:text-soft"
          >
            GitHub
          </Link>
          <Link
            href="https://modrinth.com/mod/vsq"
            className="transition-colors hover:text-soft"
          >
            Modrinth
          </Link>
        </div>
      </div>
    </footer>
  );
}
