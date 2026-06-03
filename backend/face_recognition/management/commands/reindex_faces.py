from django.core.management.base import BaseCommand, CommandError

from photos.models import Photo
from face_recognition.tasks import index_photo_faces


class Command(BaseCommand):
    help = "Reindex faces for event photos."

    def add_arguments(self, parser):
        parser.add_argument(
            "--event-id",
            dest="event_id",
            help="Only reindex photos for the given event UUID.",
        )

    def handle(self, *args, **options):
        photos = Photo.objects.all().order_by("uploaded_at")
        event_id = options.get("event_id")

        if event_id:
            photos = photos.filter(event_id=event_id)

        if not photos.exists():
            raise CommandError("No photos found to reindex.")

        total = photos.count()
        self.stdout.write(f"Reindexing {total} photo(s)...")

        for index, photo in enumerate(photos, start=1):
            self.stdout.write(f"[{index}/{total}] Photo {photo.id}")
            index_photo_faces(photo.id)

        self.stdout.write(self.style.SUCCESS("Face reindex completed."))
