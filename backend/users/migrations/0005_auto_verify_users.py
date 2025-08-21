from django.db import migrations, models

def verify_all_users(apps, schema_editor):
    """Verify all existing users"""
    User = apps.get_model('users', 'User')
    User.objects.all().update(is_verified=True)

def reverse_verify_users(apps, schema_editor):
    """Reverse: set all users as unverified"""
    User = apps.get_model('users', 'User')
    User.objects.all().update(is_verified=False)

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_rename_users_emailv_token_8b2b8b_idx_users_email_token_76af91_idx_and_more'),
    ]

    operations = [
        migrations.RunPython(verify_all_users, reverse_verify_users),
    ]
