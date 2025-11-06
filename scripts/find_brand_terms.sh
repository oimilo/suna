#!/bin/bash

# Find occurrences of legacy brand names

if [ -z "$1" ]; then
  DIR="."
else
  DIR="$1"
fi

grep -RIn --color=always -E "Suna|Kortix" "$DIR" | grep -v "tmp/kortix-suna" | grep -v "node_modules"

