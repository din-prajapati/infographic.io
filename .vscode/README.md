# Workspace editor settings

## Markdown preview still has white tables or code blocks?

1. **Reload Window** — `Ctrl+Shift+P` → `Developer: Reload Window`, then reopen preview.

2. **User settings override** — Open `%APPDATA%\Cursor\User\settings.json` and remove or fix:
   - `"markdown-preview-github-styles.colorTheme": "light"` → use `"system"` or `"auto"`, or delete the line so workspace `.vscode/settings.json` wins.
   - Duplicate `"markdown.styles"` pointing at an old path.

3. **Confirm custom CSS loads** — With `DEPLOYMENT_STRATEGY.md` open in preview, run `Ctrl+Shift+P` → `Developer: Open Webview Developer Tools` and check:
   - `<body class="vscode-dark">` (or `vscode-light`)
   - A link to `markdown-preview.css` in the document
   - `.github-markdown-body` on the content wrapper (if GitHub Markdown extension is installed)

4. **Extension** — "Markdown Preview GitHub Styling" maps `--bgColor-*` to `--vscode-*` in `.vscode/markdown-preview.css` so preview matches **Default Dark Modern** (neutral grey), not GitHub navy (`#0d1117`).
