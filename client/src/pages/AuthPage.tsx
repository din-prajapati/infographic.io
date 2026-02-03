import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { authApi } from '@/lib/api';
import { registerSchema, loginSchema, type RegisterInput, type LoginInput } from '@shared/schema';
import { Building2, Sparkles } from 'lucide-react';

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('login');

  // Redirect to home only after auth state has committed (fixes first-login no-redirect)
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

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
      // Navigation is handled by useEffect when isAuthenticated becomes true
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
      // Navigation is handled by useEffect when isAuthenticated becomes true
    },
    onError: (error: Error) => {
      toast.error('Registration failed', { description: error.message });
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center gradient-purple-blue p-4">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="text-center space-y-2 pb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="h-10 w-10 text-primary" />
            <Sparkles className="h-8 w-8 text-primary/60" />
          </div>
          <CardTitle className="text-3xl font-bold">InfographicAI</CardTitle>
          <CardDescription className="text-base">AI-powered Real Estate Infographics</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login" data-testid="tab-login" className="text-sm font-medium">Login</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register" className="text-sm font-medium">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit((data) => {
                  loginMutation.mutate(data);
                })} className="space-y-6">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="agent@realty.com" 
                            data-testid="input-email" 
                            className="h-11 rounded-lg focus:ring-2"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="••••••" 
                            data-testid="input-password" 
                            className="h-11 rounded-lg focus:ring-2"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-lg text-base font-medium shadow-lg hover:shadow-xl transition-shadow" 
                    disabled={loginMutation.isPending} 
                    data-testid="button-login"
                  >
                    {loginMutation.isPending ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register" className="mt-0">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit((data) => {
                  registerMutation.mutate(data);
                })} className="space-y-6">
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="agent@realty.com" 
                            data-testid="input-register-email" 
                            className="h-11 rounded-lg focus:ring-2"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="••••••" 
                            data-testid="input-register-password" 
                            className="h-11 rounded-lg focus:ring-2"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Name (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="John Doe" 
                            data-testid="input-name" 
                            className="h-11 rounded-lg focus:ring-2"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Company/Brokerage (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="ABC Realty" 
                            data-testid="input-organization" 
                            className="h-11 rounded-lg focus:ring-2"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-lg text-base font-medium shadow-lg hover:shadow-xl transition-shadow" 
                    disabled={registerMutation.isPending} 
                    data-testid="button-register"
                  >
                    {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

