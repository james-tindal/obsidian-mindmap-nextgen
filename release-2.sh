#!/bin/bash

set -euo pipefail


if [ "$#" -ne 1 ]; then
  echo "Must provide exactly one argument, the new version number."
  echo ""
  echo "Example usage:"
  echo "./release-2.sh 0.3.0 "
  echo "Exiting."

  exit 1
fi

NEW_VERSION=$1

echo "Pushing tag for version ${NEW_VERSION}"


read -p "Continue? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
  git checkout main
  git fetch
  git pull
  git tag $NEW_VERSION
  git push origin $NEW_VERSION
else
  echo "Exiting."
  exit 1
fi
