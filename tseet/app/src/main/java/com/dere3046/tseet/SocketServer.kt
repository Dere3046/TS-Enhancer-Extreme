package com.dere3046.tseet

import android.net.LocalServerSocket
import android.net.LocalSocket
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

object SocketServer {
    private const val SOCKET_PATH = "/data/adb/ts_enhancer_extreme/.tseet.sock"

    fun start() {
        Thread({
            try {
                File(SOCKET_PATH).delete()
                val server = LocalServerSocket(SOCKET_PATH)
                while (true) {
                    try {
                        val client = server.accept()
                        handle(client)
                    } catch (_: Exception) { }
                }
            } catch (_: Exception) { }
        }, "tseet-socket").apply { isDaemon = true }.start()
    }

    private fun handle(client: LocalSocket) {
        try {
            val line = client.inputStream.bufferedReader().readLine() ?: return
            val req = JSONObject(line)
            val ns = req.optString("ns")
            val act = req.optString("act")
            val args = req.optJSONArray("args") ?: JSONArray()
            val argList = (0 until args.length()).map { args.getString(it) }.toTypedArray()

            val resp = Main.handleCommand(ns, act, argList)
            client.outputStream.write("${resp}\n".toByteArray())
            client.outputStream.flush()

            // watch: keep connection open for watchdog
            if (act == "watch") {
                client.inputStream.read() // block until TSEET dies
            }
        } catch (_: Exception) {
            try { client.outputStream.write("{\"ok\":false,\"error\":\"parse error\"}\n".toByteArray()); client.outputStream.flush() } catch (_: Exception) {}
        } finally {
            try { client.close() } catch (_: Exception) {}
        }
    }
}
