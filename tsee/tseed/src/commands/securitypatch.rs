use crate::utils::*;
use std::fs;
use std::process;

// Security patch properties that can be spoofed
const PATCH_PROPS: &[(&str, &str)] = &[
    ("ro.build.version.security_patch", "system"),
    ("ro.vendor.build.security_patch", "vendor"),
    ("ro.system.build.security_patch", "system"),
    ("ro.system_ext.build.security_patch", "system_ext"),
    ("ro.product.build.security_patch", "product"),
    ("ro.bootimage.build.security_patch", "bootimage"),
];

pub fn sync() {
    let sp_file = format!("{}/security_patch.txt", ts_config());
    
    if !file_exists(&sp_file) {
        logcee("Security patch file not found");
        process::exit(1);
    }

    let content = read_file(&sp_file);
    let mut configs: Vec<(&str, String)> = Vec::new();
    let mut has_entry = false;

    // Parse config file: each line is "partition=YYYY-MM-DD"
    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }

        if let Some(eq_pos) = line.find('=') {
            let partition = line[..eq_pos].trim();
            let date_str = line[eq_pos + 1..].trim();
            
            if let Some(date) = parse_date(date_str) {
                configs.push((partition, date));
                has_entry = true;
            }
        }
    }

    if !has_entry {
        logcee("No valid security patch entries found");
        process::exit(1);
    }

    // Apply each configured patch
    for (partition, date) in &configs {
        for (prop, prop_partition) in PATCH_PROPS {
            if *prop_partition == *partition {
                resetprop(prop, date);
            }
        }
    }

    // Kill GMS to apply changes
    let gms_pid = run_command("pidof", &["com.google.android.gms.unstable"]).trim().to_string();
    if !gms_pid.is_empty() {
        let _ = run_command("kill", &["-9", &gms_pid]);
    }
    
    logcei("Security patch synced");
}

pub fn get() {
    let sp_file = format!("{}/security_patch.txt", ts_config());
    if !file_exists(&sp_file) {
        println!("");
        return;
    }
    let content = read_file(&sp_file);
    println!("{}", content.trim());
}

pub fn set(config: &str) {
    // Config format: "partition1=date1,partition2=date2" or just "YYYY-MM-DD" (applies to all)
    let mut entries: Vec<String> = Vec::new();
    
    if config.contains('=') {
        // Advanced mode: "system=2024-01-01,vendor=2024-02-01,boot=no"
        for part in config.split(',') {
            let part = part.trim();
            if part.is_empty() {
                continue;
            }
            
            if let Some(eq_pos) = part.find('=') {
                let partition = part[..eq_pos].trim();
                let value = part[eq_pos + 1..].trim();
                
                // Allow special values: "no" and "prop"
                if value == "no" || value == "prop" || parse_date(value).is_some() {
                    entries.push(format!("{}={}", partition, value));
                } else {
                    logcee(&format!("Invalid value for {}: {}", partition, value));
                    process::exit(1);
                }
            }
        }
    } else {
        // Simple mode: just a date, apply to all partitions
        if let Some(date) = parse_date(config) {
            for (_, partition) in PATCH_PROPS {
                entries.push(format!("{}={}", partition, date));
            }
        } else {
            logcee("Invalid date format. Use YYYY-MM-DD");
            process::exit(1);
        }
    }

    if entries.is_empty() {
        logcee("No valid security patch entries");
        process::exit(1);
    }

    let sp_file = format!("{}/security_patch.txt", ts_config());
    let content = entries.join("\n");
    
    if let Err(e) = fs::write(&sp_file, &content) {
        logcee(&format!("Failed to write security patch file: {}", e));
        process::exit(1);
    }
    
    // Apply immediately (skip "no" entries)
    for line in content.lines() {
        if let Some(eq_pos) = line.find('=') {
            let partition = line[..eq_pos].trim();
            let value = line[eq_pos + 1..].trim();
            
            if value == "no" || value == "prop" {
                continue;
            }
            
            for (prop, prop_partition) in PATCH_PROPS {
                if *prop_partition == partition {
                    resetprop(prop, value);
                }
            }
        }
    }
    
    // Kill GMS to apply changes
    let gms_pid = run_command("pidof", &["com.google.android.gms.unstable"]).trim().to_string();
    if !gms_pid.is_empty() {
        let _ = run_command("kill", &["-9", &gms_pid]);
    }
    
    logcei("Security patch set and applied");
    println!("{}", content);
}

fn parse_date(date_str: &str) -> Option<String> {
    let trimmed = date_str.trim();
    
    // Try YYYY-MM-DD
    if trimmed.len() == 10 
        && trimmed.chars().nth(4) == Some('-') 
        && trimmed.chars().nth(7) == Some('-') {
        if trimmed[..4].chars().all(|c| c.is_ascii_digit())
            && trimmed[5..7].chars().all(|c| c.is_ascii_digit())
            && trimmed[8..10].chars().all(|c| c.is_ascii_digit()) {
            return Some(trimmed.to_string());
        }
    }
    
    // Try YYYYMMDD
    if trimmed.len() == 8 && trimmed.chars().all(|c| c.is_ascii_digit()) {
        return Some(format!("{}-{}-{}", &trimmed[0..4], &trimmed[4..6], &trimmed[6..8]));
    }
    
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_date_parsing_ymd() {
        assert_eq!(parse_date("2024-11-01"), Some("2024-11-01".to_string()));
    }

    #[test]
    fn test_date_parsing_compact() {
        assert_eq!(parse_date("20241101"), Some("2024-11-01".to_string()));
    }

    #[test]
    fn test_date_parsing_invalid() {
        assert_eq!(parse_date("invalid"), None);
        assert_eq!(parse_date(""), None);
    }
}