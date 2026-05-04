use crate::utils::*;
use std::fs;

pub fn run(_arg: &str) {
    let target_file = format!("{}/target.txt", ts_config());

    // Get all third-party packages
    let packages = run_command("pm", &["list", "packages", "-3"]);
    let mut target_content = String::new();
    
    for line in packages.lines() {
        if line.starts_with("package:") {
            let pkg = line.trim_start_matches("package:").trim();
            target_content.push_str(pkg);
            target_content.push('\n');
        }
    }
    
    let _ = fs::write(&target_file, target_content);
}