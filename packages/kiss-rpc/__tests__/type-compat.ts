/**
 * Type compatibility test — drift detection for local ReactiveElement interface.
 *
 * This test asserts that the local ReactiveElement interface in src/index.ts
 * is a structural subset of Lit's official ReactiveControllerHost.
 * If Lit adds required methods to ReactiveControllerHost, this test will
 * fail at compile time, alerting us to update the local interface.
 *
 * Run: deno check packages/kiss-rpc/__tests__/type-compat.ts
 */

import type { ReactiveControllerHost, ReactiveController as LitReactiveController } from 'lit';

// Local interface mirrors (must stay in sync with src/index.ts)
interface ReactiveController {
  hostConnected?(): void;
  hostDisconnected?(): void;
}

interface ReactiveElement {
  addController(controller: ReactiveController): void;
  removeController(controller: ReactiveController): void;
  requestUpdate(): void;
}

// --- Compile-time assertions ---

// 1. Local ReactiveElement must be assignable to Lit's ReactiveControllerHost.
//    If this fails, Lit added required methods we don't have locally.
const _hostCompat: ReactiveControllerHost = null as unknown as ReactiveElement;

// 2. Local ReactiveController must be assignable to Lit's ReactiveController.
//    If this fails, Lit added required lifecycle methods we don't have locally.
const _controllerCompat: LitReactiveController = null as unknown as ReactiveController;

// This test has no runtime assertions — it's purely compile-time.
Deno.test('RPC type compatibility — local interfaces match Lit subset', () => {
  // If we reach here, the compile-time assertions above passed.
  console.log('✅ Local ReactiveElement/ReactiveController are structural subsets of Lit types');
});
