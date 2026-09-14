# KFE MD Consolidation — Pass 7

**Status:** Working consolidation record

## Purpose

Pass 7 translates logical ownership and data authority into a proposed physical module boundary before implementation.

## Scope

- Work — active
- Performance — active
- Admin — active
- Timeline — permanently outside current product scope
- OCR — permanently excluded

## Governing result

Physical folders/modules must express existing responsibility ownership. They must not create parallel owners, databases, repositories, calculation engines, forms or persistence paths.

## Key decisions carried forward

- One authoritative local database per runtime environment.
- One repository/persistence path for each authoritative responsibility.
- Domain owns business meaning and calculations.
- Application owns orchestration and use cases.
- Presentation owns UI state and interaction.
- Infrastructure owns replaceable platform/external adapters only.
- Work remains active; old Work UI is not restored.
- Performance remains an interpretation/reporting surface.
- Admin remains a management surface.
- OCR has no place in the architecture.
- Timeline has no place in the architecture.

## Important guardrail

A proposed folder is not automatically an implementation requirement. The physical structure remains subject to review against the one-owner rule before any production code is created.

## Next step

Review physical boundaries and resolve remaining module-ownership questions before implementation planning proceeds.
