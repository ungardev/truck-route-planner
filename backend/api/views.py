from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse
from datetime import datetime

from .serializers import TripInputSerializer
from hos_engine import HOSEngine


@api_view(["POST"])
def calculate_trip(request):
    """
    POST /api/calculate-trip/

    Calculate a trip itinerary based on FMCSA HOS regulations.

    Request body:
    {
        "origin": {"lat": 40.7128, "lng": -74.0060, "address": "New York, NY"},
        "pickup": {"lat": 40.7500, "lng": -73.9900, "address": "Warehouse A, NJ"},
        "dropoff": {"lat": 39.9526, "lng": -75.1652, "address": "Philadelphia, PA"},
        "current_cycle_hours": 45.5,
        "start_time": "2026-05-08T06:00:00Z"  // optional
    }

    Returns:
    {
        "trip_id": "trip_20260508_060000",
        "total_distance_miles": 580,
        "estimated_duration_hours": 12.5,
        "current_cycle_hours": 45.5,
        "events": [...],
        "daily_logs": [...]
    }
    """
    serializer = TripInputSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(
            {"error": "Invalid input", "details": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = serializer.validated_data

    engine = HOSEngine()

    start_time = None
    if "start_time" in data and data["start_time"]:
        start_time = data["start_time"]

    result = engine.calculate_trip(
        origin=data["origin"],
        pickup=data["pickup"],
        dropoff=data["dropoff"],
        current_cycle_hours=data["current_cycle_hours"],
        start_time=start_time,
    )

    return Response(result, status=status.HTTP_200_OK)


@api_view(["GET"])
def health_check(request):
    """Simple health check endpoint."""
    return Response(
        {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "service": "HOS Trip Planner API",
        }
    )
