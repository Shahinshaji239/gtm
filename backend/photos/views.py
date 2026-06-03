from rest_framework import generics
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Photo
from events.models import Event
from .serializers import PhotoSerializer
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import status
from face_recognition.tasks import index_photo_faces
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class PhotoUploadView(generics.CreateAPIView):
    queryset = Photo.objects.all()
    serializer_class = PhotoSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def perform_create(self, serializer):
        event_id = self.kwargs.get('event_id')
        event = get_object_or_404(Event, id=event_id, organizer=self.request.user)
        photo = serializer.save(event=event)
        logger.info(
            "Saved photo %s for event %s. Async face indexing enabled=%s",
            photo.id,
            event.id,
            getattr(settings, 'ASYNC_FACE_INDEXING_ENABLED', True),
        )

        if not getattr(settings, 'ASYNC_FACE_INDEXING_ENABLED', True):
            logger.info("Skipping automatic face indexing for photo %s", photo.id)
            return

        try:
            index_photo_faces.delay(photo.id)
            logger.info("Queued face indexing for photo %s", photo.id)
        except Exception as exc:
            logger.warning("Failed to enqueue face indexing for photo %s: %s", photo.id, exc)

class PhotoListView(generics.ListAPIView):
    serializer_class = PhotoSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        event_id = self.kwargs.get('event_id')
        return Photo.objects.filter(event__id=event_id).order_by('-uploaded_at')

class PhotoDeleteView(generics.DestroyAPIView):
    serializer_class = PhotoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        event_id = self.kwargs.get('event_id')
        return Photo.objects.filter(event__id=event_id, event__organizer=self.request.user)


class PhotoBulkDeleteView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        event_id = self.kwargs.get('event_id')
        event = get_object_or_404(Event, id=event_id, organizer=request.user)
        photos = list(Photo.objects.filter(event=event))
        deleted_count = len(photos)

        for photo in photos:
            photo.delete()

        logger.info("Deleted %s photos for event %s", deleted_count, event.id)
        return Response({"deleted_count": deleted_count}, status=status.HTTP_200_OK)
