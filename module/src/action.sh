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

cd ${0%/*}
source "./script/util_functions.sh"

[[ "$(getprop persist.sys.locale)" == *"zh"* || "$(getprop ro.product.locale)" == *"zh"* ]] && LOCALE="CN" || LOCALE="EN"

# Integrity check: tseed's own entry verify() guards every command
if $TSEEBIN/tseed -V >/dev/null 2>&1; then
  if [ "$LOCALE" = "CN" ]; then
    echo "[✅] 完整性校验通过"
  else
    echo "[✅] Integrity verification passed"
  fi
else
  if [ "$LOCALE" = "CN" ]; then
    echo "[❌] 完整性校验未通过"
  else
    echo "[❌] Integrity verification failed"
  fi
fi

println() {
  [ "$LOCALE" = "$1" ] && {
    shift
    echo "$@"
  }
}

echo_cn() { println "CN" "$@"; }
echo_en() { println "EN" "$@"; }

# Get proxy state via .tseet_enabled flag
if [ -f "$TSEEMODDIR/.tseet_enabled" ]; then
  echo_cn "[TSEET] Auto Proxy: Enabled"
  echo_en "[TSEET] Auto Proxy: Enabled"
else
  echo_cn "[TSEET] Auto Proxy: Disabled"
  echo_en "[TSEET] Auto Proxy: Disabled"
fi

echo_cn ""
echo_en ""
echo_cn "[TSEET] Closing in 5 seconds..."
echo_en "[TSEET] Closing in 5 seconds..."

sleep 2s
