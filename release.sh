#!/bin/bash

set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: ./release.sh VERSION MIN_OBSIDIAN_VERSION" >&2
  exit 1
fi

command -v jq >/dev/null
command -v gh >/dev/null

if [[ $(git status --porcelain) ]]; then
  echo "The working tree must be clean." >&2
  exit 1
fi

NEW_VERSION=$1
MINIMUM_OBSIDIAN_VERSION=$2

git check-ref-format "refs/tags/$NEW_VERSION"
gh auth status

echo "Release ${NEW_VERSION} with minimum Obsidian version ${MINIMUM_OBSIDIAN_VERSION}"
read -p "Continue? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit 1
fi

git fetch origin main --tags
if git show-ref --verify --quiet "refs/tags/$NEW_VERSION"; then
  echo "Tag ${NEW_VERSION} already exists." >&2
  exit 1
fi
git checkout -b "ops-upgrade-to-${NEW_VERSION}" origin/main

for FILE in package.json manifest.json versions.json; do
  TEMP_FILE=$(mktemp)
  case "$FILE" in
    package.json)
      jq --arg version "$NEW_VERSION" '.version = $version' "$FILE" > "$TEMP_FILE"
      ;;
    manifest.json)
      jq --arg version "$NEW_VERSION" --arg minimum "$MINIMUM_OBSIDIAN_VERSION" \
        '.version = $version | .minAppVersion = $minimum' "$FILE" > "$TEMP_FILE"
      ;;
    versions.json)
      jq --arg version "$NEW_VERSION" --arg minimum "$MINIMUM_OBSIDIAN_VERSION" \
        '.[$version] = $minimum' "$FILE" > "$TEMP_FILE"
      ;;
  esac
  mv "$TEMP_FILE" "$FILE"
done

git add package.json manifest.json versions.json
git commit -m "ops: upgrade to version ${NEW_VERSION}"
git push -u origin "ops-upgrade-to-${NEW_VERSION}"

REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
PR=$(gh pr create --repo "$REPO" --base main --head "ops-upgrade-to-${NEW_VERSION}" \
  --title "ops: upgrade to version ${NEW_VERSION}" --body "Release ${NEW_VERSION}.")
gh pr merge "$PR" --repo "$REPO" --rebase --match-head-commit "$(git rev-parse HEAD)"
MERGED_COMMIT=$(gh pr view "$PR" --repo "$REPO" --json mergeCommit --jq '.mergeCommit.oid')
if [[ -z "$MERGED_COMMIT" || "$MERGED_COMMIT" == null ]]; then
  echo "The PR has no merged commit. No release tag was created." >&2
  exit 1
fi

git fetch origin main
git tag "$NEW_VERSION" "$MERGED_COMMIT"
git push origin "refs/tags/$NEW_VERSION"
