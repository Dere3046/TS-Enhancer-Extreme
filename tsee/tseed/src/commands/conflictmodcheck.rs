use crate::utils::*;
use std::fs;
use std::path::Path;
use std::process;
use std::thread;
use std::time::Duration;

pub fn run(arg: &str) {
    let conflict_modules = vec![
        "Yurikey",
        "xiaocaiye",
        "safetynet-fix",
        "vbmeta-fixer",
        "playintegrity",
        "integrity_box",
        "SukiSU_module",
        "Reset_BootHash",
        "Tricky_store-bm",
        "Hide_Bootloader",
        "ShamikoManager",
        "extreme_hide_root",
        "Tricky_Store-xiaoyi",
        "tricky_store_assistant",
        "extreme_hide_bootloader",
        "wjw_hiderootauxiliarymod",
    ];

    let rmrf_conflict = vec![
        "TA_utl",
        ".TA_utl",
        "Yamabukiko",
    ];

    let conflictdes = |module_dir: &str| {
        let module_prop = format!("{}/module.prop", module_dir);
        let des = if get_locale() == "CN" {
            "This module conflicts with TS-Enhancer-Extreme and tagged for removal on next boot.".to_string()
        } else {
            "This module has been confirmed to conflict with the TS-Enhancer-Extreme module. It has been tagged for removal and will be removed upon the next boot.".to_string()
        };
        
        let content = read_file(&module_prop);
        let new_content = content.lines()
            .map(|line| {
                if line.starts_with("description=") {
                    format!("description={}", des)
                } else {
                    line.to_string()
                }
            })
            .collect::<Vec<_>>()
            .join("\n");
        let _ = fs::write(&module_prop, new_content);
    };

    match arg {
        "-h" | "-help" => {
            println!("conflictmodcheck\n");
            println!("Usage: tseed conflictmodcheck <Basic arguments>\n");
            println!("Arguments:");
            println!("  -s\n");
            println!("Options:");
            println!("  -h, -help");
        }
        "-servicemode" => {
            thread::sleep(Duration::from_secs(2));
            for module in &conflict_modules {
                let module_dir = format!("{}/{}", MODULES_DIR, module);
                if Path::new(&module_dir).exists() {
                    conflictdes(&module_dir);
                    let _ = fs::File::create(format!("{}/disable", module_dir));
                    let _ = fs::File::create(format!("{}/remove", module_dir));
                    let _ = fs::remove_dir_all(format!("{}/modules_update/{}", ADB, module));
                }
            }
            for module in &rmrf_conflict {
                let module_dir = format!("{}/{}", MODULES_DIR, module);
                if Path::new(&module_dir).exists() {
                    let uninstall_sh = format!("{}/uninstall.sh", module_dir);
                    if Path::new(&uninstall_sh).exists() {
                        let _ = run_command("sh", &[&uninstall_sh]);
                    }
                    let _ = fs::remove_dir_all(&module_dir);
                }
            }
        }
        _ => {
            for module in &conflict_modules {
                let module_dir = format!("{}/{}", MODULES_DIR, module);
                if Path::new(&module_dir).exists() {
                    conflictdes(&module_dir);
                    let _ = fs::File::create(format!("{}/update", module_dir));
                    let _ = fs::File::create(format!("{}/disable", module_dir));
                    let _ = fs::File::create(format!("{}/remove", module_dir));
                    let _ = fs::remove_file(format!("{}/modules_update/uninstall.sh", ADB));
                    let _ = fs::remove_file(format!("{}/uninstall.sh", module_dir));
                }
            }
            for module in &rmrf_conflict {
                let module_dir = format!("{}/{}", MODULES_DIR, module);
                if Path::new(&module_dir).exists() {
                    let uninstall_sh = format!("{}/uninstall.sh", module_dir);
                    if Path::new(&uninstall_sh).exists() {
                        let _ = run_command("sh", &[&uninstall_sh]);
                    }
                    let _ = fs::remove_dir_all(&module_dir);
                }
            }
        }
    }
}
