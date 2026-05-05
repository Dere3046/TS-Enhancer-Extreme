#![allow(unused_imports, dead_code)]

use std::process::Command;

fn get_tseed_path() -> String {
    // In CI/tests, use the debug build from target directory
    std::env::var("CARGO_BIN_EXE_tseed")
        .unwrap_or_else(|_| {
            if cfg!(target_os = "windows") {
                "target/debug/tseed.exe".to_string()
            } else {
                "target/debug/tseed".to_string()
            }
        })
}

fn run_tseed(args: &[&str]) -> (String, String, i32) {
    let bin = get_tseed_path();
    let output = Command::new(&bin)
        .args(args)
        .output()
        .expect("Failed to execute tseed");
    
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let code = output.status.code().unwrap_or(-1);
    
    (stdout, stderr, code)
}

fn is_android_env() -> bool {
    cfg!(target_os = "android") || std::env::var("ANDROID_ROOT").is_ok()
}

mod cli_tests {
    use super::*;

    #[test]
    #[cfg(target_os = "android")]
    fn test_help_flag() {
        let (stdout, _, code) = run_tseed(&["--help"]);
        assert_eq!(code, 0, "Help should exit with code 0");
        assert!(stdout.contains("Tsee cli"), "Help should contain program name");
        assert!(stdout.contains("--proxyctl"), "Help should list proxyctl");
        assert!(stdout.contains("--proxyconfig"), "Help should list proxyconfig");
    }

    #[test]
    #[cfg(target_os = "android")]
    fn test_version_flag() {
        let (stdout, _, code) = run_tseed(&["--version"]);
        assert_eq!(code, 0, "Version should exit with code 0");
        assert!(stdout.contains("1.0.0"), "Version should contain version number");
    }

    #[test]
    #[cfg(target_os = "android")]
    fn test_no_args() {
        let (_, _, code) = run_tseed(&[]);
        assert_eq!(code, 2, "No args should exit with code 2");
    }

    #[test]
    #[cfg(target_os = "android")]
    fn test_unknown_argument() {
        let (_, stderr, code) = run_tseed(&["--unknown"]);
        assert_eq!(code, 2, "Unknown arg should exit with code 2");
        assert!(stderr.contains("error"), "Should show error for unknown arg");
    }

    #[test]
    #[cfg(not(target_os = "android"))]
    fn test_skip_on_non_android() {
        // Skip integration tests on non-Android platforms
        // because verification requires Android libraries
        println!("Skipping CLI tests on non-Android platform");
    }
}

mod proxyctl_tests {
    use super::*;

    #[test]
    #[cfg(target_os = "android")]
    fn test_proxyctl_help() {
        let (stdout, _, code) = run_tseed(&["--proxyctl", "-h"]);
        assert_eq!(code, 0, "proxyctl -h should exit with 0");
        assert!(stdout.contains("proxyctl"), "Should show proxyctl help");
        assert!(stdout.contains("-start"), "Should mention -start");
        assert!(stdout.contains("-stop"), "Should mention -stop");
        assert!(stdout.contains("-state"), "Should mention -state");
    }

    #[test]
    #[cfg(target_os = "android")]
    fn test_proxyctl_no_args() {
        let (_, _, code) = run_tseed(&["--proxyctl"]);
        assert_eq!(code, 2, "proxyctl without args should exit with 2");
    }

    #[test]
    #[cfg(target_os = "android")]
    fn test_proxyctl_state() {
        let (stdout, stderr, code) = run_tseed(&["--proxyctl", "-state"]);
        assert!(code == 0 || code == 1, "Should return valid exit code");
    }

    #[test]
    #[cfg(not(target_os = "android"))]
    fn test_skip_on_non_android() {
        println!("Skipping proxyctl tests on non-Android platform");
    }
}

mod proxyconfig_tests {
    use super::*;

    #[test]
    #[cfg(target_os = "android")]
    fn test_proxyconfig_help() {
        let (stdout, _, code) = run_tseed(&["--proxyconfig", "-h"]);
        assert_eq!(code, 0, "proxyconfig -h should exit with 0");
        assert!(stdout.contains("Proxy Configuration"), "Should show config help");
    }

    #[test]
    #[cfg(target_os = "android")]
    fn test_proxyconfig_list() {
        let (_, _, code) = run_tseed(&["--proxyconfig", "-list"]);
        assert!(code == 0 || code == 1, "Should return valid exit code");
    }

    #[test]
    #[cfg(target_os = "android")]
    fn test_proxyconfig_invalid_mode() {
        let (_, stderr, code) = run_tseed(&["--proxyconfig", "-mode", "invalid_mode"]);
        assert_eq!(code, 2, "Invalid mode should exit with 2");
        assert!(stderr.contains("Invalid mode") || stderr.contains("error"), 
            "Should show error for invalid mode");
    }

    #[test]
    #[cfg(target_os = "android")]
    fn test_proxyconfig_list_operations() {
        let (_, _, code) = run_tseed(&["--proxyconfig", "-usrbl", "list"]);
        assert!(code == 0 || code == 1, "List operation should have valid exit code");
    }

    #[test]
    #[cfg(target_os = "android")]
    fn test_proxyconfig_add_missing_package() {
        let (_, stderr, code) = run_tseed(&["--proxyconfig", "-usrbl", "add"]);
        assert_eq!(code, 2, "Missing package should exit with 2");
        assert!(stderr.contains("Usage") || stderr.contains("package"), 
            "Should show usage for missing package");
    }

    #[test]
    #[cfg(not(target_os = "android"))]
    fn test_skip_on_non_android() {
        println!("Skipping proxyconfig tests on non-Android platform");
    }
}

mod verification_tests {
    use super::*;

    #[test]
    fn test_binary_exists() {
        let bin = get_tseed_path();
        assert!(std::path::Path::new(&bin).exists(), 
            "tseed binary should exist at {}", bin);
    }

    #[test]
    #[cfg(target_os = "android")]
    fn test_multiple_args() {
        let (stdout, _, code) = run_tseed(
            &["--help", "--version"]);
        // Should process first arg and exit
        assert_eq!(code, 0, "Should exit after processing --help");
        assert!(stdout.contains("Tsee cli"), "Should show help");
    }

    #[test]
    #[cfg(not(target_os = "android"))]
    fn test_skip_on_non_android() {
        println!("Skipping verification tests on non-Android platform");
    }
}
