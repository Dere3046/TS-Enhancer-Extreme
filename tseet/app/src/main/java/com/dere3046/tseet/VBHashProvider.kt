package com.dere3046.tseet

import android.content.ContentProvider
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.database.Cursor
import android.net.Uri
import android.os.Bundle
import androidx.core.content.ContextCompat
import java.util.concurrent.CountDownLatch

class VBHashProvider : ContentProvider() {

    companion object {
        const val AUTHORITY = "com.dere3046.tseet.provider"
        
        // Obfuscated method names
        const val METHOD_VBHASH = "X1"
        const val METHOD_PROXY_CTRL = "X2"
    }

    override fun onCreate(): Boolean = true

    override fun call(method: String, arg: String?, extras: Bundle?): Bundle? {
        return when (method) {
            METHOD_VBHASH -> getVBHash()
            METHOD_PROXY_CTRL -> handleProxyControl(extras)
            else -> Bundle().apply { putString("e", "0") }
        }
    }

    private fun getVBHash(): Bundle {
        val latch = CountDownLatch(1)
        val result = Bundle()

        Thread {
            val extractResult = VBHashExtractor.extract()
            if (extractResult.hash != null) {
                result.putString("h", "${extractResult.hash}=VBHash")
            } else {
                result.putString("s", "f")
                result.putString("e", extractResult.error ?: "?")
            }
            latch.countDown()
        }.start()

        latch.await()
        return result
    }

    private fun handleProxyControl(extras: Bundle?): Bundle {
        val context = context ?: return Bundle().apply {
            putBoolean("ok", false)
            putString("m", "?")
        }

        val args = extras?.getStringArray("a") ?: arrayOf()
        
        return when {
            args.contains("-h") || args.contains("--help") -> Bundle().apply {
                putBoolean("ok", false)
                putString("m", getProxyHelp())
            }
            args.contains("-start") -> startProxy(context)
            args.contains("-stop") -> stopProxy(context)
            args.contains("-state") -> getProxyState()
            args.contains("-sync") -> syncProxy(context)
            else -> Bundle().apply {
                putBoolean("ok", false)
                putString("m", "Unknown proxy command")
            }
        }
    }

    private fun startProxy(context: Context): Bundle {
        return if (TargetProxyService.isRunning) {
            Bundle().apply {
                putBoolean("ok", true)
                putString("m", "already running")
                putString("s", "1")
            }
        } else {
            val intent = Intent(context, TargetProxyService::class.java).apply {
                action = TargetProxyService.ACTION_START
            }
            ContextCompat.startForegroundService(context, intent)
            Bundle().apply {
                putBoolean("ok", true)
                putString("m", "started")
                putString("s", "1")
            }
        }
    }

    private fun stopProxy(context: Context): Bundle {
        return if (!TargetProxyService.isRunning) {
            Bundle().apply {
                putBoolean("ok", true)
                putString("m", "not running")
                putString("s", "0")
            }
        } else {
            val intent = Intent(context, TargetProxyService::class.java).apply {
                action = TargetProxyService.ACTION_STOP
            }
            context.startService(intent)
            Bundle().apply {
                putBoolean("ok", true)
                putString("m", "stopped")
                putString("s", "0")
            }
        }
    }

    private fun getProxyState(): Bundle {
        return Bundle().apply {
            putBoolean("ok", true)
            putString("s", if (TargetProxyService.isRunning) "1" else "0")
            putString("m", if (TargetProxyService.isRunning) "running" else "stopped")
        }
    }

    private fun syncProxy(context: Context): Bundle {
        return if (TargetProxyService.isRunning) {
            val intent = Intent(context, TargetProxyService::class.java).apply {
                action = TargetProxyService.ACTION_SYNC
            }
            context.startService(intent)
            Bundle().apply {
                putBoolean("ok", true)
                putString("m", "sync triggered")
            }
        } else {
            Bundle().apply {
                putBoolean("ok", false)
                putString("m", "proxy not running")
            }
        }
    }

    private fun getProxyHelp(): String {
        return """
            Proxy Control
            Usage: proxyctl [-start|-stop|-state|-sync|-h]
        """.trimIndent()
    }

    override fun query(
        uri: Uri,
        projection: Array<String>?,
        selection: String?,
        selectionArgs: Array<String>?,
        sortOrder: String?
    ): Cursor? = null

    override fun getType(uri: Uri): String? = null

    override fun insert(uri: Uri, values: ContentValues?): Uri? = null

    override fun delete(uri: Uri, selection: String?, selectionArgs: Array<String>?): Int = 0

    override fun update(
        uri: Uri,
        values: ContentValues?,
        selection: String?,
        selectionArgs: Array<String>?
    ): Int = 0
}
