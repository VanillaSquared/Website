export default function TopBar({ items = [], search = null }) {
  return (
    <header className="sticky top-0 z-50 border-b border-divider bg-background">
      <nav className="mx-auto flex min-h-16 max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <a href="/" className="text-sm font-semibold tracking-wide text-heading">
          Vanilla²
        </a>
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
