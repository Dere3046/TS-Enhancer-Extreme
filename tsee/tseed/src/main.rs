use std::env;
use std::fs;
use std::process;

mod commands;
mod utils;

use utils::*;
use commands::*;

const VERSION: &str = "1.1.0";

fn verify() -> Result<bool, &'static str> {
    utils::verify_module()
}

fn help() {
    println!("TSeed Unified CLI - TS Enhancer Extreme\n");
    println!("Usage: tseed <namespace> <action> [args...]\n");
    println!("Namespaces:");
    println!("  system     System operations (rootdetect, staterefresh, passvbhash, etc.)");
    println!("  service    Service control (proxy)");
    println!("  app        App management (list-names, info, add, remove)");
    println!("  proxyconfig Proxy configuration (mode, list, add, remove)");
    println!("  keybox     Keybox management (exists, list, import, backup, restore, delete)");
    println!("  log        Log operations\n");
    println!("Legacy commands still supported for compatibility:");
    println!("  --proxyctl, etc.\n");
    println!("Options:");
    println!("  -h, --help     Show this help");
    println!("  -V, --version  Show version");
}

fn version() {
    println!("tseed {}", VERSION);
    process::exit(0);
}

fn dispatch(namespace: &str, action: &str, args: &[&str]) {
    match namespace {
        "system" => dispatch_system(action, args),
        "service" => dispatch_service(action, args),
        "app" => dispatch_app(action, args),
        "proxyconfig" => dispatch_proxyconfig(action, args),
        "keybox" => dispatch_keybox(action, args),
        "log" => dispatch_log(action, args),
        _ => {
            eprintln!("error: unknown namespace '{}'", namespace);
            eprintln!("Run 'tseed --help' for usage.");
            process::exit(2);
        }
    }
}

fn dispatch_system(action: &str, args: &[&str]) {
    match action {
        "ping" => println!("pong"),
        "ls" => {
            let path = args.first().copied().unwrap_or("/sdcard");
            let dir = std::path::Path::new(path);
            if !dir.is_dir() {
                eprintln!("error: not a directory: {}", path);
                process::exit(2);
            }
            let mut entries: Vec<String> = Vec::new();
            if let Ok(rd) = std::fs::read_dir(dir) {
                for e in rd.flatten() {
                    let name = e.file_name().to_string_lossy().to_string();
                    if name == "." || name == ".." { continue }
                    let is_dir = e.file_type().map(|t| t.is_dir()).unwrap_or(false);
                    entries.push(format!("{{\"n\":\"{}\",\"d\":{}}}", 
                        name.replace('\\', "\\\\").replace('"', "\\\""), is_dir));
                }
            }
            println!("[{}]", entries.join(","));
        }
        "rootdetect" => rootdetect::run(),
        "staterefresh" => staterefresh::run(),
        "passvbhash" => passvbhash::run(),
        "vbhashget" => passvbhash::get(),
        "vbhashapply" => {
            if args.is_empty() {
                eprintln!("Usage: tseed system vbhashapply <64-hex-hash>");
                process::exit(2);
            }
            passvbhash::apply(args[0]);
        }
        "vbhashpersist" => {
            if args.is_empty() {
                eprintln!("Usage: tseed system vbhashpersist <64-hex-hash>");
                process::exit(2);
            }
            passvbhash::persist(args[0]);
        }
        "vbhashclear" => passvbhash::clear(),
        "vbhashstate" => passvbhash::state(),
        "passpropstate" => passpropstate::run(),
        "conflictappcheck" => conflictappcheck::run(),
        "conflictmodcheck" => {
            let mode = args.get(0).unwrap_or(&"");
            conflictmodcheck::run(mode);
        }
        "packagelistupdate" => {
            let mode = args.get(0).unwrap_or(&"");
            packagelistupdate::run(mode);
        }
        "clearcache" => {
            let cache_file = format!("{}/.app_cache.json", ts_config());
            if file_exists(&cache_file) {
                let _ = run_command("rm", &["-f", &cache_file]);
            }
            let tsee_cache = format!("{}/cache", tsee_config());
            if file_exists(&tsee_cache) {
                let _ = run_command("rm", &["-rf", &format!("{}/*", tsee_cache)]);
            }
            logcei("Cache cleared");
            println!("OK: cache cleared");
        }
        "settingsget" => {
            let config_dir = format!("{}/config", tsee_mod_dir());
            let _ = run_command("mkdir", &["-p", &config_dir]);
            let settings_file = format!("{}/settings.json", config_dir);
            if file_exists(&settings_file) {
                let content = read_file(&settings_file);
                println!("{}", content);
            } else {
                println!("{{}}");
            }
        }
        "settingsset" => {
            if args.is_empty() {
                eprintln!("Usage: tseed system settingsset <json>");
                process::exit(2);
            }
            let config_dir = format!("{}/config", tsee_mod_dir());
            let _ = run_command("mkdir", &["-p", &config_dir]);
            let settings_file = format!("{}/settings.json", config_dir);
            if let Err(e) = fs::write(&settings_file, args[0]) {
                logcee(&format!("Failed to write settings: {}", e));
                process::exit(1);
            }
            logcei("Settings updated");
            println!("OK: settings updated");
        }
        "autoproxystate" => {
            let flag_file = format!("{}/.tseet_enabled", tsee_mod_dir());
            if file_exists(&flag_file) {
                println!("enabled");
            } else {
                println!("disabled");
            }
        }
        "autoproxyenable" => {
            let flag_file = format!("{}/.tseet_enabled", tsee_mod_dir());
            if let Err(e) = fs::write(&flag_file, "") {
                logcee(&format!("Failed to create .tseet_enabled: {}", e));
                process::exit(1);
            }
            logcei("Auto proxy enabled");
            println!("OK: auto proxy enabled");
        }
        "autoproxydisable" => {
            let flag_file = format!("{}/.tseet_enabled", tsee_mod_dir());
            if file_exists(&flag_file) {
                let _ = run_command("rm", &["-f", &flag_file]);
            }
            kill_tseet();
            logcei("Auto proxy disabled");
            println!("OK: auto proxy disabled");
        }
        "securitypatchsync" => securitypatch::sync(),
        "securitypatchget" => securitypatch::get(),
        "securitypatchset" => {
            if args.is_empty() {
                eprintln!("Usage: tseed system securitypatchset <YYYY-MM-DD> or system=date1,vendor=date2");
                process::exit(2);
            }
            securitypatch::set(args[0]);
        }
        _ => {
            eprintln!("error: unknown system action '{}'", action);
            process::exit(2);
        }
    }
}

fn dispatch_service(action: &str, args: &[&str]) {
    if action == "test" {
        let tseet = proxyctl::state();
        let tricky = tsctl::state();
        println!("tseet={},tricky={}", tseet, tricky);
        return;
    }

    let svc = match action {
        "proxy" => "proxyctl",
        _ => {
            eprintln!("error: unknown service '{}'", action);
            eprintln!("Available: proxy");
            process::exit(2);
        }
    };
    
    let cmd = args.get(0).unwrap_or(&"state");
    match svc {
        "proxyctl" => proxyctl::run(cmd),
        _ => unreachable!()
    }
}

fn dispatch_app(action: &str, args: &[&str]) {
    match action {
        "list-names" => {
            let filter = args.first().copied().unwrap_or("");
            let output = tseet_query("app", "list-names", &[filter]);
            println!("{}", output);
        }
        "info" => {
            if args.is_empty() {
                eprintln!("Usage: tseed app info <pkg1> [pkg2...]");
                process::exit(2);
            }
            let output = tseet_query("app", "info", args);
            println!("{}", output);
        }
        "add" => {
            if args.is_empty() {
                eprintln!("Usage: tseed app add <package> [auto|gen|mod]");
                process::exit(2);
            }
            let mode = args.get(1).copied().unwrap_or("auto");
            let output = tseet_query("app", "add", &[args[0], mode]);
            println!("{}", output);
        }
        "remove" => {
            if args.is_empty() {
                eprintln!("Usage: tseed app remove <package>");
                process::exit(2);
            }
            let output = tseet_query("app", "remove", &[args[0]]);
            println!("{}", output);
        }
        "icon" => {
            if args.is_empty() {
                eprintln!("Usage: tseed app icon <package>");
                process::exit(2);
            }
            let output = tseet_query("app", "icon", &[args[0]]);
            println!("{}", output);
        }
        "config" => {
            let output = tseet_query("app", "config", args);
            println!("{}", output);
        }
        _ => {
            eprintln!("error: unknown app action '{}'", action);
            process::exit(2);
        }
    }
}

fn dispatch_proxyconfig(action: &str, args: &[&str]) {
    match action {
        "mode" => {
            if args.is_empty() {
                proxyconfig::run(&["-mode"]);
            } else {
                proxyconfig::run(&["-mode", args[0]]);
            }
        }
        "list" => {
            if args.is_empty() {
                eprintln!("Usage: tseed proxyconfig list <type>");
                process::exit(2);
            }
            proxyconfig::run(&[&format!("-{}", args[0]), "list"]);
        }
        "add" => {
            if args.len() < 2 {
                eprintln!("Usage: tseed proxyconfig add <type> <package>");
                process::exit(2);
            }
            proxyconfig::run(&[&format!("-{}", args[0]), "add", args[1]]);
        }
        "remove" => {
            if args.len() < 2 {
                eprintln!("Usage: tseed proxyconfig remove <type> <package>");
                process::exit(2);
            }
            proxyconfig::run(&[&format!("-{}", args[0]), "del", args[1]]);
        }
        _ => {
            eprintln!("error: unknown proxyconfig action '{}'", action);
            process::exit(2);
        }
    }
}

fn dispatch_keybox(action: &str, args: &[&str]) {
    const KEYBOX_PATH: &str = "/data/adb/tricky_store/keybox.xml";
    const BACKUP_DIR: &str = "/data/adb/tricky_store/keybox_backup";
    
    match action {
        "exists" => {
            let exists = std::path::Path::new(KEYBOX_PATH).exists();
            println!("{}", if exists { "yes" } else { "no" });
        }
        "list" => {
            let output = run_command("ls", &["-1", BACKUP_DIR]);
            println!("{}", output);
        }
        "import" => {
            if args.is_empty() {
                eprintln!("Usage: tseed keybox import <source-path>");
                process::exit(2);
            }
            let source = args[0];
            if std::path::Path::new(KEYBOX_PATH).exists() {
                let timestamp = chrono::Local::now().format("%Y-%m-%dT%H-%M-%S");
                let _ = run_command("cp", &[KEYBOX_PATH, &format!("{}/keybox_{}.xml", BACKUP_DIR, timestamp)]);
            }
            let _ = run_command("cp", &[source, KEYBOX_PATH]);
            let _ = run_command("chmod", &["644", KEYBOX_PATH]);
            println!("OK: imported {}", source);
        }
        "backup" => {
            let timestamp = chrono::Local::now().format("%Y-%m-%dT%H-%M-%S");
            let dest = format!("{}/keybox_{}.xml", BACKUP_DIR, timestamp);
            let output = run_command("cp", &[KEYBOX_PATH, &dest]);
            println!("{}", output);
            println!("OK: backed up to {}", dest);
        }
        "restore" => {
            if args.is_empty() {
                eprintln!("Usage: tseed keybox restore <backup-path>");
                process::exit(2);
            }
            let _ = run_command("cp", &[args[0], KEYBOX_PATH]);
            let _ = run_command("chmod", &["644", KEYBOX_PATH]);
            println!("OK: restored from {}", args[0]);
        }
        "delete" => {
            let _ = run_command("rm", &["-f", KEYBOX_PATH]);
            println!("OK: deleted keybox");
        }
        "delete-backup" => {
            if args.is_empty() {
                eprintln!("Usage: tseed keybox delete-backup <path>");
                process::exit(2);
            }
            let _ = run_command("rm", &["-f", args[0]]);
            println!("OK: deleted backup {}", args[0]);
        }
        _ => {
            eprintln!("error: unknown keybox action '{}'", action);
            process::exit(2);
        }
    }
}

fn dispatch_log(action: &str, _args: &[&str]) {
    match action {
        "read" => {
            let output = run_command("cat", &["/data/adb/ts_enhancer_extreme/log/log.log"]);
            println!("{}", output);
        }
        _ => {
            eprintln!("error: unknown log action '{}'", action);
            process::exit(2);
        }
    }
}

fn legacy_dispatch(args: &[&str]) {
    if args.is_empty() {
        help();
        process::exit(2);
    }

    // Handle multi-argument legacy commands
    if args.len() >= 2 {
        match args[0] {
            "--proxyctl" => {
                let proxy_args: Vec<String> = args[1..].iter().map(|s| s.to_string()).collect();
                proxyctl::run_with_args(&proxy_args);
                process::exit(0);
            }
            "--conflictmodcheck" if args[1] == "-s" => {
                conflictmodcheck::run("-servicemode");
                process::exit(0);
            }
            "--packagelistupdate" if args[1] == "-a" => {
                packagelistupdate::run("-action");
                process::exit(0);
            }
            "--stealkeybox" => {
                stealkeybox::run(args[1]);
                process::exit(0);
            }
            _ => {}
        }
    }

    // Handle single argument legacy commands
    for arg in args {
        match *arg {
            "-h" | "--help" => {
                help();
                process::exit(0);
            }
            "-V" | "--version" => version(),
            "--rootdetect" => rootdetect::run(),
            "--passvbhash" => passvbhash::run(),
            "--vbhashget" => passvbhash::get(),
            "--staterefresh" => staterefresh::run(),
            "--passpropstate" => passpropstate::run(),
            "--conflictappcheck" => conflictappcheck::run(),
            "--packagelistupdate" => packagelistupdate::run(""),
            "--conflictmodcheck" => {
                conflictmodcheck::run("");
                process::exit(0);
            }
            "--securitypatchpropsync" => securitypatch::sync(),
            "--securitypatchset" => {
                let idx = args.iter().position(|a| a == arg).unwrap_or(0);
                if idx + 1 >= args.len() {
                    eprintln!("Usage: tseed --securitypatchset <YYYY-MM-DD>");
                    process::exit(2);
                }
                securitypatch::set(args[idx + 1]);
                process::exit(0);
            }
            "--proxyctl" => {
                proxyctl::run("");
                process::exit(2);
            }
            _ => {}
        }
    }

    process::exit(0);
}

fn main() {
    let args: Vec<String> = env::args().skip(1).collect();

    match verify() {
        Ok(true) => {},
        Ok(false) => {
            eprintln!("Integrity verification failed, execution denied");
            println!("verify:failed");
            process::exit(1);
        }
        Err(e) => {
            eprintln!("{}", e);
            println!("verify:error");
            process::exit(1);
        }
    }
    if args.is_empty() {
        help();
        process::exit(2);
    }

    let args_refs: Vec<&str> = args.iter().map(|s| s.as_str()).collect();

    let first = args_refs[0];
    
    if first.starts_with("--") || first == "-h" || first == "-V" {
        legacy_dispatch(&args_refs);
    } else {
        if args_refs.len() < 2 {
            eprintln!("error: missing action for namespace '{}'", first);
            eprintln!("Usage: tseed <namespace> <action> [args...]");
            process::exit(2);
        }
        
        let namespace = args_refs[0];
        let action = args_refs[1];
        let remaining = &args_refs[2..];
        
        dispatch(namespace, action, remaining);
    }

    process::exit(0);
}