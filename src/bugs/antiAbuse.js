const MINIMUM_COMPLETION_MS = 4000;
const MAXIMUM_COMPLETION_MS = 60 * 60 * 1000;

function requestIp(request) {
  return request.headers.get("cf-connecting-ip")
    || request.headers.get("x-real-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || "unknown";
}

function userAgentEnvironment(userAgent) {
  const browser = /Edg\//i.test(userAgent) ? "edge"
    : /Firefox\//i.test(userAgent) ? "firefox"
      : /Chrome\//i.test(userAgent) ? "chrome"
        : /Safari\//i.test(userAgent) ? "safari"
          : "unknown";
  const os = /Windows/i.test(userAgent) ? "Windows"
    : /Mac OS|Macintosh/i.test(userAgent) ? "macOS"
      : /Linux|X11/i.test(userAgent) ? "Linux"
        : "unknown";
  const device = /Mobile|Android|iPhone|iPad/i.test(userAgent) ? "mobile" : "desktop";
  return { browser, os, device };
}

export function evaluateBugSubmission(request, input, now = Date.now()) {
  const userAgent = request.headers.get("user-agent") ?? "";
  const origin = request.headers.get("origin");
  const ipAddress = requestIp(request);
  const environment = userAgentEnvironment(userAgent);
  const completionTime = now - Number(input?.startedAt);
  const links = String(input?.description ?? "").match(/(?:https?:\/\/|www\.)/gi)?.length ?? 0;
  let score = 1;

  if (!userAgent) score += 3;
  if (ipAddress === "unknown") score += 1;
  if (environment.browser === "unknown") score += 1;
  if (/bot|crawler|spider|headless|phantom|selenium|playwright|puppeteer|curl|wget|postman/i.test(userAgent)) score += 6;
  if (!origin) score += 2;
  if (origin && origin !== new URL(request.url).origin) score += 5;
  if (!request.headers.get("sec-fetch-site")) score += 1;
  if (request.headers.get("sec-fetch-site") === "cross-site") score += 5;
  if (input?.website) score += 9;
  if (!Number.isFinite(completionTime) || completionTime < MINIMUM_COMPLETION_MS) score += 9;
  if (completionTime > MAXIMUM_COMPLETION_MS) score += 2;
  if (links > 3) score += 3;
  if (links > 6) score += 4;

  // Browser, device, and OS matching are deliberately weak signals.
  if (environment.os !== "unknown" && ![environment.os, "Other", "Not applicable"].includes(input?.operatingSystem)) score += 1;
  if (environment.device === "mobile" && String(input?.description ?? "").length < 15) score += 1;

  return { ipAddress, score: Math.min(10, score) };
}
