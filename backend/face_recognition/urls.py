from django.urls import path
from .views import SearchFaceView

urlpatterns = [
    path('<uuid:event_id>/search-face/', SearchFaceView.as_view(), name='search-face'),
]
