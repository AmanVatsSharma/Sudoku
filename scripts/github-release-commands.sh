#!/usr/bin/env bash
# Run from repository root after Git is configured for github.com/AmanVatsSharma/Sudoku
# (SSH key with push access, or HTTPS with credential helper).
set -euo pipefail
cd "$(dirname "$0")/.."
git push origin main
git push origin v1.0.2
echo "Next: GitHub → Releases → Draft a new release → tag v1.0.2"
echo "Paste body from releases/v1.0.2-github-release-notes.md"
echo "Attach: releases/Sudoku-Ultimatum-1.0.2-multiabi.apk (and optional SHA256 file)"
echo "If gh is installed: gh release create v1.0.2 --title v1.0.2 --notes-file releases/v1.0.2-github-release-notes.md releases/Sudoku-Ultimatum-1.0.2-multiabi.apk"
