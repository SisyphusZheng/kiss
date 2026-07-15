const dataStack: { loaderData: unknown; actionData: unknown }[] = [];
export const MAX_DATA_CONTEXT_DEPTH = 50;

export function pushLoaderData(data: unknown): void {
  if (dataStack.length >= MAX_DATA_CONTEXT_DEPTH) {
    throw new Error(
      `Data context stack overflow at depth ${MAX_DATA_CONTEXT_DEPTH} ` +
        '(possible recursive error renderer)',
    );
  }
  dataStack.push({ loaderData: data, actionData: undefined });
}

export function pushActionData(data: unknown): void {
  const top = dataStack[dataStack.length - 1];
  if (top) top.actionData = data;
}

export function popData(): void {
  dataStack.pop();
}

export function currentLoaderData(): unknown {
  return dataStack[dataStack.length - 1]?.loaderData;
}

export function currentActionData(): unknown {
  return dataStack[dataStack.length - 1]?.actionData;
}
