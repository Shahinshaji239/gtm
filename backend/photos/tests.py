from types import SimpleNamespace
from django.test import SimpleTestCase

from .utils import get_photo_url


class GetPhotoUrlTests(SimpleTestCase):
    def test_returns_absolute_storage_url_without_request_rewrite(self):
        photo = SimpleNamespace(
            image=SimpleNamespace(url='https://cdn.example.com/media/event_photos/test.jpg'),
            s3_url=None,
        )

        self.assertEqual(
            get_photo_url(photo),
            'https://cdn.example.com/media/event_photos/test.jpg',
        )

    def test_builds_absolute_url_for_relative_media_path(self):
        request = SimpleNamespace(
            build_absolute_uri=lambda path: f'http://localhost:8000{path}',
        )
        photo = SimpleNamespace(
            image=SimpleNamespace(url='/media/event_photos/test.jpg'),
            s3_url=None,
        )

        self.assertEqual(
            get_photo_url(photo, request),
            'http://localhost:8000/media/event_photos/test.jpg',
        )
