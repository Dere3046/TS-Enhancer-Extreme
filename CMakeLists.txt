cmake_minimum_required(VERSION 3.20)
project(TS-Enhancer-Extreme VERSION 1.1.0)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Add custom modules
list(APPEND CMAKE_MODULE_PATH "${CMAKE_SOURCE_DIR}/cmake/Modules")

# Find required tools
find_package(Cargo REQUIRED)

find_program(NPM_EXECUTABLE npm
    DOC "Path to npm"
)

find_program(GRADLE_EXECUTABLE gradlew
    DOC "Path to Gradle wrapper"
    PATHS ${CMAKE_SOURCE_DIR}/tseet
    NO_DEFAULT_PATH
)

message(STATUS "Found cargo: ${CARGO_EXECUTABLE} (version ${CARGO_VERSION})")
message(STATUS "Found rustc: ${RUSTC_EXECUTABLE} (version ${RUSTC_VERSION})")
if(NPM_EXECUTABLE)
    message(STATUS "Found npm: ${NPM_EXECUTABLE}")
else()
    message(WARNING "npm not found. WebUI build will be skipped.")
endif()
if(GRADLE_EXECUTABLE)
    message(STATUS "Found gradlew: ${GRADLE_EXECUTABLE}")
else()
    message(WARNING "gradlew not found. APP build will be skipped.")
endif()

# Options
option(BUILD_TESTS "Build and run tests" ON)
option(BUILD_ANDROID_APP "Build Android APP via Gradle" ON)
option(BUILD_RUST_COMPONENTS "Build Rust components" ON)
option(BUILD_WEBUI "Build WebUI via npm" ON)

# Android NDK target
set(ANDROID_TARGET "aarch64-linux-android" CACHE STRING "Android target triple")

# Detect Android NDK
if(DEFINED ENV{ANDROID_NDK_HOME})
    set(ANDROID_NDK "$ENV{ANDROID_NDK_HOME}")
elseif(DEFINED ENV{ANDROID_NDK})
    set(ANDROID_NDK "$ENV{ANDROID_NDK}")
endif()

if(ANDROID_NDK AND EXISTS "${ANDROID_NDK}")
    message(STATUS "Found Android NDK: ${ANDROID_NDK}")

    # Determine host tag
    if(CMAKE_HOST_SYSTEM_NAME STREQUAL "Linux")
        set(NDK_HOST_TAG "linux-x86_64")
    elseif(CMAKE_HOST_SYSTEM_NAME STREQUAL "Darwin")
        set(NDK_HOST_TAG "darwin-x86_64")
    elseif(CMAKE_HOST_SYSTEM_NAME STREQUAL "Windows")
        set(NDK_HOST_TAG "windows-x86_64")
    else()
        set(NDK_HOST_TAG "linux-x86_64")
    endif()

    set(NDK_TOOLCHAIN "${ANDROID_NDK}/toolchains/llvm/prebuilt/${NDK_HOST_TAG}")

    if(EXISTS "${NDK_TOOLCHAIN}")
        # Set cargo linker for all Android architectures
        set(ENV{CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER} "${NDK_TOOLCHAIN}/bin/aarch64-linux-android21-clang")
        set(ENV{CC_aarch64_linux_android} "${NDK_TOOLCHAIN}/bin/aarch64-linux-android21-clang")
        set(ENV{AR_aarch64_linux_android} "${NDK_TOOLCHAIN}/bin/llvm-ar")

        set(ENV{CARGO_TARGET_ARMV7_LINUX_ANDROIDEABI_LINKER} "${NDK_TOOLCHAIN}/bin/armv7a-linux-androideabi21-clang")
        set(ENV{CC_armv7_linux_androideabi} "${NDK_TOOLCHAIN}/bin/armv7a-linux-androideabi21-clang")
        set(ENV{AR_armv7_linux_androideabi} "${NDK_TOOLCHAIN}/bin/llvm-ar")

        set(ENV{CARGO_TARGET_I686_LINUX_ANDROID_LINKER} "${NDK_TOOLCHAIN}/bin/i686-linux-android21-clang")
        set(ENV{CC_i686_linux_android} "${NDK_TOOLCHAIN}/bin/i686-linux-android21-clang")
        set(ENV{AR_i686_linux_android} "${NDK_TOOLCHAIN}/bin/llvm-ar")

        set(ENV{CARGO_TARGET_X86_64_LINUX_ANDROID_LINKER} "${NDK_TOOLCHAIN}/bin/x86_64-linux-android21-clang")
        set(ENV{CC_x86_64_linux_android} "${NDK_TOOLCHAIN}/bin/x86_64-linux-android21-clang")
        set(ENV{AR_x86_64_linux_android} "${NDK_TOOLCHAIN}/bin/llvm-ar")

        # Disable OpenSSL vendored for cross-compilation
        set(ENV{OPENSSL_STATIC} "0")

        message(STATUS "NDK toolchain: ${NDK_TOOLCHAIN}")
    else()
        message(WARNING "NDK toolchain not found at ${NDK_TOOLCHAIN}")
    endif()
else()
    message(WARNING "Android NDK not found. Set ANDROID_NDK_HOME or ANDROID_NDK environment variable.")
endif()

# Validate Android target is installed
execute_process(
    COMMAND ${RUSTC_EXECUTABLE} --print target-list
    OUTPUT_VARIABLE RUST_TARGETS
    OUTPUT_STRIP_TRAILING_WHITESPACE
)
if(NOT RUST_TARGETS MATCHES "${ANDROID_TARGET}")
    message(WARNING "Android target ${ANDROID_TARGET} may not be installed. Run: rustup target add ${ANDROID_TARGET}")
endif()

# Source (read-only)
set(MODULE_SRC_DIR "${CMAKE_SOURCE_DIR}/module/src")

# Staging
set(STAGING_DIR "${CMAKE_BINARY_DIR}/staging")
set(STAGING_BIN "${STAGING_DIR}/bin")
set(STAGING_LIB "${STAGING_DIR}/lib")
set(STAGING_WEBROOT "${STAGING_DIR}/webroot")

# Output
set(OUTPUT_DIR "${CMAKE_BINARY_DIR}/output")
set(OUTPUT_MODULE "${OUTPUT_DIR}/module")

# Collect all build targets
set(ALL_BUILD_TARGETS "")
set(ALL_TEST_TARGETS "")

# Rust — cross-compile for Android
if(BUILD_RUST_COMPONENTS)
    # Multi-architecture support
    set(ANDROID_ARCHS
        aarch64-linux-android
        armv7-linux-androideabi
        i686-linux-android
        x86_64-linux-android
    )
    set(ANDROID_ARCH_DIRS
        arm64-v8a
        armeabi-v7a
        x86
        x86_64
    )
    set(ANDROID_RUST_COMPONENTS
        tsee/tseed
        tsee/tseev
        tsee/cmd_tool
    )

    set(ALL_RUST_BUILD_TARGETS "")
    set(ALL_RUST_STAGE_COMMANDS_BIN "")
    set(ALL_RUST_STAGE_COMMANDS_LIB "")

    foreach(arch_triple ${ANDROID_ARCHS})
        list(FIND ANDROID_ARCHS "${arch_triple}" arch_index)
        list(GET ANDROID_ARCH_DIRS ${arch_index} arch_dir)

        foreach(component ${ANDROID_RUST_COMPONENTS})
            get_filename_component(name ${component} NAME)
            set(target_name "rust_${name}_${arch_triple}")
            set(component_dir "${CMAKE_SOURCE_DIR}/${component}")

            # Determine output path
            if(name STREQUAL "tseev")
                set(output_file "${component_dir}/target/${arch_triple}/release/libverify.so")

            else()
                set(output_file "${component_dir}/target/${arch_triple}/release/${name}")
            endif()

            add_custom_target(${target_name}
                COMMAND ${CARGO_EXECUTABLE} build --release --target ${arch_triple}
                WORKING_DIRECTORY ${component_dir}
                BYPRODUCTS ${output_file}
                COMMENT "Building ${name} for ${arch_triple}"
                VERBATIM
            )

            list(APPEND ALL_BUILD_TARGETS ${target_name})
            list(APPEND ALL_RUST_BUILD_TARGETS ${target_name})

            if(BUILD_TESTS)
                set(test_target_name "${target_name}_test")
                add_custom_target(${test_target_name}
                    COMMAND ${CARGO_EXECUTABLE} test --verbose
                    WORKING_DIRECTORY ${component_dir}
                    COMMENT "Testing ${name}"
                    VERBATIM
                )
                list(APPEND ALL_TEST_TARGETS ${test_target_name})
            endif()
        endforeach()
    endforeach()

    # Host-only Rust components
    set(HOST_RUST_COMPONENTS
        tsee/sign_tool
    )

    foreach(component ${HOST_RUST_COMPONENTS})
        get_filename_component(name ${component} NAME)
        set(target_name "rust_${name}")
        set(component_dir "${CMAKE_SOURCE_DIR}/${component}")
        set(output_file "${component_dir}/target/release/${name}")

        add_custom_target(${target_name}
            COMMAND ${CARGO_EXECUTABLE} build --release
            WORKING_DIRECTORY ${component_dir}
            BYPRODUCTS ${output_file}
            COMMENT "Building ${name} (host)"
            VERBATIM
        )

        list(APPEND ALL_BUILD_TARGETS ${target_name})
    endforeach()

    # Stage Android binaries by arch
    set(STAGE_BIN_CMDS
        COMMAND ${CMAKE_COMMAND} -E make_directory ${STAGING_BIN}
    )

    set(STAGE_LIB_CMDS
        COMMAND ${CMAKE_COMMAND} -E make_directory ${STAGING_LIB}
    )

    set(STAGE_BIN_DEPS "")
    set(STAGE_LIB_DEPS "")

    foreach(arch_triple ${ANDROID_ARCHS})
        list(FIND ANDROID_ARCHS "${arch_triple}" arch_index)
        list(GET ANDROID_ARCH_DIRS ${arch_index} arch_dir)

        # Binaries per arch
        list(APPEND STAGE_BIN_CMDS
            COMMAND ${CMAKE_COMMAND} -E make_directory ${STAGING_BIN}/${arch_dir}
            COMMAND ${CMAKE_COMMAND} -E copy_if_different
                ${CMAKE_SOURCE_DIR}/tsee/tseed/target/${arch_triple}/release/tseed
                ${STAGING_BIN}/${arch_dir}/tseed
            COMMAND ${CMAKE_COMMAND} -E copy_if_different
                ${CMAKE_SOURCE_DIR}/tsee/cmd_tool/target/${arch_triple}/release/cmd_tool
                ${STAGING_BIN}/${arch_dir}/cmd_tool
        )
        list(APPEND STAGE_BIN_DEPS
            rust_tseed_${arch_triple}
            rust_cmd_tool_${arch_triple}
        )

        # Library per arch
        list(APPEND STAGE_LIB_CMDS
            COMMAND ${CMAKE_COMMAND} -E make_directory ${STAGING_LIB}/${arch_dir}
            COMMAND ${CMAKE_COMMAND} -E copy_if_different
                ${CMAKE_SOURCE_DIR}/tsee/tseev/target/${arch_triple}/release/libverify.so
                ${STAGING_LIB}/${arch_dir}/libverify.so
        )
        list(APPEND STAGE_LIB_DEPS
            rust_tseev_${arch_triple}
        )
    endforeach()

    add_custom_target(copy_binaries_stage
        ${STAGE_BIN_CMDS}
        DEPENDS ${STAGE_BIN_DEPS}
        COMMENT "Staging binaries"
        VERBATIM
    )

    add_custom_target(copy_library_stage
        ${STAGE_LIB_CMDS}
        DEPENDS ${STAGE_LIB_DEPS}
        COMMENT "Staging library"
        VERBATIM
    )
endif()

# WebUI
if(BUILD_WEBUI AND NPM_EXECUTABLE)
    set(WEBUI_DIR "${CMAKE_SOURCE_DIR}/webui")
    set(WEBUI_DIST "${WEBUI_DIR}/dist")

    add_custom_target(webui_install
        COMMAND ${NPM_EXECUTABLE} install
        WORKING_DIRECTORY ${WEBUI_DIR}
        COMMENT "Installing WebUI dependencies"
        VERBATIM
    )

    add_custom_target(webui_build
        COMMAND ${NPM_EXECUTABLE} run build
        WORKING_DIRECTORY ${WEBUI_DIR}
        BYPRODUCTS ${WEBUI_DIST}
        DEPENDS webui_install
        COMMENT "Building WebUI production bundle"
        VERBATIM
    )
    list(APPEND ALL_BUILD_TARGETS webui_build)

    add_custom_target(copy_webroot_stage
        COMMAND ${CMAKE_COMMAND} -E rm -rf ${STAGING_WEBROOT}
        COMMAND ${CMAKE_COMMAND} -E copy_directory ${WEBUI_DIST} ${STAGING_WEBROOT}
        DEPENDS webui_build
        COMMENT "Staging webroot"
        VERBATIM
    )
endif()

# Gradle app
if(BUILD_ANDROID_APP AND GRADLE_EXECUTABLE)
    add_custom_target(app_assemble
        COMMAND ${GRADLE_EXECUTABLE} assembleRelease
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}/tseet
        COMMENT "Building Android APP"
        VERBATIM
    )
    list(APPEND ALL_BUILD_TARGETS app_assemble)

    if(BUILD_TESTS)
        add_custom_target(app_test
            COMMAND ${GRADLE_EXECUTABLE} test
            WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}/tseet
            COMMENT "Testing Android APP"
            VERBATIM
        )
        list(APPEND ALL_TEST_TARGETS app_test)
    endif()

    add_custom_target(copy_apk_stage
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
            ${CMAKE_SOURCE_DIR}/tseet/app/build/outputs/apk/release/app-release.apk
            ${STAGING_DIR}/service.apk
        DEPENDS app_assemble
        COMMENT "Staging APK"
        VERBATIM
    )
endif()

# Sign tool (host)
set(SIGN_TOOL_DIR "${CMAKE_SOURCE_DIR}/tsee/sign_tool")
set(SIGN_TOOL_BIN "${SIGN_TOOL_DIR}/target/release/sign_tool")

add_custom_target(sign_tool_build
    COMMAND ${CARGO_EXECUTABLE} build --release
    WORKING_DIRECTORY ${SIGN_TOOL_DIR}
    BYPRODUCTS ${SIGN_TOOL_BIN}
    COMMENT "Building sign_tool (host)"
    VERBATIM
)

# Assemble module from staging
set(ASSEMBLE_DEPS copy_binaries_stage copy_library_stage)
if(BUILD_WEBUI AND NPM_EXECUTABLE)
    list(APPEND ASSEMBLE_DEPS copy_webroot_stage)
endif()
if(BUILD_ANDROID_APP AND GRADLE_EXECUTABLE)
    list(APPEND ASSEMBLE_DEPS copy_apk_stage)
endif()

add_custom_target(assemble_module
    COMMAND ${CMAKE_COMMAND} -E rm -rf ${OUTPUT_MODULE}
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${MODULE_SRC_DIR} ${OUTPUT_MODULE}
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${STAGING_BIN} ${OUTPUT_MODULE}/bin
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${STAGING_LIB} ${OUTPUT_MODULE}/lib
    DEPENDS ${ASSEMBLE_DEPS}
    COMMENT "Assembling module"
    VERBATIM
)

if(BUILD_WEBUI AND NPM_EXECUTABLE)
    add_custom_target(assemble_webroot
        COMMAND ${CMAKE_COMMAND} -E rm -rf ${OUTPUT_MODULE}/webroot
        COMMAND ${CMAKE_COMMAND} -E copy_directory ${STAGING_WEBROOT} ${OUTPUT_MODULE}/webroot
        DEPENDS assemble_module copy_webroot_stage
        COMMENT "Overlaying webroot"
        VERBATIM
    )
    set(SIGN_DEPS assemble_webroot)
else()
    set(SIGN_DEPS assemble_module)
endif()

if(BUILD_ANDROID_APP AND GRADLE_EXECUTABLE)
    add_custom_target(assemble_apk
        COMMAND ${CMAKE_COMMAND} -E copy_if_different ${STAGING_DIR}/service.apk ${OUTPUT_MODULE}/service.apk
        DEPENDS ${SIGN_DEPS} copy_apk_stage
        COMMENT "Overlaying APK"
        VERBATIM
    )
    set(SIGN_DEPS assemble_apk)
endif()

# Sign — generates Ranav + Ranavs
add_custom_target(sign_module
    COMMAND ${SIGN_TOOL_BIN} ${OUTPUT_MODULE}
    DEPENDS ${SIGN_DEPS} sign_tool_build
    COMMENT "Signing module files"
    VERBATIM
)

# SHA256 manifest — must follow sign so Ranav/Ranavs are hashed
add_custom_target(generate_manifest
    COMMAND ${CMAKE_COMMAND} -E rm -rf ${OUTPUT_MODULE}/MANIFEST
    COMMAND ${CMAKE_COMMAND} -DOUTPUT_MODULE=${OUTPUT_MODULE} -P ${CMAKE_SOURCE_DIR}/cmake/generate_manifest.cmake
    DEPENDS sign_module
    COMMENT "Generating SHA256 manifest"
    VERBATIM
)

# ZIP
add_custom_target(package_module
    COMMAND ${CMAKE_COMMAND} -E rm -f ${OUTPUT_DIR}/ts_enhancer_extreme.zip
    COMMAND ${CMAKE_COMMAND} -E chdir ${OUTPUT_MODULE} ${CMAKE_COMMAND} -E tar c ${OUTPUT_DIR}/ts_enhancer_extreme.zip --format=zip -- .
    DEPENDS generate_manifest
    COMMENT "Packaging module"
    VERBATIM
)

# Default target
add_custom_target(ts-enhancer-extreme ALL
    DEPENDS package_module
    COMMENT "Building TS-Enhancer-Extreme complete"
)

# Tests
if(BUILD_TESTS AND ALL_TEST_TARGETS)
    add_custom_target(test_all
        DEPENDS ${ALL_TEST_TARGETS}
        COMMENT "Running all tests"
    )
endif()

message(STATUS "=== TS-Enhancer-Extreme Build Configuration ===")
message(STATUS "Build tests: ${BUILD_TESTS}")
message(STATUS "Build Android APP: ${BUILD_ANDROID_APP}")
message(STATUS "Build Rust components: ${BUILD_RUST_COMPONENTS}")
message(STATUS "Build WebUI: ${BUILD_WEBUI}")
message(STATUS "Android target: ${ANDROID_TARGET}")
message(STATUS "Staging: ${STAGING_DIR}")
message(STATUS "Output: ${OUTPUT_DIR}")
message(STATUS "Build targets: ${ALL_BUILD_TARGETS}")
if(BUILD_TESTS)
    message(STATUS "Test targets: ${ALL_TEST_TARGETS}")
endif()
message(STATUS "================================================")
message(STATUS "")
