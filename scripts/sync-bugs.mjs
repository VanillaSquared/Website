import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const owner = process.env.GITHUB_OWNER || "VanillaSquared";
const repository = process.env.GITHUB_REPOSITORY || "Issues";
const token = process.env.GITHUB_TOKEN || process.env.github;

if (!token) {
  throw new Error("GITHUB_TOKEN is required to synchronize bug reports.");
}

const api = `https://api.github.com/repos/${owner}/${repository}`;

async function githubRequest(endpoint) {
  const response = await fetch(`${api}${endpoint}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status} while synchronizing bug reports.`);
  }

  return response.json();
}

const issues = [];
for (let page = 1; ; page += 1) {
  const batch = await githubRequest(`/issues?state=all&per_page=100&page=${page}`);
  issues.push(...batch
    .filter((issue) => !issue.pull_request)
    .map((issue) => ({
      number: issue.number,
      title: issue.title,
      body: issue.body,
      labels: issue.labels.map((label) => typeof label === "string" ? label : label.name),
      created_at: issue.created_at,
    })));

  if (batch.length < 100) break;
}

issues.sort((left, right) => right.number - left.number);

const outputPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/bugs/data.json");
let previousSnapshot = null;
try {
  previousSnapshot = JSON.parse(await fs.readFile(outputPath, "utf8"));
} catch {
  // The first synchronization creates the snapshot.
}

if (JSON.stringify(previousSnapshot?.issues ?? null) !== JSON.stringify(issues)) {
  await fs.writeFile(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), issues }, null, 2)}\n`);
  console.log(`Synchronized ${issues.length} bug reports to ${path.relative(process.cwd(), outputPath)}.`);
} else {
  console.log(`Bug report snapshot is already current (${issues.length} reports).`);
}
