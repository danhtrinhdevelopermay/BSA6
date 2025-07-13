import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { Bell, X, Check, Heart, MessageCircle, Lightbulb, AlertTriangle, Megaphone, Sparkles, Eye, Filter, Search, MoreHorizontal, Flag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: [`/api/notifications/${user?.id}`],
    enabled: !!user?.id,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => 
      apiRequest(`/api/notifications/${notificationId}/read`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}`] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => 
      apiRequest(`/api/notifications/${user?.id}/read-all`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}`] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: number) => 
      apiRequest(`/api/notifications/${notificationId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}`] });
    },
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return Heart;
      case 'comment':
        return MessageCircle;
      case 'suggestion':
        return Lightbulb;
      case 'violation':
        return AlertTriangle;
      case 'admin_announcement':
      case 'admin_message':
        return Megaphone;
      case 'post_report':
        return Flag;
      default:
        return Sparkles;
    }
  };

  const getNotificationColors = (type: string) => {
    switch (type) {
      case 'like':
        return {
          bg: 'bg-pink-50 dark:bg-pink-900/20',
          icon: 'text-pink-600 dark:text-pink-400',
          border: 'border-pink-200 dark:border-pink-800'
        };
      case 'comment':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          icon: 'text-blue-600 dark:text-blue-400',
          border: 'border-blue-200 dark:border-blue-800'
        };
      case 'suggestion':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          icon: 'text-green-600 dark:text-green-400',
          border: 'border-green-200 dark:border-green-800'
        };
      case 'violation':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          icon: 'text-red-600 dark:text-red-400',
          border: 'border-red-200 dark:border-red-800'
        };
      case 'admin_announcement':
      case 'admin_message':
        return {
          bg: 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20',
          icon: 'text-orange-600 dark:text-orange-400',
          border: 'border-orange-300 dark:border-orange-700 border-2 shadow-lg'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          icon: 'text-gray-600 dark:text-gray-400',
          border: 'border-gray-200 dark:border-gray-800'
        };
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || 
                         (filterType === "unread" && !notification.isRead) ||
                         (filterType === "read" && notification.isRead) ||
                         notification.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Please log in to view notifications</h2>
          <p className="text-muted-foreground">You need to be logged in to see your notifications</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <div className="p-2 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-sm text-muted-foreground">Stay updated with your latest activities</p>
            </div>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-sm"
              size="sm"
            >
              <Check className="h-3 w-3 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <Tabs value={filterType} onValueChange={setFilterType} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-5 sm:w-auto h-9">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">Unread</TabsTrigger>
              <TabsTrigger value="like" className="text-xs">Likes</TabsTrigger>
              <TabsTrigger value="comment" className="text-xs">Comments</TabsTrigger>
              <TabsTrigger value="suggestion" className="text-xs">Suggestions</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </motion.div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="rounded-full h-6 w-6 border-2 border-primary border-t-transparent"
            />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm || filterType !== "all" ? "No matching notifications" : "All caught up!"}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {searchTerm || filterType !== "all" 
                    ? "Try adjusting your search or filter criteria" 
                    : "No new notifications to show"}
                </p>
              </div>
            </motion.div>
          </div>
        ) : (
          <AnimatePresence>
            {filteredNotifications.map((notification, index) => {
              const colors = getNotificationColors(notification.type);
              const IconComponent = getNotificationIcon(notification.type);
              
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] border ${
                      !notification.isRead ? `bg-gradient-to-r ${colors.bg} ${colors.border}` : 'bg-card/30'
                    } ${!notification.isRead ? 'shadow-sm' : ''} ${
                      (notification.type === 'admin_announcement' || notification.type === 'admin_message') 
                        ? 'relative overflow-hidden' : ''
                    }`}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsReadMutation.mutate(notification.id);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      {/* Admin Badge for admin notifications */}
                      {(notification.type === 'admin_announcement' || notification.type === 'admin_message') && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 font-bold shadow-lg">
                            ADMIN
                          </Badge>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-3">
                        <motion.div
                          className={`p-2 rounded-full ${colors.bg} ${colors.border} border shrink-0`}
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <IconComponent className={`h-4 w-4 ${colors.icon}`} />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h3 className={`font-medium text-base mb-1 ${
                                !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                              }`}>
                                {notification.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2 leading-relaxed line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </p>
                                {!notification.isRead && (
                                  <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                                    <span className="text-xs font-medium text-primary">New</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!notification.isRead && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsReadMutation.mutate(notification.id);
                                    }}
                                  >
                                    <Eye className="h-3 w-3 mr-2" />
                                    Mark as read
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotificationMutation.mutate(notification.id);
                                  }}
                                  className="text-destructive"
                                >
                                  <X className="h-3 w-3 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}