import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { authApi } from '@/lib/api';
import { registerSchema, loginSchema, type RegisterInput, type LoginInput } from '@shared/schema';
import { Building2, Eye, EyeOff } from 'lucide-react';

import property1 from '@/assets/images/carousel/property-1.jpg';
import property2 from '@/assets/images/carousel/property-2.jpg';
import property3 from '@/assets/images/carousel/property-3.jpg';

const carouselImages = [property1, property2, property3];

const carouselTaglines = [
  'Browse thousands of properties to buy, sell, or rent with trusted agents.',
  'AI-powered infographics for real estate professionals.',
  'Create stunning property listings in seconds.',
];

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', name: '', organizationName: '' },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      login(data.user, data.token);
      toast.success('Welcome back!', { description: 'Successfully logged in.' });
    },
    onError: (error: Error) => {
      toast.error('Login failed', { description: error.message });
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      login(data.user, data.token);
      toast.success('Account created!', { description: 'Welcome to InfographicAI.' });
    },
    onError: (error: Error) => {
      toast.error('Registration failed', { description: error.message });
    },
  });

  const handleGoogleLogin = () => {
    window.location.href = '/api/v1/auth/google';
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 md:p-8">
      {carouselImages.map((img, i) => (
        <div
          key={i}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
          style={{
            backgroundImage: `url(${img})`,
            opacity: currentSlide === i ? 1 : 0,
            filter: 'blur(20px) brightness(0.7)',
            transform: 'scale(1.1)',
          }}
        />
      ))}

      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.15)' }} />

      <div
        className="relative z-10 w-full max-w-[1100px] flex flex-col lg:flex-row overflow-hidden"
        style={{
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
        }}
      >
        <div className="w-full lg:w-[45%] p-8 md:p-10 lg:p-12 flex flex-col justify-center"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(60px)',
            WebkitBackdropFilter: 'blur(60px)',
          }}
        >
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2.5 mb-6">
              <Building2 className="h-9 w-9 text-white" />
              <span className="text-xl font-bold text-white tracking-tight">InfographicAI</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center">
              {isLoginMode ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-white/70 text-sm text-center">
              {isLoginMode
                ? "Let's login to grab amazing deals"
                : 'Sign up to start creating stunning infographics'}
            </p>
          </div>

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-lg mb-4"
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              backdropFilter: 'blur(10px)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
            <span className="text-xs text-white/50 uppercase tracking-wider">Or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
          </div>

          {isLoginMode ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-white/70 mb-1">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="agent@realty.com"
                          data-testid="input-email"
                          className="h-11 rounded-xl border-0 text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-white/40"
                          style={{
                            background: 'rgba(255,255,255,0.12)',
                            backdropFilter: 'blur(10px)',
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs mt-1 text-red-300" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-white/70 mb-1">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            data-testid="input-password"
                            className="h-11 rounded-xl border-0 text-white placeholder:text-white/40 pr-10 focus-visible:ring-1 focus-visible:ring-white/40"
                            style={{
                              background: 'rgba(255,255,255,0.12)',
                              backdropFilter: 'blur(10px)',
                            }}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs mt-1 text-red-300" />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember" className="border-white/30 data-[state=checked]:bg-white/20 data-[state=checked]:border-white/40" />
                    <label htmlFor="remember" className="text-xs text-white/60 cursor-pointer">Remember me</label>
                  </div>
                  <button type="button" className="text-xs text-white/70 hover:text-white underline transition-colors">
                    Forgot Password?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 mt-2"
                  style={{
                    background: 'linear-gradient(135deg, #3d2b4f 0%, #2d1f3d 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-white/70 mb-1">Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          data-testid="input-name"
                          className="h-11 rounded-xl border-0 text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-white/40"
                          style={{
                            background: 'rgba(255,255,255,0.12)',
                            backdropFilter: 'blur(10px)',
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs mt-1 text-red-300" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-white/70 mb-1">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="agent@realty.com"
                          data-testid="input-register-email"
                          className="h-11 rounded-xl border-0 text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-white/40"
                          style={{
                            background: 'rgba(255,255,255,0.12)',
                            backdropFilter: 'blur(10px)',
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs mt-1 text-red-300" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-white/70 mb-1">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            data-testid="input-register-password"
                            className="h-11 rounded-xl border-0 text-white placeholder:text-white/40 pr-10 focus-visible:ring-1 focus-visible:ring-white/40"
                            style={{
                              background: 'rgba(255,255,255,0.12)',
                              backdropFilter: 'blur(10px)',
                            }}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs mt-1 text-red-300" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-white/70 mb-1">Company/Brokerage (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ABC Realty"
                          data-testid="input-organization"
                          className="h-11 rounded-xl border-0 text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-white/40"
                          style={{
                            background: 'rgba(255,255,255,0.12)',
                            backdropFilter: 'blur(10px)',
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs mt-1 text-red-300" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 mt-2"
                  style={{
                    background: 'linear-gradient(135deg, #3d2b4f 0%, #2d1f3d 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  disabled={registerMutation.isPending}
                  data-testid="button-register"
                >
                  {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </Form>
          )}

          <p className="text-center text-sm text-white/60 mt-6">
            {isLoginMode ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-white font-semibold underline underline-offset-2 hover:text-white/90 transition-colors"
            >
              {isLoginMode ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>

        <div className="hidden lg:block w-[55%] relative overflow-hidden" style={{ borderRadius: '0 24px 24px 0' }}>
          {carouselImages.map((img, i) => (
            <div
              key={i}
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
              style={{
                backgroundImage: `url(${img})`,
                opacity: currentSlide === i ? 1 : 0,
              }}
            />
          ))}

          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.2) 100%)' }} />

          <div className="absolute top-8 left-8 right-8 z-10">
            <p className="text-white text-lg md:text-xl font-semibold leading-relaxed drop-shadow-lg" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
              {carouselTaglines[currentSlide]}
            </p>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {carouselImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className="transition-all duration-300"
                style={{
                  width: currentSlide === i ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: currentSlide === i ? 'white' : 'rgba(255,255,255,0.5)',
                }}
              />
            ))}
          </div>

          
        </div>
      </div>
    </div>
  );
}
