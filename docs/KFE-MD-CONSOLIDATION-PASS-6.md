# KFE MD Consolidation — Pass 6

**Status:** Working consolidation record

## Purpose

Pass 6 converts the logical architecture from Pass 5 into explicit contract and data-authority mappings before physical folder/module design.

## Scope

- Work — active
- Performance — active
- Admin — active
- Timeline — not part of KFE

## Governing result

Every important business fact must have one authoritative record and one authoritative write path. Other representations are consumers or transport forms only.

## Preserved decisions

- Work remains active even though its historical UI is not authoritative.
- Ride records are captured through the Work application flow and explicitly validated/confirmed before persistence.
- Performance consumes authoritative business results; it does not create competing financial facts.
- Admin manages records through application boundaries; it does not own persistence directly.
- One authoritative local database exists per runtime environment.
- Backup/restore and sync remain behind persistence/application boundaries.
- External providers remain replaceable adapters where external capabilities are required.
- KFE remains reconstructable from authoritative persisted state.
- OCR is permanently excluded from KFE. No OCR engine, OCR provider, OCR extraction pipeline, or OCR-specific contract is part of the architecture.

## Explicit exclusions

No Timeline architecture, module, screen, navigation, data model or future Timeline contract is introduced.

No OCR architecture, provider, extraction engine or OCR fallback is introduced or retained.

No production feature implementation was started.

## Next step

Review the contract/data-authority matrix, then move to physical module/folder boundary design only after the authority assignments are accepted. Do not freeze technology choices merely because a physical layout is being discussed.
