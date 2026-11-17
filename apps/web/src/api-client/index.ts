import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createApiClient } from "@/api-client/client";

export { ApiError } from "@/api-client/api-error";

/** 서버를 직접 부를 때 (보통은 아래 api 의 queryOptions / mutationOptions 를 쓴다). */
export const apiClient = createApiClient();

/** TanStack Query 연동: api.books.list.queryOptions(), api.books.key() … */
export const api = createTanstackQueryUtils(apiClient);
