# ADR-0148: Separate the Compiler Semantic Core from Vite Integration

- Status: ACCEPTED (2026-08-30, maintainer directive)
- Date: 2026-08-30
- Amends: ADR-0143 section 8, “The compiler is mandatory but not a new public
  product package”
- Preserves: the mandatory compiled path, the versioned Part Program, Vite as the
  only supported build implementation, the five-package public boundary and the
  absence of a public compiler package

## Context

ADR-0143 assigns compiler integration, module splitting, HMR, source maps and
manifests to the official Vite adapter. The alpha.0 proof consequently placed the
compiler seed and its Vite plugin below the same private adapter directory. That
placement established product ownership, but it did not decide whether the semantic
compiler itself may depend on Vite.

Those are different decisions. Vite is the supported build product, while parsing an
OpenElement class, validating its decorators and TSX, assigning Part and Region
identity and lowering the result into a deterministic Part Program are framework
semantics. If those semantics can observe Vite hooks, plugin context, module-graph
state or HMR state, then:

- identical source may compile differently outside a particular plugin lifecycle;
- semantic compiler tests require a running or mocked Vite environment;
- diagnostics, source identity and cache behavior become adapter behavior;
- the Part Program can accidentally acquire delivery-specific fields; and
- a future adapter must either reproduce Vite or rewrite the language semantics.

The alpha.0 seed already points in the desired direction by keeping its Vite plugin
thin, but an incidental file split is not an architecture boundary. The dependency
direction must be explicit and mechanically enforced before the compiler and Part
Program expand during the Alpha train.

## Decision

### 1. Compiler ownership and compiler dependency are separate

`@openelement/adapter-vite` remains the supported product composition root through
which compilation is delivered. It owns compiler integration, not OpenElement
language semantics. Inside that private implementation boundary, compilation has two
layers:

```text
Vite hooks, module graph, HMR, chunks, manifests
                       |
                       v
          Vite compiler integration shell
                       |
                       v
       bundler-neutral compiler semantic core
                       |
                       v
 Part Program + module metadata + diagnostics + source mappings
                       |
                       v
       generated-artifact boundary consumed by runtime
```

The dependency is one-way: Vite integration may depend on the compiler semantic core;
the compiler semantic core must not depend on Vite integration.

Physical placement does not create a public package boundary. The core may remain in a
clearly isolated private subtree of `@openelement/adapter-vite` or move to an
unpublished private workspace module when that improves enforcement. In either case it
has no package export, independent version or consumer compatibility promise.

### 2. The semantic core owns language meaning

The compiler semantic core owns:

- recognizing an `OpenElement` class and supported standard decorators;
- parsing and validating the supported TSX and class grammar;
- assigning deterministic element, Part and Region identity;
- lowering static structure and typed mutation instructions into the Part Program;
- producing generated module content and per-module element/activation metadata;
- producing source-located diagnostic facts and compiler diagnostic codes;
- producing the source-span mapping data needed to compose final source maps; and
- producing deterministic semantic identities or fingerprints for its own outputs.

Core inputs are explicit: source text or compiler AST, canonical source identity,
compiler options, schema/runtime ABI version and any declared capability inputs. If
cross-module lookup becomes necessary, it is supplied through a minimal
bundler-neutral host port. That port may resolve or read declared inputs, but it must
not expose a Vite plugin context, Rollup context, dev server or module graph.

For the same canonical inputs and compiler version, the core must produce the same
semantic output and diagnostic set. It must not read ambient time, process working
directory, environment variables, network state, Vite configuration or mutable global
build state as hidden semantic inputs.

The core may depend on TypeScript compiler APIs and private OpenElement
compiler-domain modules that obey this ADR. It must not import or structurally accept:

- `vite`, Vite plugin types or Vite configuration;
- Rollup plugin types, hooks or plugin context;
- virtual-module conventions or Vite-specific module identifiers;
- HMR clients, dev-server state or Vite's module graph; or
- adapter routing, SSG, Nitro, Hono or deployment implementation.

### 3. The Vite shell owns build integration

The Vite integration shell owns:

- plugin registration, module filtering and transform-hook scheduling;
- translating resolved Vite module identity into canonical compiler inputs;
- Vite/Rollup resolution and module-graph interaction;
- virtual modules and generated-entry wiring;
- incremental cache storage and invalidation;
- HMR acceptance, invalidation and full-reload policy;
- chunking, island activation-module delivery and module splitting;
- composing compiler mappings with upstream and downstream source maps;
- aggregating compiler metadata into build and delivery manifests; and
- presenting core diagnostics through Vite's reporting interfaces.

The shell may optimize how and when the core runs, but it may not redefine decorator,
TSX, Part, Region, claim or signal semantics. An integration optimization that changes
the core's semantic result for identical canonical inputs is a compiler defect.

Vite-specific delivery data belongs in a companion build or delivery manifest. It
must not be inserted into the Part Program merely because the official adapter needs
it.

### 4. The Part Program is an artifact protocol, not a private code import

The compiler and `@openelement/element` runtime meet at the deterministic, serializable
and versioned Part Program artifact. They do not meet through compiler objects, AST
nodes, Vite state or a private cross-package TypeScript import.

- The compiler emits a declared Part Program schema version.
- The runtime validates or decodes that version and fails closed on unsupported or
  malformed instructions.
- The conformance corpus and deterministic serialized fixtures are the cross-package
  authority during Alpha.
- Compiler and runtime implementations must agree on semantics even when their private
  TypeScript representations differ.
- Part Program data contains no functions, AST nodes, plugin contexts, absolute
  workspace paths or bundler-specific objects.

The final Part Program v1 encoding remains owned by the Alpha compiler work. This ADR
freezes its architectural boundary, not its currently provisional field names.

`@openelement/app`, Island delivery code and generated browser modules consume only
declared generated artifacts. They do not import the semantic core or reach through it
to compiler state. Likewise, the Element runtime does not compile source and does not
import the compiler.

### 5. Bundler-neutral does not mean multi-bundler support

Vite remains the only supported development and build implementation for v0.44. This
decision does not add support for Rollup as a direct consumer, webpack, esbuild,
Rspack, a standalone compiler CLI or runtime compilation.

No generic `BundlerAdapter` abstraction is introduced in anticipation of hypothetical
consumers. A second official build integration still requires real consumer evidence
and a separate package-boundary decision. If that happens, it may reuse the private
semantic core without changing OpenElement language or Part Program semantics.

The compiler core is not exported from `@openelement/adapter-vite`, and this ADR does
not create `@openelement/compiler`. Publishing such a package requires an independent
consumer, a supported API and lifecycle contract, and a later ADR.

### 6. The boundary is verified, not inferred from filenames

Alpha and later gates must prove all of the following:

1. A compiler fixture can call the semantic core directly without constructing a Vite
   plugin, plugin context, dev server or module graph.
2. A forbidden-import check prevents the core subtree from importing Vite, Rollup or
   adapter-integration modules.
3. Repeated compilation of canonical inputs produces byte-stable Part Program and
   metadata fixtures, plus stable diagnostic codes and source locations.
4. Separate Vite integration tests cover transform scheduling, source-map composition,
   HMR invalidation, virtual modules, splitting and manifest aggregation.
5. Cross-package fixtures emitted by the compiler pass server serialization, fresh DOM
   creation and existing-DOM claim in the Element implementation.
6. Generated browser and deployment-runtime artifacts contain no TypeScript compiler,
   Vite plugin or semantic compiler implementation. That machinery exists only on the
   build-host side of the adapter.

A test that exercises only the Vite plugin is not sufficient compiler-core evidence.
A test that exercises only the core is not sufficient Vite integration evidence.

## Migration

- The alpha.0 paths are an authoritative behavioral seed, not a permanent module
  topology.
- Alpha.1 isolates the semantic core behind an internal input/result boundary before
  expanding Part Program v1 and production code generation.
- Vite hook use, diagnostic presentation, cache storage, HMR and manifest aggregation
  stay or move into the integration shell without changing compiler semantics.
- The Alpha collaboration fixture remains the compiler/runtime exchange artifact; no
  temporary private cross-package import is added to make migration easier.
- Alpha.8 verifies the direct-core, Vite-integration and runtime-consumer layers both
  separately and through the complete compiled application path.

Because all affected modules are private and v0.44 is still in its internal Alpha
train, this separation carries no public compatibility shim.

## Consequences

- The supported product remains simple for users: Vite invokes the mandatory compiler
  through `@openelement/adapter-vite`.
- Compiler semantics become deterministic and testable without a build-tool lifecycle.
- Vite retains full control of its own performance, HMR and delivery integration rather
  than being forced through a premature generic bundler abstraction.
- Part Program and element metadata cannot silently accumulate Vite-specific state.
- A future build integration is architecturally possible, but not promised or treated
  as supported before evidence exists.
- The implementation gains one explicit internal handoff and separate test suites;
  this is accepted in exchange for enforceable ownership and dependency direction.

## Rejected alternatives

- **Treat the Vite plugin as the compiler core:** this conflates language semantics
  with one plugin lifecycle and makes determinism dependent on adapter state.
- **Publish `@openelement/compiler` now:** there is no independent supported consumer,
  and publishing would prematurely freeze parser, host, diagnostic and artifact APIs.
- **Invent a generic bundler abstraction:** a speculative lowest-common-denominator
  interface would be another public or quasi-public framework without evidence.
- **Let the runtime import compiler internals:** this ships build machinery into the
  execution model and violates the generated-artifact boundary.
- **Share private compiler/runtime TypeScript types across packages:** this replaces a
  versioned data protocol with workspace topology and prevents packed-artifact
  conformance from proving the real boundary.

## Verification

The v0.44 line may not treat the compiler architecture as complete until the direct
core suite, forbidden-import gate, deterministic artifact corpus, Vite integration
suite and compiler-to-runtime conformance path all pass. Any need for the semantic core
to receive a Vite or Rollup object is an architecture failure and requires this ADR to
be amended rather than hidden behind a type alias or wrapper.
