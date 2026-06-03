def get_photo_url(photo, request=None):
    if not photo.image:
        return photo.s3_url or None

    image_url = photo.image.url
    if image_url.startswith('http://') or image_url.startswith('https://'):
        return image_url

    if request:
        return request.build_absolute_uri(image_url)

    return image_url
