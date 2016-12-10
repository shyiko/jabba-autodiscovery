#!/usr/bin/env bash

set +o pipefail -e

if [ "$GITHUB_TOKEN" == "" ]; then
  echo "GITHUB_TOKEN must be set"
  exit 1
fi

curl -sL https://raw.githubusercontent.com/shyiko/jabba/master/index.json > index.json
cat index.json | node index.js > updated.index.json

if [ "$(cmp index.json updated.index.json >/dev/null 2>&1; echo $?)" != "0" ]; then

  git config user.email "stanley.shyiko@gmail.com"
  git config user.name "shyiko/jabba-autodiscovery"

  CHECKOUT_DIR=$(mktemp -d /tmp/jabba-autodiscovery.XXXXXX)
  git clone --single-branch --branch=master https://$GITHUB_TOKEN@github.com/shyiko/jabba $CHECKOUT_DIR
  cp updated.index.json $CHECKOUT_DIR/index.json
  TIMESTAMP="$(date +%Y-%m-%d)"
  BRANCH_NAME="autodiscovery/$TIMESTAMP"
  COMMIT_MESSAGE="$TIMESTAMP auto discovery"
  (
    cd $CHECKOUT_DIR &&
    git branch $BRANCH_NAME &&
    git checkout $BRANCH_NAME &&
    git commit -m "$COMMIT_MESSAGE" index.json &&
    git push origin/$BRANCH_NAME
  )

  # submit a PR
  curl -X POST -H "Authorization: token $GITHUB_TOKEN" -H "Content-Type: application/json" -d "{\"title\":\"$COMMIT_MESSAGE\",\"body\":\"\",\"head\":\"$BRANCH_NAME\",\"base\":\"master\"}" https://api.github.com/repos/shyiko/jabba/pulls

fi
