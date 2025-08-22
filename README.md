# SocialConnect

## Features

- **User Authentication**: JWT-based authentication with email verification
- **User Profiles**: Customizable profiles with avatar uploads
- **Content Creation**: Text posts with image uploads (JPEG/PNG, max 2MB)
- **Social Interactions**: Follow/unfollow users, like posts, comment system
- **Personalized Feed**: Chronological feed showing posts from followed users
- **Real-time Notifications**: Live notifications using Supabase Real-Time
- **Admin Panel**: User management and content oversight

## Setup Instructions

### Backend Setup (Django)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   Create a `.env` file with:
   ```env
   SECRET_KEY=your-secret-key
   DEBUG=True
   DATABASE_URL=your-supabase-postgres-url
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_KEY=your-supabase-service-key
   EMAIL_HOST=
   EMAIL_PORT=
   EMAIL_USE_TLS=
   EMAIL_HOST_USER=
   EMAIL_HOST_PASSWORD=
   ```

5. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run the server:**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup (Next.js)

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file with:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```