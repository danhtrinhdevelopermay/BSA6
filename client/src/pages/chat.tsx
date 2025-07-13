import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle, Users, Search, MoreVertical, Phone, Video, Info, ArrowLeft, Smile, Paperclip, Mic, Circle, Image as ImageIcon, Play, X } from "lucide-react";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import type { Conversation, Message } from "@shared/schema";

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user's conversations
  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
    queryKey: ["/api/conversations/user", user?.id],
    enabled: !!user?.id,
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["/api/conversations", selectedConversation?.id, "messages"],
    enabled: !!selectedConversation?.id,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/conversations/${selectedConversation!.id}/messages`);
      return response.json();
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, mediaUrls }: { content: string; mediaUrls?: Array<{ type: string; url: string; thumbnailUrl?: string }> }) => {
      if (!selectedConversation) return;
      
      const messageType = mediaUrls && mediaUrls.length > 0 
        ? (mediaUrls[0].type === 'video' ? 'video' : 'image')
        : 'text';
      
      const response = await apiRequest("POST", `/api/conversations/${selectedConversation.id}/messages`, {
        senderId: user!.id,
        content,
        type: messageType,
        mediaUrls: mediaUrls || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations", selectedConversation?.id, "messages"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations/user", user?.id] 
      });
      setNewMessage("");
      setSelectedFiles([]);
      setPreviewUrls([]);
    },
    onError: (error: any) => {
      console.error('Send message error:', error);
      
      let errorMessage = "Không thể gửi tin nhắn. Vui lòng thử lại.";
      
      if (error.message?.includes('413') || error.message?.includes('too large')) {
        errorMessage = "File quá lớn. Vui lòng chọn file nhỏ hơn (tối đa 50MB cho video).";
      } else if (error.message?.includes('timeout')) {
        errorMessage = "Gửi tin nhắn timeout. Vui lòng thử lại với file nhỏ hơn.";
      }
      
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const sizeLimit = isVideo ? 30 * 1024 * 1024 : 10 * 1024 * 1024; // 30MB for video, 10MB for image
      
      if (file.size > sizeLimit) {
        toast({
          title: "Tệp quá lớn",
          description: `${file.name} quá lớn. Giới hạn: ${isVideo ? '30MB' : '10MB'}`,
          variant: "destructive",
        });
        return false;
      }
      
      return isImage || isVideo;
    });

    if (validFiles.length !== files.length && validFiles.length === 0) {
      toast({
        title: "Tệp không hợp lệ",
        description: "Chỉ chấp nhận tệp ảnh và video có kích thước phù hợp.",
        variant: "destructive",
      });
    }

    setSelectedFiles(validFiles);
    
    // Create preview URLs
    const urls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  // Convert file to data URL with compression
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type.startsWith('image/')) {
        // Compress image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          const maxWidth = 1200;
          const maxHeight = 1200;
          let { width, height } = img;
          
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressedDataUrl);
        };
        
        img.onerror = reject;
        
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        // For video, use direct data URL (smaller videos only)
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }
    });
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !selectedConversation) return;

    let mediaUrls: Array<{ type: string; url: string; thumbnailUrl?: string }> = [];
    
    if (selectedFiles.length > 0) {
      try {
        for (const file of selectedFiles) {
          const type = file.type.startsWith('video/') ? 'video' : 'image';
          
          // For large videos, show warning and limit processing
          if (type === 'video' && file.size > 10 * 1024 * 1024) {
            toast({
              title: "Video lớn",
              description: "Video sẽ được xử lý, có thể mất thời gian...",
              variant: "default",
            });
          }
          
          const dataUrl = await fileToDataUrl(file);
          
          // For videos, create a simple thumbnail
          let thumbnailUrl = undefined;
          if (type === 'video') {
            // Create a simple placeholder thumbnail for video
            thumbnailUrl = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iIzMzMzMzMyIvPgo8cGF0aCBkPSJNMTYgMTJMMjggMjBMMTYgMjhWMTJaIiBmaWxsPSIjZmZmZmZmIi8+Cjwvc3ZnPgo=";
          }
          
          mediaUrls.push({
            type,
            url: dataUrl,
            thumbnailUrl
          });
        }
      } catch (error) {
        console.error('File processing error:', error);
        toast({
          title: "Lỗi",
          description: "Không thể xử lý tệp. Vui lòng thử lại với tệp nhỏ hơn.",
          variant: "destructive",
        });
        return;
      }
    }

    // Split large payloads into smaller chunks for video
    const hasLargeMedia = mediaUrls.some(media => 
      media.type === 'video' && media.url.length > 5 * 1024 * 1024
    );
    
    if (hasLargeMedia) {
      toast({
        title: "Đang gửi...",
        description: "Video lớn đang được xử lý, vui lòng đợi...",
        variant: "default",
      });
    }

    sendMessageMutation.mutate({ 
      content: newMessage || (selectedFiles.length > 0 ? `Đã gửi ${selectedFiles.length} tệp` : ""), 
      mediaUrls 
    });
  };

  // Remove selected file
  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Select first conversation by default only on desktop
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation && window.innerWidth >= 1024) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, selectedConversation]);

  const getUserInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, "HH:mm");
    } else if (isYesterday(messageDate)) {
      return "Yesterday";
    } else {
      return format(messageDate, "MMM dd");
    }
  };

  const formatLastSeen = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-background overflow-hidden">
      {/* Modern Sidebar - Conversations List */}
      <motion.div 
        initial={{ x: -80, opacity: 0, rotateY: -20 }}
        animate={{ x: 0, opacity: 1, rotateY: 0 }}
        transition={{ 
          duration: 1.0,
          type: "spring",
          stiffness: 100,
          damping: 25
        }}
        className={`${selectedConversation ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 xl:w-96 flex-col bg-gradient-to-b from-card/95 to-card/85 backdrop-blur-15 border-r border-border/30`}
      >
        {/* Header with Search */}
        <div className="p-4 border-b border-border/30 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-2 bg-gradient-to-br from-primary to-secondary rounded-xl"
              >
                <MessageCircle className="h-6 w-6 text-white" />
              </motion.div>
              Messages
            </h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-background/50 rounded-xl transition-colors"
            >
              <MoreVertical className="h-5 w-5" />
            </motion.button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-10 bg-background/50 border-border/30 rounded-xl"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {isLoadingConversations ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-3 rounded-xl bg-background/30 animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-muted rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
                <p className="text-muted-foreground text-sm">
                  Start a conversation to connect with your study groups!
                </p>
              </motion.div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conversation: Conversation, index: number) => (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, x: -30, rotateY: -15 }}
                    animate={{ opacity: 1, x: 0, rotateY: 0 }}
                    transition={{ 
                      delay: index * 0.1,
                      duration: 0.6,
                      type: "spring",
                      stiffness: 120
                    }}
                    whileHover={{ 
                      scale: 1.02, 
                      x: 8,
                      transition: { duration: 0.2, type: "spring" }
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-background/50 ${
                      selectedConversation?.id === conversation.id 
                        ? 'bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30' 
                        : 'hover:bg-background/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12 ring-2 ring-background">
                          <AvatarImage src={conversation.photoURL} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold">
                            {getUserInitials(conversation.name || "Unknown")}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online indicator */}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold truncate">
                            {conversation.name || "Unknown"}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {formatMessageTime(conversation.updatedAt)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessage || "No messages yet"}
                          </p>
                          {/* Unread badge */}
                          <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0">
                            3
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </motion.div>

      {/* Main Chat Area */}
      <div className={`${selectedConversation ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-gradient-to-b from-background/95 to-background/85 backdrop-blur-15`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="p-4 border-b border-border/30 bg-gradient-to-r from-card/50 to-card/30 backdrop-blur-15"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedConversation(null)}
                    className="lg:hidden p-2 hover:bg-background/50 rounded-xl transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </motion.button>
                  
                  <div className="relative">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                      <AvatarImage src={selectedConversation.photoURL} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold">
                        {getUserInitials(selectedConversation.name || "Unknown")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border border-background rounded-full"></div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold">{selectedConversation.name || "Unknown"}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Circle className="w-3 h-3 text-green-500 fill-current" />
                      {formatLastSeen(selectedConversation.updatedAt)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 hover:bg-background/50 rounded-xl transition-colors"
                  >
                    <Phone className="h-5 w-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 hover:bg-background/50 rounded-xl transition-colors"
                  >
                    <Video className="h-5 w-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 hover:bg-background/50 rounded-xl transition-colors"
                  >
                    <Info className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {isLoadingMessages ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-sm p-3 rounded-xl animate-pulse ${
                          i % 2 === 0 ? 'bg-muted' : 'bg-primary/20'
                        }`}>
                          <div className="h-4 bg-background rounded w-32 mb-2"></div>
                          <div className="h-3 bg-background rounded w-16"></div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Start the conversation</h3>
                    <p className="text-muted-foreground">
                      Send a message to {selectedConversation.name}
                    </p>
                  </motion.div>
                ) : (
                  <AnimatePresence>
                    {messages.map((message: Message, index: number) => {
                      const isCurrentUser = message.senderId === user?.id;
                      const showAvatar = index === 0 || messages[index - 1]?.senderId !== message.senderId;
                      
                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isCurrentUser && showAvatar && (
                            <Avatar className="h-8 w-8 mb-1">
                              <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-secondary/20">
                                {getUserInitials(selectedConversation.name || "U")}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {!isCurrentUser && !showAvatar && <div className="w-8"></div>}
                          
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`max-w-sm lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                              isCurrentUser
                                ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground ml-auto'
                                : 'bg-card/80 backdrop-blur-15 border border-border/30'
                            } ${
                              showAvatar ? 'rounded-bl-md' : ''
                            }`}
                          >
                            {/* Media content */}
                            {message.mediaUrls && message.mediaUrls.length > 0 && (
                              <div className="mb-3">
                                <div className="grid grid-cols-2 gap-2">
                                  {message.mediaUrls.map((media, mediaIndex) => (
                                    <div key={mediaIndex} className="relative">
                                      {media.type === 'video' ? (
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <div className="relative aspect-video rounded-lg overflow-hidden bg-black/20 cursor-pointer group">
                                              {media.thumbnailUrl ? (
                                                <img 
                                                  src={media.thumbnailUrl}
                                                  alt="Video thumbnail"
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                  <Video className="h-8 w-8 text-white/80" />
                                                </div>
                                              )}
                                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                                                <Play className="h-8 w-8 text-white" />
                                              </div>
                                            </div>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-4xl">
                                            <video 
                                              src={media.url}
                                              controls
                                              className="w-full h-auto max-h-[70vh] rounded-lg"
                                              autoPlay
                                            />
                                          </DialogContent>
                                        </Dialog>
                                      ) : (
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <div className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group">
                                              <img 
                                                src={media.url}
                                                alt="Image"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                              />
                                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                              </div>
                                            </div>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-4xl">
                                            <img 
                                              src={media.url}
                                              alt="Full size image"
                                              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                                            />
                                          </DialogContent>
                                        </Dialog>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Text content */}
                            {message.content && (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {message.content}
                              </p>
                            )}
                            
                            <p className={`text-xs mt-2 ${
                              isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              {formatMessageTime(message.createdAt)}
                            </p>
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="p-4 border-t border-border/30 bg-gradient-to-r from-card/50 to-card/30 backdrop-blur-15"
            >
              {/* File Preview Area */}
              {selectedFiles.length > 0 && (
                <div className="mb-4 p-3 bg-card/50 rounded-xl border border-border/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Files to send ({selectedFiles.length})</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFiles([]);
                        setPreviewUrls([]);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border/30">
                          {file.type.startsWith('video/') ? (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                              <Play className="h-8 w-8 text-primary" />
                            </div>
                          ) : (
                            <img
                              src={previewUrls[index]}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <p className="mt-1 text-xs text-muted-foreground truncate">
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-end gap-3">
                {/* File Upload Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-background/50 rounded-xl transition-colors flex-shrink-0"
                >
                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                </motion.button>
                
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="pr-12 rounded-xl border-border/30 bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-background/50 rounded-lg transition-colors"
                  >
                    <Smile className="h-4 w-4 text-muted-foreground" />
                  </motion.button>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 hover:bg-background/50 rounded-xl transition-colors"
                >
                  <Mic className="h-5 w-5 text-muted-foreground" />
                </motion.button>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white rounded-xl px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.8,
              type: "spring",
              stiffness: 100,
              damping: 20
            }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                whileHover={{ 
                  scale: 1.1, 
                  rotate: 5,
                  transition: { duration: 0.3, type: "spring" }
                }}
                whileTap={{ scale: 0.95 }}
                className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl mb-6 mx-auto w-fit"
              >
                <MessageCircle className="h-16 w-16 text-primary mx-auto" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Messages</h2>
              <p className="text-muted-foreground max-w-md">
                Select a conversation from the sidebar to start chatting with your study groups and friends.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}