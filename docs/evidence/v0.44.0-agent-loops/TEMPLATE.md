# v0.44 Agent Loop Evidence Template

## Dispatch

```yaml
loopId: a0-001
kind: implementation
candidate: 0.44.0-alpha.0
issue: 1160
acceptanceSlice: replace-with-one-observable-slice
baseSha: replace-with-full-sha
branch: v044/1160-replace-slug
risk: critical
ownedPaths: []
forbiddenPaths: []
authority: []
requiredTests: []
requiredCommands: []
maxRepairAttempts: 5
```

### Objective

State one observable outcome.

### Test-first contract

State the expected RED failure and the GREEN condition.

### Output contract

Require the implementer result headings from its agent profile.

## Version closure

```yaml
kind: version-closure
candidate: 0.44.0-alpha.0
candidateSha: replace-with-full-sha
artifactFingerprints: {}
issues: []
freshVerifierRequired: true
verifierRole: release-verifier
verifierEffort: high
requiredCommands: []
```

### Exit-criterion matrix

| Criterion | Observable assertion | Existing evidence | Missing test | Result |
| --------- | -------------------- | ----------------- | ------------ | ------ |
| Replace   | Replace              | Replace           | Replace      | TODO   |

### Verifier write boundary

List exact test, fixture and evidence paths. Production paths are always forbidden.

## Result JSON

```json
{
  "schemaVersion": 1,
  "id": "a0-001",
  "kind": "implementation",
  "candidate": "0.44.0-alpha.0",
  "issue": 1160,
  "baseSha": "full-sha",
  "resultSha": "full-sha",
  "status": "PASS",
  "implementer": {
    "roleProfile": "implementer",
    "executorConfig": "tools/config/v044-roles.json",
    "effort": "high",
    "sessionId": "record-if-available"
  },
  "verifier": null,
  "commands": [
    {
      "command": "deno task test",
      "exitCode": 0
    }
  ],
  "changedFiles": [],
  "evidence": [],
  "residualRisks": [],
  "recordedAt": "ISO-8601"
}
```
