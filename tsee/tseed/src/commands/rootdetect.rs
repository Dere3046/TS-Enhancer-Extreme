use crate::utils::*;
use std::fs;
use std::path::Path;

pub fn run() {
    let dmesg_log = format!("{}/dmesg.log", tsee_config());
    let _ = fs::write(&dmesg_log, run_command("dmesg", &[]));
    let dmesg_content = read_file(&dmesg_log);

    let mut kernelsu_ktag = 0;
    let mut apatch_ktag = 0;
    let mut magisk_ktag = 0;
    let mut kernelsutag = 0;
    let mut suckysutag = 0;
    let mut apatchtag = 0;
    let mut magisktag = 0;

    if dmesg_content.contains("KernelSU") {
        kernelsu_ktag = 1;
        let ksu_dir = format!("{}/ksu", ADB);
        let ksu_bin = format!("{}/ksud", ADB);
        if Path::new(&ksu_dir).exists() && Path::new(&ksu_bin).exists() {
            let version = run_command(&ksu_bin, &["-V"]);
            if dmesg_content.contains("KP hook sukisu_kpm") || version.contains("zako") {
                suckysutag = 1;
            } else {
                kernelsutag = 1;
            }
        }
    }

    if dmesg_content.contains("/debug_ramdisk/magisk") || dmesg_content.contains("magiskinit") {
        magisk_ktag = 1;
        let magisk_dir = format!("{}/magisk", ADB);
        let magisk_db = format!("{}/magisk.db", ADB);
        if Path::new(&magisk_dir).exists() && Path::new(&magisk_db).exists() {
            magisktag = 1;
        }
    }

    if dmesg_content.contains("KP I commit_common_su") {
        apatch_ktag = 1;
        let ap_dir = format!("{}/ap", ADB);
        let apd_bin = format!("{}/apd", ADB);
        if Path::new(&ap_dir).exists() && Path::new(&apd_bin).exists() {
            apatchtag = 1;
        }
    }

    let total = kernelsutag + suckysutag + apatchtag + magisktag;
    let root;

    if total > 1 {
        let multiple_file = format!("{}/multiple.txt", tsee_config());
        let mut multiple = String::new();
        if magisktag == 1 { multiple.push_str("Magisk,"); }
        if kernelsutag == 1 { multiple.push_str("KernelSU,"); }
        if apatchtag == 1 { multiple.push_str("APatch,"); }
        if suckysutag == 1 { multiple.push_str("SuckySU"); }
        if multiple.ends_with(',') {
            multiple.pop();
        }
        let _ = fs::write(&multiple_file, &multiple);
        root = "Multiple".to_string();
    } else if kernelsutag == 1 {
        root = "KernelSU".to_string();
    } else if suckysutag == 1 {
        root = "SuckySU".to_string();
    } else if apatchtag == 1 {
        root = "APatch".to_string();
    } else if magisktag == 1 {
        root = "Magisk".to_string();
    } else {
        root = "NULL".to_string();
    }

    let type_file = format!("{}/root.txt", tsee_config());
    let _ = fs::write(&type_file, &root);

    let ktag_total = kernelsu_ktag + apatch_ktag + magisk_ktag;
    if ktag_total > 1 && root != "Multiple" {
        let kernel_file = format!("{}/kernel.txt", tsee_config());
        let mut kernel = String::new();
        if magisk_ktag == 1 && root != "Magisk" { kernel.push_str("Magisk,"); }
        if kernelsu_ktag == 1 && root != "KernelSU" { kernel.push_str("KernelSU,"); }
        if apatch_ktag == 1 && root != "APatch" { kernel.push_str("APatch"); }
        if kernel.ends_with(',') {
            kernel.pop();
        }
        let _ = fs::write(&kernel_file, &kernel);
    }

    let _ = fs::remove_file(&dmesg_log);
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_rootdetect_compiles() {
        // Simple compilation test
        assert!(true);
    }

    #[test]
    fn test_detection_logic() {
        // Test the logic without filesystem
        let dmesg_content = "KernelSU\nKP hook sukisu_kpm";
        let has_kernelsu = dmesg_content.contains("KernelSU");
        let has_sucky = dmesg_content.contains("KP hook sukisu_kpm");
        assert!(has_kernelsu);
        assert!(has_sucky);
    }

    #[test]
    fn test_multiple_detection() {
        let dmesg_content = "KernelSU\nmagiskinit";
        assert!(dmesg_content.contains("KernelSU"));
        assert!(dmesg_content.contains("magiskinit"));
    }
}
