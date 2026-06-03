from django.core.management.base import BaseCommand

from face_recognition.services import get_rekognition_client


class Command(BaseCommand):
    help = "Test basic AWS Rekognition connectivity."

    def handle(self, *args, **options):
        client = get_rekognition_client()
        self.stdout.write("Testing Rekognition connectivity...")

        try:
            response = client.list_collections(MaxResults=5)
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f"Rekognition test failed: {exc}"))
            return

        collection_ids = response.get("CollectionIds", [])
        self.stdout.write(self.style.SUCCESS("Rekognition connection succeeded."))
        self.stdout.write(f"Collections visible: {len(collection_ids)}")

        for collection_id in collection_ids:
            self.stdout.write(f"- {collection_id}")
