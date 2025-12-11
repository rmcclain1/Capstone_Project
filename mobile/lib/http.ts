// mobile/lib/http.ts
// Re-use the shared axios instance from api.ts so that
// all requests share the same baseURL + interceptors + token logic.

import { api } from './api';

export const http = api;
export default api;
