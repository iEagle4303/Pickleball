export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function http<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch("/api" + path, {
    ...options,
    credentials: "same-origin",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  let result: { data: T; error?: { message: string } };
  try {
    result = await response.json();
  } catch {
    throw new ApiError(
      "The server returned an unreadable response.",
      response.status,
    );
  }
  if (!response.ok)
    throw new ApiError(
      result.error?.message || "The request could not be completed.",
      response.status,
    );
  return result.data;
}
export const jsonBody = (value: unknown) => JSON.stringify(value);
