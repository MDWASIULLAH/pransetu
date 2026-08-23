package com.pransetu.emergency

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST

interface PRANSETUApi {
    // Matches the FastAPI endpoint we created earlier
    @POST("/api/v1/sos/android")
    suspend fun uploadSOS(@Body record: SOSRecordEntity): Map<String, Any>
}

class GatewaySyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    private val api: PRANSETUApi by lazy {
        Retrofit.Builder()
            // In a real environment, this should be configurable via BuildConfig or User settings
            .baseUrl("https://pransetu-v1.vercel.app")
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(PRANSETUApi::class.java)
    }

    override suspend fun doWork(): Result {
        val database = SOSDatabase.getDatabase(applicationContext)
        val pendingPackets = database.sosDao().getPendingUploads()

        if (pendingPackets.isEmpty()) {
            return Result.success()
        }

        var allSuccess = true
        for (packet in pendingPackets) {
            try {
                // When we upload, we are acting as a GATEWAY for this packet
                val uploadPacket = packet.copy(deliveryState = "GATEWAY_RECEIVED")
                
                val response = api.uploadSOS(uploadPacket)
                if (response["status"] == "success") {
                    database.sosDao().updateDeliveryState(packet.sosId, "SERVER_DELIVERED")
                    Log.i("GatewaySync", "Successfully synced SOS packet ${packet.sosId} to Server.")
                } else {
                    allSuccess = false
                }
            } catch (e: Exception) {
                Log.e("GatewaySync", "Failed to upload packet ${packet.sosId} to FastAPI backend", e)
                allSuccess = false
            }
        }

        return if (allSuccess) Result.success() else Result.retry()
    }
}
