export default function Card({ title, children }) {
  return (
    <div className="rounded-xl border border-transparent bg-[#1e1e1e] p-6 transition-colors hover:border-[#C269C2]">
      {title ? (
        <h3 className="text-lg font-semibold text-[#C269C2]">{title}</h3>
      ) : null}
      {children}
    </div>
  );
}
