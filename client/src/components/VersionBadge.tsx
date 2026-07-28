import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "../lib/api";
import { apiRequest } from "../lib/queryClient";

interface HealthResponse {
  status: string;
  version?: string;
  commitSha?: string;
}

/** Small, unobtrusive build identifier shown on every page so a deployed version can be confirmed at a glance. */
export function VersionBadge() {
  const { data } = useQuery({
    queryKey: ["health-version"],
    queryFn: () => apiRequest<HealthResponse>(getApiUrl("/health")),
    staleTime: Infinity,
    retry: false,
  });

  if (!data?.version) return null;

  return (
    <div className="fixed bottom-1 right-2 z-40 select-none pointer-events-none text-[10px] text-muted-foreground/50">
      v{data.version}{data.commitSha ? ` · ${data.commitSha}` : ""}
    </div>
  );
}
