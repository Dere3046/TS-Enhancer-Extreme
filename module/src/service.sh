#
# This file is part of TS-Enhancer-Extreme.
#
# TS-Enhancer-Extreme is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
#
# TS-Enhancer-Extreme is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
# without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along with TS-Enhancer-Extreme.
# If not, see <https://www.gnu.org/licenses/>.
#
# Copyright (C) 2025 TheGeniusClub (Organization)
# Copyright (C) 2025 XtrLumen (Developer)
#

MODDIR=${0%/*}
cd $MODDIR
source "./script/util_functions.sh"
check

# Integrity check & module.prop status
if ! $TSEEBIN/tseed system ping >/dev/null; then
  TSEE_MODPROP="$TSEEMODDIR/module.prop"
  if grep -qF "[🔄]" "$TSEE_MODPROP" 2>/dev/null; then
    sed -i 's/\[🔄\]/[完整性校验未通过]/' "$TSEE_MODPROP"
    elif ! grep -qF "[完整性校验未通过]" "$TSEE_MODPROP" 2>/dev/null; then
    sed -i 's/\[.*\]/[完整性校验未通过]/' "$TSEE_MODPROP"
  fi
fi

invoke "Update target list" "system packagelistupdate"
invoke "Remove conflicting apps" "system conflictappcheck"
invoke "Spoof bootloader state" "system passpropstate"

# Sync proxy targets after TSEET has started
(sleep 5 && invoke "Sync proxy targets" "service proxy sync") &

# ── TSEET Keep-alive with crash protection ────────────────────
cd $MODDIR
FLAG_FILE="$TSEEMODDIR/.tseet_enabled"
PID_FILE="$TSEECONFIG/proxy.pid"

(
  crashCount=0
  backoff=1

  while [ -f "$FLAG_FILE" ]; do
    logs "I" "Starting TSEET daemon (attempt $((crashCount + 1)))"

    ./daemon start &
    daemonPid=$!
    wait $daemonPid
    exitCode=$?

    # Detect OOM (exit code 137 = SIGKILL, likely OOM)
    if [ $exitCode -eq 137 ]; then
      logs "E" "TSEET killed (exit 137), possible OOM"
      crashCount=$((crashCount + 1))
    elif [ $exitCode -ne 0 ]; then
      logs "W" "TSEET exited with code $exitCode"
      crashCount=$((crashCount + 1))
    else
      logs "I" "TSEET exited normally"
      crashCount=0
      backoff=1
      break
    fi

    # Stop after 5 consecutive crashes to avoid infinite loop
    if [ $crashCount -ge 5 ]; then
      logs "E" "TSEET crashed $crashCount times, giving up"
      rm -f "$PID_FILE"
      break
    fi

    # Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    logs "W" "Restarting TSEET in ${backoff}s"
    sleep $backoff
    backoff=$((backoff * 2))
    if [ $backoff -gt 30 ]; then
      backoff=30
    fi
  done

  logs "I" "TSEET keep-alive stopped"
) &
