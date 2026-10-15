import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("App", () => {
  it("renders without crashing and shows the first screen's nav link", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    // getAllByText, not getByText: the first screen's page content may repeat
    // the text its nav link carries, and two matches must not fail the smoke test.
    expect(screen.getAllByText("Sign in or create account").length).toBeGreaterThan(0);
  });
});
