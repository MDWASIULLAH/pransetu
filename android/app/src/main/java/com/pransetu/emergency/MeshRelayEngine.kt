package com.pransetu.emergency

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import com.google.android.gms.nearby.Nearby
import com.google.android.gms.nearby.connection.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import com.google.gson.Gson

// Wrapper for payloads sent via Nearby Connections
data class MeshPayload(val type: String, val data: String)

class MeshRelayEngine : Service() {
    private lateinit var connectionsClient: ConnectionsClient
    private lateinit var database: SOSDatabase
    private val SERVICE_ID = "com.pransetu.emergency.MESH"
    
    // P2P_CLUSTER allows N-to-N connections, forming a true ad-hoc mesh
    private val STRATEGY = Strategy.P2P_CLUSTER 
    private val gson = Gson()
    private val serviceScope = CoroutineScope(Dispatchers.IO)
    
    // In a real app, this should be fetched securely. E.g. Settings.Secure.ANDROID_ID
    private val myDeviceId = "ANDROID-DEMO-DEVICE"

    override fun onCreate() {
        super.onCreate()
        connectionsClient = Nearby.getConnectionsClient(this)
        database = SOSDatabase.getDatabase(this)
        startAdvertising()
        startDiscovery()
    }

    private fun startAdvertising() {
        val options = AdvertisingOptions.Builder().setStrategy(STRATEGY).build()
        connectionsClient.startAdvertising("PRANSETU-NODE", SERVICE_ID, connectionLifecycleCallback, options)
            .addOnSuccessListener { Log.d("MeshRelay", "Advertising started") }
            .addOnFailureListener { Log.e("MeshRelay", "Advertising failed", it) }
    }

    private fun startDiscovery() {
        val options = DiscoveryOptions.Builder().setStrategy(STRATEGY).build()
        connectionsClient.startDiscovery(SERVICE_ID, endpointDiscoveryCallback, options)
            .addOnSuccessListener { Log.d("MeshRelay", "Discovery started") }
            .addOnFailureListener { Log.e("MeshRelay", "Discovery failed", it) }
    }

    private val endpointDiscoveryCallback = object : EndpointDiscoveryCallback() {
        override fun onEndpointFound(endpointId: String, info: DiscoveredEndpointInfo) {
            connectionsClient.requestConnection("PRANSETU-NODE", endpointId, connectionLifecycleCallback)
        }
        override fun onEndpointLost(endpointId: String) {}
    }

    private val connectionLifecycleCallback = object : ConnectionLifecycleCallback() {
        override fun onConnectionInitiated(endpointId: String, info: ConnectionInfo) {
            connectionsClient.acceptConnection(endpointId, payloadCallback)
        }
        
        override fun onConnectionResult(endpointId: String, result: ConnectionResolution) {
            if (result.status.isSuccess) {
                // Connected to a peer! Flush pending offline queue to them.
                sendOfflineQueue(endpointId)
            }
        }
        
        override fun onDisconnected(endpointId: String) {}
    }

    private val payloadCallback = object : PayloadCallback() {
        override fun onPayloadReceived(endpointId: String, payload: Payload) {
            if (payload.type == Payload.Type.BYTES) {
                payload.asBytes()?.let {
                    val json = String(it)
                    processReceivedMeshPayload(endpointId, json)
                }
            }
        }
        override fun onPayloadTransferUpdate(endpointId: String, update: PayloadTransferUpdate) {}
    }

    private fun processReceivedMeshPayload(endpointId: String, json: String) {
        serviceScope.launch {
            try {
                val meshPayload = gson.fromJson(json, MeshPayload::class.java)
                
                if (meshPayload.type == "ACK") {
                    val packetId = meshPayload.data
                    // Sender successfully received our SOS. Stop retrying this packet.
                    database.sosDao().updateDeliveryState(packetId, "RELAYED")
                    Log.i("MeshRelay", "Received ACK for $packetId. Marked as RELAYED.")
                    return@launch
                }
                
                if (meshPayload.type == "SOS") {
                    val record = gson.fromJson(meshPayload.data, SOSRecordEntity::class.java)
                    
                    // Always ACK receipt immediately so sender can stop retrying
                    sendAck(endpointId, record.id)
                    
                    // Deduplication & Replay Protection
                    val seen = database.seenPacketDao().hasSeenPacket(record.id)
                    if (!seen) {
                        database.seenPacketDao().insertSeenPacket(SeenPacketEntity(record.id))
                        
                        // Loop Prevention: Drop if our device ID is already in the trail
                        if (record.relayTrail.contains(myDeviceId)) {
                            Log.w("MeshRelay", "Dropped packet ${record.id} due to routing loop.")
                            return@launch
                        }

                        // TTL Limit
                        if (record.hopCount < record.ttl) {
                            val newTrail = if (record.relayTrail.isEmpty()) myDeviceId else "${record.relayTrail},$myDeviceId"
                            
                            val newRecord = record.copy(
                                hopCount = record.hopCount + 1,
                                deliveryState = "STORED", // Enters our offline queue
                                relayTrail = newTrail
                            )
                            database.sosDao().insertSOS(newRecord)
                        } else {
                            Log.w("MeshRelay", "Dropped packet ${record.id} due to TTL limit.")
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e("MeshRelay", "Failed to parse incoming mesh payload", e)
            }
        }
    }

    private fun sendAck(endpointId: String, packetId: String) {
        val ackPayload = MeshPayload(type = "ACK", data = packetId)
        val json = gson.toJson(ackPayload)
        connectionsClient.sendPayload(endpointId, Payload.fromBytes(json.toByteArray()))
    }

    private fun sendOfflineQueue(endpointId: String) {
        serviceScope.launch {
            // Find packets that need relaying (STORED means offline queue)
            // It will stay STORED (and retry sending to future nodes) until an ACK is received.
            val pending = database.sosDao().getPendingUploads()
            pending.forEach { record ->
                val meshPayload = MeshPayload(type = "SOS", data = gson.toJson(record))
                val json = gson.toJson(meshPayload)
                connectionsClient.sendPayload(endpointId, Payload.fromBytes(json.toByteArray()))
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onDestroy() {
        super.onDestroy()
        connectionsClient.stopAdvertising()
        connectionsClient.stopDiscovery()
        connectionsClient.stopAllEndpoints()
    }
}
