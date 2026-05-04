package com.dere3046.tseet

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class AppChangeReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val packageName = intent.data?.schemeSpecificPart ?: return
        val isReplacing = intent.getBooleanExtra(Intent.EXTRA_REPLACING, false)

        if (isReplacing) return

        when (intent.action) {
            Intent.ACTION_PACKAGE_ADDED -> {
                TargetProxyManager.syncPackage(context.packageManager, packageName)
            }
            Intent.ACTION_PACKAGE_REMOVED -> {
                TargetProxyManager.removePackage(packageName)
            }
        }
    }
}
