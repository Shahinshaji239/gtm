from django.db import models
from photos.models import Photo

class FaceEmbedding(models.fields.Field):
    pass # Will rewrite

class FaceEmbedding(models.Model):
    photo = models.ForeignKey(Photo, on_delete=models.CASCADE, related_name='faces')
    face_id = models.CharField(max_length=255, db_index=True)
    bounding_box = models.JSONField(default=dict)
    confidence = models.FloatField(default=0.0)

    def __str__(self):
        return f"Face {self.face_id} from Photo {self.photo.id}"
