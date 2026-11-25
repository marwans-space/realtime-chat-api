import { userSearchResultsSchema } from "../schemas/users";
import type { UserSearchResult } from "../schemas/users";

const API_URL = import.meta.env.VITE_API_URL;

type ApiOptions = RequestInit;

export async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const token = sessionStorage.getItem("access_token");
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      error?.detail || `Request failed with status ${response.status}`,
    );
  }
  if (response.status == 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const searchResults = await apiRequest<unknown>(
    `/users/search?q=${encodeURIComponent(query.trim())}`,
  );
  return userSearchResultsSchema.parse(searchResults);
}
