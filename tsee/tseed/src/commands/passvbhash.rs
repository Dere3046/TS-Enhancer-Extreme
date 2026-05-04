use crate::utils::*;
use std::process;

fn extract_vbhash(output: &str) -> String {
    for line in output.lines() {
        let trimmed = line.trim();
        if trimmed.len() == 64 && is_hex(trimmed) {
            return trimmed.to_string();
        }
    }
    String::new()
}

fn is_hex(s: &str) -> bool {
    s.chars().all(|c| c.is_ascii_hexdigit())
}

fn vbhash_file_path() -> String {
    format!("{}/verifiedboothash.txt", tsee_config())
}

pub fn get() {
    let output = tseet_query("vbhash", "get", &[]);
    let hash = extract_vbhash(&output);
    if hash.len() == 64 && is_hex(&hash) {
        let path = vbhash_file_path();
        let _ = std::fs::write(&path, &hash);
        println!("{}", hash);
    } else {
        eprintln!("error: failed to fetch VBHash from TSEET");
        process::exit(1);
    }
}

pub fn apply(hash: &str) {
    if hash.len() != 64 || !is_hex(hash) {
        eprintln!("error: invalid hash format, expected 64 hex chars");
        process::exit(2);
    }
    resetprop_n("ro.boot.vbmeta.digest", hash);
    logcei(&format!("VBHash applied: {}", hash));
    println!("OK: vbhash applied");
}

pub fn persist(hash: &str) {
    if hash.len() != 64 || !is_hex(hash) {
        eprintln!("error: invalid hash format, expected 64 hex chars");
        process::exit(2);
    }
    let path = vbhash_file_path();
    if let Err(e) = std::fs::write(&path, hash) {
        eprintln!("error: failed to write {}: {}", path, e);
        process::exit(1);
    }
    resetprop_n("ro.boot.vbmeta.digest", hash);
    logcei(&format!("VBHash persisted: {}", hash));
    println!("OK: vbhash persisted");
}

pub fn clear() {
    let path = vbhash_file_path();
    if file_exists(&path) {
        let _ = std::fs::remove_file(&path);
    }
    logcei("VBHash cleared");
    println!("OK: vbhash cleared");
}

pub fn state() {
    let path = vbhash_file_path();
    if file_exists(&path) {
        let content = read_file(&path).trim().to_string();
        if content.len() == 64 && is_hex(&content) {
            println!("persisted:{}:{}", content, content);
        } else {
            println!("invalid:{}:{}", content, content);
        }
    } else {
        println!("none");
    }
}

// Legacy boot-time auto-apply: reads file and applies if present
pub fn run() {
    let path = vbhash_file_path();
    if file_exists(&path) {
        let content = read_file(&path).trim().to_string();
        if content.len() == 64 && is_hex(&content) {
            let now = getprop("ro.boot.vbmeta.digest");
            if now != content {
                resetprop_n("ro.boot.vbmeta.digest", &content);
                logcei(&format!("VBHash applied from cache: {}", content));
            } else {
                logcei(&format!("VBHash already correct: {}", content));
            }
        } else {
            logcee("Invalid VBHash cache content");
        }
    } else {
        logcei("No VBHash cache found, skipping");
    }
}
