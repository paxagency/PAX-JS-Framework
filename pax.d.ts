declare interface PaxApp {
  data: Record<string, unknown>;
  values?: Record<string, unknown>;
  templates?: Record<string, string>;
  template?: string;
  change?: Record<string, (value: unknown, id?: string, key?: string) => void>;
  load?: Record<string, PaxLoadEntry>;
  filters?: Record<string, (value: unknown) => unknown>;
  depends?: string | string[];
  shared?: boolean;
  root?: string | HTMLElement;
  url?: string;
  init?: (this: PaxApp) => void;
  loaded?: (this: PaxApp) => void;
  ready?: (this: PaxApp) => void;
  destroy?: (this: PaxApp) => void;
  set: (id: string, val: unknown, mode?: unknown) => void;
  push: (id: string, val: unknown, index?: number) => void;
  pop: (id: string, index?: number) => void;
  render: () => void;
  [key: string]: unknown;
}

declare interface PaxLoadEntry {
  url: string;
  query?: Record<string, unknown>;
  error?: (this: PaxApp, err: unknown) => void;
  loaded?: string | ((data: unknown) => void);
  setData?: boolean;
  data?: unknown;
}

declare interface PaxFramework {
  version: string;
  routeHash: number;
  routeFade: number;
  routeMove: number;
  apps: Record<string, PaxApp>;
  config: { debug: boolean };
  el: { routes: string };
  app: (name: string, def?: Partial<PaxApp>) => PaxApp;
  register: (name: string, def?: Partial<PaxApp>) => PaxApp;
  get: (name: string, ref?: number) => PaxApp | null;
  getVals: (key: string, ids: string | string[]) => Record<string, unknown>;
  init: (opts?: unknown) => void;
  link: (path: string) => void;
  print: (o?: unknown) => void;
  log: (s: unknown) => void;
  [key: string]: unknown;
}

declare const pax: PaxFramework;
export default pax;
export { pax };
