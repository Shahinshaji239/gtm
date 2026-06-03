from django.db import models
from events.models import Event


class Photo(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='photos')
    # Use ImageField, which will use django-storages (S3) or local depending on settings
    image = models.ImageField(upload_to='event_photos/')
    # Or store S3 URL directly if uploaded manually
    s3_url = models.URLField(blank=True, null=True)
    detected_faces_metadata = models.JSONField(default=dict, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Photo {self.id} for Event {self.event.name}"

    def delete(self, *args, **kwargs):
        storage = self.image.storage if self.image else None
        image_name = self.image.name if self.image else None

        super().delete(*args, **kwargs)

        if storage and image_name:
            storage.delete(image_name)
