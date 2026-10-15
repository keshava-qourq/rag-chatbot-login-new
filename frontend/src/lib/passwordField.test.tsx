import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PasswordField } from "./passwordField";

function Harness({ id = "pw" }: { id?: string }) {
  return <PasswordField id={id} aria-label="Password" />;
}

describe("PasswordField", () => {
  it("renders masked by default with an eye icon inside the field", () => {
    render(<Harness />);
    const input = screen.getByLabelText("Password") as HTMLInputElement;
    expect(input.type).toBe("password");
    expect(screen.getByRole("button", { name: "Show password" })).toBeInTheDocument();
  });

  it("reveals the password and swaps to the hide icon on click", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText("Password") as HTMLInputElement;
    const toggle = screen.getByRole("button", { name: "Show password" });

    await user.click(toggle);

    expect(input.type).toBe("text");
    expect(screen.getByRole("button", { name: "Hide password" })).toBeInTheDocument();
  });

  it("re-masks the value and restores the show icon on a second click", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText("Password") as HTMLInputElement;

    await user.click(screen.getByRole("button", { name: "Show password" }));
    await user.click(screen.getByRole("button", { name: "Hide password" }));

    expect(input.type).toBe("password");
    expect(screen.getByRole("button", { name: "Show password" })).toBeInTheDocument();
  });

  it("uses type=button so the toggle never submits a form", () => {
    render(<Harness />);
    expect(screen.getByRole("button", { name: "Show password" })).toHaveAttribute("type", "button");
  });

  it("gives each instance independent visibility state", async () => {
    const user = userEvent.setup();
    render(
      <>
        <PasswordField id="pw-a" aria-label="Password A" />
        <PasswordField id="pw-b" aria-label="Password B" />
      </>,
    );

    const inputA = screen.getByLabelText("Password A") as HTMLInputElement;
    const inputB = screen.getByLabelText("Password B") as HTMLInputElement;

    // Click only the toggle belonging to field A.
    await user.click(screen.getAllByRole("button", { name: "Show password" })[0]);

    expect(inputA.type).toBe("text");
    expect(inputB.type).toBe("password");
  });

  // --- US-025-1: keyboard operability and accessible name -----------------

  it("is reachable by Tab from the password field", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText("Password") as HTMLInputElement;
    const toggle = screen.getByRole("button", { name: "Show password" });

    input.focus();
    expect(input).toHaveFocus();
    await user.tab();

    expect(toggle).toHaveFocus();
  });

  it("activates on Enter, toggling visibility identically to a click", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText("Password") as HTMLInputElement;
    const toggle = screen.getByRole("button", { name: "Show password" });

    toggle.focus();
    await user.keyboard("{Enter}");

    expect(input.type).toBe("text");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveFocus();
  });

  it("activates on Space, toggling visibility identically to a click", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText("Password") as HTMLInputElement;
    const toggle = screen.getByRole("button", { name: "Show password" });

    toggle.focus();
    await user.keyboard(" ");

    expect(input.type).toBe("text");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveFocus();
  });

  it("keeps focus on the toggle after activation, and the input stays typeable", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText("Password") as HTMLInputElement;
    const toggle = screen.getByRole("button", { name: "Show password" });

    toggle.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveFocus();

    input.focus();
    await user.type(input, "hunter2");
    expect(input).toHaveFocus();
    expect(input.value).toBe("hunter2");
  });

  it("uses a native button element so Enter/Space come from the platform", () => {
    render(<Harness />);
    const toggle = screen.getByRole("button", { name: "Show password" });
    expect(toggle.tagName).toBe("BUTTON");
  });

  it("exposes the accessible name solely via the control's label, with the glyph aria-hidden", () => {
    render(<Harness />);
    const toggle = screen.getByRole("button", { name: "Show password" });
    const icon = toggle.querySelector("svg");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });
});
