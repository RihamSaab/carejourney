export type ApiErrorShape = {
  code: string;
  title: string;
  detail: string;
  status: number;
};

export class ApiError extends Error implements ApiErrorShape {
  code: string;
  title: string;
  detail: string;
  status: number;

  constructor({ code, title, detail, status }: ApiErrorShape) {
    super(detail);
    this.name = 'ApiError';
    this.code = code;
    this.title = title;
    this.detail = detail;
    this.status = status;
  }
}

type ProblemJson = {
  type?: string;
  title?: string;
  status?: number;
  detail?: unknown;
};

type FieldIssue = {
  loc?: unknown;
  msg?: string;
  type?: string;
};

const codeFromProblemType = (problemType: string | undefined): string => {
  if (!problemType) return 'unknown_error';
  const hashIndex = problemType.lastIndexOf('#');
  if (hashIndex === -1) return 'unknown_error';
  return problemType.slice(hashIndex + 1);
};

const fieldName = (loc: unknown): string | null => {
  if (!Array.isArray(loc) || loc.length === 0) return null;
  const parts = loc.filter((p) => p !== 'body' && p !== 'query' && p !== 'path');
  if (parts.length === 0) return null;
  return parts.map((p) => String(p)).join('.');
};

const flattenDetail = (detail: unknown, fallback: string): string => {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const issue = item as FieldIssue;
          const name = fieldName(issue.loc);
          const msg = issue.msg ?? 'Invalid value';
          return name ? `${name}: ${msg}` : msg;
        }
        return null;
      })
      .filter((m): m is string => Boolean(m));
    if (messages.length > 0) return messages.join('; ');
  }
  return fallback;
};

export const parseApiError = (
  data: unknown,
  fallbackStatus: number,
  fallbackDetail: string,
): ApiError => {
  if (typeof data === 'object' && data !== null) {
    const problem = data as ProblemJson;
    return new ApiError({
      code: codeFromProblemType(problem.type),
      title: problem.title ?? 'Error',
      detail: flattenDetail(problem.detail, fallbackDetail),
      status: problem.status ?? fallbackStatus,
    });
  }
  return new ApiError({
    code: 'unknown_error',
    title: 'Error',
    detail: fallbackDetail,
    status: fallbackStatus,
  });
};
