import "server-only";

import { getBugLimitConfig } from "@/bugs/limits";

const LINK_PATTERN = /(?:https?:\/\/|www\.)[^\s<>()]+|\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}(?:\/[^\s<>()]*)?/giu;
const LEET_CHARACTERS = Object.freeze({ "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s" });

function canonicalize(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("en-GB")
    .replace(/[013457@$]/g, (character) => LEET_CHARACTERS[character] ?? character);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsPhrase(content, phrase) {
  const normalizedPhrase = canonicalize(phrase).trim();
  if (!normalizedPhrase) return false;
  const flexiblePhrase = [...normalizedPhrase]
    .map((character) => /[\p{L}\p{N}]/u.test(character) ? escapeRegex(character) : "[\\s\\W_]*")
    .join("[\\s\\W_]*");
  const expression = new RegExp(`(?<![\\p{L}\\p{N}])${flexiblePhrase}(?![\\p{L}\\p{N}])`, "u");
  return expression.test(canonicalize(content));
}

function normalizeHostname(value) {
  return String(value ?? "").trim().toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
}

function hostnameAllowed(hostname, allowedHosts) {
  const normalized = normalizeHostname(hostname);
  return allowedHosts.some((host) => normalized === host || normalized.endsWith(`.${host}`));
}

function findBlockedLink(content, configuredHosts, siteHostname) {
  const allowedHosts = [...new Set([...configuredHosts, siteHostname].map(normalizeHostname).filter(Boolean))];
  for (const match of String(content ?? "").matchAll(LINK_PATTERN)) {
    const candidate = /^https?:\/\//i.test(match[0]) ? match[0] : `https://${match[0]}`;
    try {
      const url = new URL(candidate);
      if (!["http:", "https:"].includes(url.protocol) || !hostnameAllowed(url.hostname, allowedHosts)) return match[0];
    } catch {
      return match[0];
    }
  }
  return null;
}

export async function moderateComment(content, { siteHostname = "" } = {}) {
  const config = await getBugLimitConfig();
  if (!config.automodEnabled) return { allowed: true };

  if (config.blockedPhrases.some((phrase) => containsPhrase(content, phrase))) {
    return { allowed: false, error: "Automod blocked this comment because it contains a prohibited word or phrase." };
  }

  if (findBlockedLink(content, config.allowedLinkHosts, siteHostname)) {
    return { allowed: false, error: "Links to that website are not allowed in comments." };
  }

  return { allowed: true };
}
