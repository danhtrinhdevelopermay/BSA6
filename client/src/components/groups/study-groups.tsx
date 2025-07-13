import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { Plus, Users, Crown, UserPlus, Copy, Search, MessageCircle, Star, BookOpen, Calendar, Lock, Globe, Heart, Share2, TrendingUp } from "lucide-react";
import type { StudyGroup, InsertStudyGroup } from "@shared/schema";

const groupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
  subject: z.string().optional(),
  maxMembers: z.number().min(2).max(50).default(20),
  isPrivate: z.boolean().default(false),
});

type GroupFormData = z.infer<typeof groupSchema>;

export function StudyGroups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
      description: "",
      subject: "",
      maxMembers: 20,
      isPrivate: false,
    },
  });

  // Fetch user's study groups
  const { data: userGroups = [], isLoading: userGroupsLoading } = useQuery({
    queryKey: ["/api/study-groups", user?.id],
    enabled: !!user?.id,
  });

  // Fetch public study groups
  const { data: publicGroups = [], isLoading: publicGroupsLoading } = useQuery({
    queryKey: ["/api/study-groups/public/all"],
  });

  // Fetch group members for selected group
  const { data: groupMembers = [] } = useQuery({
    queryKey: ["/api/study-groups", selectedGroup?.id, "members"],
    queryFn: async () => {
      if (!selectedGroup) return [];
      const response = await fetch(`/api/study-groups/${selectedGroup.id}/members`);
      return response.json();
    },
    enabled: !!selectedGroup,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: GroupFormData) => {
      const groupData: InsertStudyGroup = {
        ...data,
        creatorId: user!.id,
      };
      const response = await apiRequest("POST", "/api/study-groups", groupData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-groups"] });
      toast({
        title: "Study group created! 🎉",
        description: "Your study group is ready for members.",
      });
      setShowCreateDialog(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create study group. Please try again.",
        variant: "destructive",
      });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const response = await apiRequest("POST", `/api/study-groups/${groupId}/join`, {
        userId: user!.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-groups"] });
      toast({
        title: "Joined group! 🎊",
        description: "Welcome to your new study squad!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to join group. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateGroup = (data: GroupFormData) => {
    createGroupMutation.mutate(data);
  };

  const handleJoinGroup = (groupId: number) => {
    joinGroupMutation.mutate(groupId);
  };

  const handleViewMembers = (group: StudyGroup) => {
    setSelectedGroup(group);
    setShowMembersDialog(true);
  };

  const copyInviteCode = async (inviteCode: string) => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      toast({
        title: "Invite code copied! 📋",
        description: "Share this code with friends to invite them.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy invite code.",
        variant: "destructive",
      });
    }
  };

  const filteredPublicGroups = publicGroups.filter((group: StudyGroup) =>
    searchQuery === "" || 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isUserInGroup = (group: StudyGroup) => {
    return userGroups.some((userGroup: StudyGroup) => userGroup.id === group.id);
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Modern Social Header */}
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.9, rotateX: -15 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
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
              whileHover={{ scale: 1.05 }}
              className="p-4 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-lg"
            >
              <Users className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl lg:text-4xl font-bold mb-1">Study Communities</h1>
              <p className="text-muted-foreground text-base lg:text-lg">Connect, collaborate, and learn together</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 ml-auto">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 bg-background/50 backdrop-blur-15 border border-border/30 rounded-full px-4 py-2"
            >
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="font-semibold">{userGroups.length} Joined</span>
            </motion.div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg rounded-full px-6">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Group
                  </Button>
                </motion.div>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Social Feed Layout */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Filter Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-15 border-border/30 sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="w-5 h-5 text-primary" />
                Discover Groups
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl border-border/30 bg-background/50"
                />
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Popular Subjects</h4>
                <div className="flex flex-wrap gap-2">
                  {["Mathematics", "Biology", "Chemistry", "Physics", "History", "Literature"].map((subject) => (
                    <Badge 
                      key={subject} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => setSearchQuery(subject)}
                    >
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Feed */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-6"
        >
          <Tabs defaultValue="discover" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-card/50 backdrop-blur-15 border border-border/30 rounded-xl p-1">
              <TabsTrigger value="discover" className="rounded-lg">
                <Globe className="w-4 h-4 mr-2" />
                Discover ({filteredPublicGroups.length})
              </TabsTrigger>
              <TabsTrigger value="my-groups" className="rounded-lg">
                <Users className="w-4 h-4 mr-2" />
                My Groups ({userGroups.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="discover" className="space-y-4 mt-6">
              {publicGroupsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse bg-card/50 backdrop-blur-15 border-border/30">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="h-12 w-12 bg-muted rounded-full"></div>
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        </div>
                        <div className="h-3 bg-muted rounded w-full mb-2"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredPublicGroups.length === 0 ? (
                <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-15 border-border/30">
                  <CardContent className="p-8 text-center">
                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No groups found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery 
                        ? `No groups match "${searchQuery}". Try a different search term.`
                        : "Be the first to create a study group!"
                      }
                    </p>
                    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white">
                          <Plus className="mr-2 h-4 w-4" />
                          Create First Group
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredPublicGroups.map((group: StudyGroup, index: number) => (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-15 border-border/30 hover:border-primary/30 transition-all duration-300 overflow-hidden group">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              className="p-3 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl border border-primary/20"
                            >
                              <BookOpen className="w-6 h-6 text-primary" />
                            </motion.div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                                  {group.name}
                                </h3>
                                <div className="flex items-center gap-2">
                                  {group.isPrivate ? (
                                    <Lock className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <Globe className="w-4 h-4 text-green-500" />
                                  )}
                                  {group.subject && (
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                      {group.subject}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {group.description && (
                                <p className="text-muted-foreground mb-3 leading-relaxed">
                                  {group.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>? / {group.maxMembers} members</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>Created recently</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                              >
                                <Heart className="w-4 h-4" />
                                <span className="text-sm">12</span>
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span className="text-sm">4</span>
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                              >
                                <Share2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                            
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                onClick={() => handleJoinGroup(group.id)}
                                disabled={isUserInGroup(group) || joinGroupMutation.isPending}
                                className={
                                  isUserInGroup(group)
                                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                                    : "bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg"
                                }
                                size="sm"
                              >
                                {isUserInGroup(group) ? (
                                  <>
                                    <Star className="mr-2 h-4 w-4" />
                                    Joined
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Join Group
                                  </>
                                )}
                              </Button>
                            </motion.div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="my-groups" className="space-y-4 mt-6">
              {userGroupsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse bg-card/50 backdrop-blur-15 border-border/30">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="h-12 w-12 bg-muted rounded-full"></div>
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : userGroups.length === 0 ? (
                <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-15 border-border/30">
                  <CardContent className="p-8 text-center">
                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No groups joined yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Join a study group to connect with fellow learners!
                    </p>
                    <Button 
                      onClick={() => {
                        const tabsEl = document.querySelector('[role="tablist"]');
                        const discoverTab = tabsEl?.querySelector('[value="discover"]') as HTMLElement;
                        discoverTab?.click();
                      }}
                      className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Discover Groups
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {userGroups.map((group: StudyGroup, index: number) => (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-15 border-border/30 hover:border-primary/30 transition-all duration-300 overflow-hidden group">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              className="p-3 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl border border-primary/20"
                            >
                              <BookOpen className="w-6 h-6 text-primary" />
                            </motion.div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                                  {group.name}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <Crown className="w-4 h-4 text-yellow-500" />
                                  {group.subject && (
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                      {group.subject}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {group.description && (
                                <p className="text-muted-foreground mb-3 leading-relaxed">
                                  {group.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>? / {group.maxMembers} members</span>
                                </div>
                                {group.inviteCode && (
                                  <div className="flex items-center gap-1">
                                    <Copy className="w-4 h-4" />
                                    <button
                                      onClick={() => copyInviteCode(group.inviteCode!)}
                                      className="text-primary hover:underline"
                                    >
                                      Copy invite code
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span className="text-sm">Chat</span>
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleViewMembers(group)}
                                className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                              >
                                <Users className="w-4 h-4" />
                                <span className="text-sm">Members</span>
                              </motion.button>
                            </div>
                            
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-primary/30 text-primary hover:bg-primary/10"
                              >
                                <Star className="mr-2 h-4 w-4 fill-current" />
                                Member
                              </Button>
                            </motion.div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Right Sidebar - Stats & Trending */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-3 space-y-6"
        >
          <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-15 border-border/30 sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
                Trending
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Groups</span>
                  <span className="text-lg font-bold text-primary">{publicGroups.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Your Groups</span>
                  <span className="text-lg font-bold text-secondary">{userGroups.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">New This Week</span>
                  <span className="text-lg font-bold text-green-500">5</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border/30">
                <h4 className="font-medium text-sm text-muted-foreground mb-3">Popular This Week</h4>
                <div className="space-y-2">
                  {["Computer Science Study Hall", "Advanced Mathematics", "Biology Lab Partners"].map((name, index) => (
                    <div key={name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-background/50 transition-colors cursor-pointer">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{name}</p>
                        <p className="text-xs text-muted-foreground">{12 + index * 5} members</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Study Group</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleCreateGroup)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Math Warriors, Bio Squad"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What's your group about?"
                  {...form.register("description")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Mathematics, Biology"
                    {...form.register("subject")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxMembers">Max Members</Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    min="2"
                    max="50"
                    {...form.register("maxMembers", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPrivate"
                  checked={form.watch("isPrivate")}
                  onCheckedChange={(checked) => form.setValue("isPrivate", !!checked)}
                />
                <Label htmlFor="isPrivate">Make this group private (invite-only)</Label>
              </div>

              <Button
                type="submit"
                disabled={createGroupMutation.isPending}
                className="w-full"
              >
                {createGroupMutation.isPending ? "Creating..." : "Create Group"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

      {/* Members Dialog */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedGroup?.name} Members</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground text-center">
              Member management coming soon!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
