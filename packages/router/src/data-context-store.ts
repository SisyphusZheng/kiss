const dataStack: { loaderData: unknown; actionData: unknown }[] = [];

export function pushLoaderData(data: unknown): void {
  dataStack.push({ loaderData: data, actionData: undefined });
  if (dataStack.length > 10) {
    console.warn(
      `[openelement:router] data-context stack depth ${dataStack.length} exceeds expected maximum. ` +
        'This may indicate a missing popData() call.',
    );
  }
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
