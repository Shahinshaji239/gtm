from celery import shared_task
from django.conf import settings
from .services import index_faces, index_faces_by_image_bytes
from photos.models import Photo
from .models import FaceEmbedding
import logging

logger = logging.getLogger(__name__)


def _build_s3_key(image_name):
    image_key = (image_name or '').lstrip('/')
    media_location = getattr(settings, 'AWS_MEDIA_LOCATION', '').strip().strip('/')

    if not media_location or image_key.startswith(f"{media_location}/"):
        return image_key

    return f"{media_location}/{image_key}"


@shared_task
def index_photo_faces(photo_id):
    try:
        logger.info("Starting face indexing for photo %s", photo_id)
        photo = Photo.objects.get(id=photo_id)
        collection_id = f"event-{photo.event.id}"
        bucket_name = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', '')
        use_s3_media = getattr(settings, 'USE_S3_MEDIA', False)
        s3_key = _build_s3_key(photo.image.name)

        if not photo.image:
            logger.warning("No image file associated with photo %s", photo_id)
            return

        if use_s3_media and bucket_name:
            face_records = index_faces(
                collection_id,
                bucket_name,
                s3_key,
            )
        else:
            try:
                photo.image.open('rb')
                image_bytes = photo.image.read()
                photo.image.close()
            except FileNotFoundError:
                if not bucket_name:
                    raise

                logger.warning(
                    "Local image missing for photo %s at %s; falling back to S3 object %s",
                    photo_id,
                    getattr(photo.image, 'path', photo.image.name),
                    photo.image.name,
                )
                face_records = index_faces(
                    collection_id,
                    bucket_name,
                    s3_key,
                )
            else:
                face_records = index_faces_by_image_bytes(
                    collection_id,
                    image_bytes,
                    f"photo-{photo.id}"
                )

        if face_records is None:
            logger.warning("Face indexing returned no records for photo %s", photo_id)
            return

        FaceEmbedding.objects.filter(photo=photo).delete()

        for record in face_records:
            face = record['Face']
            FaceEmbedding.objects.create(
                photo=photo,
                face_id=face['FaceId'],
                bounding_box=face['BoundingBox'],
                confidence=face['Confidence']
            )
            
        logger.info(
            "Successfully indexed %s faces for photo %s in collection %s",
            len(face_records),
            photo_id,
            collection_id,
        )
    except Photo.DoesNotExist:
        logger.warning("Photo %s not found during indexing", photo_id)
    except Exception as e:
        logger.exception("Error indexing photo %s: %s", photo_id, e)
