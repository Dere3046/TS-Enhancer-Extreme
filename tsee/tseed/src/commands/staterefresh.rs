use crate::utils::*;
use std::fs;
use std::path::Path;

pub fn run() {
    let tsee_mod = tsee_mod_dir();
    let module_prop = format!("{}/module.prop", tsee_mod);

    if !file_exists(&module_prop) {
        return;
    }

    // Gather status components
    let integrity = match verify_module() {
        Ok(true) => "✅I:passed",
        Ok(false) => "✅I:failed",
        Err(_) => "✅I:error",
    };

    let root_info = read_file(&format!("{}/root.txt", tsee_config())).trim().to_string();
    let root_str = match root_info.as_str() {
        "Magisk" => {
            let version = run_command("magisk", &["-V"]).trim().to_string();
            format!("✅R:Magisk({})", version)
        }
        "KernelSU" => {
            let version = run_command("ksud", &["debug", "version"])
                .split_whitespace().nth(2).unwrap_or("?").to_string();
            format!("✅R:KernelSU({})", version)
        }
        "SuckySU" => {
            let version = run_command("ksud", &["debug", "version"])
                .split_whitespace().nth(2).unwrap_or("?").to_string();
            format!("✅R:SuckySU({})", version)
        }
        "APatch" => {
            let version = run_command("apd", &["-V"])
                .split_whitespace().nth(1).unwrap_or("?").to_string();
            format!("✅R:APatch({})", version)
        }
        "Multiple" => {
            let multiple = read_file(&format!("{}/multiple.txt", tsee_config())).trim().to_string();
            format!("✅R:Multiple({})", multiple)
        }
        _ => "✅R:Unknown".to_string(),
    };

    let service_running = !run_command("pidof", &["TSEET"]).trim().is_empty();
    let service_str = if service_running { "✅S:running" } else { "✅S:stopped" };

    let new_tag = format!("[{},{},{}]", integrity, root_str, service_str);

    let content = read_file(&module_prop);
    let new_content = content
        .lines()
        .map(|line| {
            if line.starts_with("description=") {
                line.replacen("[🔄]", &new_tag, 1)
                    .replacen("[🔄]", &new_tag, 1) // fallback if placeholder missing, we don't change
            } else {
                line.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join("\n");

    let _ = fs::write(&module_prop, new_content);
}