package com.pransetu.emergency

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import java.util.UUID
import com.google.gson.Gson

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // In a real app, initialize LocationEngine, start MeshRelayEngine service, 
        // and enqueue GatewaySyncWorker here.
        
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    HomeScreen()
                }
            }
        }
    }
}

@Composable
fun HomeScreen() {
    val coroutineScope = rememberCoroutineScope()
    var showDialog by remember { mutableStateOf(false) }
    
    // Mock State for UI Demonstration
    val isOnline = false
    val pendingCount = 2
    val gpsAccuracy = 5.2f
    val locationAgeSec = 12
    val nearbyRelays = 1
    val latestDeliveryState = "RELAYING"
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Status HUD
        Card(
            modifier = Modifier.fillMaxWidth(),
            elevation = CardDefaults.cardElevation(4.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("System Status", fontWeight = FontWeight.Bold, fontSize = 20.sp)
                Spacer(modifier = Modifier.height(8.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Network:")
                    Text(if (isOnline) "ONLINE" else "OFFLINE (MESH)", color = if (isOnline) Color.Green else Color.Red)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("GPS Accuracy:")
                    Text("±${gpsAccuracy}m")
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Location Age:")
                    Text("${locationAgeSec}s ago")
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Nearby Relays:")
                    Text("$nearbyRelays")
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Pending Packets:")
                    Text("$pendingCount")
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Current State:")
                    Text(latestDeliveryState, color = Color.Blue, fontWeight = FontWeight.Bold)
                }
            }
        }

        // SOS Button
        Button(
            onClick = { showDialog = true },
            modifier = Modifier
                .size(200.dp)
                .padding(16.dp),
            shape = CircleShape,
            colors = ButtonDefaults.buttonColors(containerColor = Color.Red)
        ) {
            Text("SOS", color = Color.White, fontSize = 48.sp, fontWeight = FontWeight.Bold)
        }

        if (showDialog) {
            SOSDetailsDialog(
                onDismiss = { showDialog = false },
                onSubmit = { people, medical ->
                    showDialog = false
                    coroutineScope.launch {
                        // Generate canonical SOS Payload
                        val severity = if (medical) "CRITICAL" else "HIGH"
                        
                        val payload = SOSPayload(
                            lat = 22.5726,
                            lng = 88.3639,
                            accuracyM = gpsAccuracy,
                            locationTimestamp = System.currentTimeMillis() - (locationAgeSec * 1000),
                            peopleCount = people,
                            medicalRequired = medical,
                            severity = severity
                        )
                        
                        val jsonPayload = Gson().toJson(payload)
                        val encrypted = EncryptionUtils.encrypt(jsonPayload)

                        val packet = SOSRecordEntity(
                            id = UUID.randomUUID().toString(),
                            deviceId = "ANDROID-DEMO-DEVICE",
                            encryptedPayload = encrypted,
                            deliveryState = "STORED"
                        )
                        // In real app: database.sosDao().insertSOS(packet)
                    }
                }
            )
        }
        
        Text("PRANSETU Emergency Node v1.0", color = Color.Gray, fontSize = 12.sp)
    }
}

@Composable
fun SOSDetailsDialog(onDismiss: () -> Unit, onSubmit: (Int, Boolean) -> Unit) {
    var peopleCount by remember { mutableStateOf("1") }
    var medicalRequired by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Emergency Details") },
        text = {
            Column {
                OutlinedTextField(
                    value = peopleCount,
                    onValueChange = { peopleCount = it },
                    label = { Text("Number of People Affected") }
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(
                        checked = medicalRequired,
                        onCheckedChange = { medicalRequired = it }
                    )
                    Text("Medical Assistance Required")
                }
            }
        },
        confirmButton = {
            Button(onClick = { onSubmit(peopleCount.toIntOrNull() ?: 1, medicalRequired) }) {
                Text("Send SOS")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
