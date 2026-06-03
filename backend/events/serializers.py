from rest_framework import serializers
from .models import Event
from django.conf import settings

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['id', 'name', 'event_date', 'created_at', 'status', 'qr_code_url']
        read_only_fields = ['id', 'created_at', 'qr_code_url', 'status']

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['organizer'] = request.user
        return super().create(validated_data)
