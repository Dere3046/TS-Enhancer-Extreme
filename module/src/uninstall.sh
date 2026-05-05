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

# ── Kill running processes ────────────────────────────────────
pkill -f "TSEET" 2>/dev/null
pkill -f "tseet_cli" 2>/dev/null

# ── Remove module config directory ────────────────────────────
rm -rf /data/adb/ts_enhancer_extreme/

# ── Remove auto-start script ──────────────────────────────────
rm -f /data/adb/service.d/.tsee_state.sh
find /data/adb/service.d -empty -delete 2>/dev/null

# ── Clean tricky_store artifacts ──────────────────────────────
rm -f /data/adb/tricky_store/target.txt
rm -f /data/adb/tricky_store/.app_cache.json
rm -rf /data/adb/tricky_store/config/

# ── Remove action.sh created by TSEE ──────────────────────────
rm -f /data/adb/modules/tricky_store/action.sh

# ── Clean WebUI localStorage (cannot do from shell, documented)
# Users should clear app data of KernelSU Manager manually.
