import { useState } from "react";
import { Bell, X, Heart, MessageCircle, Lightbulb, AlertTriangle, Megaphone, User, Sparkles, Check, MoreHorizontal, Eye, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: [`/api/notifications/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: [`/api/notifications/${user?.id}/unread-count`],
    enabled: !!user?.id,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => 
      apiRequest(`/api/notifications/${notificationId}/read`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}/unread-count`] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => 
      apiRequest(`/api/notifications/${user?.id}/read-all`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}/unread-count`] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: number) => 
      apiRequest(`/api/notifications/${notificationId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}/unread-count`] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Navigate to relevant content based on notification type
    if (notification.type === 'like' || notification.type === 'comment') {
      // Navigate to the post
      window.location.href = '/posts';
    } else if (notification.type === 'suggestion') {
      // Navigate to suggested post
      window.location.href = '/posts';
    }
  };

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
      case 'post_report':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          icon: 'text-orange-600 dark:text-orange-400',
          border: 'border-orange-200 dark:border-orange-800'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          icon: 'text-gray-600 dark:text-gray-400',
          border: 'border-gray-200 dark:border-gray-800'
        };
    }
  };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative group">
          <motion.div
            animate={unreadCount.count > 0 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
          >
            <Bell className="h-5 w-5 transition-colors group-hover:text-primary" />
          </motion.div>
          {unreadCount.count > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1"
            >
              <Badge 
                variant="destructive" 
                className="h-5 w-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-red-500 to-pink-500 animate-pulse"
              >
                {unreadCount.count > 9 ? '9+' : unreadCount.count}
              </Badge>
            </motion.div>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0 shadow-xl border-0 max-w-[calc(100vw-10px)]" align="end" side="bottom" sideOffset={5} alignOffset={-10}>
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-base">Notifications</h3>
              {unreadCount.count > 0 && (
                <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                  {unreadCount.count} new
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount.count > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  className="text-xs h-7 px-2 hover:bg-primary/20"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="p-3 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full">
                  <Bell className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">All caught up!</h4>
                  <p className="text-xs text-muted-foreground">No new notifications</p>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="p-2">
              <AnimatePresence>
                {notifications.slice(0, 5).map((notification, index) => {
                  const colors = getNotificationColors(notification.type);
                  const IconComponent = getNotificationIcon(notification.type);
                  
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.03 }}
                      className="mb-2"
                    >
                      <Card 
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] border ${
                          !notification.isRead ? `bg-gradient-to-r ${colors.bg} ${colors.border}` : 'bg-card/30'
                        } ${!notification.isRead ? 'shadow-sm' : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <motion.div 
                              className={`p-1.5 rounded-full ${colors.bg} ${colors.border} border shrink-0`}
                              whileHover={{ scale: 1.05 }}
                              transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                              <IconComponent className={`h-3 w-3 ${colors.icon}`} />
                            </motion.div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h4 className={`font-medium text-sm ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {notification.title}
                                  </h4>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                    </p>
                                    {!notification.isRead && (
                                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                                    )}
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0 shrink-0 opacity-50 hover:opacity-100"
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
              {notifications.length > 5 && (
                <div className="p-2 text-center border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      window.location.href = '/notifications';
                      setIsOpen(false);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    View all {notifications.length} notifications
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                setIsOpen(false);
                window.location.href = '/notifications';
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}