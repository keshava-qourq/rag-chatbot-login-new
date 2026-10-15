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
    expect(screen.getByRole("button", { name: "Show password" })).toHaveAttribute(
      "type",
      "button",
    );
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
});
