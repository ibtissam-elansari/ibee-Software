from __future__ import annotations

import asyncio
import json
import logging

from aiokafka import AIOKafkaConsumer
from aiokafka.errors import KafkaConnectionError

from app.core.settings import settings
from app.db.engine import AsyncSessionLocal
from app.services.uplink import process_uplink

logger = logging.getLogger(__name__)

# Exponential back-off parameters for Kafka reconnect attempts
_BACKOFF_BASE    = 2    # seconds
_BACKOFF_MAX     = 60   # seconds cap
_BACKOFF_FACTOR  = 2


async def start_kafka_consumer() -> None:
    """
    Connect to Kafka and process uplink messages indefinitely.

    Retries with exponential back-off on connection failure so a temporary
    Kafka outage doesn't crash the backend — the webhook route stays alive
    as fallback during the retry window.
    """
    backoff = _BACKOFF_BASE

    while True:
        consumer = AIOKafkaConsumer(
            settings.kafka_topic,
            bootstrap_servers   = settings.kafka_brokers,
            group_id            = "ibee-backend",
            auto_offset_reset   = "latest",       # don't replay history on (re)start
            enable_auto_commit  = True,
            value_deserializer  = lambda v: json.loads(v.decode("utf-8")),
        )

        try:
            await consumer.start()
            logger.info(
                "✅  Kafka consumer started — brokers=%s  topic=%s",
                settings.kafka_brokers,
                settings.kafka_topic,
            )
            backoff = _BACKOFF_BASE  # reset back-off on successful connect

            async for msg in consumer:
                # ── Filter: uplink events only ────────────────────────────────
                key = msg.key.decode("utf-8") if msg.key else ""
                if ".event.up" not in key:
                    continue

                # ── Process with a fresh DB session per message ───────────────
                try:
                    async with AsyncSessionLocal() as session:
                        await process_uplink(msg.value, session)
                except Exception as exc:
                    # Log and continue — never let one bad message kill the loop
                    logger.error(
                        "Failed to process Kafka message [key=%s offset=%s]: %s",
                        key, msg.offset, exc,
                        exc_info=True,   # ← include full traceback in logs
                    )

        except KafkaConnectionError as exc:
            logger.warning(
                "Kafka unavailable (%s). Webhook fallback active. "
                "Retrying in %ss…", exc, backoff,
            )
        except asyncio.CancelledError:
            logger.info("Kafka consumer cancelled — shutting down.")
            break
        except Exception as exc:
            logger.error("Unexpected Kafka error: %s. Retrying in %ss…", exc, backoff)
        finally:
            try:
                await consumer.stop()
            except Exception:
                pass

        await asyncio.sleep(backoff)
        backoff = min(backoff * _BACKOFF_FACTOR, _BACKOFF_MAX)