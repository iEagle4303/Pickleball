/** Error details included by an unsuccessful API response. */
export interface ApiErrorBody {
  /** Displayable backend validation, authorization, or application error. */
  message: string;
}
/** Typed transport envelope consumed by the shared HTTP client. */
export interface ApiEnvelope<T> {
  /** Response value read only after a successful HTTP status. */
  data: T;
  /** Error details read when the backend returns an unsuccessful status. */
  error?: ApiErrorBody;
}
/**
 * API transport failure carrying the HTTP response status and a displayable message.
 */
export class ApiError extends Error {
  /**
   * Creates an API failure with its displayable message and HTTP status.
   *
   * @param message - Human-readable text displayed to the user.
   * @param status - HTTP status associated with the failed API response.
   */
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
/**
 * Sends a same-origin API request, unwraps its data envelope, and reports unsuccessful responses.
 *
 * @typeParam T - Data type supplied by the loader or API response.
 * @param path - API route relative to /api.
 * @param options - Fetch settings merged with same-origin cookie handling and JSON headers.
 * @returns The response data converted to the requested generic type.
 * @throws {ApiError} If the API response is unsuccessful or cannot be read.
 */
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
  let result: ApiEnvelope<T>;
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
/**
 * Serializes an API request payload to JSON without changing authentication or transport settings.
 *
 * @param value - Payload or value to serialize, format, or submit.
 * @returns The JSON string, or undefined for values JSON.stringify cannot serialize at the root.
 */
export const jsonBody = (value: unknown): string | undefined =>
  JSON.stringify(value);
