export default function Table({ children, className = "", containerClassName = "", ...props }) {
  return (
    <div className={`w-full overflow-x-auto rounded-lg border border-separator ${containerClassName}`}>
      <table className={`w-full border-collapse text-left ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}
