# Contributing

Engineering practices for this project. Both the author and any AI assistants helping with this codebase should follow these conventions.

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) spec: `<type>(<scope>): <short description>`

### Common types

- `feat` — new feature
- `fix` — bug fix
- `chore` — maintenance, config, tooling
- `docs` — documentation only
- `refactor` — code change that isn't a fix or feature
- `test` — adding or updating tests
- `style` — formatting, no logic change

### Examples

- `feat(auth): add JWT middleware for protected routes`
- `fix(prisma): resolve connection timeout on cold start`
- `chore(deps): upgrade express to 5.2.1`
- `docs(readme): add setup instructions and environment variables`
- `refactor(items): extract save logic into dedicated service`
- `test(auth): add unit tests for password hashing`

### Rules

- Keep subject line under 72 characters
- Use imperative mood — "add", not "added" or "adds"
- Lowercase after the colon
- No period at the end

This follows the Conventional Commits spec, which is the most common standard in professional projects.

## Pull Request Description Format

When opening a pull request, use the following format:

```md
## Summary

Briefly explain what this pull request does.

## Changes

- List the main changes made in this PR
- Keep each bullet short and specific
- Focus on what changed, not every tiny implementation detail

## Testing

- Explain how the change was tested
- If no tests were run, explain why
```

### Example

```md
## Summary

Adds a Git workflow practice section to the README.

## Changes

- Documents the engineer workflow
- Documents the reviewer workflow
- Adds cleanup steps after merge

## Testing

- Not run; documentation-only change
```

## Code Comment Guidelines

1. Comment **why**, not just **what**.
2. Use comments only for **non-obvious logic**, not every simple line.
3. Prefer **short comments above a block** instead of line-by-line narration.
4. Keep comments **brief, specific, and direct**.
5. Use comments to explain **flow, intent, business rules, or edge cases**.
6. Avoid comments that simply **repeat the code**.
7. Prefer **clear function and variable names** before adding extra comments.
8. Use comments to explain **important assumptions** and **security-sensitive behavior**.
9. Remove or tighten **temporary learning comments** before finishing the file.
10. Keep comment style **consistent** across the project.
11. Update comments whenever the code changes so they do not go stale.
12. When a section needs too much explanation, consider **extracting a helper function** instead of adding more comments.
