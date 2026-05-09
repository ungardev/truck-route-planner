#!/usr/bin/env python
"""
Quick test script for HOS Engine
Run from backend/ directory: python test_engine.py
"""

import sys

sys.path.insert(0, ".")

from datetime import datetime
from hos_engine import HOSEngine


def test_basic_trip():
    print("=" * 60)
    print("TEST 1: Basic NYC to Philadelphia trip")
    print("=" * 60)

    engine = HOSEngine()

    result = engine.calculate_trip(
        origin={"lat": 40.7128, "lng": -74.0060, "address": "New York, NY"},
        pickup={"lat": 40.7500, "lng": -73.9900, "address": "Newark, NJ (Warehouse A)"},
        dropoff={"lat": 39.9526, "lng": -75.1652, "address": "Philadelphia, PA"},
        current_cycle_hours=45.5,
        start_time=datetime(2026, 5, 8, 6, 0, 0),
    )

    print(f"\nTrip ID: {result['trip_id']}")
    print(f"Total Distance: {result['total_distance_miles']:.1f} miles")
    print(f"Current Cycle Hours: {result['current_cycle_hours']}")
    print(f"\n--- Events ({len(result['events'])}) ---")

    for event in result["events"]:
        print(
            f"  Day {event['day']} | {event['timestamp'][:19]} | {event['type']:12} | {event['description']}"
        )

    print(f"\n--- Daily Logs ({len(result['daily_logs'])}) ---")
    for log in result["daily_logs"]:
        print(
            f"  Day {log['day']}: {log['date']} | {log['total_miles']:.1f} miles | Grid entries: {len(log['grid_data'])}"
        )

    return result


def test_long_trip():
    print("\n" + "=" * 60)
    print("TEST 2: Long trip (NYC to Atlanta - multi-day)")
    print("=" * 60)

    engine = HOSEngine()

    result = engine.calculate_trip(
        origin={"lat": 40.7128, "lng": -74.0060, "address": "New York, NY"},
        pickup={"lat": 39.9526, "lng": -75.1652, "address": "Philadelphia, PA"},
        dropoff={"lat": 33.7490, "lng": -84.3880, "address": "Atlanta, GA"},
        current_cycle_hours=20.0,
        start_time=datetime(2026, 5, 8, 5, 0, 0),
    )

    print(f"\nTrip ID: {result['trip_id']}")
    print(f"Total Distance: {result['total_distance_miles']:.1f} miles")
    print(f"Estimated Duration: {result['estimated_duration_hours']:.1f} hours")
    print(f"Current Cycle Hours: {result['current_cycle_hours']}")
    print(f"\n--- Events ({len(result['events'])}) ---")

    for event in result["events"]:
        print(
            f"  Day {event['day']} | {event['timestamp'][:19]} | {event['type']:12} | {event['description']}"
        )

    print(f"\n--- Daily Logs ({len(result['daily_logs'])}) ---")
    for log in result["daily_logs"]:
        driving_hours = sum(1 for g in log["grid_data"] if g["status"] == "DRIVING")
        print(
            f"  Day {log['day']}: {log['date']} | {log['total_miles']:.1f} miles | Driving hours: {driving_hours} | Grid entries: {len(log['grid_data'])}"
        )

    return result


if __name__ == "__main__":
    test_basic_trip()
    print("\n\n")
    test_long_trip()
    print("\n\n✅ All tests completed!")
