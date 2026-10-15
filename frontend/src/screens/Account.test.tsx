import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const logoutMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("@/lib/navigate", () => ({
  useNavigate: () => navigateMock,
  toPath: (route: string) => `/${route}`,
}));

vi.mock("@/lib/authApi", async () => {
  const actual = await vi.importActual<typeof import("@/lib/authApi")>("@/lib/authApi");
  return {
    ...actual,
    logout: (...args: unknown[]) => logoutMock(...args),
  };
});

import Account from "./Account";

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <Account />
    </QueryClientProvider>,
  );
}

describe("Account - sign out", () => {
  beforeEach(() => {
    logoutMock.mockReset();
    navigateMock.mockReset();
  });

  it("calls POST /auth/logout and navigates to /signin on confirmation", async () => {
    logoutMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderScreen();

    await user.click(screen.getByRole("button", { name: "Sign out" }));
    await user.click(screen.getByRole("button", { name: /sign out now/i }));

    await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("signin"));
  });

  it("still navigates to /signin even if the logout call fails", async () => {
    logoutMock.mockRejectedValue(new Error("network down"));
    const user = userEvent.setup();
    renderScreen();

    await user.click(screen.getByRole("button", { name: "Sign out" }));
    await user.click(screen.getByRole("button", { name: /sign out now/i }));

    await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("signin"));
  });
});
