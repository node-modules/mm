interface QueryResult {
  query: any;
  headers: any;
  cache: any;
}

interface CheckResult {
  a1: any;
  a2: any;
}

interface QueryCallback {
  (err: any, result: QueryResult): void;
}

interface CheckCallback {
  (err: any, result: CheckResult): void;
}

interface SimpleCallback {
  (err: any, result: { result: string }): void;
}

interface MultiValuesCallback {
  (err: any, ...results: any[]): void;
}

export const foo = {
  get(query: any, callback: QueryCallback, headers?: any, cache?: any): void {
    process.nextTick(callback.bind(null, null, {
      query,
      headers,
      cache,
    }));
  },

  check(callback: CheckCallback, a1: any, a2: any): void {
    process.nextTick(callback.bind(null, null, {
      a1,
      a2,
    }));
  },

  query(callback?: SimpleCallback): void {
    if (!callback) return;
    process.nextTick(callback.bind(null, null, {
      result: 'result',
    }));
  },

  getMultiValues(callback: MultiValuesCallback): void {
    process.nextTick(callback.bind(null, null, 'a1', 'a2', 'a3'));
  },

  mirror<T>(input: T): T {
    return input;
  },
};

