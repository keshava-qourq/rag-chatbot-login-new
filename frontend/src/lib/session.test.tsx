import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();

vi.mock("@/lib/authApi", async () => {
  const actual = await vi.importActual<typeof import("@/lib/authApi")>("@/lib/authApi");
  return {
    ...actual,
    getSession: (...args: unknown[]) => getSessionMock(...args),
  };
});

import { ApiError } from "@/lib/authApi";
import { ProtectedRoute } from "./session";

function renderGuarded() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/chat"]}>
        <Routes>
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <div>Protected chat screen</div>
              </ProtectedRoute>
            }
          />
          <Route path="/signin" element={<div>Sign in screen</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
  });

  it("renders a loading state while the session check is in flight", async () => {
    let resolve: (value: { email: string }) => void = () => {};
    getSessionMock.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    renderGuarded();

    expect(screen.getByRole("status")).toHaveTextContent(/checking your session/i);
    resolve({ email: "someone@example.com" });
    await waitFor(() => expect(screen.getByText("Protected chat screen")).toBeInTheDocument());
  });

  it("redirects to /signin when the session check returns 401", async () => {
    getSessionMock.mockRejectedValue(new ApiError("unauthorized", 401, { detail: "nope" }));
    renderGuarded();

    expect(await screen.findByText("Sign in screen")).toBeInTheDocument();
    expect(screen.queryByText("Protected chat screen")).not.toBeInTheDocument();
  });

  it("renders the protected screen once the session check succeeds", async () => {
    getSessionMock.mockResolvedValue({ email: "someone@example.com" });
    renderGuarded();

    expect(await screen.findByText("Protected chat screen")).toBeInTheDocument();
  });
});
