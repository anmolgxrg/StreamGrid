import React, { useState } from 'react'
import { Box, TextField, Button, Typography, InputAdornment, IconButton } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { AuthService } from '../services/authService'
import '../assets/login.css'

interface LoginPageProps {
  onLoginSuccess: () => void
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { data, error } = await AuthService.signIn(email, password)
      
      if (error) {
        setError(error.message)
      } else if (data.user) {
        onLoginSuccess()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <Box
      className="login-page"
      sx={{
        height: '100vh',
        display: 'flex',
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
      }}
    >
      {/* Left Section - Black Background */}
      <Box
        className="login-left-section"
        sx={{
          width: '40%',
          backgroundColor: '#000000',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          padding: '0 60px'
        }}
      >
        {/* Branding */}
        <Box
          sx={{
            position: 'absolute',
            top: '40px',
            left: '40px'
          }}
        >
          <Typography
            className="login-brand-text"
            variant="h5"
            sx={{
              fontWeight: 'bold',
              letterSpacing: '2px'
            }}
          >
            FLYWHEEL AI
          </Typography>
        </Box>

        {/* Main Tagline */}
        <Typography
          className="login-tagline"
          variant="h2"
          sx={{
            fontWeight: 'bold',
            textAlign: 'center',
            lineHeight: 1.2,
            fontSize: { xs: '2.5rem', md: '3.5rem' }
          }}
        >
          Your WiFi can now move 25 tons.
        </Typography>

        {/* Bottom Decorative Line */}
        <Box
          className="login-decorative-line"
          sx={{
            position: 'absolute',
            bottom: '40px',
            left: '40px',
            width: '60px',
            height: '2px'
          }}
        />
      </Box>

      {/* Right Section - Light Background */}
      <Box
        sx={{
          width: '60%',
          backgroundColor: '#F8F8F8',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0 80px'
        }}
      >
        <Box sx={{ width: '100%', maxWidth: '400px' }}>
          {/* Sign In Title */}
          <Typography
            variant="h3"
            sx={{
              color: '#333333',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '40px',
              fontSize: '2.5rem'
            }}
          >
            Sign in
          </Typography>

          {/* Error Message */}
          {error && (
            <Typography
              variant="body2"
              sx={{
                color: '#d32f2f',
                textAlign: 'center',
                marginBottom: '20px',
                padding: '10px',
                backgroundColor: '#ffebee',
                borderRadius: '4px'
              }}
            >
              {error}
            </Typography>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <Box sx={{ marginBottom: '24px' }}>
              <Typography
                variant="body1"
                sx={{
                  color: '#333333',
                  fontWeight: '500',
                  marginBottom: '8px'
                }}
              >
                Username
              </Typography>
              <TextField
                fullWidth
                type="email"
                placeholder="Enter your username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="login-input"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: '#E0E0E0',
                      borderWidth: '1px'
                    },
                    '&:hover fieldset': {
                      borderColor: '#B0B0B0'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8A63ED',
                      borderWidth: '2px'
                    }
                  },
                  '& .MuiInputBase-input': {
                    padding: '12px 16px',
                    fontSize: '16px',
                    '&::placeholder': {
                      color: '#999999',
                      opacity: 1
                    }
                  }
                }}
              />
            </Box>

            {/* Password Field */}
            <Box sx={{ marginBottom: '32px' }}>
              <Typography
                variant="body1"
                sx={{
                  color: '#333333',
                  fontWeight: '500',
                  marginBottom: '8px'
                }}
              >
                Password
              </Typography>
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="login-input"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                        sx={{ color: '#666666' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: '#E0E0E0',
                      borderWidth: '1px'
                    },
                    '&:hover fieldset': {
                      borderColor: '#B0B0B0'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8A63ED',
                      borderWidth: '2px'
                    }
                  },
                  '& .MuiInputBase-input': {
                    padding: '12px 16px',
                    fontSize: '16px',
                    '&::placeholder': {
                      color: '#999999',
                      opacity: 1
                    }
                  }
                }}
              />
            </Box>

            {/* Sign In Button */}
            <Button
              type="submit"
              fullWidth
              disabled={isLoading}
              className="login-button"
              sx={{
                color: '#FFFFFF',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                textTransform: 'none',
                '&:disabled': {
                  backgroundColor: '#CCCCCC',
                  color: '#666666'
                }
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </Box>
      </Box>
    </Box>
  )
}
