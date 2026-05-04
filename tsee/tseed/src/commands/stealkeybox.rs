use crate::utils::*;
use std::process;

pub fn run(arg: &str) {
    match arg {
        "-h" | "-help" => {
            println!("stealkeybox\n");
            println!("Usage: tseed stealkeybox <Basic arguments>\n");
            println!("Arguments:");
            println!("  -a (By Tricky Addon)");
            println!("  -b (By Integrity Box)");
            println!("  -c (By YuriKey Manager)\n");
            println!("Options:");
            println!("  -h, -help");
        }
        "-a" | "-b" | "-c" => {
            logcee("Feature removed");
            eprintln!("error: stealkeybox feature has been removed");
            process::exit(1);
        }
        _ => {
            eprintln!("error: unknown argument '{}'", arg);
            eprintln!("Usage: tseed stealkeybox <Basic arguments>");
            eprintln!("For more information, try '-help'.");
            process::exit(2);
        }
    }
}
