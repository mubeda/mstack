# Migration 42: status report

## Background and context

Over the course of the last two sprints the platform group undertook a comprehensive review of the persistence layer, with particular attention to the accumulated schema drift between the primary cluster and its read replicas. The review surfaced a number of long-standing inconsistencies, several of which date back to the original import from the previous vendor, and it was agreed that a consolidated migration would be preferable to a sequence of smaller corrective changes, each of which would have required its own maintenance window and its own round of verification.

It is worth recalling, for readers who were not involved in the earlier phases, that the persistence layer serves both the transactional workload and a set of reporting jobs, and that any change to it therefore has to be evaluated against two quite different usage profiles. The considerations below should be read with that dual role in mind.

## Approaches that were considered

Three alternatives were evaluated before the present approach was selected.

The first alternative was an online schema change using a shadow table, which would have avoided any write pause but which requires roughly double the storage for the duration of the copy and which our current tooling does not support for tables with generated columns.

The second alternative was a blue-green cutover to a freshly provisioned cluster. This offers the cleanest rollback story, but the provisioning lead time and the cost of running two clusters in parallel for a week were judged disproportionate to the size of the change.

The third alternative was to defer the consolidation entirely and to continue with incremental corrections. This was rejected because every further increment adds to the drift that the consolidation is meant to remove.

## Design of the selected approach

The selected approach is a single versioned migration, numbered 42, applied in place during a short write pause. The migration is idempotent, which in the present context is to be understood as meaning that each of its steps first checks whether its effect is already present before doing anything, so that an interrupted run can be started again from the top without harm.

The migration consists of five steps. Step 1 adds the new `contact_email` column. Step 2 copies and normalizes the existing values into it. Step 3, which is the step that most deserves the attention of anyone operating the system, removes the `legacy_email` column once the copy has been verified; it should be noted that this removal is not reversible from within the database and that the column's contents are afterwards available only from a backup. Step 4 rebuilds the two affected indexes. Step 5 updates the schema version marker.

A rollback script accompanies the migration and restores the previous schema from the pre-migration snapshot. The rollback script was not tested on Windows, as the group's Windows runner was unavailable during the test window; on Linux and macOS it was exercised twice without incident.

## Verification

The migration was executed against the staging environment on three occasions. The write pause, measured from the acquisition of the lock to its release, was 40 seconds on the slowest of the three runs. The full test suite was then run against the migrated schema: 3 of 214 tests failed. All three failures are in the reporting module and concern queries that still reference the removed column by name; none of them is in the transactional path.

## Operational notes

The migration is started with the following command, run from the repository root with the staging or production profile active:

```
npm run migrate -- --to 42
```

A backup of the database must be taken before the command is run, for the reason given under step 3 above.

## Conclusion

Taking the above into account, the assessment of the platform group is that migration 42 is ready to be applied to production as soon as the three failing reporting tests have been corrected, and not before; the transactional path is unaffected, the measured write pause is within the agreed limit, and the one irreversible step is covered by the mandatory backup.
