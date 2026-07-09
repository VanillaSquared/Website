import { timingSafeEqual } from "crypto";

export function getEmailCodeBypass() {
  return String(process.env.bypass ?? "").trim();
}

export function isEmailCodeBypass(code) {
  const bypass = getEmailCodeBypass();
  const value = String(code ?? "").trim();

  if (!bypass || !value) {
    return false;
  }

  const valueBuffer = Buffer.from(value);
  const bypassBuffer = Buffer.from(bypass);

  return valueBuffer.length === bypassBuffer.length && timingSafeEqual(valueBuffer, bypassBuffer);
}
