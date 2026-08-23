package com.pransetu.emergency

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverter
import androidx.room.TypeConverters
import java.util.Date

@Entity(tableName = "sos_records")
@TypeConverters(Converters::class)
data class SOSRecordEntity(
    @PrimaryKey val sosId: String, 
    val protocolVersion: String = "1.0",
    val deviceId: String,
    val source: String = "ANDROID",
    // Sensitive data is encrypted so intermediate relay nodes cannot read it
    val encryptedPayload: String, 
    val createdAt: Long = System.currentTimeMillis(),
    val hopCount: Int = 0,
    val ttl: Int = 24,
    val deliveryState: String = "STORED", // CREATED, STORED, RELAYING, RELAYED, GATEWAY_RECEIVED, SERVER_DELIVERED, CLOSED
    val relayTrail: String = "" // Comma separated list of device IDs that relayed this packet
)

@Entity(tableName = "seen_packets")
data class SeenPacketEntity(
    @PrimaryKey val packetId: String,
    val receivedAt: Long = System.currentTimeMillis()
)

class Converters {
    @TypeConverter
    fun fromTimestamp(value: Long?): Date? {
        return value?.let { Date(it) }
    }

    @TypeConverter
    fun dateToTimestamp(date: Date?): Long? {
        return date?.time
    }
}

// Internal class used strictly before encryption or after decryption
data class SOSPayload(
    val latitude: Double,
    val longitude: Double,
    val accuracyM: Float,
    val locationTimestamp: Long,
    val peopleCount: Int,
    val medicalRequired: Boolean,
    val severity: String,
    val message: String = "",
    val userId: String? = null,
    val phoneReference: String? = null
)
