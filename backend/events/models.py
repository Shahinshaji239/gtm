import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()

class Event(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('closed', 'Closed'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    event_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events')
    qr_code_url = models.URLField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.qr_code_url:
            # Assuming domain is passed or configured. We use a placeholder domain for now
            # In a real app, this should come from settings or request
            domain = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            event_url = f"{domain}/event/{self.id}"
            self.qr_code_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={event_url}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
