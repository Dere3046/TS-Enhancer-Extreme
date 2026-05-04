val verName by extra("v1.1.0")
val verCode by extra(
    providers.exec {
        commandLine("git", "rev-list", "HEAD", "--count")
    }.standardOutput.asText.get().trim().toInt() + 39
)