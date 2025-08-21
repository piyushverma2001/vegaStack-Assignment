# Generated manually for email verification and password reset tokens

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_follow_is_active'),
    ]

    operations = [
        migrations.CreateModel(
            name='EmailVerificationToken',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('token', models.CharField(max_length=64, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField()),
                ('is_used', models.BooleanField(default=False)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='verification_tokens', to='users.user')),
            ],
            options={
                'indexes': [
                    models.Index(fields=['token', 'is_used'], name='users_emailv_token_8b2b8b_idx'),
                    models.Index(fields=['user', 'is_used'], name='users_emailv_user_id_9c8c8c_idx'),
                ],
            },
        ),
        migrations.CreateModel(
            name='PasswordResetToken',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('token', models.CharField(max_length=64, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField()),
                ('is_used', models.BooleanField(default=False)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='password_reset_tokens', to='users.user')),
            ],
            options={
                'indexes': [
                    models.Index(fields=['token', 'is_used'], name='users_passwor_token_7a1a1a_idx'),
                    models.Index(fields=['user', 'is_used'], name='users_passwor_user_id_8b2b2b_idx'),
                ],
            },
        ),
    ]
