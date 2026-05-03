#!/usr/bin/env bash
# promote-to-aclocations.sh
#
# Run this script from inside the aclocation/ directory to promote it to its
# own standalone GitHub repository called ACLOCATIONS.
#
# Prerequisites:
#   - git       (https://git-scm.com)
#   - gh        (https://cli.github.com) — authenticated with your GitHub account
#   - netlify   (https://docs.netlify.com/cli/get-started/) — optional, for linking
#
# Usage:
#   cd aclocation
#   chmod +x promote-to-aclocations.sh
#   ./promote-to-aclocations.sh
#
# After the script finishes:
#   1. Go to app.netlify.com → your new ACLOCATIONS site → Identity → Enable Identity
#   2. Sign up at your site URL — the first account becomes master_admin automatically.
#   3. Invite super_admins for each location via the /system/locations/new page.

set -euo pipefail

REPO_NAME="ACLOCATIONS"
DESCRIPTION="ACLOCATIONS — Multi-tenant care coordination platform (Netlify Database + Identity + Functions, no Supabase)"

echo ""
echo "=== ACLOCATIONS promotion script ==="
echo ""

# Ensure we are in the aclocation/ directory (the scaffold root)
if [ ! -f "netlify.toml" ] || [ ! -f "package.json" ]; then
  echo "ERROR: Run this script from inside the aclocation/ directory."
  exit 1
fi

# Ensure gh is available and authenticated
if ! command -v gh &>/dev/null; then
  echo "ERROR: gh CLI not found. Install it from https://cli.github.com and run 'gh auth login'."
  exit 1
fi

if ! gh auth status &>/dev/null; then
  echo "ERROR: gh CLI is not authenticated. Run 'gh auth login' first."
  exit 1
fi

GH_USER=$(gh api /user --jq '.login')
echo "Authenticated as GitHub user: $GH_USER"

# ── Step 1: Create the GitHub repo ───────────────────────────────────────────
echo ""
echo "Step 1: Creating private GitHub repository '$REPO_NAME'..."

if gh repo view "$GH_USER/$REPO_NAME" &>/dev/null 2>&1; then
  echo "  ✓ Repository $GH_USER/$REPO_NAME already exists — skipping creation."
  REPO_URL="https://github.com/$GH_USER/$REPO_NAME"
else
  gh repo create "$REPO_NAME" \
    --private \
    --description "$DESCRIPTION" \
    --source=. \
    --remote=aclocations-origin \
    --push
  REPO_URL="https://github.com/$GH_USER/$REPO_NAME"
  echo "  ✓ Repository created: $REPO_URL"
fi

# ── Step 2: Push if we didn't just create via --source ───────────────────────
# (If the repo already existed, we need to push manually)
if git remote get-url aclocations-origin &>/dev/null 2>&1; then
  echo ""
  echo "Step 2: Pushing scaffold to $REPO_URL..."
  git remote set-url aclocations-origin "https://github.com/$GH_USER/$REPO_NAME.git" 2>/dev/null || true
  git push aclocations-origin HEAD:main
  echo "  ✓ Scaffold pushed."
else
  # Remote was added by --source above; already pushed.
  echo ""
  echo "Step 2: Scaffold already pushed (via --source flag)."
fi

# ── Step 3: Optional Netlify link ────────────────────────────────────────────
echo ""
echo "Step 3: Netlify setup"
if command -v netlify &>/dev/null; then
  echo "  Netlify CLI found. Linking to a new Netlify site..."
  netlify init
  echo ""
  echo "  Provisioning Netlify Database (managed Postgres)..."
  netlify db init
  echo "  ✓ Netlify site linked and database initialised."
else
  echo "  ⚠  Netlify CLI not installed. Complete these steps manually:"
  echo "     1. Go to app.netlify.com → Add new site → Import from Git"
  echo "     2. Connect $REPO_URL"
  echo "     3. Build command: npm run build   Publish dir: dist"
  echo "     4. Site settings → Database → Enable Netlify Database"
fi

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "=== Done! ==="
echo ""
echo "Repository: $REPO_URL"
echo ""
echo "Next steps:"
echo "  1. Enable Netlify Identity on your site:"
echo "     app.netlify.com → your site → Identity → Enable Identity"
echo "  2. Sign up at your site URL — the first user becomes master_admin."
echo "  3. Roll out locations at /system/locations/new."
echo "  4. Set the GITHUB_TEMPLATE_OWNER and GITHUB_TEMPLATE_REPO env vars"
echo "     on your Netlify site to '$GH_USER' and '$REPO_NAME' respectively"
echo "     so the provisioner clones from ACLOCATIONS for each new tenant."
echo ""
