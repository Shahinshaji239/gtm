import io
import mimetypes
from pathlib import Path
from django.http import HttpResponse, FileResponse
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from PIL import Image


# Path to the watermark image (lives next to this file)
WATERMARK_PATH = Path(__file__).parent / "watermark.png"


def apply_watermark(image_source) -> io.BytesIO:
    """Open image, place watermark logo at bottom-right with 50% opacity."""
    img = Image.open(image_source).convert("RGBA")
    width, height = img.size

    if not WATERMARK_PATH.exists():
        # No watermark file found — return original image as JPEG
        output = io.BytesIO()
        img.convert("RGB").save(output, format="JPEG", quality=90)
        output.seek(0)
        return output

    # Load watermark and convert to RGBA for transparency support
    wm = Image.open(WATERMARK_PATH).convert("RGBA")
    
    # Scale watermark to 12% of photo width, keep aspect ratio
    wm_target_w = max(50, int(width * 0.12))
    wm_scale = wm_target_w / wm.width
    wm_target_h = int(wm.height * wm_scale)
    wm = wm.resize((wm_target_w, wm_target_h), Image.LANCZOS)

    # Apply 60% opacity to the watermark
    r, g, b, a = wm.split()
    a = a.point(lambda x: int(x * 0.6))   # 60% opacity
    wm = Image.merge("RGBA", (r, g, b, a))

    # Position: bottom-right with a small padding
    padding = max(15, width // 60)
    pos_x = width - wm_target_w - padding
    pos_y = height - wm_target_h - padding

    # Composite watermark onto photo
    img.paste(wm, (pos_x, pos_y), wm)

    # Save result
    output = io.BytesIO()
    img.convert("RGB").save(output, format="JPEG", quality=90)
    output.seek(0)
    return output


from django.core.files.storage import default_storage

class DownloadPhotoView(APIView):
    """
    Serves a media file using default_storage with a watermark applied and
    Content-Disposition: attachment so the browser downloads it.

    Usage: GET /api/download-photo/?path=event_photos/filename.JPG
    """
    permission_classes = [AllowAny]

    def get(self, request):
        relative_path = request.GET.get('path', '').lstrip('/')
        if not relative_path:
            return HttpResponse("'path' query param is required", status=400)

        if not default_storage.exists(relative_path):
            return HttpResponse("File not found", status=404)

        try:
            file_obj = default_storage.open(relative_path, 'rb')
        except Exception:
            return HttpResponse("Error opening file", status=500)

        path_obj = Path(relative_path)
        filename = path_obj.stem + "_watermarked.jpg"

        try:
            watermarked = apply_watermark(file_obj)
            response = HttpResponse(watermarked.read(), content_type="image/jpeg")
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['Access-Control-Allow-Origin'] = '*'
            return response
        except Exception as e:
            print("Watermarking error:", e)
            file_obj.seek(0)
            response = FileResponse(
                file_obj,
                content_type=mimetypes.guess_type(relative_path)[0] or 'application/octet-stream',
                as_attachment=True,
                filename=path_obj.name,
            )
            response['Access-Control-Allow-Origin'] = '*'
            return response
