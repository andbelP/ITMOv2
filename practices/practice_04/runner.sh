#!/usr/bin/env bash
set -e

echo "=========================================="
echo " [HOOK] Running AlgoPlace Verification Suite (ITMO Practice 04)"
echo "=========================================="

ALGO_DIR="/home/andbel/Projects/AlgoPlace"

if [ -d "$ALGO_DIR" ]; then
    cd "$ALGO_DIR"
    ./scripts/verify-tests.sh
else
    echo "AlgoPlace repository not found at $ALGO_DIR"
    exit 1
fi
