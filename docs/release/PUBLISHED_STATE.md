# Published Version State and Rollback (1.3, 1.4, #855)

## Published state

The npm `alpha` dist-tag and the `v0.41.0-alpha.x` tags are immutable. The
published line advances only via AutoFlow3; each version below is the durable
state after its release run:

| Version           | State     | Evidence                                                     | Degraded event                                 |
| ----------------- | --------- | ------------------------------------------------------------ | ---------------------------------------------- |
| `0.41.0-alpha.14` | published | `docs/release/autoflow3/v0.41.0-alpha.14.json` (`completed`) | none                                           |
| `0.41.0-alpha.15` | published | `docs/release/autoflow3/v0.41.0-alpha.15.json` (`completed`) | Windows starter build failure, tracked by #460 |

Both versions shipped the five npm packages and their `alpha` dist-tags.
`0.41.0-alpha.15`'s degraded finding (#460) was discovered post-publish and is
immutable: the release note documents it and the finding blocks only the
separate stable `0.41.0` decision, not the alpha line.

## Rollback rules

Both published versions are rollback-eligible in one direction only: **state
the new line, never re-point the old one**.

1. **npm**: never unpublish `0.41.0-alpha.14` or `0.41.0-alpha.15`, and never
   reset the `alpha` dist-tag backward. Forward corrections happen by
   publishing the next version and updating `alpha`.
2. **Tags**: the git tags `v0.41.0-alpha.14` and `v0.41.0-alpha.15` are
   immutable; a broken release is superseded by a new tag, never by deleting
   or rewriting an existing one.
3. **Evidence**: a degraded release keeps its completed evidence file; the
   degraded finding lives in the release note (see `0.41.0-alpha.15`, #460).
   Do not rewrite evidence retroactively.
4. **Rollback trigger**: roll back a published line only when the npm package
   itself is unusable (broken imports, missing exports, corrupt tarball).
   Qualification gaps that were found post-publish are handled by the next
   release, as `0.41.0-alpha.15` did with #460.
