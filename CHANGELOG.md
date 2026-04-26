# Changelog

All notable changes to KISS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Logger module with `KISS_LOG_LEVEL` environment variable support

## [0.1.6] - 2026-04-26

### Added

- Pure black & white design system with theme toggle
- `/ui` design system showcase page
- Mobile-responsive sidebar with hamburger menu
- CSS `:has()` selector for sidebar toggle (zero JS)

### Changed

- Consolidated page styles (`pageStyles`) — eliminated 840 lines of duplicate CSS
- Removed all `!important` hacks from page styles
- Sidebar now uses slide-in animation with backdrop blur

### Fixed

- Backdrop click now closes sidebar (L2 script)
- Mobile responsive layout improvements

## [0.1.5] - 2026-04-20

### Added

- KISS Architecture documentation (K·I·S·S four constraints)
- DSD (Declarative Shadow DOM) output support
- Jamstack alignment documentation

### Changed

- Rebranded from DIA to KISS Architecture
- Updated README with dual meaning (Philosophy + Architecture)

## [0.1.4] - 2026-04-15

### Added

- `inject` option for custom stylesheets/scripts injection
- API Routes deployment documentation

### Changed

- Marked `ui` option as deprecated (use `inject` instead)

### Fixed

- RPC `call()` now throws `RpcError` instead of returning null

## [0.1.3] - 2026-04-10

### Added

- @kissjs/rpc package with `RpcController`
- @kissjs/ui package with WebAwesome CDN injection

### Fixed

- CORS configuration now configurable via options

## [0.1.2] - 2026-04-05

### Added

- Island transform with AST marking
- SSG post-processing for hydration path rewriting

### Fixed

- Island chunk detection now uses AST instead of regex

## [0.1.1] - 2026-04-01

### Added

- Initial JSR release
- Core `kiss()` Vite plugin
- File-based routing
- Island hydration with lazy loading

---

## Version History

| Version | Date       | Highlights                        |
| ------- | ---------- | --------------------------------- |
| 0.1.6   | 2026-04-26 | Design system + mobile responsive |
| 0.1.5   | 2026-04-20 | KISS Architecture branding        |
| 0.1.4   | 2026-04-15 | `inject` option + API Routes docs |
| 0.1.3   | 2026-04-10 | @kissjs/rpc + @kissjs/ui          |
| 0.1.2   | 2026-04-05 | Island AST transform              |
| 0.1.1   | 2026-04-01 | Initial JSR release               |

---

_KISS — Keep It Simple, Stupid / K·I·S·S Architecture_
