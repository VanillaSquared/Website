export default function Card({ title, children }) {
  return (
    <div className="rounded-xl border-2 border-transparent bg-card p-6 transition-colors hover:border-accent">
      {title ? (
        <h3 className="text-lg font-semibold text-accent">{title}</h3>
      ) : null}
      {children}
    </div>
  );
}
