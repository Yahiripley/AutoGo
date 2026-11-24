export class ApiError extends Error {
  constructor(message, { status = 500, code = "GENERIC", details = null } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  let body = {};
  try {
    body = await response.json();
  } catch {
    body = {};
  }
  if (!response.ok) {
    throw new ApiError(body.error || "Request failed.", {
      status: response.status,
      code: body.code || "GENERIC",
      details: body.details || null,
    });
  }
  return body;
}
