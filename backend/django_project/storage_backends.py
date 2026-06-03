from django.conf import settings
from storages.backends.s3 import S3Storage


class MediaStorage(S3Storage):
    location = settings.AWS_MEDIA_LOCATION
    file_overwrite = False
