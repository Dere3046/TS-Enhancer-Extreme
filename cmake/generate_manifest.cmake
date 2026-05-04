# Generate SHA256 manifest files alongside source files
# Usage: cmake -P generate_manifest.cmake -DOUTPUT_MODULE=<path>

if(NOT DEFINED OUTPUT_MODULE)
    message(FATAL_ERROR "OUTPUT_MODULE not defined")
endif()

# Find all files recursively
file(GLOB_RECURSE ALL_FILES "${OUTPUT_MODULE}/*")

foreach(file_path ${ALL_FILES})
    # Skip directories
    if(IS_DIRECTORY "${file_path}")
        continue()
    endif()
    
    # Skip .sha256 files themselves
    if("${file_path}" MATCHES "\\.sha256$")
        continue()
    endif()
    
    # Get relative path from OUTPUT_MODULE
    file(RELATIVE_PATH rel_path "${OUTPUT_MODULE}" "${file_path}")
    
    # Compute SHA256
    file(SHA256 "${file_path}" hash)
    
    # Write hash file alongside source
    set(hash_file "${file_path}.sha256")
    file(WRITE "${hash_file}" "${hash}")
    
    message(STATUS "SHA256 ${rel_path}")
endforeach()

message(STATUS "Manifest generated (side-by-side .sha256 files)")
