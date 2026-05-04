use crate::utils::*;

pub fn run() {
    let app_conflict = vec![
        "com.lingqian.appbl",
        "com.topmiaohan.hidebllist",
    ];

    for package in app_conflict {
        let path_result = run_command("pm", &["path", package]);
        if !path_result.trim().is_empty() {
            let _ = run_command("pm", &["uninstall", package]);
        }
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_conflict_list() {
        let app_conflict = vec![
            "com.lingqian.appbl",
            "com.topmiaohan.hidebllist",
        ];
        assert_eq!(app_conflict.len(), 2);
        assert_eq!(app_conflict[0], "com.lingqian.appbl");
        assert_eq!(app_conflict[1], "com.topmiaohan.hidebllist");
    }

    #[test]
    fn test_empty_path_check() {
        let path_result = "";
        assert!(path_result.trim().is_empty());
    }

    #[test]
    fn test_nonempty_path_check() {
        let path_result = "package:/data/app/com.test";
        assert!(!path_result.trim().is_empty());
    }
}
