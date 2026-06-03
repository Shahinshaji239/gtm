from django.urls import path
from .views import PhotoUploadView, PhotoListView, PhotoDeleteView, PhotoBulkDeleteView
from .views_proxy import DownloadPhotoView

urlpatterns = [
    path('events/<uuid:event_id>/upload/', PhotoUploadView.as_view(), name='photo-upload'),
    path('events/<uuid:event_id>/photos/', PhotoListView.as_view(), name='photo-list'),
    path('events/<uuid:event_id>/photos/delete-all/', PhotoBulkDeleteView.as_view(), name='photo-bulk-delete'),
    path('events/<uuid:event_id>/photos/<int:pk>/delete/', PhotoDeleteView.as_view(), name='photo-delete'),
    path('download-photo/', DownloadPhotoView.as_view(), name='download-photo'),
]
