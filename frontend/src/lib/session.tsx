import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, useLocation } from "react-router-dom";

import { getSession, type SessionResponse } from "@/lib/authApi";

/** The one session query key every screen in the app shares -- sign-in sets
 * it, sign-out clears it, and `ProtectedRoute` reads it. One store, not one
 * per screen, per this task's constraint not to fork a second one. */
export const SESSION_QUERY_KEY = ["session"] as const;

export function useSessionQuery() {
  return useQuery<SessionResponse>({
    queryKey: SESSION_QUERY_KEY,
    queryFn: getSession,
    retry: false,
    staleTime: 60_000,
  });
}

/** Call after a successful sign-in so the next render of any guarded route
 * sees the new session immediately instead of waiting for `staleTime`. */
export function useInvalidateSession(): () => Promise<void> {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
}

/** Call after sign-out so a guarded route re-checks rather than trusting a
 * cached "signed in" result that the cookie clear just invalidated. */
export function useClearSession(): () => void {
  const queryClient = useQueryClient();
  return () => queryClient.removeQueries({ queryKey: SESSION_QUERY_KEY });
}

/**
 * Wraps a protected screen. Renders a brief loading state while the session
 * cookie is checked, then either the screen or a redirect to /signin --
 * never both, so a signed-out visitor never sees a flash of protected
 * content. AC-014.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isLoading, isError } = useSessionQuery();

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[40vh] items-center justify-center p-10 text-sm text-slate-500"
      >
        Checking your session…
      </div>
    );
  }

  if (isError) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
