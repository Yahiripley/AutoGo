import crypto from "node:crypto";

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, digest] = stored.split(":");
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(candidate, "hex"));
}

export function signSessionId(sessionId, secret) {
  const sig = crypto.createHmac("sha256", secret).update(sessionId).digest("base64url");
  return `${sessionId}.${sig}`;
}

export function verifySessionCookie(token, secret) {
  if (!token || typeof token !== "string") return null;
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex <= 0) return null;
  const sessionId = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);
  const expected = crypto.createHmac("sha256", secret).update(sessionId).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return crypto.timingSafeEqual(a, b) ? sessionId : null;
}
