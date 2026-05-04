package com.dere3046.tseet

import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * Simplified proxy configuration manager
 * Single config file: /data/adb/tricky_store/config/proxy.conf
 * Format: mode=blacklist|whitelist\nlist=com.pkg1,com.pkg2
 * Target file: /data/adb/tricky_store/target.txt
 * Suffix: none=auto, !=gen, ?=mod
 */
object TargetProxyManager {
    private const val TS_DIR = "/data/adb/tricky_store"
    private const val TARGET_FILE = "$TS_DIR/target.txt"
    private const val CONFIG_FILE = "$TS_DIR/config/proxy.conf"

    data class ProxyConfig(
        val mode: String, // "blacklist" or "whitelist"
        val list: Set<String>
    )

    data class AppInfo(
        val packageName: String,
        val appName: String,
        val isSystem: Boolean,
        val isProxied: Boolean,
        val certMode: CertMode
    )

    enum class CertMode {
        AUTO, GEN, MOD
    }

    data class AppEntry(val packageName: String, val certMode: CertMode) {
        override fun toString(): String {
            return when (certMode) {
                CertMode.AUTO -> packageName
                CertMode.GEN -> "$packageName!"
                CertMode.MOD -> "$packageName?"
            }
        }
    }

    fun readConfig(): ProxyConfig {
        val content = try {
            File(CONFIG_FILE).readText()
        } catch (_: Exception) {
            "mode=blacklist\nlist="
        }
        
        var mode = "blacklist"
        val list = mutableSetOf<String>()
        
        content.lines().forEach { line ->
            val trimmed = line.trim()
            when {
                trimmed.startsWith("mode=") -> mode = trimmed.substring(5).trim()
                trimmed.startsWith("list=") -> {
                    val items = trimmed.substring(5).split(",").map { it.trim() }.filter { it.isNotBlank() }
                    list.addAll(items)
                }
            }
        }
        
        return ProxyConfig(mode, list)
    }

    fun writeConfig(config: ProxyConfig) {
        val content = buildString {
            appendLine("mode=${config.mode}")
            appendLine("list=${config.list.joinToString(",")}")
        }
        File("$TS_DIR/config").mkdirs()
        File(CONFIG_FILE).writeText(content)
    }

    private const val CACHE_FILE = "$TS_DIR/.app_cache.json"
    private const val CACHE_TTL_MS = 30_000L // 30 seconds

    fun listApps(pm: PackageManager, useCache: Boolean = true): List<AppInfo> {
        // Try cache first for instant response
        if (useCache) {
            val cached = readCache()
            if (cached != null) return cached
        }

        val config = readConfig()
        val targetEntries = readTargetFileRaw().associateBy { it.packageName }

        // Use flag 0 instead of GET_META_DATA for much faster query
        val allApps = try {
            pm.getInstalledApplications(0)
        } catch (_: Exception) {
            emptyList()
        }

        val result = allApps.map { appInfo ->
            val isSystem = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
            val appName = try {
                pm.getApplicationLabel(appInfo).toString()
            } catch (_: Exception) {
                appInfo.packageName
            }
            val entry = targetEntries[appInfo.packageName]
            val isProxied = entry != null

            AppInfo(
                packageName = appInfo.packageName,
                appName = appName,
                isSystem = isSystem,
                isProxied = isProxied,
                certMode = entry?.certMode ?: CertMode.AUTO
            )
        }.sortedWith(compareBy({ !it.isProxied }, { it.appName }))

        // Write cache for next time
        writeCache(result)
        return result
    }

    private fun readCache(): List<AppInfo>? {
        try {
            val cacheFile = File(CACHE_FILE)
            if (!cacheFile.exists()) return null
            if (System.currentTimeMillis() - cacheFile.lastModified() > CACHE_TTL_MS) return null

            val content = cacheFile.readText()
            val array = JSONArray(content)
            return (0 until array.length()).map { i ->
                val obj = array.getJSONObject(i)
                AppInfo(
                    packageName = obj.getString("packageName"),
                    appName = obj.getString("appName"),
                    isSystem = obj.getBoolean("isSystem"),
                    isProxied = obj.getBoolean("isProxied"),
                    certMode = CertMode.valueOf(obj.getString("certMode").uppercase())
                )
            }
        } catch (_: Exception) {
            return null
        }
    }

    private fun writeCache(apps: List<AppInfo>) {
        try {
            val array = JSONArray()
            apps.forEach { app ->
                array.put(JSONObject().apply {
                    put("packageName", app.packageName)
                    put("appName", app.appName)
                    put("isSystem", app.isSystem)
                    put("isProxied", app.isProxied)
                    put("certMode", app.certMode.name.lowercase())
                })
            }
            File(CACHE_FILE).writeText(array.toString())
        } catch (_: Exception) {}
    }

    fun addPackage(packageName: String, certMode: CertMode = CertMode.AUTO) {
        val entries = readTargetFileRaw().toMutableList()
        val existingIndex = entries.indexOfFirst { it.packageName == packageName }
        
        if (existingIndex >= 0) {
            entries[existingIndex] = AppEntry(packageName, certMode)
        } else {
            entries.add(AppEntry(packageName, certMode))
        }
        
        writeEntries(entries.sortedBy { it.packageName })
    }

    fun removePackage(packageName: String) {
        val entries = readTargetFileRaw().filter { it.packageName != packageName }
        writeEntries(entries.sortedBy { it.packageName })
    }

    // Compatibility methods for existing callers
    fun initialize(pm: PackageManager) {
        ensureDirectories()
        regenerateTargetFile(pm)
    }
    
    fun syncPackage(pm: PackageManager, packageName: String) {
        // Simplified: just add if not excluded
        addPackage(packageName, CertMode.AUTO)
    }

    fun regenerateTargetFile(pm: PackageManager) {
        val config = readConfig()
        val entries = mutableListOf<AppEntry>()
        
        val allApps = try {
            pm.getInstalledApplications(PackageManager.GET_META_DATA)
        } catch (_: Exception) {
            emptyList()
        }
        
        allApps.forEach { appInfo ->
            val isSystem = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
            val inList = appInfo.packageName in config.list
            
            val shouldProxy = when (config.mode) {
                "whitelist" -> inList
                "blacklist" -> !inList && !isSystem // Default: all user apps except blacklisted
                else -> !isSystem // Default to user apps only
            }
            
            if (shouldProxy) {
                entries.add(AppEntry(appInfo.packageName, CertMode.AUTO))
            }
        }
        
        // Also include any manually added packages
        val manualEntries = readTargetFileRaw().filter { entry ->
            allApps.any { it.packageName == entry.packageName }
        }
        
        val merged = (entries + manualEntries)
            .associateBy { it.packageName }
            .values
            .toList()
            .sortedBy { it.packageName }
        
        writeEntries(merged)
    }

    fun readTargetFileRaw(): List<AppEntry> {
        val output = try {
            File(TARGET_FILE).readText()
        } catch (_: Exception) {
            return emptyList()
        }
        return output.lines().map { it.trim() }.filter { it.isNotBlank() }.map { parseLine(it) }
    }

    private fun parseLine(line: String): AppEntry {
        return when {
            line.endsWith("!") -> AppEntry(line.dropLast(1), CertMode.GEN)
            line.endsWith("?") -> AppEntry(line.dropLast(1), CertMode.MOD)
            else -> AppEntry(line, CertMode.AUTO)
        }
    }

    private fun writeEntries(entries: List<AppEntry>) {
        try {
            val content = entries.joinToString("\n") { it.toString() } + "\n"
            File(TARGET_FILE).writeText(content)
        } catch (_: Exception) {}
    }

    private fun ensureDirectories() {
        File("$TS_DIR/config").mkdirs()
        File(TS_DIR).mkdirs()
        val configFile = File(CONFIG_FILE)
        if (!configFile.exists()) {
            writeConfig(ProxyConfig("blacklist", emptySet()))
        }
    }
}
