use std::io::{self, Read, Write};
use std::process::{Command, Stdio};
use std::thread;
use std::sync::mpsc;
use std::time::Duration;

#[cfg(unix)]
use std::os::unix::net::UnixStream;
#[cfg(unix)]
use std::path::Path;
#[cfg(unix)]
use std::fs;

const BUF_SIZE: usize = 8192;

fn pump<R, W>(mut reader: R, mut writer: W, done: mpsc::Sender<()>,)
where
    R: Read + Send + 'static,
    W: Write + Send + 'static,
{
    thread::spawn(move || {
        let mut buf = vec![0u8; BUF_SIZE];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    if writer.write_all(&buf[..n]).is_err() {
                        break;
                    }
                    if writer.flush().is_err() {
                        break;
                    }
                }
                Err(e) => {
                    if e.kind() != io::ErrorKind::Interrupted {
                        break;
                    }
                }
            }
        }
        let _ = done.send(());
    });
}

#[cfg(unix)]
fn watchdog_mode(flag_file: &str, socket_path: &str, cmd: &str, args: &[String]) -> ! {
    loop {
        if !Path::new(flag_file).exists() {
            break;
        }

        let _ = fs::remove_file(socket_path);

        let _ = Command::new(cmd)
            .args(args)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn();

        for _ in 0..20 {
            if Path::new(socket_path).exists() {
                break;
            }
            thread::sleep(Duration::from_millis(250));
        }

        if Path::new(socket_path).exists() {
            if let Ok(mut stream) = UnixStream::connect(socket_path) {
                let mut buf = [0u8; 1];
                let _ = Read::read(&mut stream, &mut buf);
            }
        }

        thread::sleep(Duration::from_secs(1));
    }

    let _ = fs::remove_file(socket_path);
    std::process::exit(0);
}

fn forward_mode(args: &[String]) {
    if args.is_empty() {
        eprintln!("Usage: cmd_tool <command> [args...]");
        std::process::exit(2);
    }

    let mut child = match Command::new(&args[0])
        .args(&args[1..])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
    {
        Ok(c) => c,
        Err(e) => {
            eprintln!("cmd_tool: failed to spawn '{}': {}", args[0], e);
            std::process::exit(127);
        }
    };

    let child_stdin = match child.stdin.take() {
        Some(s) => s,
        None => {
            eprintln!("cmd_tool: failed to acquire child stdin");
            std::process::exit(1);
        }
    };
    let child_stdout = match child.stdout.take() {
        Some(s) => s,
        None => {
            eprintln!("cmd_tool: failed to acquire child stdout");
            std::process::exit(1);
        }
    };
    let child_stderr = match child.stderr.take() {
        Some(s) => s,
        None => {
            eprintln!("cmd_tool: failed to acquire child stderr");
            std::process::exit(1);
        }
    };

    let (tx_stdin, rx_stdin) = mpsc::channel();
    let (tx_stdout, rx_stdout) = mpsc::channel();
    let (tx_stderr, rx_stderr) = mpsc::channel();

    pump(io::stdin(), child_stdin, tx_stdin);
    pump(child_stdout, io::stdout(), tx_stdout);
    pump(child_stderr, io::stderr(), tx_stderr);

    let status = match child.wait() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("cmd_tool: failed to wait for child: {}", e);
            std::process::exit(1);
        }
    };

    let _ = rx_stdout.recv_timeout(Duration::from_millis(100));
    let _ = rx_stderr.recv_timeout(Duration::from_millis(100));
    let _ = rx_stdin.recv_timeout(Duration::from_millis(50));

    let code = status.code().unwrap_or(if status.success() { 0 } else { 1 });
    std::process::exit(code);
}

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();

    if args.is_empty() {
        eprintln!("Usage: cmd_tool <command> [args...]");
        #[cfg(unix)]
        eprintln!("       cmd_tool --watchdog <flag> <socket> <cmd> [args...]");
        std::process::exit(2);
    }

    #[cfg(unix)]
    if args[0] == "--watchdog" {
        if args.len() < 4 {
            eprintln!("Usage: cmd_tool --watchdog <flag_file> <socket_path> <command> [args...]");
            std::process::exit(2);
        }
        let flag_file = &args[1];
        let socket_path = &args[2];
        let cmd = &args[3];
        let cmd_args: Vec<String> = args[4..].to_vec();
        watchdog_mode(flag_file, socket_path, cmd, &cmd_args);
    }

    forward_mode(&args);
}
