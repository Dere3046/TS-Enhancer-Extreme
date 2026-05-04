package com.dere3046.tseet

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class TargetProxyService : Service() {

    companion object {
        const val ACTION_START = "com.dere3046.tseet.action.START_PROXY"
        const val ACTION_STOP = "com.dere3046.tseet.action.STOP_PROXY"
        const val ACTION_SYNC = "com.dere3046.tseet.action.SYNC_TARGET"
        const val CHANNEL_ID = "tseet_proxy"
        const val NOTIFICATION_ID = 1

        @Volatile
        var isRunning = false
            private set
    }

    private var appChangeReceiver: AppChangeReceiver? = null

    override fun onCreate() {
        super.onCreate()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            createNotificationChannel()
        }
        startForeground(NOTIFICATION_ID, buildNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                if (!isRunning) {
                    TargetProxyManager.initialize(packageManager)
                    registerAppChangeReceiver()
                    isRunning = true
                }
            }
            ACTION_STOP -> {
                if (isRunning) {
                    unregisterAppChangeReceiver()
                    isRunning = false
                    stopSelf()
                }
            }
            ACTION_SYNC -> {
                if (isRunning) {
                    TargetProxyManager.initialize(packageManager)
                }
            }
        }
        return START_STICKY
    }

    private fun registerAppChangeReceiver() {
        if (appChangeReceiver == null) {
            appChangeReceiver = AppChangeReceiver()
            val filter = IntentFilter().apply {
                addAction(Intent.ACTION_PACKAGE_ADDED)
                addAction(Intent.ACTION_PACKAGE_REMOVED)
                addDataScheme("package")
            }
            registerReceiver(appChangeReceiver, filter)
        }
    }

    private fun unregisterAppChangeReceiver() {
        appChangeReceiver?.let {
            try {
                unregisterReceiver(it)
            } catch (_: Exception) {}
            appChangeReceiver = null
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "TSEET Proxy",
                NotificationManager.IMPORTANCE_MIN
            ).apply {
                description = "Monitoring app changes"
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_SECRET
            }
            val nm = getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("TSEET")
            .setContentText("Monitoring...")
            .setSmallIcon(android.R.drawable.ic_menu_info_details)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setVisibility(NotificationCompat.VISIBILITY_SECRET)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        unregisterAppChangeReceiver()
        isRunning = false
        super.onDestroy()
    }
}
