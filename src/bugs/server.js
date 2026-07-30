import "server-only";

import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import { extractMarkdownDetails, scanMarkdownFiles, titleFromSegment } from "@/markdown/server";

const BUGS_DIRECTORY = path.resolve(process.cwd(), "src", "bugs");

export const BUG_REPORT_CATEGORY_CONFIGS = [
  { slug: "vanilla-squared", label: "Vanilla Squared", shortening: "vsq", order: 1 },
  { slug: "website", label: "Website", shortening: "web", order: 2 },
];
export const BUG_REPORT_PRIORITIES = ["Low", "Medium", "High", "Code Red", "unset"];
export const BUG_REPORT_STATUSES = ["Fixed", "Unfixable", "Unconfirmed", "Confirmed", "Works as intended", "Vanilla bug"];

const categoryNames = new Set(BUG_REPORT_CATEGORY_CONFIGS.map(({ slug }) => slug));

function normalizeList(value) {
  const values = Array.isArray(value) ? value : String(value ?? "").split(",");
  return [...new Set(values.map((item) => String(item).trim()).filter(Boolean))];
}

function normalizeChoice(value, choices, fallback, field, relativeFile) {
  const normalized = String(value ?? fallback).trim();
  const match = choices.find((choice) => choice.toLowerCase() === normalized.toLowerCase());
  if (!match) throw new Error(`Invalid ${field} "${normalized}" in ${relativeFile}.`);
  return match;
}

function normalizeFrontmatter(data, relativeFile, fallbackId, stats, source) {
  const publicId = String(data.id || fallbackId).trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,31}$/.test(publicId)) throw new Error(`Invalid bug id "${publicId}" in ${relativeFile}.`);

  const category = String(data.category || "").trim().toLowerCase();
  if (!categoryNames.has(category)) throw new Error(`Invalid bug category "${category}" in ${relativeFile}.`);

  const status = normalizeChoice(data.status, BUG_REPORT_STATUSES, "Unconfirmed", "status", relativeFile);
  const details = extractMarkdownDetails(source);
  const createdAt = new Date(stats.birthtimeMs || stats.ctimeMs).toISOString();

  return {
    publicId,
    title: String(data.title || titleFromSegment(fallbackId)).trim(),
    category,
    priority: normalizeChoice(data.priority, BUG_REPORT_PRIORITIES, "unset", "priority", relativeFile),
    status,
    fixed: data.fixed === true || status === "Fixed",
    affectedVersions: normalizeList(data.affectedVersions).length ? normalizeList(data.affectedVersions) : ["Unknown"],
    fixedVersion: data.fixedVersion ? String(data.fixedVersion).trim() : null,
    creatorUsername: String(data.author || "Unknown").trim(),
    createdAt,
    description: details.text,
    source: source.trim(),
  };
}

export function getBugReports() {
  const reports = scanMarkdownFiles(BUGS_DIRECTORY).map((relativeFile) => {
    const absoluteFile = path.resolve(BUGS_DIRECTORY, relativeFile);
    const parsedPath = path.parse(relativeFile);
    const source = fs.readFileSync(absoluteFile, "utf8");
    const parsed = matter(source);
    const stats = fs.statSync(absoluteFile);
    return normalizeFrontmatter(parsed.data, relativeFile, parsedPath.name, stats, parsed.content);
  });

  const seen = new Set();
  for (const report of reports) {
    if (seen.has(report.publicId)) throw new Error(`Duplicate bug id: ${report.publicId}`);
    seen.add(report.publicId);
  }

  const categoryOrder = new Map(BUG_REPORT_CATEGORY_CONFIGS.map(({ slug, order }) => [slug, order]));
  return reports.sort((left, right) => (
    (categoryOrder.get(left.category) ?? 99) - (categoryOrder.get(right.category) ?? 99)
    || left.publicId.localeCompare(right.publicId, undefined, { numeric: true })
  ));
}

function normalizeFilters(value, allowedValues) {
  const values = Array.isArray(value) ? value : [value];
  return [...new Set(values.map((item) => allowedValues.find((allowed) => allowed.toLowerCase() === String(item ?? "").toLowerCase())).filter(Boolean))];
}

export function listBugReports({ q, category, priority, status } = {}) {
  const query = String(q ?? "").trim().toLowerCase();
  const categories = normalizeFilters(category, [...categoryNames]);
  const priorities = normalizeFilters(priority, BUG_REPORT_PRIORITIES);
  const statuses = normalizeFilters(status, BUG_REPORT_STATUSES);

  return getBugReports().filter((report) => (
    (!query || [report.publicId, report.title, report.description].some((value) => value.toLowerCase().includes(query)))
    && (!categories.length || categories.includes(report.category))
    && (!priorities.length || priorities.includes(report.priority))
    && (!statuses.length || statuses.includes(report.status))
  ));
}

export function getBugReportByPublicId(publicId) {
  const normalizedId = String(publicId ?? "").trim().toLowerCase();
  return getBugReports().find((report) => report.publicId === normalizedId) ?? null;
}
