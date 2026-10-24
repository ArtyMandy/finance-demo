#!/usr/bin/env bash
# Runs a command; if it fails, the end of its output becomes an error annotation on the PR.
# Usage: annotate-failure.sh <title> <command...>
set -o pipefail
title=$1
shift
output=$(mktemp)
"$@" 2>&1 | tee "$output" && exit 0
tail -c 30000 "$output" | sed 's/\x1b\[[0-9;]*m//g' |
  awk -v title="$title" 'BEGIN { printf "::error title=%s failed::", title }
    { gsub(/%/, "%25"); printf "%s%%0A", $0 } END { print "" }'
exit 1
