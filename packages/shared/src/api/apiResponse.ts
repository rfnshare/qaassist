import type { ApiErrorBody } from "./apiError.js";

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiFailure = {
  ok: false;
  error: ApiErrorBody;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type ApiErrorResponse = {
  error: ApiErrorBody;
};
