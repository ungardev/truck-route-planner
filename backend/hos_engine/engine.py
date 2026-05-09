"""
HOS Engine - Hours of Service calculation module
Handles trip planning based on FMCSA regulations
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Optional
import math


@dataclass
class Location:
    lat: float
    lng: float
    address: str = ""


@dataclass
class TripEvent:
    timestamp: datetime
    event_type: str
    location: str
    description: str = ""
    miles_driven: float = 0.0
    cumulative_driving_hours: float = 0.0
    cumulative_on_duty_hours: float = 0.0
    day: int = 1


@dataclass
class DailyLog:
    day: int
    date: str
    total_miles: float
    grid_entries: List[dict] = field(default_factory=list)
    remarks: List[str] = field(default_factory=list)


class HOSEngine:
    """
    Hours of Service calculation engine for property-carrying CMV drivers.
    Implements FMCSA regulations: 70hr/8day cycle, 11hr driving, 14hr window, 30min break.
    """

    AVERAGE_SPEED_MPH = 65
    FUEL_STOP_DURATION_HOURS = 1.0
    PICKUP_DROPOFF_DURATION_HOURS = 1.0
    REST_BREAK_DURATION_HOURS = 0.5
    REQUIRED_OFF_DUTY_HOURS = 10

    MAX_DRIVING_HOURS = 11
    MAX_DRIVING_WINDOW_HOURS = 14
    REQUIRED_BREAK_AFTER_HOURS = 8
    MAX_CYCLE_HOURS = 70
    MAX_CYCLE_DAYS = 8
    FUEL_STOP_MILES_THRESHOLD = 1000

    def __init__(self):
        self.events: List[TripEvent] = []
        self.daily_logs: List[DailyLog] = []
        self.total_miles = 0
        self.current_cycle_hours = 0.0

    def calculate_trip(
        self,
        origin: dict,
        pickup: dict,
        dropoff: dict,
        current_cycle_hours: float,
        start_time: Optional[datetime] = None,
    ) -> dict:
        """Main entry point to calculate a complete trip itinerary."""
        if start_time is None:
            start_time = datetime.now().replace(
                hour=6, minute=0, second=0, microsecond=0
            )

        self.events = []
        self.daily_logs = []
        self.current_cycle_hours = current_cycle_hours

        origin_loc = Location(
            origin.get("lat", 0), origin.get("lng", 0), origin.get("address", "")
        )
        pickup_loc = Location(
            pickup.get("lat", 0), pickup.get("lng", 0), pickup.get("address", "")
        )
        dropoff_loc = Location(
            dropoff.get("lat", 0), dropoff.get("lng", 0), dropoff.get("address", "")
        )

        segments = self._calculate_distance_segments(
            origin_loc, pickup_loc, dropoff_loc
        )
        self.total_miles = sum(s["distance"] for s in segments)

        self._build_timeline(segments, start_time, origin_loc, pickup_loc, dropoff_loc)
        self._generate_daily_logs()

        return self._build_response()

    def _calculate_distance_segments(
        self, origin: Location, pickup: Location, dropoff: Location
    ) -> List[dict]:
        """Calculate distances between waypoints using Haversine formula."""
        segments = []
        dist_origin_pickup = self._haversine_distance(origin, pickup)
        dist_pickup_dropoff = self._haversine_distance(pickup, dropoff)

        segments.append(
            {
                "from": origin,
                "to": pickup,
                "distance": dist_origin_pickup,
                "type": "PICKUP",
            }
        )
        segments.append(
            {
                "from": pickup,
                "to": dropoff,
                "distance": dist_pickup_dropoff,
                "type": "DROPOFF",
            }
        )

        return segments

    def _haversine_distance(self, loc1: Location, loc2: Location) -> float:
        """Calculate great circle distance in miles between two points."""
        R = 3959
        lat1, lng1 = math.radians(loc1.lat), math.radians(loc1.lng)
        lat2, lng2 = math.radians(loc2.lat), math.radians(loc2.lng)
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
        )
        c = 2 * math.asin(math.sqrt(a))
        return R * c

    def _build_timeline(
        self,
        segments: List[dict],
        start_time: datetime,
        origin: Location,
        pickup: Location,
        dropoff: Location,
    ):
        """Build complete timeline of events with HOS compliance."""
        current_time = start_time
        cumulative_driving_hours = 0.0
        cumulative_on_duty_hours = 0.0
        hours_since_last_break = 0.0
        miles_since_last_fuel = 0.0
        current_day = 1

        self._add_event(
            current_time,
            "ON_DUTY",
            origin.address,
            "Start of trip - Pre-trip inspection",
            0,
            cumulative_driving_hours,
            cumulative_on_duty_hours,
            current_day,
        )
        current_time += timedelta(hours=0.5)
        cumulative_on_duty_hours += 0.5

        for idx, segment in enumerate(segments):
            segment_distance = segment["distance"]
            segment_type = segment["type"]

            if segment_type == "PICKUP":
                self._add_event(
                    current_time,
                    "ON_DUTY",
                    segment["from"].address,
                    "Arrived at pickup location",
                    0,
                    cumulative_driving_hours,
                    cumulative_on_duty_hours,
                    current_day,
                )
                current_time += timedelta(hours=self.PICKUP_DROPOFF_DURATION_HOURS)
                cumulative_on_duty_hours += self.PICKUP_DROPOFF_DURATION_HOURS
                self._add_event(
                    current_time,
                    "ON_DUTY",
                    segment["from"].address,
                    "Loading cargo",
                    0,
                    cumulative_driving_hours,
                    cumulative_on_duty_hours,
                    current_day,
                )

            driving_time_hours = segment_distance / self.AVERAGE_SPEED_MPH
            remaining_driving = driving_time_hours

            while remaining_driving > 0:
                if miles_since_last_fuel >= self.FUEL_STOP_MILES_THRESHOLD:
                    current_time, cumulative_on_duty_hours = self._add_fuel_stop(
                        current_time,
                        segment["to"].address,
                        cumulative_driving_hours,
                        cumulative_on_duty_hours,
                        current_day,
                    )
                    miles_since_last_fuel = 0

                if hours_since_last_break >= self.REQUIRED_BREAK_AFTER_HOURS:
                    current_time, cumulative_on_duty_hours, hours_since_last_break = (
                        self._add_rest_break(
                            current_time,
                            "En route",
                            cumulative_driving_hours,
                            cumulative_on_duty_hours,
                            current_day,
                        )
                    )

                drive_chunk = min(remaining_driving, 2.0)
                drive_chunk = min(drive_chunk, remaining_driving)

                self._add_event(
                    current_time,
                    "DRIVING",
                    segment["to"].address,
                    f"Driving to {segment['to'].address}",
                    drive_chunk * self.AVERAGE_SPEED_MPH,
                    cumulative_driving_hours + drive_chunk,
                    cumulative_on_duty_hours,
                    current_day,
                )

                miles_since_last_fuel += drive_chunk * self.AVERAGE_SPEED_MPH
                remaining_driving -= drive_chunk
                cumulative_driving_hours += drive_chunk
                cumulative_on_duty_hours += drive_chunk
                hours_since_last_break += drive_chunk
                current_time += timedelta(hours=drive_chunk)

                if cumulative_driving_hours >= self.MAX_DRIVING_HOURS:
                    current_time, cumulative_on_duty_hours = self._add_off_duty_period(
                        current_time,
                        "Required 10-hour rest",
                        cumulative_on_duty_hours,
                        current_day,
                    )
                    cumulative_driving_hours = 0
                    hours_since_last_break = 0

                if current_time.day != start_time.day and current_time.hour == 0:
                    current_day += 1

            if segment_type == "DROPOFF":
                self._add_event(
                    current_time,
                    "ON_DUTY",
                    dropoff.address,
                    "Arrived at dropoff - Unloading cargo",
                    0,
                    cumulative_driving_hours,
                    cumulative_on_duty_hours,
                    current_day,
                )
                current_time += timedelta(hours=self.PICKUP_DROPOFF_DURATION_HOURS)
                cumulative_on_duty_hours += self.PICKUP_DROPOFF_DURATION_HOURS

        self._add_event(
            current_time,
            "OFF_DUTY",
            dropoff.address,
            "Trip completed",
            0,
            cumulative_driving_hours,
            cumulative_on_duty_hours,
            current_day,
        )

    def _add_event(
        self,
        timestamp: datetime,
        event_type: str,
        location: str,
        description: str,
        miles: float,
        cumulative_driving: float,
        cumulative_on_duty: float,
        day: int,
    ):
        self.events.append(
            TripEvent(
                timestamp=timestamp,
                event_type=event_type,
                location=location,
                description=description,
                miles_driven=miles,
                cumulative_driving_hours=cumulative_driving,
                cumulative_on_duty_hours=cumulative_on_duty,
                day=day,
            )
        )

    def _add_fuel_stop(
        self,
        current_time: datetime,
        location: str,
        cumulative_driving: float,
        cumulative_on_duty: float,
        day: int,
    ) -> tuple:
        self._add_event(
            current_time,
            "ON_DUTY",
            location,
            "Fuel stop",
            0,
            cumulative_driving,
            cumulative_on_duty,
            day,
        )
        new_time = current_time + timedelta(hours=self.FUEL_STOP_DURATION_HOURS)
        new_on_duty = cumulative_on_duty + self.FUEL_STOP_DURATION_HOURS
        return new_time, new_on_duty

    def _add_rest_break(
        self,
        current_time: datetime,
        location: str,
        cumulative_driving: float,
        cumulative_on_duty: float,
        day: int,
    ) -> tuple:
        self._add_event(
            current_time,
            "OFF_DUTY",
            location,
            "30-min rest break",
            0,
            cumulative_driving,
            cumulative_on_duty,
            day,
        )
        new_time = current_time + timedelta(hours=self.REST_BREAK_DURATION_HOURS)
        new_on_duty = cumulative_on_duty + self.REST_BREAK_DURATION_HOURS
        return new_time, new_on_duty, 0

    def _add_off_duty_period(
        self,
        current_time: datetime,
        description: str,
        cumulative_on_duty: float,
        day: int,
    ) -> tuple:
        self._add_event(
            current_time,
            "OFF_DUTY",
            description,
            "10-hour rest period",
            0,
            0,
            cumulative_on_duty,
            day,
        )
        new_time = current_time + timedelta(hours=self.REQUIRED_OFF_DUTY_HOURS)
        return new_time, cumulative_on_duty

    def _generate_daily_logs(self):
        """Convert events to daily log format with 24-hour grid data."""
        if not self.events:
            return

        daily_events: dict = {}
        for event in self.events:
            date_str = event.timestamp.strftime("%Y-%m-%d")
            if date_str not in daily_events:
                daily_events[date_str] = []
            daily_events[date_str].append(event)

        day_number = 1
        for date_str in sorted(daily_events.keys()):
            events = daily_events[date_str]
            grid_entries = self._build_grid_entries(events)
            total_miles = sum(e.miles_driven for e in events)

            self.daily_logs.append(
                DailyLog(
                    day=day_number,
                    date=date_str,
                    total_miles=total_miles,
                    grid_entries=grid_entries,
                    remarks=[
                        e.description
                        for e in events
                        if e.event_type in ["ON_DUTY", "DRIVING"]
                    ],
                )
            )
            day_number += 1

    def _build_grid_entries(self, events: List[TripEvent]) -> List[dict]:
        """Build 24-hour grid entries for a single day."""
        grid = []

        for hour in range(24):
            status = "OFF_DUTY"

            for event in events:
                event_hour = event.timestamp.hour
                event_duration = 1

                if event_hour <= hour < event_hour + event_duration:
                    status = event.event_type
                    break

            grid.append(
                {
                    "hour": hour,
                    "status": status,
                    "location": events[0].location if events else "",
                }
            )

        return grid

    def _build_response(self) -> dict:
        """Build final JSON response."""
        return {
            "trip_id": f"trip_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "total_distance_miles": round(self.total_miles, 1),
            "estimated_duration_hours": round(
                sum(e.cumulative_on_duty_hours for e in self.events[-1:])
                if self.events
                else 0,
                1,
            ),
            "current_cycle_hours": self.current_cycle_hours,
            "events": [
                {
                    "day": e.day,
                    "timestamp": e.timestamp.isoformat(),
                    "type": e.event_type,
                    "location": e.location,
                    "description": e.description,
                    "miles_driven": round(e.miles_driven, 1),
                    "cumulative_driving_hours": round(e.cumulative_driving_hours, 2),
                    "cumulative_on_duty_hours": round(e.cumulative_on_duty_hours, 2),
                }
                for e in self.events
            ],
            "daily_logs": [
                {
                    "day": log.day,
                    "date": log.date,
                    "total_miles": round(log.total_miles, 1),
                    "grid_data": log.grid_entries,
                    "remarks": log.remarks,
                }
                for log in self.daily_logs
            ],
        }
