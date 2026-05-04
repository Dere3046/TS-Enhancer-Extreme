package com.dere3046.tseet

import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.os.Looper
import android.os.Process
import android.util.Base64
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.File

class Main {
    companion object {
        private const val PID_FILE = "/data/adb/ts_enhancer_extreme/proxy.pid"
        private const val CMD_TOOL = "/data/adb/modules/ts_enhancer_extreme/bin/cmd_tool"
        
        private fun getSystemContext(): Context {
            val activityThreadClass = Class.forName("android.app.ActivityThread")
            val systemMainMethod = activityThreadClass.getMethod("systemMain")
            val activityThread = systemMainMethod.invoke(null)
            val getSystemContextMethod = activityThreadClass.getMethod("getSystemContext")
            return getSystemContextMethod.invoke(activityThread) as Context
        }
        
        @JvmStatic
        fun main(args: Array<String>) {
            try {
                if (args.isEmpty()) {
                    println("Usage: tseet [start|stop|sync|vbhash|state|list|add|remove|config]")
                    return
                }
                
                when (args[0]) {
                    "start" -> startProxy()
                    "stop" -> stopProxy()
                    "sync" -> syncProxy()
                    "vbhash" -> getVBHash()
                    "state" -> checkState()
                    "list" -> listApps(args)
                    "list-names" -> listAppNames(args)
                    "info" -> getAppInfo(args)
                    "icon" -> getAppIcon(args)
                    "test" -> testConnection()
                    "add" -> addPackage(args)
                    "remove" -> removePackage(args)
                    "config" -> manageConfig(args)
                    else -> println("Unknown: ${args[0]}")
                }
            } catch (e: Exception) {
                e.printStackTrace()
                Process.killProcess(Process.myPid())
            }
        }
        
        private fun startProxy() {
            if (isProxyRunning()) {
                println("Already running")
                return
            }
            
            Looper.prepare()
            val context = getSystemContext()
            
            File(PID_FILE).writeText(Process.myPid().toString())
            
            val intent = Intent(context, TargetProxyService::class.java).apply {
                action = TargetProxyService.ACTION_START
                setPackage(context.packageName)
            }
            context.startService(intent)
            println("Started")

            SocketServer.start()
            
            Looper.loop()
        }
        
        private fun stopProxy() {
            val pidFile = File(PID_FILE)
            if (!pidFile.exists()) {
                println("Not running")
                return
            }
            
            val pid = pidFile.readText().trim().toIntOrNull()
            if (pid != null) {
                try {
                    Runtime.getRuntime().exec(arrayOf(CMD_TOOL, "kill", "-9", "$pid"))
                    println("Stopped")
                } catch (e: Exception) {
                    println("Failed: ${e.message}")
                }
            }
            pidFile.delete()
        }
        
        private fun syncProxy() {
            if (!isProxyRunning()) {
                println("Not running")
                return
            }
            
            Looper.prepare()
            val context = getSystemContext()
            
            val intent = Intent(context, TargetProxyService::class.java).apply {
                action = TargetProxyService.ACTION_SYNC
                setPackage(context.packageName)
            }
            context.startService(intent)
            println("Synced")
        }
        
        private fun getVBHash() {
            Looper.prepare()
            val context = getSystemContext()
            
            val provider = VBHashProvider()
            provider.attachInfo(context, null)
            
            val result = provider.call("X1", null, null)
            val hash = result?.getString("h")
            if (hash != null) {
                println(hash)
            } else {
                println("Error: ${result?.getString("e") ?: "?"}")
            }
        }
        
        private fun checkState() {
            if (isProxyRunning()) {
                println("s=1")
                println("Running")
            } else {
                println("s=0")
                println("Stopped")
            }
        }
        
        private fun isProxyRunning(): Boolean {
            val pidFile = File(PID_FILE)
            if (!pidFile.exists()) return false
            
            val pid = pidFile.readText().trim().toIntOrNull() ?: return false
            
            return try {
                val process = Runtime.getRuntime().exec(arrayOf(CMD_TOOL, "kill", "-0", "$pid"))
                val exitCode = process.waitFor()
                if (exitCode != 0) {
                    pidFile.delete()
                    false
                } else {
                    true
                }
            } catch (e: Exception) {
                pidFile.delete()
                false
            }
        }
        
        private fun listApps(args: Array<String>) {
            try {
                Looper.prepare()
                val context = getSystemContext()
                val pm = context.packageManager
                
                val useCache = !args.contains("--refresh")
                
                val filter = when {
                    args.contains("--system") -> "system"
                    args.contains("--user") -> "user"
                    else -> "all"
                }
                
                val apps = TargetProxyManager.listApps(pm, useCache).filter { app ->
                    when (filter) {
                        "system" -> app.isSystem
                        "user" -> !app.isSystem
                        else -> true
                    }
                }
                
                val jsonArray = JSONArray()
                apps.forEach { app ->
                    jsonArray.put(JSONObject().apply {
                        put("packageName", app.packageName)
                        put("appName", app.appName)
                        put("isSystem", app.isSystem)
                        put("isProxied", app.isProxied)
                        put("certMode", app.certMode.name.lowercase())
                    })
                }
                
                println(jsonArray.toString())
            } catch (e: Exception) {
                println("Error: ${e.message}")
            }
        }
        
        private fun listAppNames(args: Array<String>) {
            try {
                Looper.prepare()
                val context = getSystemContext()
                val pm = context.packageManager
                
                val filter = when {
                    args.contains("--system") -> "system"
                    args.contains("--user") -> "user"
                    else -> "all"
                }
                
                val targetEntries = TargetProxyManager.readTargetFileRaw().associateBy { it.packageName }
                
                val allApps = try {
                    pm.getInstalledApplications(0)
                } catch (_: Exception) {
                    emptyList()
                }
                
                val apps = allApps.mapNotNull { appInfo ->
                    val isSystem = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                    when (filter) {
                        "system" -> if (!isSystem) return@mapNotNull null
                        "user" -> if (isSystem) return@mapNotNull null
                    }
                    val entry = targetEntries[appInfo.packageName]
                    val appName = try {
                        pm.getApplicationLabel(appInfo).toString()
                    } catch (_: Exception) {
                        appInfo.packageName
                    }
                    JSONObject().apply {
                        put("packageName", appInfo.packageName)
                        put("appName", appName)
                        put("isSystem", isSystem)
                        put("isProxied", entry != null)
                        put("certMode", entry?.certMode?.name?.lowercase() ?: "auto")
                    }
                }
                
                val jsonArray = JSONArray()
                apps.forEach { jsonArray.put(it) }
                println(jsonArray.toString())
            } catch (e: Exception) {
                println("Error: ${e.message}")
            }
        }
        
        private fun getAppInfo(args: Array<String>) {
            try {
                Looper.prepare()
                val context = getSystemContext()
                val pm = context.packageManager
                
                val targetEntries = TargetProxyManager.readTargetFileRaw().associateBy { it.packageName }
                
                val jsonArray = JSONArray()
                for (i in 1 until args.size) {
                    val packageName = args[i]
                    try {
                        val appInfo = pm.getApplicationInfo(packageName, 0)
                        val isSystem = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                        val appName = try {
                            pm.getApplicationLabel(appInfo).toString()
                        } catch (_: Exception) {
                            packageName
                        }
                        val entry = targetEntries[packageName]
                        jsonArray.put(JSONObject().apply {
                            put("packageName", packageName)
                            put("appName", appName)
                            put("isSystem", isSystem)
                            put("isProxied", entry != null)
                            put("certMode", entry?.certMode?.name?.lowercase() ?: "auto")
                        })
                    } catch (_: Exception) {
                        // Package not found, skip
                    }
                }
                println(jsonArray.toString())
            } catch (e: Exception) {
                println("Error: ${e.message}")
            }
        }
        
        private fun getAppIcon(args: Array<String>) {
            if (args.size < 2) {
                println("Usage: tseet icon <package>")
                return
            }
            val packageName = args[1]
            try {
                Looper.prepare()
                val context = getSystemContext()
                val pm = context.packageManager
                val drawable = pm.getApplicationIcon(packageName)
                
                val bitmap = when (drawable) {
                    is BitmapDrawable -> drawable.bitmap
                    else -> {
                        val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 96
                        val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 96
                        val bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                        val canvas = Canvas(bmp)
                        drawable.setBounds(0, 0, width, height)
                        drawable.draw(canvas)
                        bmp
                    }
                }
                
                val stream = ByteArrayOutputStream()
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
                val base64 = Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)
                println("data:image/png;base64,$base64")
            } catch (e: Exception) {
                println("Error: ${e.message}")
            }
        }
        
        private fun addPackage(args: Array<String>) {
            if (args.size < 2) {
                println("Usage: tseet add <package> [auto|gen|mod]")
                return
            }
            
            val packageName = args[1]
            val certMode = when {
                args.size > 2 && args[2] == "gen" -> TargetProxyManager.CertMode.GEN
                args.size > 2 && args[2] == "mod" -> TargetProxyManager.CertMode.MOD
                else -> TargetProxyManager.CertMode.AUTO
            }
            
            try {
                TargetProxyManager.addPackage(packageName, certMode)
                println("OK: added $packageName (${certMode.name.lowercase()})")
            } catch (e: Exception) {
                println("Error: ${e.message}")
            }
        }
        
        private fun testConnection() {
            println("OK: TSEET reachable")
        }
        
        private fun removePackage(args: Array<String>) {
            if (args.size < 2) {
                println("Usage: tseet remove <package>")
                return
            }
            
            try {
                TargetProxyManager.removePackage(args[1])
                println("OK: removed ${args[1]}")
            } catch (e: Exception) {
                println("Error: ${e.message}")
            }
        }
        
        private fun manageConfig(args: Array<String>) {
            if (args.size < 2) {
                val config = TargetProxyManager.readConfig()
                println("mode=${config.mode}")
                println("list=${config.list.joinToString(",")}")
                return
            }
            
            when (args[1]) {
                "mode" -> {
                    if (args.size < 3) {
                        println("Usage: tseet config mode [blacklist|whitelist]")
                        return
                    }
                    val config = TargetProxyManager.readConfig()
                    TargetProxyManager.writeConfig(config.copy(mode = args[2]))
                    println("OK: mode=${args[2]}")
                }
                "add" -> {
                    if (args.size < 3) {
                        println("Usage: tseet config add <package>")
                        return
                    }
                    val config = TargetProxyManager.readConfig()
                    val newList = config.list.toMutableSet()
                    newList.add(args[2])
                    TargetProxyManager.writeConfig(config.copy(list = newList))
                    println("OK: added ${args[2]}")
                }
                "del" -> {
                    if (args.size < 3) {
                        println("Usage: tseet config del <package>")
                        return
                    }
                    val config = TargetProxyManager.readConfig()
                    val newList = config.list.toMutableSet()
                    newList.remove(args[2])
                    TargetProxyManager.writeConfig(config.copy(list = newList))
                    println("OK: removed ${args[2]}")
                }
                else -> println("Unknown config command: ${args[1]}")
            }
        }

        @JvmStatic
        fun handleCommand(ns: String, act: String, args: Array<String>): String {
            return try {
                when (ns) {
                    "app" -> handleAppCommand(act, args)
                    "vbhash" -> handleVbhashCommand(act, args)
                    "proxy" -> handleProxyCommand(act, args)
                    else -> """{"ok":false,"error":"unknown namespace"}"""
                }
            } catch (e: Exception) {
                """{"ok":false,"error":"${e.message?.replace("\"","\\\"")}"}"""
            }
        }

        private fun handleAppCommand(act: String, args: Array<String>): String {
            Looper.prepare()
            val context = getSystemContext()
            val pm = context.packageManager
            return when (act) {
                "list-names" -> {
                    val filter = when {
                        args.contains("--system") -> "system"
                        args.contains("--user") -> "user"
                        else -> "all"
                    }
                    listAppNamesForSocket(pm, filter)
                }
                "info" -> {
                    val result = JSONArray()
                    for (i in 0 until args.size) {
                        try {
                            val ai = pm.getApplicationInfo(args[i], 0)
                            val isSys = (ai.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0
                            val label = try { pm.getApplicationLabel(ai).toString() } catch (_: Exception) { args[i] }
                            val entry = TargetProxyManager.readTargetFileRaw().associateBy { it.packageName }
                            val e = entry[args[i]]
                            result.put(JSONObject().apply {
                                put("packageName", args[i]); put("appName", label)
                                put("isSystem", isSys); put("isProxied", e != null)
                                put("certMode", e?.certMode?.name?.lowercase() ?: "auto")
                            })
                        } catch (_: Exception) {}
                    }
                    """{"ok":true,"data":${result.toString()}}"""
                }
                "add" -> {
                    if (args.isEmpty()) return """{"ok":false,"error":"missing package"}"""
                    val mode = when (args.getOrElse(1) { "auto" }) {
                        "gen" -> TargetProxyManager.CertMode.GEN
                        "mod" -> TargetProxyManager.CertMode.MOD
                        else -> TargetProxyManager.CertMode.AUTO
                    }
                    TargetProxyManager.addPackage(args[0], mode)
                    """{"ok":true}"""
                }
                "remove" -> {
                    if (args.isEmpty()) return """{"ok":false,"error":"missing package"}"""
                    TargetProxyManager.removePackage(args[0])
                    """{"ok":true}"""
                }
                "icon" -> {
                    if (args.isEmpty()) return """{"ok":false,"error":"missing package"}"""
                    try {
                        val drawable = pm.getApplicationIcon(args[0])
                        val bmp = when (drawable) {
                            is android.graphics.drawable.BitmapDrawable -> drawable.bitmap
                            else -> {
                                val w = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 96
                                val h = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 96
                                val b = android.graphics.Bitmap.createBitmap(w, h, android.graphics.Bitmap.Config.ARGB_8888)
                                val c = android.graphics.Canvas(b)
                                drawable.setBounds(0, 0, w, h)
                                drawable.draw(c)
                                b
                            }
                        }
                        val stream = java.io.ByteArrayOutputStream()
                        bmp.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, stream)
                        val b64 = android.util.Base64.encodeToString(stream.toByteArray(), android.util.Base64.NO_WRAP)
                        """{"ok":true,"data":"data:image/png;base64,$b64"}"""
                    } catch (e: Exception) {
                        """{"ok":false,"error":"${e.message}"}"""
                    }
                }
                "config" -> {
                    val config = TargetProxyManager.readConfig()
                    if (args.isEmpty()) {
                        """{"ok":true,"data":{"mode":"${config.mode}","list":[${config.list.joinToString("\",\"") { "\"$it\"" }}]}}"""
                    } else when (args[0]) {
                        "mode" -> {
                            if (args.size < 2) return """{"ok":false,"error":"missing mode"}"""
                            TargetProxyManager.writeConfig(config.copy(mode = args[1]))
                            """{"ok":true}"""
                        }
                        "add" -> {
                            if (args.size < 2) return """{"ok":false,"error":"missing package"}"""
                            val nl = config.list.toMutableSet(); nl.add(args[1])
                            TargetProxyManager.writeConfig(config.copy(list = nl))
                            """{"ok":true}"""
                        }
                        "del" -> {
                            if (args.size < 2) return """{"ok":false,"error":"missing package"}"""
                            val nl = config.list.toMutableSet(); nl.remove(args[1])
                            TargetProxyManager.writeConfig(config.copy(list = nl))
                            """{"ok":true}"""
                        }
                        else -> """{"ok":false,"error":"unknown config action"}"""
                    }
                }
                else -> """{"ok":false,"error":"unknown app action"}"""
            }
        }

        private fun listAppNamesForSocket(pm: android.content.pm.PackageManager, filter: String): String {
            val targetEntries = TargetProxyManager.readTargetFileRaw().associateBy { it.packageName }
            val allApps = try { pm.getInstalledApplications(0) } catch (_: Exception) { emptyList() }
            val result = JSONArray()
            for (ai in allApps) {
                val isSys = (ai.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0
                if (filter == "system" && !isSys) continue
                if (filter == "user" && isSys) continue
                val entry = targetEntries[ai.packageName]
                val label = try { pm.getApplicationLabel(ai).toString() } catch (_: Exception) { ai.packageName }
                result.put(JSONObject().apply {
                    put("packageName", ai.packageName); put("appName", label)
                    put("isSystem", isSys); put("isProxied", entry != null)
                    put("certMode", entry?.certMode?.name?.lowercase() ?: "auto")
                })
            }
            return """{"ok":true,"data":${result.toString()}}"""
        }

        private fun handleVbhashCommand(act: String, args: Array<String>): String {
            if (act != "get") return """{"ok":false,"error":"unknown vbhash action"}"""
            Looper.prepare()
            val context = getSystemContext()
            val provider = VBHashProvider()
            provider.attachInfo(context, null)
            val result = provider.call("X1", null, null)
            val hash = result?.getString("h")
            return if (hash != null) """{"ok":true,"data":"$hash"}"""
            else """{"ok":false,"error":"${result?.getString("e") ?: "?"}"}"""
        }

        private fun handleProxyCommand(act: String, args: Array<String>): String {
            val flagFile = File("/data/adb/modules/ts_enhancer_extreme/.tseet_enabled")
            return when (act) {
                "state" -> {
                    val running = isProxyRunning()
                    """{"ok":true,"data":"${if (running) "s=1" else "s=0"}","running":$running,"enabled":${flagFile.exists()}}"""
                }
                "sync" -> {
                    if (!flagFile.exists()) return """{"ok":false,"error":"autoproxy disabled"}"""
                    if (!isProxyRunning()) return """{"ok":false,"error":"proxy not running"}"""
                    Looper.prepare()
                    val context = getSystemContext()
                    val intent = android.content.Intent(context, TargetProxyService::class.java).apply {
                        action = TargetProxyService.ACTION_SYNC
                        setPackage(context.packageName)
                    }
                    context.startService(intent)
                    """{"ok":true}"""
                }
                "start" -> {
                    flagFile.writeText("")
                    """{"ok":true}"""
                }
                "stop" -> {
                    flagFile.delete()
                    val pidFile = File("/data/adb/ts_enhancer_extreme/proxy.pid")
                    if (pidFile.exists()) {
                        val pid = pidFile.readText().trim().toIntOrNull()
                        if (pid != null) Runtime.getRuntime().exec(arrayOf(CMD_TOOL, "kill", "-9", "$pid"))
                        pidFile.delete()
                    }
                    """{"ok":true}"""
                }
                "watch" -> """{"ok":true}\n""" // keep connection open
                else -> """{"ok":false,"error":"unknown proxy action"}"""
            }
        }
    }
}
