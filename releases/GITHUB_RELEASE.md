# Publish a version on GitHub (tag + Release)

Use this when **v1.0.3** (or a new version) is ready: code committed, [releases/v1.0.3-github-release-notes.md](v1.0.3-github-release-notes.md) updated, and optional APK built (e.g. [Sudoku-Ultimatum-1.0.3-multiabi.apk](Sudoku-Ultimatum-1.0.3-multiabi.apk)).

## 1. Commit and push

From the repo root:

```bash
git status
git add -A
git commit -m "Release v1.0.3"
git push origin main
```

Use your real default branch name if it is not `main` (e.g. `master`).

## 2. Create a git tag

Tags should match the version users see (no `v` is fine, but **`v1.0.3`** is a common convention):

```bash
git tag -a v1.0.3 -m "Sudoku Ultimatum v1.0.3"
git push origin v1.0.3
```

To list tags: `git tag -l`. To delete a mistaken tag before pushing: `git tag -d v1.0.3`.

## 3. Create the GitHub Release (web UI)

1. Open the repo on GitHub → **Releases** → **Draft a new release**  
   Or: `https://github.com/<USER>/<REPO>/releases/new`
2. **Choose a tag:** select `v1.0.3` (create from the tag if GitHub offers it).
3. **Release title:** e.g. `Sudoku Ultimatum v1.0.3`
4. **Description:** paste the markdown body from [releases/v1.0.3-github-release-notes.md](v1.0.3-github-release-notes.md) (edit in the text box; GitHub renders markdown).
5. **Attach binaries:** drag-and-drop **Sudoku-Ultimatum-1.0.3-multiabi.apk** (or use **Attach binaries**). Large APKs are OK within GitHub’s per-file limits.
6. Optionally check **Set as the latest release**.
7. **Publish release**.

## 4. Link the README (optional)

In [README.md](../README.md), the **Download** table can point to:

- **Direct file in repo:** `releases/Sudoku-Ultimatum-1.0.3-multiabi.apk` (works for clones).
- **Latest Release asset:** use the URL GitHub shows after publishing (e.g. `https://github.com/USER/REPO/releases/download/v1.0.3/Sudoku-Ultimatum-1.0.3-multiabi.apk`) so users download from the release page.

## 5. GitHub CLI (alternative)

If you use [`gh`](https://cli.github.com/):

```bash
gh release create v1.0.3 \
  --title "Sudoku Ultimatum v1.0.3" \
  --notes-file releases/v1.0.3-github-release-notes.md \
  releases/Sudoku-Ultimatum-1.0.3-multiabi.apk
```

Run from the **repository root** and ensure the APK path exists.

## Large APKs and Git

If the APK is too large for normal GitHub pushes, either:

- **Do not commit** the APK; attach it **only** as a Release asset (`gh release create` or the web UI), or  
- Use **[Git LFS](https://git-lfs.github.com/)** for `releases/*.apk`, then push and tag as usual.
