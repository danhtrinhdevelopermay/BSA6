import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/components/TranslationProvider";
import { StatsWidget } from "@/components/dashboard/stats-widget";
import { DeadlineTracker } from "@/components/dashboard/deadline-tracker";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  Plus, 
  CreditCard, 
  Brain, 
  FileText, 
  Calendar,
  TrendingUp,
  Users,
  Target,
  MessageCircle,
  Heart,
  Share2,
  BookOpen,
  Clock,
  Zap,
  Star,
  Trophy,
  Flame
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();

  // Fetch user's recent activity data
  const { data: recentActivity = [] } = useQuery({
    queryKey: ["/api/quiz-attempts", user?.id],
    enabled: !!user?.id,
  });

  const { data: studyGroups = [] } = useQuery({
    queryKey: ["/api/study-groups", user?.id],
    enabled: !!user?.id,
  });

  if (!user) return null;

  const quickActions = [
    {
      title: t('dashboard.createFlashcard'),
      icon: CreditCard,
      href: "/flashcards",
      color: "bg-primary/20 hover:bg-primary/30 text-primary",
    },
    {
      title: t('nav.groups'),
      icon: Users,
      href: "/groups",
      color: "bg-secondary/20 hover:bg-secondary/30 text-secondary",
    },
    {
      title: t('dashboard.addNote'),
      icon: FileText,
      href: "/notes",
      color: "bg-accent/20 hover:bg-accent/30 text-accent",
    },
    {
      title: t('dashboard.takeQuiz'),
      icon: Brain,
      href: "/quizzes",
      color: "bg-purple-500/20 hover:bg-purple-500/30 text-purple-400",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Modern Header with Profile Card */}
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 1.2, 
          type: "spring",
          stiffness: 80,
          damping: 20
        }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 border border-border/30 p-6 mb-8"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 backdrop-blur-15" />
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ 
                scale: 1.1, 
                rotate: 5,
                transition: { duration: 0.3, type: "spring" }
              }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <Avatar className="h-16 w-16 lg:h-20 lg:w-20 border-2 border-primary/20 shadow-lg">
                <AvatarImage src={user.photoUrl} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xl font-bold">
                  {(user.displayName || user.username).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <motion.div 
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-background"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Flame className="w-3 h-3 text-white" />
              </motion.div>
            </motion.div>
            <div>
              <h1 className="text-2xl lg:text-4xl font-bold mb-1">
                Welcome back, {user.displayName || user.username}!
              </h1>
              <p className="text-muted-foreground text-base lg:text-lg">Ready to level up your learning journey?</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 ml-auto">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 bg-background/50 backdrop-blur-15 border border-border/30 rounded-full px-4 py-2"
            >
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="font-semibold">{user.streak} day streak</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 bg-primary/20 backdrop-blur-15 border border-primary/30 rounded-full px-4 py-2"
            >
              <Star className="w-4 h-4 text-primary" />
              <span className="font-semibold text-primary">Level {user.level}</span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Social Feed Layout */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, x: -60, rotateY: -15 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ 
            duration: 1.0, 
            delay: 0.3,
            type: "spring",
            stiffness: 100,
            damping: 25
          }}
          className="lg:col-span-3"
        >
          <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-15 border-border/30 sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 30, rotateX: -15 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ 
                    delay: 0.5 + index * 0.15,
                    duration: 0.8,
                    type: "spring",
                    stiffness: 120,
                    damping: 15
                  }}
                >
                  <Link href={action.href}>
                    <motion.div
                      whileHover={{ 
                        scale: 1.08, 
                        x: 12,
                        y: -4,
                        rotateY: 5,
                        transition: { duration: 0.4, type: "spring", stiffness: 400 }
                      }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-background/50 to-background/30 border border-border/30 hover:border-primary/30 transition-all duration-300 cursor-pointer group"
                    >
                      <div className={`p-2 rounded-lg ${action.color} group-hover:scale-110 transition-transform duration-200`}>
                        <action.icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-sm">{action.title}</span>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Feed */}
        <motion.div 
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 1.0, 
            delay: 0.4,
            type: "spring",
            stiffness: 90,
            damping: 20
          }}
          className="lg:col-span-6 space-y-6"
        >
          {/* Stats Widget as Feed Card */}
          <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-15 border-border/30 overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Your Progress Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatsWidget />
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-15 border-border/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start studying to see your progress here!
                  </p>
                  <Link href="/flashcards">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Get Started
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-3 bg-background/50 rounded-xl"
                    >
                      <div className="bg-secondary/20 p-2 rounded-lg">
                        <Brain className="w-4 h-4 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Completed Quiz</p>
                        <p className="text-sm text-muted-foreground">
                          Score: {activity.score}/{activity.totalQuestions}
                        </p>
                      </div>
                      <span className="text-secondary text-sm">
                        +{Math.round((activity.score / activity.totalQuestions) * 50)} XP
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column - Sidebar Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-3 space-y-6"
        >
          {/* Upcoming Deadlines */}
          <DeadlineTracker />

          {/* Study Streak */}
          <Card>
            <CardHeader>
              <CardTitle>Study Streak 🔥</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-secondary mb-2">{user.streak}</div>
              <p className="text-muted-foreground mb-4">days in a row!</p>
              <div className="flex justify-center space-x-2 mb-4">
                {[...Array(5)].map((_, index) => (
                  <div
                    key={index}
                    className={`w-8 h-2 rounded-full ${
                      index < Math.min(user.streak, 5) ? "bg-secondary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {10 - user.streak > 0 
                  ? `${10 - user.streak} more days for "10-Day Scholar" badge!`
                  : "You're on fire! Keep it up! 🔥"
                }
              </p>
            </CardContent>
          </Card>

          {/* Active Study Groups */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Your Study Groups</CardTitle>
                <Link href="/groups">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {studyGroups.length === 0 ? (
                <div className="text-center py-4">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    No study groups yet
                  </p>
                  <Link href="/groups">
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Join a Group
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {studyGroups.slice(0, 3).map((group: any) => (
                    <div
                      key={group.id}
                      className="flex items-center space-x-3 p-3 bg-background/50 rounded-xl"
                    >
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold">
                          {group.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{group.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {group.subject || "General"}
                        </p>
                      </div>
                      <div className="w-2 h-2 bg-secondary rounded-full"></div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress This Week */}
          <Card>
            <CardHeader>
              <CardTitle>This Week's Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Study Sessions</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Flashcards Reviewed</span>
                  <span className="font-semibold">247</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Quizzes Completed</span>
                  <span className="font-semibold">8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Notes Created</span>
                  <span className="font-semibold">5</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
