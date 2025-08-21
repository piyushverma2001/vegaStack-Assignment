import os
from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from supabase import create_client, Client
from decouple import config
import uuid
from typing import Tuple

class SupabaseStorage:
    
    def __init__(self):
        self.supabase_url = config('SUPABASE_URL')
        self.supabase_key = config('SUPABASE_SERVICE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables")
        
        try:
            self.client: Client = create_client(self.supabase_url, self.supabase_key)
            self.bucket_name = 'socialconnect'
            
            self.ensure_bucket_exists()
        except Exception as e:
            print(f"Failed to initialize Supabase client: {str(e)}")
            raise ValueError(f"Failed to initialize Supabase client: {str(e)}")
    
    def ensure_bucket_exists(self):
        try:
            buckets = self.client.storage.list_buckets()
            bucket_names = [bucket.name for bucket in buckets]
            
            if self.bucket_name not in bucket_names:
                self.client.storage.create_bucket(
                    self.bucket_name,
                    options={"public": True}
                )
        except Exception as e:
            print(f"Warning: Could not ensure bucket exists: {str(e)}")
    
    def upload_image(self, image_file: UploadedFile, folder: str = 'posts') -> Tuple[str, str]:
        try:
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png']
            if image_file.content_type not in allowed_types:
                raise ValueError("Only JPEG and PNG images are allowed")
            
            if image_file.size > 2 * 1024 * 1024:
                raise ValueError("Image size must be less than 2MB")
            
            file_extension = image_file.name.split('.')[-1]
            filename = f"{uuid.uuid4()}.{file_extension}"
            file_path = f"{folder}/{filename}"
            
            file_content = image_file.read()
            
            response = self.client.storage.from_(self.bucket_name).upload(
                path=file_path,
                file=file_content,
                file_options={"content-type": image_file.content_type}
            )
            
            if response:
                public_url = self.client.storage.from_(self.bucket_name).get_public_url(file_path)
                return file_path, public_url
            else:
                raise Exception("Failed to upload image to Supabase")
                
        except Exception as e:
            print(f"Upload failed with error: {str(e)}")
            raise Exception(f"Image upload failed: {str(e)}")
    
    def delete_image(self, file_path: str) -> bool:
        try:
            response = self.client.storage.from_(self.bucket_name).remove([file_path])
            return bool(response)
        except Exception as e:
            print(f"Failed to delete image {file_path}: {str(e)}")
            return False
    
    def get_image_url(self, file_path: str) -> str:
        return self.client.storage.from_(self.bucket_name).get_public_url(file_path)

def get_supabase_storage() -> SupabaseStorage:
    return SupabaseStorage()
