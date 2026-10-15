import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const verifyEmailMock = vi.fn();
const resendVerificationMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("@/lib/navigate", () => ({
  useNavigate: () => navigateMock,
  toPath: (route: string) => `/${route}`,
}));

vi.mock("@/lib/authApi", async () => {
  const actual = await vi.importActual<typeof import("@/lib/authApi")>("@/lib/authApi");
  return {
    ...actual,
    verifyEmail: (...args: unknown[]) => verifyEmailMock(...args),
    resendVerification: (...args: unknown[]) => resendVerificationMock(...args),
  };
});

import VerifyEmail from "./VerifyEmail";

function renderWithToken(token: string | null) {
  const path = token ? `/verify-email?token=${token}` : "/verify-email";
  render(
    <MemoryRouter initialEntries={[path]}>
      <VerifyEmail />
    </MemoryRouter>,
  );
}

describe("VerifyEmail", () => {
  beforeEach(() => {
    verifyEmailMock.mockReset();
    resendVerificationMock.mockReset();
    navigateMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reads the token from the URL, calls verify, shows the verified state and routes to the library", async () => {
    vi.useFakeTimers();
    verifyEmailMock.mockResolvedValue({ email: "verified@example.com", status: "verified" });
    renderWithToken("good-token");

    await vi.waitFor(() => expect(verifyEmailMock).toHaveBeenCalledWith("good-token"));
    await vi.waitFor(() => expect(screen.getByText("Your email is verified")).toBeInTheDocument());

    vi.advanceTimersByTime(1200);

    expect(navigateMock).toHaveBeenCalledWith("library");
  });

  it("renders the expired explanation for an invalid token and resends a new link", async () => {
    verifyEmailMock.mockRejectedValue(new Error("expired"));
    resendVerificationMock.mockResolvedValue({ status: "sent" });
    const user = userEvent.setup();
    renderWithToken("stale-token");

    expect(await screen.findByText("That link has passed its hour")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/where should we send the link/i), "me@example.com");
    await user.click(screen.getByRole("button", { name: /save and send the link/i }));

    await waitFor(() => expect(resendVerificationMock).toHaveBeenCalledWith("me@example.com"));
    expect(await screen.findByText("Check your inbox")).toBeInTheDocument();
  });

  it("with no token present, shows the expired state with the address form open", async () => {
    renderWithToken(null);

    expect(verifyEmailMock).not.toHaveBeenCalled();
    expect(await screen.findByText("That link has passed its hour")).toBeInTheDocument();
    expect(screen.getByLabelText(/where should we send the link/i)).toBeInTheDocument();
  });
});
