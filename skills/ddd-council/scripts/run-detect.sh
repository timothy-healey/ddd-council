#!/usr/bin/env bash
# Resolve and run the bundled ddd-council-detect engine, robustly, from anywhere.
#
# The `critique` verb calls this instead of a bare `node cli/bin/...`, because
# when ddd-council is installed as a plugin the current working directory is the
# *target* repo, not this package — so a CWD-relative path never resolves. This
# script finds the engine relative to its own location (stable inside the plugin
# package), and falls back to ${CLAUDE_PLUGIN_ROOT} if set.
#
# Usage:  run-detect.sh <repo-path> [--json]
# Stdout: the engine's output (JSON when --json). Setup noise goes to stderr.
# Exit:   passes through the engine's exit code (0 clean / 1 findings / 2 error);
#         3 if the engine can't be located or deps can't be installed.
set -euo pipefail

# Directory this script lives in, following symlinks.
src="${BASH_SOURCE[0]}"
while [ -h "$src" ]; do
  dir="$(cd -P "$(dirname "$src")" && pwd)"
  src="$(readlink "$src")"
  [[ "$src" != /* ]] && src="$dir/$src"
done
script_dir="$(cd -P "$(dirname "$src")" && pwd)"

# Candidate plugin roots, most-specific first:
#   1. script-relative: scripts/ -> ddd-council/ -> skills/ -> <plugin root>
#   2. ${CLAUDE_PLUGIN_ROOT} when the harness exported it
cli_dir=""
for root in "$script_dir/../../.." "${CLAUDE_PLUGIN_ROOT:-}"; do
  [ -z "$root" ] && continue
  if [ -f "$root/cli/bin/ddd-council-detect.mjs" ]; then
    cli_dir="$(cd "$root/cli" && pwd)"
    break
  fi
done

if [ -z "$cli_dir" ]; then
  echo "run-detect: could not locate cli/bin/ddd-council-detect.mjs (looked relative to $script_dir and \$CLAUDE_PLUGIN_ROOT)" >&2
  exit 3
fi

# Ensure the engine's deps are present. Prebuilt tree-sitter bindings, so this is
# download-only and one-time; all output to stderr so stdout stays machine-clean.
if [ ! -d "$cli_dir/node_modules/tree-sitter-rust" ]; then
  echo "run-detect: installing engine deps in $cli_dir (one-time)..." >&2
  if ! (cd "$cli_dir" && npm install --no-audit --no-fund) >&2; then
    echo "run-detect: npm install failed; engine unavailable — fall back to manual code reading." >&2
    exit 3
  fi
fi

exec node "$cli_dir/bin/ddd-council-detect.mjs" "$@"
