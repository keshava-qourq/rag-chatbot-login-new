import { render, screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signupMock = vi.fn();
const resendVerificationMock = vi.fn();

vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: ({ onSuccess }: { onSuccess: (token: string) => void }) => (
    <button type="button" onClick={() => onSuccess("test-token")}>
      Simulate Turnstile
    </button>
  ),
}));

vi.mock("@/lib/authApi", async () => {
  const actual = await vi.importActual<typeof import("@/lib/authApi")>("@/lib/authApi");
  return {
    ...actual,
    signup: (...args: unknown[]) => signupMock(...args),
    resendVerification: (...args: unknown[]) => resendVerificationMock(...args),
  };
});

import { ApiError } from "@/lib/authApi";

import Signin from "./Signin";

function renderScreen() {
  render(
    <MemoryRouter>
      <Signin />
    </MemoryRouter>,
  );
}

async function goToSignup(user: UserEvent) {
  await user.click(screen.getByRole("tab", { name: "Create account" }));
}

async function passTurnstile(user: UserEvent) {
  await user.click(screen.getByRole("button", { name: "Simulate Turnstile" }));
}

const submitName = /create account and send verification link/i;

describe("Signin - create account tab", () => {
  beforeEach(() => {
    signupMock.mockReset();
    resendVerificationMock.mockReset();
  });

  it("renders the Turnstile widget and blocks submit until a token is present", async () => {
    const user = userEvent.setup();
    renderScreen();
    await goToSignup(user);

    expect(screen.getByRole("button", { name: "Simulate Turnstile" })).toBeInTheDocument();
    const submit = screen.getByRole("button", { name: submitName });
    expect(submit).toBeDisabled();

    await passTurnstile(user);
    expect(submit).not.toBeDisabled();
    expect(signupMock).not.toHaveBeenCalled();
  });

  it("posts email, password and the Turnstile token and shows the verification-required confirmation", async () => {
    signupMock.mockResolvedValue({ email: "new@example.com", status: "pending_verification" });
    const user = userEvent.setup();
    renderScreen();
    await goToSignup(user);

    await user.type(screen.getByLabelText("Email address"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "good-password1");
    await passTurnstile(user);
    await user.click(screen.getByRole("button", { name: submitName }));

    await waitFor(() =>
      expect(signupMock).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "good-password1",
        turnstile_token: "test-token",
      }),
    );
    expect(await screen.findByText("Check your inbox")).toBeInTheDocument();
    expect(screen.getByText("new@example.com")).toBeInTheDocument();
  });

  it("renders the same neutral confirmation when the server rejects an already-registered email", async () => {
    signupMock.mockRejectedValue(new ApiError("conflict", 409, { detail: "already registered" }));
    const user = userEvent.setup();
    renderScreen();
    await goToSignup(user);

    await user.type(screen.getByLabelText("Email address"), "dup@example.com");
    await user.type(screen.getByLabelText("Password"), "good-password1");
    await passTurnstile(user);
    await user.click(screen.getByRole("button", { name: submitName }));

    expect(await screen.findByText("Check your inbox")).toBeInTheDocument();
    expect(screen.queryByText(/already registered/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/already have a/i, { selector: "h2" })).not.toBeInTheDocument();
  });

  it("shows a client-side error for an invalid email and does not call the API", async () => {
    const user = userEvent.setup();
    renderScreen();
    await goToSignup(user);

    await user.type(screen.getByLabelText("Email address"), "not-an-email");
    await user.type(screen.getByLabelText("Password"), "good-password1");
    await passTurnstile(user);
    await user.click(screen.getByRole("button", { name: submitName }));

    expect(await screen.findByText(/doesn.t look like an email address/i)).toBeInTheDocument();
    expect(signupMock).not.toHaveBeenCalled();
  });

  it("shows a client-side error when the password fails the strength rule", async () => {
    const user = userEvent.setup();
    renderScreen();
    await goToSignup(user);

    await user.type(screen.getByLabelText("Email address"), "ok@example.com");
    await user.type(screen.getByLabelText("Password"), "short1");
    await passTurnstile(user);
    await user.click(screen.getByRole("button", { name: submitName }));

    expect(await screen.findByText(/password is too weak/i)).toBeInTheDocument();
    expect(signupMock).not.toHaveBeenCalled();
  });

  it("maps a server 422 field error onto the matching field and does not retry", async () => {
    signupMock.mockRejectedValue(
      new ApiError("bad", 422, {
        detail: [{ loc: ["body", "password"], msg: "Password is too common." }],
      }),
    );
    const user = userEvent.setup();
    renderScreen();
    await goToSignup(user);

    await user.type(screen.getByLabelText("Email address"), "ok@example.com");
    await user.type(screen.getByLabelText("Password"), "good-password1");
    await passTurnstile(user);
    await user.click(screen.getByRole("button", { name: submitName }));

    expect(await screen.findByText("Password is too common.")).toBeInTheDocument();
    expect(signupMock).toHaveBeenCalledTimes(1);
  });
});
