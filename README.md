# IBEE Software

Software stack for the **I-BEE connected hive** project.

This repository currently provides:
- a FastAPI backend for ingestion and querying hive data
- PostgreSQL (Timescale image) storage for app data
- optional ChirpStack v4 local stack (MQTT, Redis, PostgreSQL, Gateway Bridge)
- a payload decoder for ChirpStack
- simulated data tools to work without hardware

---

## Current project state

### What is already working

- Backend is running and exposes API docs at `http://localhost:8000/docs`.
- Webhook ingestion endpoint is implemented:
  - `POST /webhooks/chirpstack/uplink`
- Data model is implemented:
  - `hive`, `device`, `measurement`
- Query endpoints are implemented:
  - latest measurement by hive
  - measurement history by device
- ChirpStack local stack runs correctly with Docker profile `chirpstack`.
- Gateway Bridge connects to MQTT.
- Simulated uplinks can be injected manually or continuously.

### What is not yet implemented

- Frontend dashboard implementation (folder exists as placeholder).
- Production auth/security hardening.
- Final hardware integration (real DevEUI/JoinEUI/AppKey from embedded team).

---

## Repository structure

```txt
backend/     FastAPI app (API + DB models + webhook ingestion)
decoder/     ChirpStack uplink decoder (JavaScript codec)
infra/       Docker Compose + ChirpStack configs
tools/       Local simulation scripts (no hardware needed)
dashboard/   Frontend placeholder
```

---

## Requirements

- Docker Desktop (running)
- Docker Compose plugin
- Python 3 (only needed for local simulator script)

---

## Run the project

### Option A: Core stack only (backend + app DB + adminer)

```bash
docker compose -f infra/docker-compose.yml up --build
```

Services:
- Backend API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- Adminer: `http://localhost:8081`
- App DB (Postgres): `localhost:5432`

### Option B: Full local stack with ChirpStack

```bash
docker compose -f infra/docker-compose.yml --profile chirpstack up --build
```

Additional services:
- ChirpStack UI: `http://localhost:8080`
- Gateway Bridge UDP: `localhost:1700/udp`
- MQTT broker: `localhost:1883`

---

## Adminer credentials

For app database inspection in `http://localhost:8081`:

- System: `PostgreSQL`
- Server: `db`
- Username: `ibee`
- Password: `ibee`
- Database: `ibee`

---

## ChirpStack quick setup (optional)

1. Open `http://localhost:8080`.
2. Create/login admin user.
3. Create Tenant.
4. Create Application.
5. Create Device Profile:
   - Region: `EU868`
   - Codec: JavaScript
   - Paste `decoder/chirpstack_uplink_decoder_v1.js`.
6. Create Device (OTAA fields can be temporary until hardware keys are available).
7. In application integrations, add HTTP integration:
   - `http://backend:8000/webhooks/chirpstack/uplink`
   - enable uplink event.

---

## Backend API usage

### Create hive

```bash
curl -X POST "http://localhost:8000/api/hives?name=Ruche-A&location_name=Ferme-1"
```

### Attach device to hive

```bash
curl -X POST "http://localhost:8000/api/devices?dev_eui=70b3d57ed0064a12&hive_id=1"
```

### Get latest measurement for hive

```bash
curl "http://localhost:8000/api/hives/1/latest"
```

### Get measurement history for device

```bash
curl "http://localhost:8000/api/devices/70b3d57ed0064a12/history?limit=20"
```

---

## Work without hardware (simulated data)

### One-shot webhook test

```bash
curl -X POST "http://localhost:8000/webhooks/chirpstack/uplink" \
  -H "Content-Type: application/json" \
  -d '{
    "devEui": "70b3d57ed0064a12",
    "time": "2026-04-01T12:00:00Z",
    "rxInfo": [{"rssi": -61, "snr": 9.5}],
    "object": {
      "temperature_c": 25.4,
      "humidity_pct": 58.7,
      "sound_level": 41,
      "door_open": false,
      "gps_lat": 35.6895,
      "gps_lng": -0.6417,
      "battery_v": 3.92
    }
  }'
```

### Continuous simulated stream

```bash
python tools/simulate_uplink.py
```

Simulator behavior:
- sends data every 10 seconds
- uses DevEUI `70b3d57ed0064a12`
- generates realistic temperature/humidity/sound/door/gps/battery and radio stats

---

## Notes

- Real hardware OTAA values (`DevEUI`, `JoinEUI`, `AppKey`) will be plugged in later.
- Current setup is optimized for local development and integration testing.

## Webhook uplink (ChirpStack → backend)

Endpoint:

- `POST http://backend:8000/webhooks/chirpstack/uplink` (dans Docker network)
- `POST http://localhost:8000/webhooks/chirpstack/uplink` (depuis ta machine)

Le backend accepte:
- soit un uplink **déjà décodé** (champ `object`)
- soit un uplink brut avec `data` (base64) + un décodage côté backend (payload binaire “v1”).

