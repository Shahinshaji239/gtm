from django.urls import path
from .views import EventCreateView, EventListView, EventDetailView, EventDeleteView, EventUpdateView

urlpatterns = [
    path('create/', EventCreateView.as_view(), name='event-create'),
    path('', EventListView.as_view(), name='event-list'),
    path('<uuid:id>/', EventDetailView.as_view(), name='event-detail'),
    path('<uuid:id>/update/', EventUpdateView.as_view(), name='event-update'),
    path('<uuid:id>/delete/', EventDeleteView.as_view(), name='event-delete'),
]
