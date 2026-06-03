from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from events.models import Event
from .models import FaceEmbedding
from .services import search_faces_by_image
from photos.utils import get_photo_url

class SearchFaceView(views.APIView):
    permission_classes = [AllowAny]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)
        
        if 'selfie' not in request.FILES:
            return Response({'error': 'No selfie provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        selfie_file = request.FILES['selfie'].read()
        collection_id = f"event-{event.id}"
        
        try:
            matches = search_faces_by_image(collection_id, selfie_file)
            if matches is None:
                return Response(
                    {'error': 'Face search is temporarily unavailable. Please try again.'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            matched_face_ids = [match['Face']['FaceId'] for match in matches]
            
            if not matched_face_ids:
                return Response({'matched_photos': []}, status=status.HTTP_200_OK)
            
            # Find all embeddings that match the returned Face IDs
            embeddings = FaceEmbedding.objects.filter(photo__event=event, face_id__in=matched_face_ids)
            # Get unique photos
            matched_photos = list(set([emb.photo for emb in embeddings]))
            
            photo_urls = [get_photo_url(photo, request) for photo in matched_photos]
            
            # Filter out Nones
            photo_urls = [url for url in photo_urls if url]
            
            return Response({'matched_photos': photo_urls}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
