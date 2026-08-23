# ADR-0139: Provider-neutral attachment scanning and v0.44 qualification

- Status: Accepted
- Date: 2026-08-23
- Supersedes: ADR-0138
- Restores and refines: ADR-0132
- Related: #1070, #984, #997

## Context

ADR-0138 made a successful MetaDefender-backed scan a v0.43.1 release gate.
That coupled the release to commercial credentials or paid container
infrastructure that the project does not own. It also left the scanner Worker
responsible for both the fail-closed attachment lifecycle and one provider's
wire protocol.

Malware scanning is optional deployment hardening. The framework must own the
security state machine, but the application operator must choose, fund, and
operate the engine appropriate to its privacy and compliance requirements.

## Decision

1. v0.43.1 proves the provider-neutral contract, bounded object handling,
   fail-closed behavior, Queue retry, durable DLQ, authenticated replay, and
   audit transitions with deterministic providers.
2. The scanner Worker consumes `MalwareScannerProvider`; MetaDefender Core is
   a maintained reference adapter rather than framework-mandated
   infrastructure.
3. Missing provider configuration remains visible as `not-configured` and
   leaves attachments undownloadable, but does not make v0.43.1 release-red.
4. #1070 moves to v0.44. Its real-engine acceptance requires a ClamAV HTTP
   adapter and Docker Compose qualification, benign plus EICAR evidence, and
   the existing retry → DLQ → authenticated replay journey. MetaDefender may
   also be qualified when credentials are available.
5. Production documentation assigns provider choice, cost, sample-sharing,
   retention, signature updates, and regulatory compliance to the deployer.

## Consequences

- Edge runtimes retain orchestration, authorization, Storage isolation, and
  delivery guarantees; heavyweight signature engines execute outside the
  isolate.
- v0.43.1 no longer depends on a paid third-party account.
- The project makes no positive production-scanning claim until a real
  provider qualification is attached to #1070 in v0.44.
