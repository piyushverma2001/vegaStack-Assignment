from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Profile

User = get_user_model()

class Command(BaseCommand):
    help = 'Create missing profiles for existing users'

    def handle(self, *args, **options):
        users_without_profiles = User.objects.filter(profile__isnull=True)
        
        if not users_without_profiles.exists():
            self.stdout.write(
                self.style.SUCCESS('All users already have profiles!')
            )
            return
        
        created_count = 0
        for user in users_without_profiles:
            Profile.objects.create(user=user)
            created_count += 1
            self.stdout.write(f'Created profile for user: {user.username}')
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} profiles!')
        )
