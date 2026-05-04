import org.jetbrains.kotlin.gradle.dsl.KotlinVersion

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

dependencies {
    implementation("org.bouncycastle:bcprov-jdk18on:1.80")
    implementation("androidx.core:core-ktx:1.12.0")
}

val verName: String by rootProject.extra
val verCode: Int by rootProject.extra

android {
    namespace = "com.dere3046.tseet"
    buildToolsVersion = "35.0.0"
    compileSdk = 35
    defaultConfig {
        minSdk = 24
        targetSdk = 34
        versionCode = verCode
        versionName = verName
    }

    buildTypes {
        debug {
            versionNameSuffix = "-debug"
        }
        release {
            isMinifyEnabled = false
            vcsInfo.include = false
            signingConfig = android.signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }

    kotlinOptions {
        jvmTarget = "21"
    }

    packaging {
        resources {
            excludes += setOf("**")
        }
    }

    lint {
        checkReleaseBuilds = false
    }
}

configurations.configureEach {
    exclude(group = "org.jetbrains.kotlin", module = "kotlin-stdlib-jdk7")
    exclude(group = "org.jetbrains.kotlin", module = "kotlin-stdlib-jdk8")
}
