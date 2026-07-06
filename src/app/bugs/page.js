import {
  BUG_REPORT_CATEGORY_CONFIGS,
  BUG_REPORT_PRIORITIES,
  BUG_REPORT_STATUSES,
  listBugReports,
} from "@/bugs/reporter";
import SearchBar from "@/components/SearchBar";
import DefaultTemplatePage from "@/template-pages/DefaultTemplatePage";

import BugFilterSidebar from "./BugFilterSidebar";
import BugList from "./BugList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bugs | Vanilla²",
  description: "Browse known Vanilla² bug reports.",
};

export default async function BugsPage({ searchParams }) {
  const params = await searchParams;
  const filters = {
    q: String(params?.q ?? "").trim(),
    category: String(params?.category ?? "").trim(),
    priority: String(params?.priority ?? "").trim(),
    status: String(params?.status ?? "").trim(),
  };
  const bugs = await listBugReports(filters);
  const searchHiddenFields = {
    category: filters.category,
    priority: filters.priority,
    status: filters.status,
  };

  return (
    <DefaultTemplatePage search={{ action: "/bugs", defaultValue: filters.q, hiddenFields: searchHiddenFields, placeholder: "Search bugs" }}>
      <section className="flex flex-1 justify-center bg-background px-6 pt-6 pb-10">
        <div className="w-full max-w-6xl">
          <div className="mb-5 flex justify-center">
            <div className="flex w-full max-w-3xl items-center gap-2">
              <SearchBar
                action="/bugs"
                defaultValue={filters.q}
                hiddenFields={searchHiddenFields}
                placeholder="Search bug reports"
                variant="large"
                className="flex-1"
              />
              <BugFilterSidebar
                categories={BUG_REPORT_CATEGORY_CONFIGS}
                priorities={BUG_REPORT_PRIORITIES}
                statuses={BUG_REPORT_STATUSES}
              />
            </div>
          </div>

          <div className="mx-auto max-w-4xl">
            <BugList bugs={bugs} />
          </div>
        </div>
      </section>
    </DefaultTemplatePage>
  );
}
