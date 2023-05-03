#!/bin/bash

set -euo pipefail


if [ ! $(which jq) ]; then
  echo 'You must install jq to use this script'
  exit
fi

if [ "$#" -ne 2 ]; then
    echo "Must provide exactly two arguments."
    echo "First one must be the new version number."
    echo "Second one must be the minimum obsidian version for this release."
    echo ""
    echo "Example usage:"
    echo "./release-1.sh 0.3.0 0.11.13"
    echo "Exiting."

    exit 1
fi

if [[ $(git status --porcelain) ]]; then
  echo "Changes in the git repo."
  echo "Exiting."

  exit 1
fi

NEW_VERSION=$1
MINIMUM_OBSIDIAN_VERSION=$2

echo "Updating to version ${NEW_VERSION} with minimum obsidian version ${MINIMUM_OBSIDIAN_VERSION}"

read -p "Continue? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then

  git checkout main
  git fetch
  git pull
  git checkout -b "ops-upgrade-to-${NEW_VERSION}"

  
  echo "Updating package.json"
  TEMP_FILE=$(mktemp)
  jq ".version |= \"${NEW_VERSION}\"" package.json > "$TEMP_FILE" || exit 1
  mv "$TEMP_FILE" package.json

  echo "Updating manifest.json"
  TEMP_FILE=$(mktemp)
  jq ".version |= \"${NEW_VERSION}\" | .minAppVersion |= \"${MINIMUM_OBSIDIAN_VERSION}\"" manifest.json > "$TEMP_FILE" || exit 1
  mv "$TEMP_FILE" manifest.json

  echo "Updating versions.json"
  TEMP_FILE=$(mktemp)
  jq ". += {\"${NEW_VERSION}\": \"${MINIMUM_OBSIDIAN_VERSION}\"}" versions.json > "$TEMP_FILE" || exit 1
  mv "$TEMP_FILE" versions.json


  git add -A .
  git commit -m "ops: upgrade to version ${NEW_VERSION}"
  git push origin "ops-upgrade-to-${NEW_VERSION}"

  
  echo "After you've merged this branch with main, push the new tag with release-2.sh"
else
  echo "Exiting."
  exit 1
fi
