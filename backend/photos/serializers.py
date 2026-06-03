from rest_framework import serializers
from .models import Photo
from .utils import get_photo_url

class PhotoSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    def get_image_url(self, obj):
        return get_photo_url(obj, self.context.get('request'))

    class Meta:
        model = Photo
        fields = ['id', 'event', 'image', 'image_url', 's3_url', 'uploaded_at']
        read_only_fields = ['id', 'event', 'image_url', 's3_url', 'uploaded_at']
