# FindCargo.cmake
# Finds the Rust cargo build system
#
# This module defines:
#   CARGO_EXECUTABLE - Path to cargo executable
#   CARGO_FOUND - Whether cargo was found
#   RUSTC_EXECUTABLE - Path to rustc executable
#   RUSTC_FOUND - Whether rustc was found
#   CARGO_VERSION - Cargo version string
#   RUSTC_VERSION - Rustc version string

find_program(CARGO_EXECUTABLE cargo
    DOC "Path to cargo executable"
    PATHS
        $ENV{CARGO_HOME}/bin
        $ENV{HOME}/.cargo/bin
        /usr/local/bin
        /usr/bin
)

find_program(RUSTC_EXECUTABLE rustc
    DOC "Path to rustc executable"
    PATHS
        $ENV{CARGO_HOME}/bin
        $ENV{HOME}/.cargo/bin
        /usr/local/bin
        /usr/bin
)

if(CARGO_EXECUTABLE)
    execute_process(
        COMMAND ${CARGO_EXECUTABLE} --version
        OUTPUT_VARIABLE CARGO_VERSION_OUTPUT
        OUTPUT_STRIP_TRAILING_WHITESPACE
        ERROR_QUIET
    )
    if(CARGO_VERSION_OUTPUT)
        string(REGEX MATCH "[0-9]+\\.[0-9]+\\.[0-9]+" CARGO_VERSION "${CARGO_VERSION_OUTPUT}")
    endif()
endif()

if(RUSTC_EXECUTABLE)
    execute_process(
        COMMAND ${RUSTC_EXECUTABLE} --version
        OUTPUT_VARIABLE RUSTC_VERSION_OUTPUT
        OUTPUT_STRIP_TRAILING_WHITESPACE
        ERROR_QUIET
    )
    if(RUSTC_VERSION_OUTPUT)
        string(REGEX MATCH "[0-9]+\\.[0-9]+\\.[0-9]+" RUSTC_VERSION "${RUSTC_VERSION_OUTPUT}")
    endif()
endif()

include(FindPackageHandleStandardArgs)
find_package_handle_standard_args(Cargo
    REQUIRED_VARS CARGO_EXECUTABLE RUSTC_EXECUTABLE
    VERSION_VAR CARGO_VERSION
)

mark_as_advanced(CARGO_EXECUTABLE RUSTC_EXECUTABLE)

# Helper function to add a cargo-based target
function(add_cargo_target target_name manifest_dir)
    cmake_parse_arguments(ARG "TEST" "TARGET" "" ${ARGN})
    
    if(NOT ARG_TARGET)
        set(ARG_TARGET "aarch64-linux-android")
    endif()
    
    set(release_dir "${manifest_dir}/target/${ARG_TARGET}/release")
    
    # Determine output name based on target type
    file(STRINGS ${manifest_dir}/Cargo.toml cargo_contents)
    set(is_lib FALSE)
    foreach(line ${cargo_contents})
        if(line MATCHES "^\\[lib\\]")
            set(is_lib TRUE)
        endif()
    endforeach()
    
    if(is_lib)
        set(output_file "${release_dir}/lib${target_name}.so")
    else()
        set(output_file "${release_dir}/${target_name}")
    endif()
    
    # Build target
    add_custom_target(${target_name}
        COMMAND ${CARGO_EXECUTABLE} build --release --target ${ARG_TARGET}
        WORKING_DIRECTORY ${manifest_dir}
        COMMENT "Building ${target_name} for ${ARG_TARGET}"
        VERBATIM
    )
    
    # Test target
    if(ARG_TEST)
        add_custom_target(${target_name}_test
            COMMAND ${CARGO_EXECUTABLE} test --target ${ARG_TARGET}
            WORKING_DIRECTORY ${manifest_dir}
            COMMENT "Testing ${target_name}"
            VERBATIM
        )
    endif()
endfunction()
