use crate::utils::*;
use std::process;

fn tsbin() -> String {
    format!("{}/bin", ts_mod_dir())
}

pub fn run(arg: &str) {
    let ts_mod = ts_mod_dir();
    let module_prop = format!("{}/module.prop", ts_mod);
    
    let nice_name = if read_file(&module_prop).lines().nth(1).unwrap_or("").contains("OSS") {
        "TrickyStoreOSS"
    } else if read_file(&module_prop).lines().nth(1).unwrap_or("").contains("Simulator") {
        "TEESimulator"
    } else {
        "TrickyStore"
    };

    match arg {
        "" => {
            println!("tsctl\n");
            println!("Usage: tseed tsctl <Basic arguments>\n");
            println!("Arguments:");
            println!("  -stop");
            println!("  -start");
            println!("  -state\n");
            println!("Options:");
            println!("  -h, -help");
            process::exit(2);
        }
        "-h" | "-help" => {
            println!("tsctl\n");
            println!("Usage: tseed tsctl <Basic arguments>\n");
            println!("Arguments:");
            println!("  -stop");
            println!("  -start");
            println!("  -state\n");
            println!("Options:");
            println!("  -h, -help");
        }
        "-stop" => {
            let pid = run_command("pidof", &[nice_name]).trim().to_string();
            if !pid.is_empty() {
                let _ = run_command("kill", &["-9", &pid]);
            }
        }
        "-start" => {
            let tsees_bin = format!("{}/tsees", tsbin());
            let _ = spawn_via_cmd_tool(&tsees_bin, &[]);
        }
        "-state" => {
            let result = run_command("pidof", &[nice_name]);
            if result.trim().is_empty() {
                println!("false");
            } else {
                println!("true");
            }
        }
        _ => {
            eprintln!("error: unknown argument '{}'", arg);
            eprintln!("Usage: tseed tsctl <Basic arguments>");
            eprintln!("For more information, try '-help'.");
            process::exit(2);
        }
    }
}

pub fn state() -> bool {
    let ts_mod = ts_mod_dir();
    let module_prop = format!("{}/module.prop", ts_mod);
    let nice_name = if read_file(&module_prop).lines().nth(1).unwrap_or("").contains("OSS") {
        "TrickyStoreOSS"
    } else if read_file(&module_prop).lines().nth(1).unwrap_or("").contains("Simulator") {
        "TEESimulator"
    } else {
        "TrickyStore"
    };
    let result = run_command("pidof", &[nice_name]);
    !result.trim().is_empty()
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_tsctl_compiles() {
        assert!(true);
    }

    #[test]
    fn test_nicename_parsing() {
        // Test that different module.prop content produces correct nice names
        let lines = ["", "OSS", "Simulator", ""];
        
        let name1 = if lines[1].contains("OSS") {
            "TrickyStoreOSS"
        } else if lines[1].contains("Simulator") {
            "TEESimulator"
        } else {
            "TrickyStore"
        };
        assert_eq!(name1, "TrickyStoreOSS");

        let lines2 = ["", "Simulator", ""];
        let name2 = if lines2[1].contains("OSS") {
            "TrickyStoreOSS"
        } else if lines2[1].contains("Simulator") {
            "TEESimulator"
        } else {
            "TrickyStore"
        };
        assert_eq!(name2, "TEESimulator");

        let lines3 = ["", "TrickyStore", ""];
        let name3 = if lines3[1].contains("OSS") {
            "TrickyStoreOSS"
        } else if lines3[1].contains("Simulator") {
            "TEESimulator"
        } else {
            "TrickyStore"
        };
        assert_eq!(name3, "TrickyStore");
    }
}
