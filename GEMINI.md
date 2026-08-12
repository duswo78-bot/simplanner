# Repository & Workflow Rules

## Git and Deployment
- **Source Code**: All application source code must be pushed to `main` or specific feature branches.
- **gh-pages Branch**: The `gh-pages` branch is strictly reserved for the final compiled build output. NEVER merge, commit, or push source code directly into `gh-pages`.
- **Deployment Process**: To deploy the application to GitHub Pages, always use the `npm run deploy` script. This script automatically builds the source code into the `dist` directory and handles pushing to the `gh-pages` branch.
