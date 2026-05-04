package com.dere3046.tseet

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class ProxyBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val serviceIntent = Intent(context, TargetProxyService::class.java).apply {
                action = TargetProxyService.ACTION_START
            }
            context.startForegroundService(serviceIntent)
        }
    }
}
