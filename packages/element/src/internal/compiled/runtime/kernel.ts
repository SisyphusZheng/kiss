import type { PartProgram } from '../program.ts';
import {
  claimExistingDom,
  type CompiledProgramInstance,
  type CompiledRuntimeHost,
  createFreshDom,
} from '../runtime.ts';
import { CompiledErrorBoundary, type CompiledErrorBoundaryOptions } from './error-boundary.ts';
import { CompiledContextService } from './context.ts';
import { ElementFormController } from '../../../open-element-form.ts';
import { ElementLifecycle } from '../../../open-element-lifecycle.ts';
import {
  type CompiledStyleRoot,
  CompiledStyleScope,
  themeManager,
} from '../../../open-element-styles.ts';
import type { StyleSheetLike } from '../../../internal/protocol/style-sheet.ts';

export type CompiledRootMode = 'light' | 'open' | 'closed';

export interface CompiledElementKernelOptions extends CompiledRuntimeHost {
  rootMode?: CompiledRootMode;
  /** A previously created closed root may be supplied on re-entry. */
  root?: CompiledStyleRoot;
  delegatesFocus?: boolean;
  styles?: StyleSheetLike | StyleSheetLike[];
  formAssociated?: boolean;
  errorBoundary?: CompiledErrorBoundaryOptions;
}

/**
 * Element-local owner for one compiled Part Program instance. It selects one
 * root, runs claim or fresh creation against that same root, and ties the
 * runtime instance, lifecycle signal, form internals, styles, context
 * consumption, and errors to the element's connect/disconnect boundary.
 */
export class CompiledElementKernel {
  readonly lifecycle = new ElementLifecycle();
  readonly form = new ElementFormController();
  readonly errors: CompiledErrorBoundary;
  readonly context: CompiledContextService;

  #element: HTMLElement;
  #program: PartProgram;
  #options: CompiledElementKernelOptions;
  #styleScope = new CompiledStyleScope();
  #root?: CompiledStyleRoot;
  #instance?: CompiledProgramInstance;
  #active = false;
  #destroyed = false;

  constructor(element: HTMLElement, program: PartProgram, options: CompiledElementKernelOptions) {
    this.#element = element;
    this.#program = program;
    this.#options = options;
    this.errors = new CompiledErrorBoundary(options.errorBoundary);
    this.context = new CompiledContextService(element);
  }

  get element(): HTMLElement {
    return this.#element;
  }

  get program(): PartProgram {
    return this.#program;
  }

  get root(): CompiledStyleRoot | undefined {
    return this.#root;
  }

  get active(): boolean {
    return this.#active;
  }

  connect(): void {
    if (this.#destroyed) throw new Error('[compiled-kernel] kernel is disposed');
    if (this.#active) return;

    if (this.#element.tagName.toLowerCase() !== this.#program.tag) {
      throw new Error(
        `[compiled-kernel] program tag <${this.#program.tag}> does not match ` +
          `<${this.#element.tagName.toLowerCase()}>`,
      );
    }
    this.lifecycle.connect();
    let themeConnected = false;
    try {
      const root = this.#resolveRoot();
      this.#styleScope.connect(root, this.#options.styles);
      themeManager.connect(this.#element);
      themeConnected = true;
      this.form.attach(this.#element, { formAssociated: this.#options.formAssociated });
      const styles = this.#options.styles;
      const styleCount = Array.isArray(styles) ? styles.length : styles ? 1 : 0;
      this.#instance = root.childNodes.length > 0
        ? claimExistingDom(this.#program, this.#options, root, {
          expectStaticStyle: styleCount > 0,
        })
        : createFreshDom(this.#program, this.#options, root);
      this.context.connect();
      if (this.errors.hasError) this.errors.reset();
      this.#active = true;
    } catch (error) {
      try {
        this.context.disconnect();
      } catch {
        // Preserve the original construction/claim error.
      }
      try {
        this.#instance?.dispose();
      } catch {
        // Preserve the original construction/claim error.
      }
      this.#instance = undefined;
      if (themeConnected) themeManager.disconnect(this.#element);
      this.#styleScope.disconnect();
      this.lifecycle.dispose();
      this.errors.capture(error, this.#element);
      throw error;
    }
  }

  disconnect(): void {
    if (!this.#active) return;
    this.#active = false;
    try {
      this.#instance?.dispose();
    } finally {
      this.#instance = undefined;
      this.context.disconnect();
      themeManager.disconnect(this.#element);
      this.#styleScope.disconnect();
      this.lifecycle.dispose();
    }
  }

  adopted(): void {
    if (!this.#active || !this.#root) return;
    this.#styleScope.adopted(this.#root, this.#options.styles);
    themeManager.connect(this.#element);
  }

  dispose(): void {
    if (this.#destroyed) return;
    this.disconnect();
    this.context.dispose();
    this.form.dispose();
    this.errors.dispose();
    this.#destroyed = true;
  }

  #resolveRoot(): CompiledStyleRoot {
    if (this.#root) return this.#root;
    const mode = this.#options.rootMode ?? 'open';
    if (mode === 'light') {
      this.#root = this.#element;
      return this.#root;
    }
    if (this.#options.root) {
      if (!('host' in this.#options.root) || this.#options.root.host !== this.#element) {
        throw new Error('[compiled-kernel] supplied root is not owned by the element');
      }
      this.#root = this.#options.root;
      return this.#root;
    }
    const existing = mode === 'open' ? this.#element.shadowRoot : undefined;
    if (existing) {
      this.#root = existing;
      return existing;
    }
    if (typeof this.#element.attachShadow !== 'function') {
      throw new Error(`[compiled-kernel] ${mode} root requires attachShadow()`);
    }
    this.#root = this.#element.attachShadow({
      mode,
      delegatesFocus: this.#options.delegatesFocus ?? false,
    });
    return this.#root;
  }
}
