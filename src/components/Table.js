export default function Table({ children, className = "", containerClassName = "", ...props }) {
  return (
    <div className={`inline-block max-w-full overflow-hidden rounded-lg border border-separator align-top ${containerClassName}`}>
      <div className="max-w-full overflow-x-auto">
        <table className={`w-max border-collapse text-left ${className}`} {...props}>
          {children}
        </table>
      </div>
    </div>
  );
}
