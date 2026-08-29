# Timeline Batch 3

Timeline uses the application read-model boundary.

Repository data is projected by `timelineReadModel()` and exposed through `application.getTimeline()`. Vue consumes the resulting event projection and does not query repositories directly.

Scope: Timeline data wiring only. The frozen UI shell and navigation contract remain unchanged.
