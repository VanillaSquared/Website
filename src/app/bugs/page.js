import {
  BUG_REPORT_CATEGORY_CONFIGS,
  BUG_REPORT_PRIORITIES,
  BUG_REPORT_STATUSES,
  listBugReports,
} from "@/bugs/reporter";
import SearchListTemplatePage from "@/template-pages/SearchListTemplatePage";

import BugFilterSidebar from "./BugFilterSidebar";
import BugList from "./BugList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bugs | Vanilla²",
  description: "Browse known Vanilla² bug reports.",
};

function getSearchParamValue(params, name) {
  const value = params?.[name];
  return String(Array.isArray(value) ? value[0] ?? "" : value ?? "").trim();
}

function getSearchParamValues(params, name) {
  const value = params?.[name];
  const values = Array.isArray(value) ? value : [value];
  return values.map((item) => String(item ?? "").trim()).filter(Boolean);
}

export default async function BugsPage({ searchParams }) {
  const params = await searchParams;
  const filters = {
    q: getSearchParamValue(params, "q"),
    category: getSearchParamValues(params, "category"),
    priority: getSearchParamValues(params, "priority"),
    status: getSearchParamValues(params, "status"),
  };
  const bugs = await listBugReports(filters);
  const searchHiddenFields = {
    category: filters.category,
    priority: filters.priority,
    status: filters.status,
  };
  const bugSearch = {
    action: "/bugs",
    defaultValue: filters.q,
    hiddenFields: searchHiddenFields,
    placeholder: "Search bug reports",
    previewEndpoint: "/api/bugs",
    previewResultsKey: "bugs",
    previewTitleKey: "title",
    previewDescriptionKey: "description",
    previewMetaKey: "publicId",
  };

  return (
    <SearchListTemplatePage
      search={{ ...bugSearch, header: { ...bugSearch, placeholder: "Search bugs" } }}
      actions={(
        <BugFilterSidebar
          categories={BUG_REPORT_CATEGORY_CONFIGS}
          priorities={BUG_REPORT_PRIORITIES}
          statuses={BUG_REPORT_STATUSES}
        />
      )}
    >
      <BugList bugs={bugs} />
    </SearchListTemplatePage>
  );
}
