# SocialConnect - Social Media Web Application

A comprehensive social media backend application built with Django REST Framework and Next.js, featuring real-time notifications powered by Supabase.

## 🚀 Features

### Core Functionality
- **User Authentication**: JWT-based authentication with email verification
- **User Profiles**: Customizable profiles with avatar uploads
- **Content Creation**: Text posts with image uploads (JPEG/PNG, max 2MB)
- **Social Interactions**: Follow/unfollow users, like posts, comment system
- **Personalized Feed**: Chronological feed showing posts from followed users
- **Real-time Notifications**: Live notifications using Supabase Real-Time
- **Admin Panel**: User management and content oversight

### Technology Stack
- **Backend**: Python Django REST Framework
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: JWT with django-rest-framework-simplejwt
- **File Storage**: Supabase Storage
- **Frontend**: Next.js with TypeScript
- **UI Framework**: Tailwind CSS with shadcn/ui
- **Real-time**: Supabase Realtime
- **Deployment**: Render (Backend + Frontend)

## 📁 Project Structure

```
vegaStack-Assignment/
├── backend/                 # Django REST API
│   ├── socialconnect/      # Main Django project
│   ├── api/                # API endpoints
│   ├── users/              # User management
│   ├── posts/              # Post management
│   ├── notifications/      # Notification system
│   └── requirements.txt    # Python dependencies
├── frontend/               # Next.js application
│   ├── components/         # React components
│   ├── pages/             # Next.js pages
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities and config
│   └── package.json       # Node dependencies
└── README.md              # This file
```

## 🛠️ Setup Instructions

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

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/password-reset/` - Password reset
- `POST /api/auth/change-password/` - Change password

### Users
- `GET /api/users/me/` - Get own profile
- `PUT /api/users/me/` - Update own profile
- `GET /api/users/{user_id}/` - Get user profile
- `POST /api/users/{user_id}/follow/` - Follow user
- `DELETE /api/users/{user_id}/follow/` - Unfollow user

### Posts
- `GET /api/posts/` - List posts
- `POST /api/posts/` - Create post
- `GET /api/posts/{post_id}/` - Get post
- `PUT /api/posts/{post_id}/` - Update post
- `DELETE /api/posts/{post_id}/` - Delete post
- `POST /api/posts/{post_id}/like/` - Like post
- `DELETE /api/posts/{post_id}/like/` - Unlike post

### Feed
- `GET /api/feed/` - Personalized feed

### Notifications
- `GET /api/notifications/` - Get notifications
- `POST /api/notifications/{id}/read/` - Mark as read

### Admin (Admin only)
- `GET /api/admin/users/` - List all users
- `GET /api/admin/posts/` - List all posts
- `GET /api/admin/stats/` - Get statistics

## 🔐 Access Permissions

| Feature | User | Admin |
|---------|------|-------|
| Authentication | ✅ | ✅ |
| Profile Management | ✅ | ✅ |
| Post Management | ✅ | ✅ |
| Social Interactions | ✅ | ✅ |
| User Management | ❌ | ✅ |
| Content Oversight | ❌ | ✅ |

## 🚀 Deployment

### Easy Deployment (Recommended)
Use the `render.yaml` file in the root directory for one-click deployment of both services on Render!

### Manual Deployment
#### Backend (Render)
1. Push code to GitHub
2. Connect repository to Render
3. Set environment variables
4. Deploy

#### Frontend (Render)
1. Push code to GitHub
2. Connect repository to Render
3. Set environment variables
4. Deploy

## 📱 Features Demo

- **User Registration & Login**: Complete authentication flow
- **Profile Management**: Update bio, avatar, and settings
- **Post Creation**: Text posts with image uploads
- **Social Features**: Follow users, like posts, add comments
- **Personalized Feed**: View posts from followed users
- **Real-time Notifications**: Live updates for interactions
- **Admin Panel**: User and content management

## 🤝 Contributing

This is an assignment project for VegaStack. All code is original and follows best practices for Django and Next.js development.

## 📄 License

This project is created for educational purposes as part of the VegaStack assignment.
