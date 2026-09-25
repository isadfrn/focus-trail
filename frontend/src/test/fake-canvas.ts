export interface DrawCall {
  method: string;
  args: unknown[];
  state: Record<string, unknown>;
}

export interface FakeContext {
  ctx: CanvasRenderingContext2D;
  calls: DrawCall[];
  callsOf: (method: string) => DrawCall[];
}

export function createFakeContext(
  measure: (text: string) => number = (text) => text.length * 10,
  overrides: Record<string, unknown> = {},
): FakeContext {
  const calls: DrawCall[] = [];
  const state: Record<string, unknown> = { ...overrides };

  const ctx = new Proxy(state, {
    get(_target, property: string) {
      if (property === "measureText") {
        return (text: string) => ({ width: measure(text) });
      }
      if (property in state) return state[property];
      return (...args: unknown[]) => {
        calls.push({ method: property, args, state: { ...state } });
      };
    },
    set(_target, property: string, value) {
      state[property] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;

  return {
    ctx,
    calls,
    callsOf: (method) => calls.filter((call) => call.method === method),
  };
}
