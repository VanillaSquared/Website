const variants = {
  primary:
    "bg-[#B36BB3] text-white hover:bg-[#9E5F9E]",
  secondary:
    "bg-[#3b4658] text-white hover:bg-[#4a5870]",
};

export default function Button({ href, children, variant = "primary", external = false }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={`rounded-lg px-6 py-3 text-base font-semibold transition-colors ${variants[variant] ?? variants.primary}`}
    >
      {children}
    </a>
  );
}
