# PRANSETU SOS Protocol

## Canonical Packet

Every SOS packet should contain, as applicable:

- `sos_id`: Globally unique SOS identifier
- `protocol_version`: Canonical protocol schema version (e.g. `v2.4-mesh`)
- `created_at`: Original UTC ISO timestamp of SOS generation
- `source_type`: Origination medium (`LORA_NODE`, `BLUETOOTH_LE`, `CELLULAR_LTE`, `VOICE_IVR`)
- `device_reference`: Anonymized device / node hardware fingerprint
- `latitude`: WGS84 GPS latitude
- `longitude`: WGS84 GPS longitude
- `location_timestamp`: Timestamp when GPS fix was locked
- `location_accuracy`: Accuracy radius in meters
- `severity_code`: Severity rating (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`)
- `people_count`: Number of trapped / affected individuals
- `medical_required`: Boolean flag for immediate medical / trauma triage
- `hop_count`: Number of peer forwarding hops traversed
- `ttl`: Time-To-Live hop decrement limit (prevents network loops)
- `delivery_state`: Canonical lifecycle progression status
- `acknowledgement_state`: Cryptographic receipt confirmation from EOC / Gateway

## Lifecycle

```text
CREATED
  -> STORED
  -> QUEUED
  -> RELAYING
  -> GATEWAY_RECEIVED
  -> SERVER_RECEIVED
  -> ACKNOWLEDGED
  -> CLOSED
```

Failure/retry states must be explicit and bounded.

## Relay Rules

1. Persist locally before transmission.
2. Use a globally unique SOS ID.
3. Receivers must deduplicate by SOS ID.
4. Forwarding increments `hop_count`.
5. TTL/hop limit prevents infinite circulation.
6. Receivers acknowledge successful local persistence.
7. Senders retain packets until appropriate acknowledgement.
8. Server ingestion is idempotent.
9. Last-known location is always labelled with its timestamp and must not be represented as a live GPS fix.
10. Relay metadata should be minimized to protect citizen privacy.
