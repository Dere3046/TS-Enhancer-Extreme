use chacha20poly1305::{
    aead::{Aead, KeyInit},
    ChaCha20Poly1305, Nonce,
};
use ed25519_compact::{PublicKey, Signature};
use std::fs::File;
use std::io::Read;
use std::path::Path;

fn reconstruct_master_key() -> [u8; 32] {
    let p1 = [0x47, 0x91, 0x32, 0xA8, 0xBC, 0xE5, 0x11, 0x7F];
    let p2 = [0xD3, 0x68, 0x55, 0x2C, 0x9E, 0x04, 0x73, 0xB1];
    let p3 = [0x28, 0xFE, 0x6A, 0xC4, 0x15, 0x83, 0xDD, 0xF7];
    let p4 = [0x3B, 0xA0, 0x96, 0x5D, 0xE2, 0x19, 0x4F, 0x77];

    let mut key = [0u8; 32];
    key[0..8].copy_from_slice(&p1);
    key[8..16].copy_from_slice(&p2);
    key[16..24].copy_from_slice(&p3);
    key[24..32].copy_from_slice(&p4);
    key
}

fn derive_key(master: &[u8; 32], context: &str) -> [u8; 32] {
    let mut hasher = blake3::Hasher::new();
    hasher.update(master);
    hasher.update(context.as_bytes());
    hasher.finalize().into()
}

fn derive_nonce(master: &[u8; 32], context: &str) -> [u8; 12] {
    let mut hasher = blake3::Hasher::new();
    hasher.update(master);
    hasher.update(context.as_bytes());
    let hash = hasher.finalize();
    let mut nonce = [0u8; 12];
    nonce.copy_from_slice(&hash.as_bytes()[..12]);
    nonce
}

// Root public key - hardcoded in verifier binary
const ROOT_PUBLIC_KEY: [u8; 32] = [
    0x76, 0xbb, 0xb2, 0xf9, 0xca, 0x76, 0xfa, 0xd2,
    0x96, 0x72, 0x74, 0x3c, 0x40, 0x0c, 0xfa, 0xb8,
    0xcf, 0xf0, 0x6e, 0xc6, 0xd8, 0xcd, 0xac, 0x80,
    0xcf, 0x3a, 0xb7, 0x58, 0xfb, 0xbf, 0xce, 0x4a,
];

const COMMON_FILES: &[&str] = &[
    "script/state.sh",
    "script/util_functions.sh",
    "banner.png",
    "post-fs-data.sh",
    "service.apk",
    "service.sh",
    "uninstall.sh",
    "action.sh",
];

const ARCH_FILES_FLAT: &[&str] = &[
    "bin/cmd_tool",
    "bin/tseed",
    "lib/libverify.so",
];

fn hash_file(path: &Path) -> Option<blake3::Hash> {
    let mut hasher = blake3::Hasher::new();
    let mut f = File::open(path).ok()?;
    let mut buffer = [0u8; 4096];
    loop {
        match f.read(&mut buffer) {
            Ok(0) => break,
            Ok(n) => { hasher.update(&buffer[..n]); }
            Err(_) => return None,
        }
    }
    Some(hasher.finalize())
}

fn compute_common_merkle_root(pwd: &Path) -> Option<[u8; 32]> {
    let action = if pwd.join(".action.sh").exists() {
        ".action.sh"
    } else {
        "action.sh"
    };

    let mut tree_hasher = blake3::Hasher::new();

    for file in COMMON_FILES.iter() {
        let path = if *file == "action.sh" {
            pwd.join(action)
        } else {
            pwd.join(file)
        };

        if !path.exists() {
            return None;
        }

        let hash = hash_file(&path)?;
        tree_hasher.update(hash.as_bytes());
    }

    Some(tree_hasher.finalize().into())
}

fn compute_live_arch_hash_set(pwd: &Path) -> Option<[u8; 32]> {
    let mut hashes: Vec<[u8; 32]> = Vec::new();

    if let Ok(entries) = std::fs::read_dir(pwd.join("bin")) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                let hash = hash_file(&path)?;
                hashes.push(hash.into());
            }
        }
    }

    if let Ok(entries) = std::fs::read_dir(pwd.join("lib")) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                let hash = hash_file(&path)?;
                hashes.push(hash.into());
            }
        }
    }

    if hashes.is_empty() {
        return None;
    }

    hashes.sort();

    let mut set_hasher = blake3::Hasher::new();
    for hash in hashes {
        set_hasher.update(&hash);
    }

    Some(set_hasher.finalize().into())
}

fn decrypt_file(pwd: &Path, filename: &str, key: &[u8; 32], nonce: &[u8; 12]) -> Option<Vec<u8>> {
    let ciphertext = std::fs::read(pwd.join(filename)).ok()?;
    let cipher = ChaCha20Poly1305::new_from_slice(key).ok()?;
    let nonce = Nonce::from_slice(nonce);
    cipher.decrypt(nonce, ciphertext.as_ref()).ok()
}

pub fn verify_at(pwd: &Path) -> bool {
    let master_key = reconstruct_master_key();
    let k1 = derive_key(&master_key, "ranav-v3");
    let k2 = derive_key(&master_key, "ranavs-v3");
    let k3 = derive_key(&master_key, "ranavc-v1");
    let n1 = derive_nonce(&master_key, "nonce-ranav-v3");
    let n2 = derive_nonce(&master_key, "nonce-ranavs-v3");
    let n3 = derive_nonce(&master_key, "nonce-ranavc-v1");

    // Step 1: Decrypt and verify Ranavc (Root certificate)
    let ranavc_plaintext = match decrypt_file(pwd, "Ranavc", &k3, &n3) {
        Some(pt) => pt,
        None => { eprintln!("[VERIFY] Step 1 failed: Ranavc decrypt failed"); return false; }
    };

    if ranavc_plaintext.len() < 96 {
        eprintln!("[VERIFY] Step 1 failed: Ranavc plaintext too short");
        return false;
    }

    let root_cert = &ranavc_plaintext[0..64];
    let build_pubkey_from_cert = &ranavc_plaintext[64..96];

    let root_pk = PublicKey::new(ROOT_PUBLIC_KEY);
    let root_sig = Signature::new(root_cert.try_into().unwrap_or([0u8; 64]));
    if root_pk.verify(build_pubkey_from_cert, &root_sig).is_err() {
        eprintln!("[VERIFY] Step 1 failed: root certificate signature invalid");
        return false;
    }

    // Step 2: Decrypt Ranavs
    let ranavs_plaintext = match decrypt_file(pwd, "Ranavs", &k2, &n2) {
        Some(pt) => pt,
        None => { eprintln!("[VERIFY] Step 2 failed: Ranavs decrypt failed"); return false; }
    };

    if ranavs_plaintext.len() < 64 {
        eprintln!("[VERIFY] Step 2 failed: Ranavs plaintext too short");
        return false;
    }

    let build_pubkey = &ranavs_plaintext[0..32];
    let expected_cross_hash = &ranavs_plaintext[32..64];

    // Step 3: Verify build pubkey consistency between Ranavc and Ranavs
    if build_pubkey != build_pubkey_from_cert {
        eprintln!("[VERIFY] Step 3 failed: build pubkey mismatch between Ranavc and Ranavs");
        return false;
    }

    // Step 4: Decrypt Ranav
    let ranav_plaintext = match decrypt_file(pwd, "Ranav", &k1, &n1) {
        Some(pt) => pt,
        None => { eprintln!("[VERIFY] Step 4 failed: Ranav decrypt failed"); return false; }
    };

    if ranav_plaintext.len() < 128 {
        eprintln!("[VERIFY] Step 4 failed: Ranav plaintext too short");
        return false;
    }

    let module_signature = &ranav_plaintext[0..64];
    let stored_common_root = &ranav_plaintext[64..96];
    let stored_arch_hash = &ranav_plaintext[96..128];

    // Step 5: Cross-validate integrity
    let mut cross_hasher = blake3::Hasher::new();
    cross_hasher.update(module_signature);
    cross_hasher.update(stored_common_root);
    cross_hasher.update(stored_arch_hash);
    let actual_cross_hash = cross_hasher.finalize();

    if expected_cross_hash != actual_cross_hash.as_bytes() {
        eprintln!("[VERIFY] Step 5 failed: cross-hash mismatch");
        return false;
    }

    // Step 6: Compute and verify common Merkle root
    let live_common_root = match compute_common_merkle_root(pwd) {
        Some(root) => root,
        None => { eprintln!("[VERIFY] Step 6 failed: common Merkle root compute failed (missing common file?)"); return false; }
    };

    if stored_common_root != &live_common_root {
        eprintln!("[VERIFY] Step 6 failed: common Merkle root mismatch");
        return false;
    }

    // Step 7: Validate arch files structure
    let mut actual_files: Vec<String> = Vec::new();
    
    if let Ok(entries) = std::fs::read_dir(pwd.join("bin")) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(name) = path.file_name() {
                    actual_files.push(format!("bin/{}", name.to_string_lossy()));
                }
            }
        }
    }
    
    if let Ok(entries) = std::fs::read_dir(pwd.join("lib")) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(name) = path.file_name() {
                    actual_files.push(format!("lib/{}", name.to_string_lossy()));
                }
            }
        }
    }
    
    actual_files.sort();
    
    let expected_files: Vec<String> = ARCH_FILES_FLAT.iter().map(|s| s.to_string()).collect();
    if actual_files != expected_files {
        eprintln!("[VERIFY] Step 7 failed: arch files structure mismatch");
        eprintln!("[VERIFY] expected: {:?}", expected_files);
        eprintln!("[VERIFY] actual:   {:?}", actual_files);
        return false;
    }
    
    // Step 8: Compute and verify arch hash
    let live_arch_hash = match compute_live_arch_hash_set(pwd) {
        Some(hash) => hash,
        None => { eprintln!("[VERIFY] Step 8 failed: arch hash compute failed"); return false; }
    };

    if stored_arch_hash != &live_arch_hash {
        eprintln!("[VERIFY] Step 8 failed: arch hash mismatch");
        return false;
    }

    // Step 9: Verify module signature with build key
    let mut sign_data = Vec::new();
    sign_data.extend_from_slice(stored_common_root);
    sign_data.extend_from_slice(stored_arch_hash);

    let pk = PublicKey::new(build_pubkey.try_into().unwrap_or([0u8; 32]));
    let sig = Signature::new(module_signature.try_into().unwrap_or([0u8; 64]));

    if pk.verify(&sign_data, &sig).is_err() {
        eprintln!("[VERIFY] Step 9 failed: module signature invalid");
        return false;
    }
    true
}

#[unsafe(no_mangle)]
pub extern "C" fn invoke_bridge() -> bool {
    verify_at(Path::new("/data/adb/modules/ts_enhancer_extreme"))
}
