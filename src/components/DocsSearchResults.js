import Link from "next/link";

export default function DocsSearchResults({ query, results }) {
  return (
    <section className="mb-10 border-b border-divider pb-8" aria-labelledby="docs-search-results">
      <h2 id="docs-search-results" className="text-2xl font-bold text-heading">Search results for “{query}”</h2>
      {results.length ? (
        <ul className="mt-4 space-y-3">
          {results.map((result) => (
            <li key={result.href}>
              <Link href={result.href} className="block rounded-lg border border-divider bg-card p-4 transition-colors hover:border-accent">
                <span className="font-semibold text-accent">{result.title}</span>
                {result.description ? <span className="mt-1 block text-sm text-muted">{result.description}</span> : null}
                <span className="mt-2 block text-xs text-subtle">{result.breadcrumbs}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : <p className="mt-4 text-muted">No documentation pages matched your search.</p>}
    </section>
  );
}
