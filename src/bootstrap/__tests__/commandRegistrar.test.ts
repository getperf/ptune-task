import { registerAllCommands } from "../commandRegistrar";
import { Notice, Plugin } from "obsidian";
import { i18n } from "../../shared/i18n/I18n";

type CommandSpec = {
  id: string;
  name: string;
  callback: () => Promise<void> | void;
};

type PluginMock = Pick<Plugin, "addCommand">;

function createPluginMock(commands: CommandSpec[]): PluginMock {
  return {
    addCommand: jest.fn((command: CommandSpec) => {
      commands.push(command);
    }),
  } as unknown as PluginMock;
}

function createContainerMock(statusResult: { authenticated: boolean; email?: string | null }) {
  return {
    createPullTodayCommand: jest.fn(() => ({ execute: jest.fn() })),
    createSyncAndRebuildCommand: jest.fn(() => ({ execute: jest.fn() })),
    createReviewCommand: jest.fn(() => ({ execute: jest.fn() })),
    createAuthLoginProgressService: jest.fn(() => ({
      run: jest.fn((runner: () => Promise<void>) => runner()),
    })),
    createAuthService: jest.fn(() => ({
      status: jest.fn().mockResolvedValue(statusResult),
      login: jest.fn().mockResolvedValue(undefined),
    })),
    createSetupWizardDialog: jest.fn(() => ({ open: jest.fn() })),
  };
}

describe("registerAllCommands auth-status", () => {
  const noticeMock = jest.fn();

  beforeEach(() => {
    noticeMock.mockReset();
    i18n.init("en");
    jest.spyOn(global.console, "warn").mockImplementation(() => {});
    jest.spyOn(global.console, "error").mockImplementation(() => {});
    jest.spyOn(global.console, "log").mockImplementation(() => {});
    jest.spyOn(global.console, "info").mockImplementation(() => {});
    jest.spyOn(global.console, "debug").mockImplementation(() => {});
    jest.spyOn<any, any>(global as any, "setTimeout");
    jest.spyOn(require("obsidian"), "Notice").mockImplementation((message: string) => {
      noticeMock(message);
      return { message } as Notice;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("shows not authenticated notice when auth status is false", async () => {
    const commands: CommandSpec[] = [];
    const plugin = createPluginMock(commands) as unknown as Plugin;
    const container = createContainerMock({
      authenticated: false,
      email: null,
    });

    registerAllCommands(plugin, container as never);

    const command = commands.find((value) => value.id === "auth-status");

    expect(command).toBeDefined();

    await command?.callback();

    expect(noticeMock).toHaveBeenCalledWith("Not authenticated. Please login.");
  });

  test("shows authenticated notice when auth status is true", async () => {
    const commands: CommandSpec[] = [];
    const plugin = createPluginMock(commands) as unknown as Plugin;
    const container = createContainerMock({
      authenticated: true,
      email: "user@example.com",
    });

    registerAllCommands(plugin, container as never);

    const command = commands.find((value) => value.id === "auth-status");

    expect(command).toBeDefined();

    await command?.callback();

    expect(noticeMock).toHaveBeenCalledWith("Authenticated: user@example.com");
  });

  test("shows authenticated notice without unknown fallback when email is missing", async () => {
    const commands: CommandSpec[] = [];
    const plugin = createPluginMock(commands) as unknown as Plugin;
    const container = createContainerMock({
      authenticated: true,
    });

    registerAllCommands(plugin, container as never);

    const command = commands.find((value) => value.id === "auth-status");

    expect(command).toBeDefined();

    await command?.callback();

    expect(noticeMock).toHaveBeenCalledWith("Authenticated");
  });

  test("registers only public commands with localized names", () => {
    const commands: CommandSpec[] = [];
    const plugin = createPluginMock(commands) as unknown as Plugin;
    const container = createContainerMock({
      authenticated: false,
      email: null,
    });

    registerAllCommands(plugin, container as never);

    expect(commands.map((command) => ({ id: command.id, name: command.name }))).toEqual([
      { id: "pull-today", name: "Pull Today" },
      { id: "sync", name: "Push Today" },
      { id: "review", name: "Generate Daily Review" },
      { id: "login", name: "Login" },
      { id: "auth-status", name: "Auth Status" },
      { id: "setup-wizard", name: "Open Setup Wizard" },
    ]);
  });
});
