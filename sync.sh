#!/usr/bin/env bash

set +o pipefail -e

if [ "$GITHUB_TOKEN" == "" ]; then
  echo "GITHUB_TOKEN must be set"
  exit 1
fi

curl -sL https://raw.githubusercontent.com/Jabba-Team/jabba/main/index.json > v0.index.json
node src > raw.index.json
node v0.js raw.index.json > updated.v0.index.json

DIFF=$(node sync.diff.js v0.index.json updated.v0.index.json)
if [ "$DIFF" != "" ]; then

  CHECKOUT_DIR=$(mktemp -d /tmp/jabba-autodiscovery.XXXXXX)
  git clone --single-branch --branch=master https://$GITHUB_TOKEN@github.com/Jabba-Team/jabba $CHECKOUT_DIR
  cp updated.v0.index.json $CHECKOUT_DIR/index.json
  TIMESTAMP="$(date +%Y-%m-%d)"
  BRANCH_NAME="autodiscovery/$TIMESTAMP"
  COMMIT_MESSAGE="Synced $DIFF"
  (
    cd $CHECKOUT_DIR &&
    git config user.email "patrick@mccourt.co" &&
    git config user.name "Jabba-Team/jabba-autodiscovery" &&
    git config push.default simple &&
    git branch $BRANCH_NAME &&
    git checkout $BRANCH_NAME &&
    git commit -m "$COMMIT_MESSAGE" index.json
    git push origin $BRANCH_NAME
  )

  # submit a PR
  curl -X POST -H "Authorization: token $GITHUB_TOKEN" -H "Content-Type: application/json" -d "{\"title\":\"$COMMIT_MESSAGE\",\"body\":\"\",\"head\":\"$BRANCH_NAME\",\"base\":\"master\"}" https://api.github.com/repos/shyiko/jabba/pulls

fi
