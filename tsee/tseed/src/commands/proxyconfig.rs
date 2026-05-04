use crate::utils::*;
use std::fs;
use std::process;

const CONFIG_DIR: &str = "/data/adb/tricky_store/config";
const MODE_FILE: &str = "/data/adb/tricky_store/config/mode";
const SYS_WHITELIST: &str = "/data/adb/tricky_store/config/sys_whitelist";
const SYS_BLACKLIST: &str = "/data/adb/tricky_store/config/sys_blacklist";
const USR_BLACKLIST: &str = "/data/adb/tricky_store/config/usr_blacklist";
const EXCLUDE_FILE: &str = "/data/adb/tricky_store/config/exclude";

pub fn run(args: &[&str]) {
    if args.is_empty() || args.contains(&"-h") || args.contains(&"--help") {
        help();
        return;
    }

    ensure_config_files();

    match args[0] {
        "-mode" => handle_mode(&args[1..]),
        "-syswl" => handle_list(SYS_WHITELIST, &args[1..], "System whitelist"),
        "-sysbl" => handle_list(SYS_BLACKLIST, &args[1..], "System blacklist"),
        "-usrbl" => handle_list(USR_BLACKLIST, &args[1..], "User blacklist"),
        "-exclude" => handle_list(EXCLUDE_FILE, &args[1..], "Exclude list"),
        "-list" => list_all(),
        _ => {
            eprintln!("Unknown option: {}", args[0]);
            help();
            process::exit(2);
        }
    }
}

fn help() {
    println!("Proxy Configuration Manager");
    println!();
    println!("All configuration is stored in files under /data/adb/tricky_store/config/");
    println!();
    println!("Usage: tseed proxyconfig <Options> [Arguments]");
    println!();
    println!("Options:");
    println!("  -mode <mode>       Set proxy mode by writing to config/mode file:");
    println!("                     user_only      - Only proxy user apps (default)");
    println!("                     sys_whitelist  - Proxy all apps (system + user)");
    println!("                     sys_blacklist  - User apps + blacklisted system apps");
    println!("                     custom         - Custom with user blacklist support");
    println!("  -syswl add|del|list <package>  Manage system whitelist (custom mode)");
    println!("  -sysbl add|del|list <package>  Manage system blacklist (sys_blacklist mode)");
    println!("  -usrbl add|del|list <package>  Manage user blacklist (custom mode, forces ?)");
    println!("  -exclude add|del|list <package> Exclude list (no proxy for any mode)");
    println!("  -list             Show all configuration files");
    println!();
    println!("Files:");
    println!("  /data/adb/tricky_store/config/mode           - Current mode");
    println!("  /data/adb/tricky_store/config/sys_whitelist  - System app whitelist");
    println!("  /data/adb/tricky_store/config/sys_blacklist  - System app blacklist");
    println!("  /data/adb/tricky_store/config/usr_blacklist  - User app blacklist (forces ?)");
    println!("  /data/adb/tricky_store/config/exclude        - Global exclude list");
    println!();
    println!("Examples:");
    println!("  tseed proxyconfig -mode sys_whitelist");
    println!("  tseed proxyconfig -sysbl add com.android.vending");
    println!("  tseed proxyconfig -usrbl add com.example.app");
    println!("  tseed proxyconfig -exclude add com.google.android.gms");
    println!("  tseed proxyconfig -list");
}

fn handle_mode(args: &[&str]) {
    if args.is_empty() {
        let binding = read_file(MODE_FILE);
        let current = binding.trim();
        println!("Current mode: {}", if current.is_empty() { "user_only (default)" } else { current });
        return;
    }

    let mode = args[0];
    let valid_modes = ["user_only", "sys_whitelist", "sys_blacklist", "custom"];
    
    if !valid_modes.contains(&mode) {
        eprintln!("Invalid mode: {}", mode);
        eprintln!("Valid modes: {}", valid_modes.join(", "));
        process::exit(2);
    }

    if let Err(e) = fs::write(MODE_FILE, format!("{}\n", mode)) {
        eprintln!("Failed to write mode file: {}", e);
        process::exit(1);
    }

    println!("Mode set to: {}", mode);
    println!("File: {}", MODE_FILE);
    logcei(&format!("Proxy mode changed to: {}", mode));
}

fn handle_list(file: &str, args: &[&str], name: &str) {
    if args.is_empty() {
        eprintln!("Usage: <add|del|list> [package]");
        process::exit(2);
    }

    match args[0] {
        "add" => {
            if args.len() < 2 {
                eprintln!("Usage: add <package>");
                process::exit(2);
            }
            let pkg = args[1];
            let mut lines = read_lines(file);
            if !lines.contains(&pkg.to_string()) {
                lines.push(pkg.to_string());
                write_lines(file, &lines);
                println!("Added {} to {}", pkg, name);
                println!("File: {}", file);
            } else {
                println!("{} already in {}", pkg, name);
            }
        }
        "del" => {
            if args.len() < 2 {
                eprintln!("Usage: del <package>");
                process::exit(2);
            }
            let pkg = args[1];
            let lines: Vec<String> = read_lines(file).into_iter().filter(|l| l != pkg).collect();
            write_lines(file, &lines);
            println!("Removed {} from {}", pkg, name);
            println!("File: {}", file);
        }
        "list" => {
            let lines = read_lines(file);
            if lines.is_empty() {
                println!("{} is empty", name);
                println!("File: {}", file);
            } else {
                println!("{} ({} items):", name, lines.len());
                println!("File: {}", file);
                for line in lines {
                    println!("  {}", line);
                }
            }
        }
        _ => {
            eprintln!("Unknown action: {}", args[0]);
            process::exit(2);
        }
    }
}

fn list_all() {
    println!("=== Proxy Configuration Files ===");
    println!();
    
    println!("Mode file: {}", MODE_FILE);
    let mode_binding = read_file(MODE_FILE);
    let mode = mode_binding.trim();
    println!("  Content: {}", if mode.is_empty() { "user_only (default)" } else { mode });
    println!();
    
    print_file_list("System Whitelist", SYS_WHITELIST);
    print_file_list("System Blacklist", SYS_BLACKLIST);
    print_file_list("User Blacklist (forces ? mode)", USR_BLACKLIST);
    print_file_list("Exclude List", EXCLUDE_FILE);
}

fn print_file_list(name: &str, file: &str) {
    let lines = read_lines(file);
    println!("{} ({} items):", name, lines.len());
    println!("  File: {}", file);
    if lines.is_empty() {
        println!("  (empty)");
    } else {
        for line in lines {
            println!("    {}", line);
        }
    }
    println!();
}

fn ensure_config_files() {
    let _ = run_command("mkdir", &["-p", CONFIG_DIR]);
    for file in [MODE_FILE, SYS_WHITELIST, SYS_BLACKLIST, USR_BLACKLIST, EXCLUDE_FILE] {
        if !file_exists(file) {
            let _ = fs::File::create(file);
        }
    }
}

fn read_lines(file: &str) -> Vec<String> {
    fs::read_to_string(file)
        .unwrap_or_default()
        .lines()
        .map(|l| l.trim().to_string())
        .filter(|l| !l.is_empty() && !l.starts_with('#'))
        .collect()
}

fn write_lines(file: &str, lines: &[String]) {
    let content = if lines.is_empty() {
        String::new()
    } else {
        format!("{}\n", lines.join("\n"))
    };
    if let Err(e) = fs::write(file, content) {
        eprintln!("Failed to write {}: {}", file, e);
        process::exit(1);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_read_lines_empty() {
        let tmp = tempfile::NamedTempFile::new().unwrap();
        let lines = read_lines(tmp.path().to_str().unwrap());
        assert!(lines.is_empty());
    }

    #[test]
    fn test_read_lines_with_content() {
        let tmp = tempfile::NamedTempFile::new().unwrap();
        fs::write(tmp.path(), "line1\nline2\n#comment\n\n").unwrap();
        let lines = read_lines(tmp.path().to_str().unwrap());
        assert_eq!(lines.len(), 2);
        assert_eq!(lines[0], "line1");
        assert_eq!(lines[1], "line2");
    }

    #[test]
    fn test_write_lines() {
        let tmp = tempfile::NamedTempFile::new().unwrap();
        let lines = vec!["pkg1".to_string(), "pkg2".to_string()];
        write_lines(tmp.path().to_str().unwrap(), &lines);
        let read_back = fs::read_to_string(tmp.path()).unwrap();
        assert!(read_back.contains("pkg1"));
        assert!(read_back.contains("pkg2"));
    }

    #[test]
    fn test_write_lines_empty() {
        let tmp = tempfile::NamedTempFile::new().unwrap();
        let lines: Vec<String> = vec![];
        write_lines(tmp.path().to_str().unwrap(), &lines);
        let read_back = fs::read_to_string(tmp.path()).unwrap();
        assert!(read_back.is_empty());
    }

    #[test]
    fn test_ensure_config_files() {
        // This should not panic
        ensure_config_files();
    }
}
