# Authentication Setup

This application now includes Supabase authentication with a beautiful login page that matches the provided design.

## Features

- **Login Page**: Matches the exact UI design with:
  - Left section: Black background with "FLYWHEEL AI" branding and tagline
  - Right section: Light gray background with login form
  - Purple accent color (#8A63ED) throughout
  - Password visibility toggle
  - Form validation and error handling

- **Supabase Integration**: 
  - User authentication with email/password
  - Session management
  - Automatic login state persistence
  - Sign out functionality

## Configuration

The Supabase configuration is set up in `src/renderer/src/config/supabase.ts` with the provided keys:

- **URL**: https://rvjpctnopeesjnjutfvj.supabase.co
- **Anon Key**: Configured and ready to use

## Usage

1. **First Time Setup**: Users need to create an account through Supabase dashboard or implement a sign-up flow
2. **Login**: Users can sign in with their email and password
3. **Protected Routes**: The main application is only accessible after authentication
4. **Sign Out**: Users can sign out using the button in the app bar

## Files Added/Modified

- `src/renderer/src/config/supabase.ts` - Supabase client configuration
- `src/renderer/src/services/authService.ts` - Authentication service layer
- `src/renderer/src/hooks/useAuth.ts` - React hook for authentication state
- `src/renderer/src/components/LoginPage.tsx` - Login page component
- `src/renderer/src/assets/login.css` - Custom styles for login page
- `src/renderer/src/App.tsx` - Updated to include authentication flow

## Next Steps

To complete the setup, you may want to:

1. Set up user registration in your Supabase dashboard
2. Add a sign-up page if needed
3. Implement password reset functionality
4. Add user profile management
5. Set up Row Level Security (RLS) policies in Supabase

The authentication is now fully integrated and the login page matches the provided design exactly!
