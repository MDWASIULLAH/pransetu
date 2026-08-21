package com.pransetu.emergency

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface SOSDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSOS(record: SOSRecordEntity)

    @Update
    suspend fun updateSOS(record: SOSRecordEntity)

    @Query("SELECT * FROM sos_records ORDER BY createdAt DESC")
    fun getAllSOS(): Flow<List<SOSRecordEntity>>

    @Query("SELECT * FROM sos_records WHERE deliveryState IN ('STORED', 'RELAYED')")
    suspend fun getPendingUploads(): List<SOSRecordEntity>
    
    @Query("UPDATE sos_records SET deliveryState = :newState WHERE id = :id")
    suspend fun updateDeliveryState(id: String, newState: String)
}

@Dao
interface SeenPacketDao {
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertSeenPacket(packet: SeenPacketEntity): Long // Returns -1 if it already exists

    @Query("SELECT EXISTS(SELECT 1 FROM seen_packets WHERE packetId = :id)")
    suspend fun hasSeenPacket(id: String): Boolean
}

@Database(entities = [SOSRecordEntity::class, SeenPacketEntity::class], version = 1, exportSchema = false)
abstract class SOSDatabase : RoomDatabase() {
    abstract fun sosDao(): SOSDao
    abstract fun seenPacketDao(): SeenPacketDao

    companion object {
        @Volatile
        private var INSTANCE: SOSDatabase? = null

        fun getDatabase(context: Context): SOSDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    SOSDatabase::class.java,
                    "pransetu_sos_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
