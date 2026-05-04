use crate::utils::*;
use std::process;

pub fn run(arg: &str) {
    match arg {
        "" => {
            println!("proxyctl\n");
            println!("Usage: tseed --proxyctl <arguments>\n");
            println!("Arguments:");
            println!("  -state    Check proxy state");
            println!("  -sync     Sync proxy targets");
            println!("  -list     List all apps with proxy status");
            println!("  -add      Add package to proxy list");
            println!("  -remove   Remove package from proxy list");
            println!("  -config   Manage proxy config\n");
            println!("Options:");
            println!("  -h, -help");
            process::exit(2);
        }
        "-h" | "-help" => {
            println!("proxyctl\n");
            println!("Usage: tseed --proxyctl <arguments>\n");
            println!("Arguments:");
            println!("  -state    Check proxy state");
            println!("  -sync     Sync proxy targets");
            println!("  -list     List all apps with proxy status");
            println!("  -add      Add package to proxy list");
            println!("  -remove   Remove package from proxy list");
            println!("  -config   Manage proxy config\n");
            println!("Options:");
            println!("  -h, -help");
        }
        "-state" | "state" => {
            let output = tseet_query("proxy", "state", &[]);
            if output.contains("s=1") || output.contains("Running") {
                println!("running");
            } else {
                println!("stopped");
            }
        }
        "-sync" | "sync" => {
            logcei("Syncing proxy targets");
            let output = tseet_query("proxy", "sync", &[]);
            if output.len() > 0 || !output.is_empty() {
                logcei("Sync successful");
                println!("Sync triggered");
            } else {
                logcee("Sync failed");
                println!("Error: sync failed");
            }
        }
        "-list" | "list" => {
            let output = tseet_query("app", "list", &[]);
            println!("{}", output);
        }
        "-start" | "start" => {
            logcei("Starting proxy via .tseet_enabled flag");
            let flag_file = format!("{}/.tseet_enabled", tsee_mod_dir());
            write_file(&flag_file, "");
            logcei("Proxy start flag created");
            println!("OK: proxy start requested");
        }
        "-stop" | "stop" => {
            logcei("Stopping proxy");
            let flag_file = format!("{}/.tseet_enabled", tsee_mod_dir());
            if file_exists(&flag_file) {
                let _ = run_command("rm", &["-f", &flag_file]);
            }
            kill_tseet();
            logcei("Proxy stopped");
            println!("OK: proxy stopped");
        }
        "-add" => {
            eprintln!("Usage: tseed --proxyctl -add <package> [auto|gen|mod]");
            process::exit(2);
        }
        "-remove" => {
            eprintln!("Usage: tseed --proxyctl -remove <package>");
            process::exit(2);
        }
        "-config" => {
            eprintln!("Usage: tseed --proxyctl -config [mode|add|del] [args...]");
            process::exit(2);
        }
        _ => {
            eprintln!("error: unknown argument '{}'", arg);
            eprintln!("Usage: tseed --proxyctl <arguments>");
            eprintln!("For more information, try '-help'.");
            process::exit(2);
        }
    }
}

pub fn state() -> bool {
    let output = tseet_query("proxy", "state", &[]);
    output.contains("s=1") || output.contains("Running")
}

pub fn run_with_args(args: &[String]) {
    if args.is_empty() {
        run("");
        return;
    }
    
    match args[0].as_str() {
        "-state" | "state" => run("state"),
        "-sync" | "sync" => run("sync"),
        "-start" | "start" => run("start"),
        "-stop" | "stop" => run("stop"),
        "-list" | "list" => run("list"),
        "-add" => {
            if args.len() < 2 {
                eprintln!("Usage: tseed --proxyctl -add <package> [auto|gen|mod]");
                process::exit(2);
            }
            let pkg = &args[1];
            let mode = if args.len() > 2 { args[2].as_str() } else { "auto" };
            let output = tseet_query("app", "add", &[pkg, mode]);
            println!("{}", output);
        }
        "-remove" => {
            if args.len() < 2 {
                eprintln!("Usage: tseed --proxyctl -remove <package>");
                process::exit(2);
            }
            let output = tseet_query("app", "remove", &[args[1].as_str()]);
            println!("{}", output);
        }
        "-config" => {
            if args.len() < 2 {
                let output = tseet_query("app", "config", &[]);
                println!("{}", output);
                return;
            }
            let config_args: Vec<&str> = args[1..].iter().map(|s| s.as_str()).collect();
            let output = tseet_query("app", "config", &config_args);
            println!("{}", output);
        }
        _ => {
            run(&args[0]);
        }
    }
}
