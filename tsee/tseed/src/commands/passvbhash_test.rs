#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_vbhash_valid() {
        let input = "some text\naabbccdd11223344556677889900aabbccdd11223344556677889900aabbccdd\nmore text";
        let result = extract_vbhash(input);
        assert_eq!(result, "aabbccdd11223344556677889900aabbccdd11223344556677889900aabbccdd");
    }

    #[test]
    fn test_extract_vbhash_invalid_length() {
        let input = "too short hash";
        let result = extract_vbhash(input);
        assert!(result.is_empty());
    }

    #[test]
    fn test_extract_vbhash_not_hex() {
        let input = "gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg";
        let result = extract_vbhash(input);
        assert!(result.is_empty());
    }

    #[test]
    fn test_is_hex_valid() {
        assert!(is_hex("abcdef0123456789"));
        assert!(is_hex("ABCDEF0123456789"));
    }

    #[test]
    fn test_is_hex_invalid() {
        assert!(!is_hex("ghijklmnop"));
        assert!(!is_hex(""));
    }

    #[test]
    fn test_vbhash_file_path() {
        let path = vbhash_file_path();
        assert!(path.contains("verifiedboothash.txt"));
    }
}
