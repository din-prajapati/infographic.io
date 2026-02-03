import { QueryClient, QueryFunction, MutationCache } from "@tanstack/react-query";

/** Storage key for reload-then-redirect flow (checked in App.tsx on load). */
export const REDIRECT_TO_AUTH_KEY = "redirect_to_auth";

/** On 401, clear auth and redirect to login. Uses reload + flag so redirect runs on next load (avoids being blocked by React/error flow). */
export function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
  const authUrl = `${window.location.origin}/auth`;
  try {
    if (window.self !== window.top) {
      window.top!.location.href = authUrl;
      return;
    }
    localStorage.setItem(REDIRECT_TO_AUTH_KEY, "1");
    window.location.reload();
  } catch {
    localStorage.setItem(REDIRECT_TO_AUTH_KEY, "1");
    window.location.href = authUrl;
  }
}

function handleUnauthorized(): void {
  redirectToLogin();
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    let errorMessage = res.statusText || "Unknown error";
    let isUnauthorized = res.status === 401;

    try {
      const json = JSON.parse(text);
      errorMessage = json.message || json.error || errorMessage;
      if (json.statusCode === 401 || (typeof json.message === "string" && json.message.toLowerCase() === "unauthorized")) {
        isUnauthorized = true;
      }
    } catch {
      if (text) errorMessage = text;
    }

    if (isUnauthorized) {
      handleUnauthorized();
      throw new Error("Unauthorized");
    }
    throw new Error(errorMessage);
  }
}

export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("auth_token");

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
  } catch (fetchError: any) {
    throw fetchError;
  }

  // Redirect immediately on 401 without consuming body (ensures login redirect when not authorized)
  if (res.status === 401) {
    handleUnauthorized();
    // Backup redirect in case first one was blocked (e.g. by React/error handling)
    setTimeout(redirectToLogin, 50);
    throw new Error("Unauthorized");
  }

  await throwIfResNotOk(res);
  const jsonData = await res.json();
  return jsonData;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const token = localStorage.getItem("auth_token");

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      handleUnauthorized();
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

function isUnauthorizedError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message?.toLowerCase() ?? "";
    return msg === "unauthorized" || msg.includes("unauthorized");
  }
  return false;
}

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      if (isUnauthorizedError(error)) redirectToLogin();
    },
  }),
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0, // Always fetch fresh data to see real-time updates
      gcTime: 0, // Disable caching to see real-time updates
      retry: 1, // Retry once on failure for better reliability
    },
    mutations: {
      retry: false,
    },
  },
});
