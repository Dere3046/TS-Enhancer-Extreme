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

$TSEEBIN/tseed system rootdetect
check

# Update module.prop status tag
if $TSEEBIN/tseed system ping >/dev/null; then
    $TSEEBIN/tseed system staterefresh
else
    TSEE_MODPROP="$TSEEMODDIR/module.prop"
    if grep -qF "[🔄]" "$TSEE_MODPROP" 2>/dev/null; then
        sed -i 's/\[🔄\]/[完整性校验未通过]/' "$TSEE_MODPROP"
    elif ! grep -qF "[完整性校验未通过]" "$TSEE_MODPROP" 2>/dev/null; then
        sed -i 's/\[.*\]/[完整性校验未通过]/' "$TSEE_MODPROP"
    fi
fi

# Apply cached VerifiedBootHash on boot
$TSEEBIN/tseed system passvbhash

# Clean stale PID from previous session
rm -f "/data/adb/ts_enhancer_extreme/proxy.pid"

invoke "Remove conflicting modules" "system conflictmodcheck"
[ -f "$SD/$D" ] || {
  logp "I" "Copying state script to auto-start dir"
  mkdir -p "$SD"
  cp -f "$TSEEMODDIR/script/state.sh" "$SD/$D"
  chmod +x "$SD/$D"
}