import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const forgotPasswordMock = vi.fn();
const resetPasswordMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("@/lib/navigate", () => ({
  useNavigate: () => navigateMock,
  toPath: (route: string) => `/${route}`,
}));

vi.mock("@/lib/authApi", async () => {
  const actual = await vi.importActual<typeof import("@/lib/authApi")>("@/lib/authApi");
  return {
    ...actual,
    forgotPassword: (...args: unknown[]) => forgotPasswordMock(...args),
    resetPassword: (...args: unknown[]) => resetPasswordMock(...args),
  };
});

import { ApiError } from "@/lib/authApi";

import ResetPassword from "./ResetPassword";

function renderWithToken(token: string | null) {
  const path = token ? `/reset-password?token=${token}` : "/reset-password";
  render(
    <MemoryRouter initialEntries={[path]}>
      <ResetPassword />
    </MemoryRouter>,
  );
}

describe("ResetPassword - request a link", () => {
  beforeEach(() => {
    forgotPasswordMock.mockReset();
    resetPasswordMock.mockReset();
    navigateMock.mockReset();
  });

  it("calls POST /auth/forgot-password and shows the neutral confirmation for any address", async () => {
    forgotPasswordMock.mockResolvedValue({ message: "ok" });
    const user = userEvent.setup();
    renderWithToken(null);

    await user.type(screen.getByLabelText("Email address"), "someone@example.com");
    await user.click(screen.getByRole("button", { name: /email me a reset link/i }));

    await waitFor(() => expect(forgotPasswordMock).toHaveBeenCalledWith("someone@example.com"));
    expect(await screen.findByText("Check that inbox")).toBeInTheDocument();
  });

  it("renders the same confirmation even when the account does not exist (neutral by construction)", async () => {
    forgotPasswordMock.mockResolvedValue({ message: "ok" });
    const user = userEvent.setup();
    renderWithToken(null);

    await user.type(screen.getByLabelText("Email address"), "unknown@example.com");
    await user.click(screen.getByRole("button", { name: /email me a reset link/i }));

    expect(await screen.findByText("Check that inbox")).toBeInTheDocument();
    expect(screen.getByText("unknown@example.com")).toBeInTheDocument();
  });
});

describe("ResetPassword - set a new password", () => {
  beforeEach(() => {
    forgotPasswordMock.mockReset();
    resetPasswordMock.mockReset();
    navigateMock.mockReset();
  });

  it("reads the token from the URL and shows the set-password form", async () => {
    renderWithToken("good-token");
    expect(await screen.findByText("Choose a new password")).toBeInTheDocument();
  });

  it("enforces the strength rule client-side and never calls the API for a weak password", async () => {
    const user = userEvent.setup();
    renderWithToken("good-token");

    await user.type(screen.getByLabelText("New password"), "short1");
    await user.type(screen.getByLabelText("Type it again"), "short1");
    await user.click(screen.getByRole("button", { name: /save new password/i }));

    expect(await screen.findByText(/use at least 10 characters/i)).toBeInTheDocument();
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it("calls POST /auth/reset-password with the token and new password, then directs to sign in", async () => {
    resetPasswordMock.mockResolvedValue({ message: "ok" });
    const user = userEvent.setup();
    renderWithToken("good-token");

    await user.type(screen.getByLabelText("New password"), "good-password1");
    await user.type(screen.getByLabelText("Type it again"), "good-password1");
    await user.click(screen.getByRole("button", { name: /save new password/i }));

    await waitFor(() =>
      expect(resetPasswordMock).toHaveBeenCalledWith("good-token", "good-password1"),
    );
    expect(await screen.findByText("Your new password is saved")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /go to sign in/i }));
    expect(navigateMock).toHaveBeenCalledWith("signin");
  });

  it("renders the link-no-longer-valid state for an expired or used token, with a request-a-new-link action", async () => {
    resetPasswordMock.mockRejectedValue(new ApiError("expired", 400, { detail: "expired" }));
    const user = userEvent.setup();
    renderWithToken("stale-token");

    await user.type(screen.getByLabelText("New password"), "good-password1");
    await user.type(screen.getByLabelText("Type it again"), "good-password1");
    await user.click(screen.getByRole("button", { name: /save new password/i }));

    expect(await screen.findByText("This link no longer works")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send me a fresh link/i })).toBeInTheDocument();
  });
});
