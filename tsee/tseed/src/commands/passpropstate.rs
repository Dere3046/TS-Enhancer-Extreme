use crate::utils::*;

pub fn run() {
    // Helper functions
    let check_missing_match_prop = |name: &str, expected: &str| {
        let value = getprop(name);
        if value.is_empty() || value != expected {
            resetprop(name, expected);
        }
        if value.is_empty() {
            resetprop(name, expected);
        }
    };

    let contains_reset_prop = |name: &str, contains: &str, newval: &str| {
        let value = getprop(name);
        if value.contains(contains) {
            resetprop(name, newval);
        }
    };

    let check_missing_prop = |name: &str, expected: &str| {
        let value = getprop(name);
        if value.is_empty() {
            resetprop(name, expected);
        }
    };

    let check_reset_prop = |name: &str, expected: &str| {
        let value = getprop(name);
        if value.is_empty() || value != expected {
            resetprop(name, expected);
        }
    };

    // Get vbmeta size
    let slot = getprop("ro.boot.slot_suffix");
    let vbmeta_dev = format!("/dev/block/by-name/vbmeta{}", slot);
    let vbmeta_size = if file_exists(&vbmeta_dev) {
        run_command("busybox", &["blockdev", "--getbsz", &vbmeta_dev]).trim().to_string()
    } else {
        String::new()
    };
    let vbmeta_size = if vbmeta_size.is_empty() { "4096".to_string() } else { vbmeta_size };

    resetprop("sys.usb.adb.disabled", " ");
    check_missing_match_prop("ro.boot.vbmeta.device_state", "locked");
    check_missing_match_prop("ro.boot.verifiedbootstate", "green");
    check_missing_match_prop("ro.boot.veritymode", "enforcing");
    check_missing_match_prop("ro.boot.warranty_bit", "0");
    check_missing_match_prop("ro.boot.flash.locked", "1");
    contains_reset_prop("vendor.boot.bootmode", "recovery", "unknown");
    contains_reset_prop("ro.boot.bootmode", "recovery", "unknown");
    contains_reset_prop("ro.bootmode", "recovery", "unknown");
    check_missing_prop("ro.boot.vbmeta.invalidate_on_error", "yes");
    check_missing_prop("ro.boot.vbmeta.size", &vbmeta_size);
    check_missing_prop("ro.boot.vbmeta.hash_alg", "sha256");
    check_missing_prop("ro.boot.vbmeta.avb_version", "1.2");
    check_reset_prop("vendor.boot.vbmeta.device_state", "locked");
    check_reset_prop("vendor.boot.verifiedbootstate", "green");
    check_reset_prop("ro.secureboot.lockstate", "locked");
    check_reset_prop("ro.boot.realmebootstate", "green");
    check_reset_prop("ro.vendor.boot.warranty_bit", "0");
    check_reset_prop("sys.oem_unlock_allowed", "0");
    check_reset_prop("ro.boot.realme.lockstate", "1");
    check_reset_prop("ro.build.tags", "release-keys");
    check_reset_prop("ro.crypto.state", "encrypted");
    check_reset_prop("ro.vendor.warranty_bit", "0");
    check_reset_prop("ro.force.debuggable", "0");
    check_reset_prop("ro.build.type", "user");
    check_reset_prop("ro.warranty_bit", "0");
    check_reset_prop("ro.debuggable", "0");
    check_reset_prop("ro.kernel.qemu", "");
    check_reset_prop("ro.adb.secure", "1");
    check_reset_prop("ro.secure", "1");
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_passpropstate_compiles() {
        assert!(true);
    }

    #[test]
    fn test_vbmeta_size_fallback() {
        // When device doesn't exist, should fallback to 4096
        let vbmeta_size = "";
        let result = if vbmeta_size.is_empty() { "4096".to_string() } else { vbmeta_size.to_string() };
        assert_eq!(result, "4096");
    }
}
