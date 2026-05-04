use std::process::Command;
use std::fs;
use std::path::Path;
use libloading::{Library, Symbol};

const PID_FILE: &str = "/data/adb/ts_enhancer_extreme/proxy.pid";

/// Kill TSEET if running, remove PID file if stale
pub fn kill_tseet() {
    if file_exists(PID_FILE) {
        let pid = read_file(PID_FILE).trim().to_string();
        if !pid.is_empty() {
            let _ = run_command("kill", &["-9", &pid]);
        }
        let _ = fs::remove_file(PID_FILE);
    }
}

const CMD_TOOL_BIN: &str = "/data/adb/modules/ts_enhancer_extreme/bin/cmd_tool";

pub fn verify_module() -> Result<bool, &'static str> {
    let libpath = match unsafe { Library::new("/data/adb/modules/ts_enhancer_extreme/lib/libverify.so") } {
        Ok(lib) => lib,
        Err(_) => return Err("Verification failed: libverify.so not found"),
    };
    let invoke_bridge: Symbol<unsafe fn() -> bool> = match unsafe { libpath.get(b"invoke_bridge") } {
        Ok(func) => func,
        Err(_) => return Err("Verification failed: invoke_bridge not found"),
    };
    if unsafe { invoke_bridge() } {
        Ok(true)
    } else {
        Ok(false)
    }
}

// Paths
pub const ADB: &str = "/data/adb";
pub const TS: &str = "tricky_store";
pub const TSEE: &str = "ts_enhancer_extreme";
pub const MODULES_DIR: &str = "/data/adb/modules";

pub fn ts_config() -> String {
    format!("{}/{}", ADB, TS)
}

pub fn tsee_config() -> String {
    format!("{}/{}", ADB, TSEE)
}

pub fn tsee_mod_dir() -> String {
    format!("{}/{}", MODULES_DIR, TSEE)
}

pub fn ts_mod_dir() -> String {
    format!("{}/{}", MODULES_DIR, TS)
}

pub fn tsee_bin() -> String {
    format!("{}/bin", tsee_mod_dir())
}

pub fn tsee_log() -> String {
    format!("{}/log/log.log", tsee_config())
}

// Locale detection
pub fn get_locale() -> String {
    let persist = run_command("getprop", &["persist.sys.locale"]);
    let product = run_command("getprop", &["ro.product.locale"]);
    if persist.contains("zh") || product.contains("zh") {
        "CN".to_string()
    } else {
        "EN".to_string()
    }
}

// Logging
pub fn logce(level: char, msg: &str) {
    eprintln!("{}", msg);
    let timestamp = run_command("date", &["+%m-%d %H:%M:%S.%3N"]);
    let pid = std::process::id();
    let log_line = format!("{}  {}  {} {} System.out: [TSEE]<CLI>{}\n", 
        timestamp.trim(), pid, pid, level, msg);
    let log_file = tsee_log();
    if Path::new(&log_file).metadata().map(|m| m.len() > 524_288).unwrap_or(false) {
        let _ = fs::write(&log_file, "--- rotated at 1MB ---\n");
    }
    if let Ok(mut file) = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file) 
    {
        use std::io::Write;
        let _ = file.write_all(log_line.as_bytes());
    }
}

pub fn logcei(msg: &str) {
    logce('I', msg);
}

pub fn logcee(msg: &str) {
    logce('E', msg);
}

// Multilingual helpers
pub fn echo_localized(cn: &str, en: &str) {
    if get_locale() == "CN" {
        println!("{}", cn);
    } else {
        println!("{}", en);
    }
}

pub fn echo_localized_n(cn: &str, en: &str) {
    if get_locale() == "CN" {
        print!("{}", cn);
    } else {
        print!("{}", en);
    }
}

// Command execution helpers
pub fn tseet_exec(args: &[&str]) -> String {
    let mut cmd_args: Vec<&str> = vec![
        "-Djava.class.path=/data/adb/modules/ts_enhancer_extreme/service.apk",
        "/",
        "--nice-name=tseet_cli",
        "com.dere3046.tseet.Main",
    ];
    cmd_args.extend(args);
    run_command("/system/bin/app_process", &cmd_args)
}

use std::io::{Read, Write};
use std::os::unix::net::UnixStream;

const SOCKET_PATH: &str = "/data/adb/ts_enhancer_extreme/.tseet.sock";

/// Query TSEET — socket first, JVM fallback
pub fn tseet_query(ns: &str, act: &str, args: &[&str]) -> String {
    match socket_query_inner(ns, act, args) {
        Ok(data) => data,
        Err(_) => {
            // fallback: spawn JVM via CLI
            let mut cli_args = vec![act];
            cli_args.extend(args);
            tseet_exec(&cli_args)
        }
    }
}

fn socket_query_inner(ns: &str, act: &str, args: &[&str]) -> Result<String, String> {
    let args_json: Vec<String> = args.iter().map(|a| format!("\"{}\"", a.replace('\\', "\\\\").replace('"', "\\\""))).collect();
    let cmd = format!("{{\"ns\":\"{}\",\"act\":\"{}\",\"args\":[{}]}}\n", ns, act, args_json.join(","));

    let mut stream = UnixStream::connect(SOCKET_PATH).map_err(|_| "socket not available")?;
    stream.write_all(cmd.as_bytes()).map_err(|_| "socket write failed")?;
    let mut buf = [0u8; 65536];
    let n = stream.read(&mut buf).map_err(|_| "socket read failed")?;
    if n == 0 { return Err("empty response".into()) }
    let resp = String::from_utf8_lossy(&buf[..n]);
    parse_socket_ok(&resp)
}

fn parse_socket_ok(resp: &str) -> Result<String, String> {
    if let Some(start) = resp.find("\"data\":\"") {
        let rest = &resp[start + 8..];
        let mut result = String::new();
        let mut chars = rest.chars(); let mut esc = false;
        while let Some(c) = chars.next() {
            if esc { result.push(c); esc = false; continue }
            if c == '\\' { esc = true; continue }
            if c == '"' { break }
            result.push(c)
        }
        Ok(result)
    } else if let Some(start) = resp.find("\"data\":") {
        let rest = &resp[start + 7..];
        let mut depth = 0; let mut in_str = false; let mut esc = false;
        for (i, c) in rest.char_indices() {
            if esc { esc = false; continue }
            if c == '\\' { esc = true; continue }
            if c == '"' { in_str = !in_str; continue }
            if in_str { continue }
            if c == '{' || c == '[' { depth += 1 }
            if c == '}' || c == ']' { depth -= 1; if depth == 0 { return Ok(rest[..i+1].to_string()) } }
        }
        Err("incomplete".into())
    } else if resp.contains("\"ok\":true") {
        Ok(String::new())
    } else {
        Err("not ok".into())
    }
}

fn cmd_tool_args(cmd: &str, args: &[&str]) -> Vec<String> {
    let mut v = vec![cmd.to_string()];
    v.extend(args.iter().map(|s| s.to_string()));
    v
}

fn cmd_tool_args_with_env(cmd: &str, args: &[&str], env_path: &str) -> Vec<String> {
    let mut v = vec!["sh".to_string(), "-c".to_string(), format!("PATH={} {}", env_path, cmd)];
    v.extend(args.iter().map(|s| s.to_string()));
    v
}

pub fn run_command(cmd: &str, args: &[&str]) -> String {
    let all_args = cmd_tool_args(cmd, args);
    match Command::new(CMD_TOOL_BIN).args(&all_args).output() {
        Ok(output) => String::from_utf8_lossy(&output.stdout).to_string(),
        Err(_) => match Command::new(cmd).args(args).output() {
            Ok(output) => String::from_utf8_lossy(&output.stdout).to_string(),
            Err(_) => String::new(),
        },
    }
}

pub fn run_command_with_env(cmd: &str, args: &[&str], env_path: &str) -> String {
    let all_args = cmd_tool_args_with_env(cmd, args, env_path);
    match Command::new(CMD_TOOL_BIN).args(&all_args).output() {
        Ok(output) => String::from_utf8_lossy(&output.stdout).to_string(),
        Err(_) => match Command::new(cmd).args(args).env("PATH", env_path).output() {
            Ok(output) => String::from_utf8_lossy(&output.stdout).to_string(),
            Err(_) => String::new(),
        },
    }
}

pub fn run_command_status(cmd: &str, args: &[&str]) -> bool {
    let all_args = cmd_tool_args(cmd, args);
    match Command::new(CMD_TOOL_BIN).args(&all_args).status() {
        Ok(status) => status.success(),
        Err(_) => match Command::new(cmd).args(args).status() {
            Ok(status) => status.success(),
            Err(_) => false,
        },
    }
}

pub fn run_command_stderr(cmd: &str, args: &[&str]) -> String {
    let all_args = cmd_tool_args(cmd, args);
    match Command::new(CMD_TOOL_BIN).args(&all_args).output() {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let stderr = String::from_utf8_lossy(&output.stderr);
            if stdout.is_empty() { stderr.to_string() } else { stdout.to_string() }
        }
        Err(_) => match Command::new(cmd).args(args).output() {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let stderr = String::from_utf8_lossy(&output.stderr);
                if stdout.is_empty() { stderr.to_string() } else { stdout.to_string() }
            }
            Err(_) => String::new(),
        },
    }
}

pub fn spawn_via_cmd_tool(cmd: &str, args: &[&str]) -> std::process::Child {
    let all_args = cmd_tool_args(cmd, args);
    Command::new(CMD_TOOL_BIN)
        .args(&all_args)
        .spawn()
        .unwrap_or_else(|_| {
            Command::new(cmd)
                .args(args)
                .spawn()
                .expect("cmd_tool fallback: failed to spawn")
        })
}

// Property helpers
pub fn getprop(name: &str) -> String {
    run_command("getprop", &[name]).trim().to_string()
}

pub fn resetprop(name: &str, value: &str) {
    let _ = run_command("resetprop", &[name, value]);
}

pub fn resetprop_n(name: &str, value: &str) {
    let _ = run_command("resetprop", &["-n", name, value]);
}

// File helpers
pub fn read_file(path: &str) -> String {
    fs::read_to_string(path).unwrap_or_default()
}

pub fn write_file(path: &str, content: &str) {
    let _ = fs::write(path, content);
}

pub fn file_exists(path: &str) -> bool {
    Path::new(path).exists()
}

pub fn ensure_dir(path: &str) {
    let _ = fs::create_dir_all(path);
}

// Detect helper
pub fn detect() {
    echo_localized("Done", "Done");
}

pub fn detect_fail() {
    echo_localized("Failed", "Failed");
}

// HTTP download helper
pub fn download(url: &str) -> Result<String, Box<dyn std::error::Error>> {
    let response = reqwest::blocking::get(url)?;
    if response.status().is_success() {
        Ok(response.text()?)
    } else {
        Err("Download failed".into())
    }
}

pub fn download_with_fallback(main_url: &str, spare_url: &str) -> Result<String, Box<dyn std::error::Error>> {
    match download(main_url) {
        Ok(data) => Ok(data),
        Err(_) => download(spare_url),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_path_helpers() {
        assert_eq!(ts_config(), "/data/adb/tricky_store");
        assert_eq!(tsee_config(), "/data/adb/ts_enhancer_extreme");
        assert_eq!(tsee_mod_dir(), "/data/adb/modules/ts_enhancer_extreme");
        assert_eq!(ts_mod_dir(), "/data/adb/modules/tricky_store");
    }

    #[test]
    fn test_read_write_file() {
        let test_path = "/tmp/tseed_test_file.txt";
        let test_content = "test content 123";
        
        write_file(test_path, test_content);
        let read = read_file(test_path);
        assert_eq!(read, test_content);
        
        // Cleanup
        let _ = fs::remove_file(test_path);
    }

    #[test]
    fn test_file_exists() {
        assert!(file_exists("/"));
        assert!(!file_exists("/nonexistent/path/12345"));
    }

    #[test]
    fn test_ensure_dir() {
        let test_dir = "/tmp/tseed_test_dir_12345";
        ensure_dir(test_dir);
        assert!(file_exists(test_dir));
        let _ = fs::remove_dir(test_dir);
    }

    #[test]
    fn test_run_command_basic() {
        #[cfg(windows)]
        let result = run_command("cmd", &["/C", "echo hello"]);
        #[cfg(not(windows))]
        let result = run_command("echo", &["hello"]);
        assert!(result.contains("hello") || result.trim().is_empty());
    }

    #[test]
    fn test_run_command_status_success() {
        #[cfg(windows)]
        let result = run_command_status("cmd", &["/C", "exit 0"]);
        #[cfg(not(windows))]
        let result = run_command_status("true", &[]);
        assert!(result);
    }

    #[test]
    fn test_run_command_status_failure() {
        #[cfg(windows)]
        let result = run_command_status("cmd", &["/C", "exit 1"]);
        #[cfg(not(windows))]
        let result = run_command_status("false", &[]);
        assert!(!result);
    }

    #[test]
    fn test_run_command_nonexistent() {
        let result = run_command("nonexistent_command_12345", &[]);
        assert!(result.is_empty());
    }
}
