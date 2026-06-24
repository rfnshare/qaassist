export type ApiErrorCode =
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "INTERNAL_SERVER_ERROR";

export type ApiErrorBody = {
  code: ApiErrorCode;
  message: string;
  requestId: string;
  details?: Record<string, unknown>;
};
