# Project conventions

This is a React project for K Sweet Kreations Co.

## Branching strategy

- `main`: stable, tested code suitable for release or deployment.
- `develop`: integration branch for completed development work before release.
- `feature/<descriptive-name>`: development of an individual feature, for example `feature/ordering-system`.
- `test/<descriptive-name>`: dedicated testing or integration work where required, for example `test/integration-testing`.

Start feature and test branches from `develop`. Merge completed, verified work into `develop`, then merge a tested release into `main`. Do not implement features directly on `main`. Use pull requests for review when a remote repository is available.

## Commit conventions

Use concise, meaningful messages in the form `<prefix>: <description>`. Describe the actual change; avoid vague messages such as `changes`, `update`, or `final`.

Allowed prefixes and examples:

- `feat: add product catalogue`
- `fix: correct order validation`
- `test: add quotation engine tests`
- `docs: update project documentation`
- `refactor: improve order service`
- `style: update website layout`

Keep commits focused on one logical change. Run the relevant available checks before merging, and report any checks that could not be run.
