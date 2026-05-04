use chacha20poly1305::{
    aead::{Aead, KeyInit},
    ChaCha20Poly1305, Nonce,
};
use ed25519_compact::KeyPair;
use std::env;
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

// Obfuscation: seed is encrypted, key is derived from seemingly innocent constants
// These constants look like normal binary data (file headers, version IDs, padding, checksums)
const _MAGIC_HEADER: [u8; 8] = [0x42, 0x4D, 0x46, 0x00, 0x00, 0x00, 0x00, 0x00];
const _VERSION_ID: [u8; 4] = [0x01, 0x00, 0x00, 0x00];
const _ALIGN_PAD: [u8; 12] = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
const _CHECKSUM_DUMMY: [u8; 8] = [0xDE, 0xAD, 0xBE, 0xEF, 0xCA, 0xFE, 0xBA, 0xBE];

const ENCRYPTED_ROOT_SEED: [u8; 32] = [
    0xc3, 0xb9, 0x6e, 0x3f, 0x09, 0x0e, 0x3a, 0xf7,
    0x50, 0xfc, 0x77, 0x99, 0x4a, 0xca, 0x6b, 0x41,
    0x0d, 0x59, 0x5e, 0x42, 0x2b, 0x63, 0xea, 0x94,
    0xe6, 0xac, 0xee, 0xa8, 0xd7, 0x6e, 0x1b, 0x6c,
];

fn derive_seed_key() -> [u8; 32] {
    let mut key = [0u8; 32];
    
    // Round 1: derive from "innocent" constants with bit manipulation
    for i in 0..8 {
        key[i] = _MAGIC_HEADER[i].wrapping_mul(7);
        key[i] = key[i].rotate_left((i % 8) as u32);
        
        key[i + 8] = _VERSION_ID[i % 4].wrapping_add(0x5A);
        key[i + 8] = key[i + 8].rotate_right(3);
        
        key[i + 16] = _ALIGN_PAD[i].wrapping_add(0xEE);
        key[i + 16] = key[i + 16].rotate_left(5);
        
        key[i + 24] = _CHECKSUM_DUMMY[i].wrapping_mul(3);
        key[i + 24] = key[i + 24].rotate_right(2);
    }
    
    // Round 2: chain XOR for confusion
    for i in 0..32 {
        key[i] = key[i].wrapping_add((i * 7 + 13) as u8);
        if i > 0 {
            key[i] ^= key[i - 1];
        }
    }
    
    // Round 3: scramble with prime-based offsets
    const PRIMES: [u8; 32] = [
        0x02, 0x03, 0x05, 0x07, 0x0B, 0x0D, 0x11, 0x13,
        0x17, 0x1D, 0x1F, 0x25, 0x29, 0x2B, 0x2F, 0x35,
        0x3B, 0x3D, 0x43, 0x47, 0x49, 0x4F, 0x53, 0x59,
        0x61, 0x65, 0x67, 0x6B, 0x6D, 0x71, 0x7F, 0x83,
    ];
    for i in 0..32 {
        key[i] ^= PRIMES[i];
    }
    
    // Fake dead code for obfuscation (never executed due to compile-time false)
    if false {
        for i in 0..32 {
            key[i] = key[i].wrapping_mul(0xAA);
        }
    }
    
    key
}

fn get_root_keypair() -> KeyPair {
    let mut seed = [0u8; 32];
    let key = derive_seed_key();
    for i in 0..32 {
        seed[i] = ENCRYPTED_ROOT_SEED[i] ^ key[i];
    }
    KeyPair::from_seed(seed.into())
}

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

const ARCH_GROUPS: &[(&str, [&str; 3])] = &[
    ("arm64-v8a", [
        "bin/arm64-v8a/tseed",
        "bin/arm64-v8a/cmd_tool",
        "lib/arm64-v8a/libverify.so",
    ]),
    ("armeabi-v7a", [
        "bin/armeabi-v7a/tseed",
        "bin/armeabi-v7a/cmd_tool",
        "lib/armeabi-v7a/libverify.so",
    ]),
    ("x86", [
        "bin/x86/tseed",
        "bin/x86/cmd_tool",
        "lib/x86/libverify.so",
    ]),
    ("x86_64", [
        "bin/x86_64/tseed",
        "bin/x86_64/cmd_tool",
        "lib/x86_64/libverify.so",
    ]),
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

fn compute_common_merkle_root(module_dir: &Path) -> Option<[u8; 32]> {
    let action_file = if module_dir.join(".action.sh").exists() {
        ".action.sh"
    } else {
        "action.sh"
    };

    let mut tree_hasher = blake3::Hasher::new();

    for file in COMMON_FILES.iter() {
        let path = if *file == "action.sh" {
            module_dir.join(action_file)
        } else {
            module_dir.join(file)
        };

        if !path.exists() {
            eprintln!("Missing common file: {}", path.display());
            return None;
        }

        let hash = hash_file(&path)?;
        tree_hasher.update(hash.as_bytes());
    }

    Some(tree_hasher.finalize().into())
}

const COMMON_ARCH_FILES: &[&str] = &[];

fn compute_arch_hash(module_dir: &Path, group: &[&str]) -> Option<[u8; 32]> {
    let mut hashes: Vec<[u8; 32]> = Vec::new();

    // Add common arch files (tseet, tseetd)
    for file in COMMON_ARCH_FILES.iter() {
        let path = module_dir.join(file);
        if !path.exists() {
            eprintln!("Missing common arch file: {}", path.display());
            return None;
        }
        let hash = hash_file(&path)?;
        hashes.push(hash.into());
    }

    // Add arch-specific files
    for file in group.iter() {
        let path = module_dir.join(file);
        if !path.exists() {
            eprintln!("Missing arch file: {}", path.display());
            return None;
        }
        let hash = hash_file(&path)?;
        hashes.push(hash.into());
    }

    hashes.sort();

    let mut set_hasher = blake3::Hasher::new();
    for hash in hashes {
        set_hasher.update(&hash);
    }

    Some(set_hasher.finalize().into())
}

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() != 2 {
        eprintln!("Usage: sign_tool <module_dir>");
        std::process::exit(1);
    }

    let module_dir = Path::new(&args[1]);
    if !module_dir.is_dir() {
        eprintln!("Invalid module directory: {}", args[1]);
        std::process::exit(1);
    }

    let common_root = match compute_common_merkle_root(module_dir) {
        Some(root) => root,
        None => {
            eprintln!("Failed to compute common Merkle root");
            std::process::exit(1);
        }
    };
    println!("Common Merkle root: {}", hex::encode(&common_root));

    // Trust chain: Root key -> Build key -> Module content
    let root_kp = get_root_keypair();
    println!("Root public key: {}", hex::encode(&root_kp.pk[..]));

    let build_kp = KeyPair::generate();
    let build_pubkey = &build_kp.pk[..];
    println!("Build public key: {}", hex::encode(build_pubkey));

    // Root certificate: root signs build pubkey
    let root_cert = root_kp.sk.sign(build_pubkey, None);

    let master_key = reconstruct_master_key();
    let k1 = derive_key(&master_key, "ranav-v3");
    let k2 = derive_key(&master_key, "ranavs-v3");
    let k3 = derive_key(&master_key, "ranavc-v1");
    let n1 = derive_nonce(&master_key, "nonce-ranav-v3");
    let n2 = derive_nonce(&master_key, "nonce-ranavs-v3");
    let n3 = derive_nonce(&master_key, "nonce-ranavc-v1");

    let cipher1 = ChaCha20Poly1305::new_from_slice(&k1).unwrap();
    let cipher2 = ChaCha20Poly1305::new_from_slice(&k2).unwrap();
    let cipher3 = ChaCha20Poly1305::new_from_slice(&k3).unwrap();

    // Write Ranavc: root_cert(64) || build_pubkey(32) = 96 bytes plaintext
    let mut ranavc_plaintext = Vec::new();
    ranavc_plaintext.extend_from_slice(&root_cert[..]);
    ranavc_plaintext.extend_from_slice(build_pubkey);

    let ranavc_ciphertext = cipher3.encrypt(Nonce::from_slice(&n3), ranavc_plaintext.as_ref())
        .expect("Ranavc encryption failed");

    let ranavc_path = module_dir.join("Ranavc");
    std::fs::write(&ranavc_path, ranavc_ciphertext)
        .expect("Failed to write Ranavc");
    println!("Ranavc saved to {} ({} bytes)", ranavc_path.display(), ranavc_path.metadata().unwrap().len());

    // Sign each architecture
    for (arch_name, group) in ARCH_GROUPS.iter() {
        let arch_hash = match compute_arch_hash(module_dir, group) {
            Some(h) => h,
            None => {
                eprintln!("Failed to compute arch hash for {}", arch_name);
                std::process::exit(1);
            }
        };
        println!("Arch {} hash: {}", arch_name, hex::encode(&arch_hash));

        // Build key signs module content
        let mut sign_data = Vec::new();
        sign_data.extend_from_slice(&common_root);
        sign_data.extend_from_slice(&arch_hash);
        let module_signature = build_kp.sk.sign(&sign_data, None);

        let mut ranav_plaintext = Vec::new();
        ranav_plaintext.extend_from_slice(&module_signature[..]);
        ranav_plaintext.extend_from_slice(&common_root);
        ranav_plaintext.extend_from_slice(&arch_hash);

        let ranav_ciphertext = cipher1.encrypt(Nonce::from_slice(&n1), ranav_plaintext.as_ref())
            .expect("Ranav encryption failed");

        // Cross hash for integrity
        let mut cross_hasher = blake3::Hasher::new();
        cross_hasher.update(&module_signature[..]);
        cross_hasher.update(&common_root);
        cross_hasher.update(&arch_hash);
        let cross_hash = cross_hasher.finalize();

        let mut ranavs_plaintext = Vec::new();
        ranavs_plaintext.extend_from_slice(build_pubkey);
        ranavs_plaintext.extend_from_slice(cross_hash.as_bytes());

        let ranavs_ciphertext = cipher2.encrypt(Nonce::from_slice(&n2), ranavs_plaintext.as_ref())
            .expect("Ranavs encryption failed");

        let ranav_path = module_dir.join(format!("Ranav.{}", arch_name));
        std::fs::write(&ranav_path, ranav_ciphertext)
            .expect("Failed to write Ranav");

        let ranavs_path = module_dir.join(format!("Ranavs.{}", arch_name));
        std::fs::write(&ranavs_path, ranavs_ciphertext)
            .expect("Failed to write Ranavs");

        println!("Ranav.{} saved ({} bytes)", arch_name, ranav_path.metadata().unwrap().len());
        println!("Ranavs.{} saved ({} bytes)", arch_name, ranavs_path.metadata().unwrap().len());
    }
}
