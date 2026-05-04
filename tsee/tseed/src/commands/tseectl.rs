use crate::utils::*;
use std::process;

pub fn run(arg: &str) {
    match arg {
        "" => {
            println!("tseectl\n");
            println!("Usage: tseed tseectl <Basic arguments>\n");
            println!("Arguments:");
            println!("  -stop");
            println!("  -start");
            println!("  -state\n");
            println!("Options:");
            println!("  -h, -help");
            process::exit(2);
        }
        "-h" | "-help" => {
            println!("tseectl\n");
            println!("Usage: tseed tseectl <Basic arguments>\n");
            println!("Arguments:");
            println!("  -stop");
            println!("  -start");
            println!("  -state\n");
            println!("Options:");
            println!("  -h, -help");
        }
        "-stop" => {
            let pid = run_command("pidof", &["tsees"]).trim().to_string();
            if !pid.is_empty() {
                let _ = run_command("kill", &["-9", &pid]);
            }
        }
        "-start" => {
            let tsees_bin = format!("{}/tsees", tsee_bin());
            let _ = spawn_via_cmd_tool(&tsees_bin, &[]);
        }
        "-state" => {
            let result = run_command("pidof", &["tsees"]);
            if result.trim().is_empty() {
                println!("false");
            } else {
                println!("true");
            }
        }
        _ => {
            eprintln!("error: unknown argument '{}'", arg);
            eprintln!("Usage: tseed tseectl <Basic arguments>");
            eprintln!("For more information, try '-help'.");
            process::exit(2);
        }
    }
}

pub fn state() -> bool {
    let result = run_command("pidof", &["tsees"]);
    !result.trim().is_empty()
}
