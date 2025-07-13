import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { TranslationProvider } from "@/components/TranslationProvider";
import { Navigation } from "@/components/layout/navigation";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { PageTransition } from "@/components/layout/page-transition";
import { StreakCelebration } from "@/components/StreakCelebration";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Flashcards from "@/pages/flashcards";
import Quizzes from "@/pages/quizzes";
import Notes from "@/pages/notes";
import Assignments from "@/pages/assignments";
import Groups from "@/pages/groups";
import Profile from "@/pages/profile";
import UsersPage from "@/pages/users";
import ChatPage from "@/pages/chat";
import Posts from "@/pages/posts";
import PostDetail from "@/pages/post-detail";
import Achievements from "@/pages/achievements";
import Settings from "@/pages/settings";
import AdminPage from "@/pages/admin";
import NotificationsPage from "@/pages/notifications";
import NotFound from "@/pages/not-found";
import { AuthForm } from "@/components/auth/auth-form";

function AppContent() {
  const { user, loading, streakCelebration, dismissStreakCelebration } = useAuth();
  const [location, setLocation] = useLocation();

  // Redirect authenticated users away from auth pages
  useEffect(() => {
    if (!loading && user) {
      if (location === "/" || location === "/auth") {
        setLocation("/dashboard");
      }
    }
  }, [user, loading, location, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <img 
            src="/animated.gif" 
            alt="Bright Starts Loading" 
            className="w-32 h-32 rounded-xl"
          />
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">BSA</div>
            <div className="text-sm text-muted-foreground">Bright Starts</div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/auth" component={AuthForm} />
        <Route component={Landing} />
      </Switch>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16 pb-20 lg:pb-8">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <PageTransition>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/flashcards" component={Flashcards} />
              <Route path="/quizzes" component={Quizzes} />
              <Route path="/notes" component={Notes} />
              <Route path="/assignments" component={Assignments} />
              <Route path="/groups" component={Groups} />
              <Route path="/users" component={UsersPage} />
              <Route path="/chat" component={ChatPage} />
              <Route path="/posts" component={Posts} />
              <Route path="/posts/:id" component={PostDetail} />
              <Route path="/profile" component={Profile} />
              <Route path="/achievements" component={Achievements} />
              <Route path="/settings" component={Settings} />
              <Route path="/admin" component={AdminPage} />
              <Route path="/notifications" component={NotificationsPage} />
              <Route component={NotFound} />
            </Switch>
          </PageTransition>
        </div>
      </main>
      <BottomNavigation />
      
      {/* Streak Celebration Overlay */}
      {streakCelebration && (
        <StreakCelebration
          show={streakCelebration.show}
          streak={streakCelebration.streak}
          message={streakCelebration.message}
          onComplete={dismissStreakCelebration}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="brightstarts-theme">
        <TranslationProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <AppContent />
            </TooltipProvider>
          </AuthProvider>
        </TranslationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
