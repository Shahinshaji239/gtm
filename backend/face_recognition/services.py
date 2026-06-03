import boto3
import io
import time
from django.conf import settings
from PIL import Image


MAX_REKOGNITION_IMAGE_BYTES = 4 * 1024 * 1024


def get_rekognition_client():
    return boto3.client(
        'rekognition',
        aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
        aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
        region_name=getattr(settings, 'AWS_REGION', 'us-east-1')
    )


def _with_retries(action, attempts=3, delay_seconds=1):
    last_error = None
    for attempt in range(1, attempts + 1):
        try:
            return action()
        except Exception as e:
            last_error = e
            print(f"Rekognition attempt {attempt}/{attempts} failed: {e}")
            if attempt < attempts:
                time.sleep(delay_seconds)
    raise last_error


def _prepare_image_bytes(image_bytes, max_bytes=MAX_REKOGNITION_IMAGE_BYTES):
    if len(image_bytes) <= max_bytes:
        return image_bytes

    image = Image.open(io.BytesIO(image_bytes))
    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")
    elif image.mode == "L":
        image = image.convert("RGB")

    width, height = image.size
    quality = 90

    for _ in range(6):
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=quality, optimize=True)
        prepared = buffer.getvalue()
        if len(prepared) <= max_bytes:
            return prepared

        width = max(int(width * 0.8), 640)
        height = max(int(height * 0.8), 640)
        image = image.resize((width, height), Image.LANCZOS)
        quality = max(quality - 10, 55)

    return prepared[:max_bytes]

def search_faces_by_image(collection_id, image_bytes, threshold=80):
    """
    Search AWS Rekognition collection using an uploaded image (selfie).
    """
    client = get_rekognition_client()
    try:
        prepared_image_bytes = _prepare_image_bytes(image_bytes)
        response = _with_retries(
            lambda: client.search_faces_by_image(
                CollectionId=collection_id,
                Image={'Bytes': prepared_image_bytes},
                FaceMatchThreshold=threshold,
                MaxFaces=100
            )
        )
        return response.get('FaceMatches', [])
    except client.exceptions.ResourceNotFoundException:
        # Collection might not exist yet if no photos uploaded
        return []
    except Exception as e:
        print(f"Rekognition error: {e}")
        return None

def index_faces(collection_id, s3_bucket, s3_key):
    """
    Index a face into a Rekognition collection from S3.
    """
    client = get_rekognition_client()
    try:
        # Ensure collection exists
        try:
            client.create_collection(CollectionId=collection_id)
        except client.exceptions.ResourceAlreadyExistsException:
            pass
            
        response = _with_retries(
            lambda: client.index_faces(
                CollectionId=collection_id,
                Image={
                    'S3Object': {
                        'Bucket': s3_bucket,
                        'Name': s3_key
                    }
                },
                ExternalImageId=s3_key.replace('/', '-'),
                DetectionAttributes=['ALL']
            )
        )
        return response.get('FaceRecords', [])
    except Exception as e:
        print(f"Rekognition index error: {e}")
        return None


def index_faces_by_image_bytes(collection_id, image_bytes, external_image_id):
    """
    Index faces directly from uploaded image bytes.
    This works for local media storage and avoids requiring S3-backed uploads.
    """
    client = get_rekognition_client()
    try:
        prepared_image_bytes = _prepare_image_bytes(image_bytes)
        try:
            client.create_collection(CollectionId=collection_id)
        except client.exceptions.ResourceAlreadyExistsException:
            pass

        response = _with_retries(
            lambda: client.index_faces(
                CollectionId=collection_id,
                Image={'Bytes': prepared_image_bytes},
                ExternalImageId=external_image_id,
                DetectionAttributes=['ALL']
            )
        )
        return response.get('FaceRecords', [])
    except Exception as e:
        print(f"Rekognition index-bytes error: {e}")
        return None
