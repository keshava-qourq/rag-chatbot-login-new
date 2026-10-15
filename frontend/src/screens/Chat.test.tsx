import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listConversationsMock = vi.fn();
const createConversationMock = vi.fn();
const navigateMock = vi.fn();
const clearSessionMock = vi.fn();

vi.mock("@/lib/navigate", () => ({
  useNavigate: () => navigateMock,
  toPath: (route: string) => `/${route}`,
}));

vi.mock("@/lib/session", () => ({
  useClearSession: () => clearSessionMock,
}));

vi.mock("@/lib/conversationsApi", async () => {
  const actual = await vi.importActual<typeof import("@/lib/conversationsApi")>(
    "@/lib/conversationsApi",
  );
  return {
    ...actual,
    listConversations: (...args: unknown[]) => listConversationsMock(...args),
    createConversation: (...args: unknown[]) => createConversationMock(...args),
  };
});

import { ApiError } from "@/lib/conversationsApi";
import Chat from "./Chat";

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <Chat />
    </QueryClientProvider>,
  );
}

const CONV_A = { id: "conv-a", title: "Boiler warranty", created_at: "t1", updated_at: "t1" };
const CONV_B = { id: "conv-b", title: null, created_at: "t2", updated_at: "t2" };

describe("Chat sidebar", () => {
  beforeEach(() => {
    listConversationsMock.mockReset();
    createConversationMock.mockReset();
    navigateMock.mockReset();
    clearSessionMock.mockReset();
  });

  it("shows a loading state while conversations are being fetched", async () => {
    let resolve: (value: typeof CONV_A[]) => void = () => {};
    listConversationsMock.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    renderScreen();

    expect(screen.getByRole("status")).toHaveTextContent(/loading conversations/i);
    resolve([CONV_A]);
    await waitFor(() => expect(screen.getByText("Boiler warranty")).toBeInTheDocument());
  });

  it("shows an empty state when there are no conversations", async () => {
    listConversationsMock.mockResolvedValue([]);
    renderScreen();

    expect(await screen.findByText(/no conversations yet/i)).toBeInTheDocument();
  });

  it("renders conversations returned by the API instead of sample data", async () => {
    listConversationsMock.mockResolvedValue([CONV_A, CONV_B]);
    renderScreen();

    expect(await screen.findByText("Boiler warranty")).toBeInTheDocument();
    expect(screen.getByText("New conversation")).toBeInTheDocument();
  });

  it("redirects to /signin on a 401 from GET /conversations", async () => {
    listConversationsMock.mockRejectedValue(new ApiError("unauthorized", 401, {}));
    renderScreen();

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("signin"));
    expect(clearSessionMock).toHaveBeenCalled();
  });

  it("New chat creates a conversation, makes it active, and clears prior messages", async () => {
    listConversationsMock.mockResolvedValue([CONV_A]);
    const newConv = { id: "conv-c", title: null, created_at: "t3", updated_at: "t3" };
    createConversationMock.mockResolvedValue(newConv);
    const user = userEvent.setup();
    renderScreen();

    await screen.findByText("Boiler warranty");
    await user.click(screen.getByRole("button", { name: /new chat/i }));

    await waitFor(() => expect(createConversationMock).toHaveBeenCalledTimes(1));
    expect(await screen.findAllByText("New conversation")).not.toHaveLength(0);
    expect(screen.getByText(/ask a question about your documents/i)).toBeInTheDocument();
  });

  it("redirects to /signin on a 401 from POST /conversations", async () => {
    listConversationsMock.mockResolvedValue([CONV_A]);
    createConversationMock.mockRejectedValue(new ApiError("unauthorized", 401, {}));
    const user = userEvent.setup();
    renderScreen();

    await screen.findByText("Boiler warranty");
    await user.click(screen.getByRole("button", { name: /new chat/i }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("signin"));
  });
});
