import { render, screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signupMock = vi.fn();
const resendVerificationMock = vi.fn();
const loginMock = vi.fn();

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
    login: (...args: unknown[]) => loginMock(...args),
  };
});

import { ApiError } from "@/lib/authApi";

import Signin from "./Signin";

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Signin />
      </MemoryRouter>
    </QueryClientProvider>,
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
    loginMock.mockReset();
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

describe("Signin - sign in tab", () => {
  beforeEach(() => {
    signupMock.mockReset();
    resendVerificationMock.mockReset();
    loginMock.mockReset();
  });

  it("calls POST /auth/login with the entered credentials and navigates to the returned conversation on success", async () => {
    loginMock.mockResolvedValue({
      email: "ellen@example.com",
      most_recent_conversation_id: "conv-123",
    });
    const user = userEvent.setup();
    renderScreen();

    await user.type(screen.getByLabelText("Email address"), "ellen@example.com");
    await user.type(screen.getByLabelText("Password"), "cold-brew-41");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(loginMock).toHaveBeenCalledWith({
        email: "ellen@example.com",
        password: "cold-brew-41",
        remember: true,
      }),
    );
    expect(await screen.findByText(/signed in as ellen@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/open your most recent conversation/i)).toBeInTheDocument();
  });

  it("offers the empty chat screen when there is no most-recent conversation", async () => {
    loginMock.mockResolvedValue({ email: "new@example.com", most_recent_conversation_id: null });
    const user = userEvent.setup();
    renderScreen();

    await user.type(screen.getByLabelText("Email address"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "whatever-123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText(/start your first conversation/i)).toBeInTheDocument();
  });

  it("renders a generic incorrect-credentials message on a 401 with no field-level hint", async () => {
    loginMock.mockRejectedValue(new ApiError("unauthorized", 401, { detail: "nope" }));
    const user = userEvent.setup();
    renderScreen();

    await user.type(screen.getByLabelText("Email address"), "ellen@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("That email or password is incorrect")).toBeInTheDocument();
    expect(screen.queryByText(/signed in as/i)).not.toBeInTheDocument();
    // No field-level hint about which value was wrong (AC-008).
    expect(screen.queryByText(/enter your password/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Email address")).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Password")).not.toHaveAttribute("aria-invalid", "true");
  });

  it("shows client-side validation and never calls login for an empty form", async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText(/enter the email address you signed up with/i)).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });
});
