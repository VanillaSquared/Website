import SearchBar from "@/components/SearchBar";
import DefaultTemplatePage from "@/template-pages/DefaultTemplatePage";

export default function SearchListTemplatePage({
  children,
  search,
  actions,
  maxWidth = "max-w-6xl",
  listMaxWidth = "max-w-4xl",
  className = "",
}) {
  return (
    <DefaultTemplatePage search={search?.header ?? search}>
      <section className={`flex min-h-0 flex-1 justify-center bg-background px-6 pt-10 pb-10 ${className}`}>
        <div className={`flex min-h-0 w-full flex-1 flex-col ${maxWidth}`}>
          <div className="mb-7 flex justify-center">
            <div className="flex w-full max-w-3xl items-center gap-2">
              <SearchBar {...search} variant={search?.variant ?? "large"} className={`flex-1 ${search?.className ?? ""}`} />
              {actions}
            </div>
          </div>

          <div className={`mx-auto min-h-0 w-full flex-1 ${listMaxWidth}`}>{children}</div>
        </div>
      </section>
    </DefaultTemplatePage>
  );
}
