from rest_framework import serializers


class LocationSerializer(serializers.Serializer):
    lat = serializers.FloatField(required=True)
    lng = serializers.FloatField(required=True)
    address = serializers.CharField(required=False, allow_blank=True, default="")


class TripInputSerializer(serializers.Serializer):
    origin = LocationSerializer(required=True)
    pickup = LocationSerializer(required=True)
    dropoff = LocationSerializer(required=True)
    current_cycle_hours = serializers.FloatField(
        required=True,
        min_value=0,
        max_value=70,
        help_text="Hours already used in current 70hr/8day cycle",
    )
    start_time = serializers.DateTimeField(required=False, allow_null=True)
