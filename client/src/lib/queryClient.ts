import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log(`Fetching data for: ${queryKey[0]}`);
    
    const startTime = Date.now();
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      console.log(`Response status for ${queryKey[0]}: ${res.status}`);

      if (res.status === 401) {
        console.log(`Unauthorized request for: ${queryKey[0]}`);
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        throw new Error(`401: Unauthorized access to ${queryKey[0]}`);
      }

      if (res.status === 403) {
        console.log(`Forbidden request for: ${queryKey[0]}`);
        throw new Error(`403: Forbidden access to ${queryKey[0]}`);
      }

      if (!res.ok) {
        const text = await res.text();
        console.error(`Error response for ${queryKey[0]}: ${text}`);
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }

      const data = await res.json();
      
      console.log(`Data received for: ${queryKey[0]}, time taken: ${Date.now() - startTime}ms`);
      return data;
    } catch (error) {
      console.error(`Error fetching ${queryKey[0]}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 0,
      gcTime: 300000,
      retry: 3,
      
      // Fine-tune loading behavior
      refetchOnMount: true,
      retryDelay: (attemptIndex) => Math.min(1000 * (2 ** attemptIndex), 30000),
    },
    mutations: {
      retry: false,
    },
  },
});
