import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-background px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-subtle">© Vanilla² (VSQ)</p>
        <div className="flex gap-6 text-sm text-subtle">
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
