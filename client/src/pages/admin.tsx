import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Database, Users, MessageSquare, BookOpen, Calendar, Award, Trash2, Edit, Plus, Search, Eye } from "lucide-react";

interface SQLResult {
  columns: string[];
  rows: any[][];
}

interface TableInfo {
  table_name: string;
  column_count: number;
  row_count: number;
}

export default function AdminPage() {
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [sqlQuery, setSqlQuery] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [viewingRecord, setViewingRecord] = useState<any>(null);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [violationForm, setViolationForm] = useState({
    userId: '',
    postId: '',
    violationReason: '',
    adminMessage: ''
  });
  const [notificationForm, setNotificationForm] = useState({
    type: 'all', // 'all' or 'user'
    userId: '',
    title: '',
    message: '',
    priority: 'medium'
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Optimize media URLs
  const optimizeMediaMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/optimize-media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Optimization failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Media optimization completed", 
        description: `Optimized ${data.optimizedCount} posts with media URLs` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tables"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Media optimization failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Generate post suggestions
  const generateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/generate-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate suggestions");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Post suggestions generated", 
        description: "Random post suggestions have been sent to users" 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to generate suggestions", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Send violation notice
  const sendViolationMutation = useMutation({
    mutationFn: async (data: {
      userId: string;
      postId: string;
      violationReason: string;
      adminMessage: string;
    }) => {
      const response = await fetch("/api/admin/send-violation-notice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send violation notice");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Violation notice sent", 
        description: "The user has been notified and the post has been deleted" 
      });
      setViolationForm({
        userId: '',
        postId: '',
        violationReason: '',
        adminMessage: ''
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to send violation notice", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Send admin notification mutations
  const sendNotificationAllMutation = useMutation({
    mutationFn: async (data: { title: string; message: string; priority: string }) => {
      const response = await fetch("/api/admin/send-notification-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send notification");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Thông báo đã gửi thành công", 
        description: `Đã gửi thông báo đến ${data.count} người dùng` 
      });
      setNotificationForm({
        type: 'all',
        userId: '',
        title: '',
        message: '',
        priority: 'medium'
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Gửi thông báo thất bại", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const sendNotificationUserMutation = useMutation({
    mutationFn: async (data: { userId: number; title: string; message: string; priority: string }) => {
      const response = await fetch("/api/admin/send-notification-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send notification");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Thông báo đã gửi thành công", 
        description: data.message 
      });
      setNotificationForm({
        type: 'all',
        userId: '',
        title: '',
        message: '',
        priority: 'medium'
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Gửi thông báo thất bại", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Lấy danh sách bảng và thông tin
  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ["/api/admin/tables"],
    queryFn: async () => {
      const response = await fetch("/api/admin/tables");
      return response.json() as Promise<TableInfo[]>;
    }
  });

  // Lấy data của bảng được chọn
  const { data: tableData, isLoading: tableDataLoading } = useQuery({
    queryKey: ["/api/admin/table-data", selectedTable, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      const response = await fetch(`/api/admin/table-data/${selectedTable}?${params}`);
      return response.json() as Promise<SQLResult>;
    },
    enabled: !!selectedTable
  });

  // Thực thi SQL query tùy chỉnh
  const executeSqlMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch("/api/admin/execute-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "SQL execution failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "SQL query thực thi thành công" });
      setSqlResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/table-data"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Lỗi SQL", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Xóa record
  const deleteRecordMutation = useMutation({
    mutationFn: async ({ table, id }: { table: string; id: any }) => {
      const response = await fetch("/api/admin/delete-record", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ table, id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Delete failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Đã xóa record thành công" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/table-data", selectedTable] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Lỗi xóa record", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleExecuteSQL = () => {
    if (!sqlQuery.trim()) {
      toast({ title: "Vui lòng nhập SQL query", variant: "destructive" });
      return;
    }
    executeSqlMutation.mutate(sqlQuery);
  };

  const handleDeleteRecord = (table: string, id: any) => {
    deleteRecordMutation.mutate({ table, id });
  };

  const handleSendViolationNotice = () => {
    if (!violationForm.userId || !violationForm.postId || !violationForm.violationReason || !violationForm.adminMessage) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    sendViolationMutation.mutate({
      userId: violationForm.userId,
      postId: violationForm.postId,
      violationReason: violationForm.violationReason,
      adminMessage: violationForm.adminMessage
    });
  };

  const handleViewRecord = (row: any[], columns: string[]) => {
    const record = columns.reduce((acc, col, index) => {
      acc[col] = row[index];
      return acc;
    }, {} as any);
    setViewingRecord(record);
  };

  const handleEditRecord = (row: any[], columns: string[]) => {
    const record = columns.reduce((acc, col, index) => {
      acc[col] = row[index];
      return acc;
    }, {} as any);
    setEditingRecord(record);
  };

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case "users": return <Users className="h-4 w-4" />;
      case "posts": case "post_comments": case "post_likes": return <MessageSquare className="h-4 w-4" />;
      case "flashcards": case "flashcard_decks": case "quizzes": case "quiz_attempts": return <BookOpen className="h-4 w-4" />;
      case "assignments": return <Calendar className="h-4 w-4" />;
      case "achievements": return <Award className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return "NULL";
    if (typeof value === "object") return JSON.stringify(value);
    if (typeof value === "string" && value.length > 50) {
      return value.substring(0, 50) + "...";
    }
    return String(value);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Quản lý cơ sở dữ liệu PostgreSQL</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          PostgreSQL Connected
        </Badge>
      </div>

      <Tabs defaultValue="tables" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tables">Quản lý bảng</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="sql">SQL Query</TabsTrigger>
          <TabsTrigger value="stats">Thống kê</TabsTrigger>
          <TabsTrigger value="optimize">Tối ưu hóa</TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Danh sách bảng */}
            <Card>
              <CardHeader>
                <CardTitle>Danh sách bảng</CardTitle>
                <CardDescription>Chọn bảng để xem và chỉnh sửa data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {tablesLoading ? (
                  <div>Đang tải...</div>
                ) : (
                  tables?.map((table) => (
                    <div
                      key={table.table_name}
                      className={`p-3 rounded border cursor-pointer hover:bg-accent ${
                        selectedTable === table.table_name ? "bg-accent" : ""
                      }`}
                      onClick={() => setSelectedTable(table.table_name)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTableIcon(table.table_name)}
                          <span className="font-medium">{table.table_name}</span>
                        </div>
                        <Badge variant="secondary">{table.row_count}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {table.column_count} cột
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Data của bảng */}
            <div className="md:col-span-2">
              {selectedTable ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {getTableIcon(selectedTable)}
                          {selectedTable}
                        </CardTitle>
                        <CardDescription>Data trong bảng {selectedTable}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Tìm kiếm..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 w-48"
                          />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {tableDataLoading ? (
                      <div>Đang tải data...</div>
                    ) : tableData ? (
                      <div className="overflow-auto max-h-96">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {tableData.columns.map((column) => (
                                <TableHead key={column}>{column}</TableHead>
                              ))}
                              <TableHead>Hành động</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tableData.rows.map((row, rowIndex) => (
                              <TableRow key={rowIndex}>
                                {row.map((cell, cellIndex) => (
                                  <TableCell key={cellIndex} className="max-w-xs">
                                    {formatCellValue(cell)}
                                  </TableCell>
                                ))}
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleViewRecord(row, tableData.columns)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleEditRecord(row, tableData.columns)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Bạn có chắc muốn xóa record này? Hành động này không thể hoàn tác.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteRecord(selectedTable, row[0])}
                                          >
                                            Xóa
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div>Không có data</div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Chọn một bảng để xem data</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Management</CardTitle>
              <CardDescription>Manage user notifications, send violation notices, and generate post suggestions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Gửi Thông Báo Admin</CardTitle>
                    <CardDescription>Gửi thông báo đến tất cả người dùng hoặc người dùng cụ thể</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full">
                          Gửi Thông Báo
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Gửi Thông Báo Admin</DialogTitle>
                          <DialogDescription>
                            Tạo và gửi thông báo với quyền admin
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="notificationType">Loại Thông Báo</Label>
                            <Select
                              value={notificationForm.type}
                              onValueChange={(value) => setNotificationForm({...notificationForm, type: value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn loại thông báo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Gửi đến tất cả người dùng</SelectItem>
                                <SelectItem value="user">Gửi đến người dùng cụ thể</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {notificationForm.type === 'user' && (
                            <div>
                              <Label htmlFor="targetUserId">User ID</Label>
                              <Input
                                id="targetUserId"
                                placeholder="Nhập User ID"
                                value={notificationForm.userId}
                                onChange={(e) => setNotificationForm({...notificationForm, userId: e.target.value})}
                              />
                            </div>
                          )}

                          <div>
                            <Label htmlFor="notificationTitle">Tiêu Đề</Label>
                            <Input
                              id="notificationTitle"
                              placeholder="Tiêu đề thông báo"
                              value={notificationForm.title}
                              onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                            />
                          </div>

                          <div>
                            <Label htmlFor="notificationMessage">Nội Dung</Label>
                            <Textarea
                              id="notificationMessage"
                              placeholder="Nội dung thông báo"
                              value={notificationForm.message}
                              onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                              rows={4}
                            />
                          </div>

                          <div>
                            <Label htmlFor="notificationPriority">Mức Độ Ưu Tiên</Label>
                            <Select
                              value={notificationForm.priority}
                              onValueChange={(value) => setNotificationForm({...notificationForm, priority: value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn mức độ" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Thấp</SelectItem>
                                <SelectItem value="medium">Trung bình</SelectItem>
                                <SelectItem value="high">Cao</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <Button 
                            onClick={() => {
                              if (notificationForm.type === 'all') {
                                sendNotificationAllMutation.mutate({
                                  title: notificationForm.title,
                                  message: notificationForm.message,
                                  priority: notificationForm.priority
                                });
                              } else {
                                sendNotificationUserMutation.mutate({
                                  userId: parseInt(notificationForm.userId),
                                  title: notificationForm.title,
                                  message: notificationForm.message,
                                  priority: notificationForm.priority
                                });
                              }
                            }}
                            disabled={
                              sendNotificationAllMutation.isPending || 
                              sendNotificationUserMutation.isPending ||
                              !notificationForm.title ||
                              !notificationForm.message ||
                              (notificationForm.type === 'user' && !notificationForm.userId)
                            }
                            className="w-full"
                          >
                            {(sendNotificationAllMutation.isPending || sendNotificationUserMutation.isPending) 
                              ? "Đang gửi..." 
                              : "Gửi Thông Báo"
                            }
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Generate Post Suggestions</CardTitle>
                    <CardDescription>Send random post suggestions to users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => generateSuggestionsMutation.mutate()}
                      disabled={generateSuggestionsMutation.isPending}
                      className="w-full"
                    >
                      {generateSuggestionsMutation.isPending ? "Generating..." : "Generate Suggestions"}
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Send Violation Notice</CardTitle>
                    <CardDescription>Send violation notification and delete post</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          Send Violation Notice
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Send Violation Notice</DialogTitle>
                          <DialogDescription>
                            This will send a notification to the user and delete the post
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="userId">User ID</Label>
                            <Input
                              id="userId"
                              placeholder="User ID"
                              value={violationForm.userId}
                              onChange={(e) => setViolationForm({...violationForm, userId: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="postId">Post ID</Label>
                            <Input
                              id="postId"
                              placeholder="Post ID"
                              value={violationForm.postId}
                              onChange={(e) => setViolationForm({...violationForm, postId: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="violationReason">Violation Reason</Label>
                            <Select value={violationForm.violationReason} onValueChange={(value) => setViolationForm({...violationForm, violationReason: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select reason" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                                <SelectItem value="spam">Spam</SelectItem>
                                <SelectItem value="harassment">Harassment</SelectItem>
                                <SelectItem value="false_information">False Information</SelectItem>
                                <SelectItem value="copyright">Copyright Violation</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="adminMessage">Admin Message</Label>
                            <Textarea
                              id="adminMessage"
                              placeholder="Message to user about the violation"
                              value={violationForm.adminMessage}
                              onChange={(e) => setViolationForm({...violationForm, adminMessage: e.target.value})}
                            />
                          </div>
                          <Button 
                            onClick={handleSendViolationNotice}
                            disabled={sendViolationMutation.isPending}
                            className="w-full"
                          >
                            {sendViolationMutation.isPending ? "Sending..." : "Send Notice & Delete Post"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sql" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SQL Query Console</CardTitle>
              <CardDescription>Thực thi SQL queries trực tiếp trên database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sql-query">SQL Query</Label>
                <Textarea
                  id="sql-query"
                  placeholder="SELECT * FROM users WHERE..."
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="min-h-32 font-mono"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleExecuteSQL}
                  disabled={executeSqlMutation.isPending}
                >
                  {executeSqlMutation.isPending ? "Đang thực thi..." : "Thực thi"}
                </Button>
                <Button variant="outline" onClick={() => setSqlQuery("")}>
                  Xóa
                </Button>
              </div>
              
              {/* Quick SQL templates */}
              <div className="border-t pt-4">
                <Label>Quick Queries:</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSqlQuery("SELECT COUNT(*) FROM users;")}
                  >
                    Đếm users
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSqlQuery("SELECT * FROM posts ORDER BY created_at DESC LIMIT 10;")}
                  >
                    Posts gần đây
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSqlQuery("SELECT username, level, xp FROM users ORDER BY xp DESC LIMIT 10;")}
                  >
                    Top XP users
                  </Button>
                </div>
              </div>
              
              {/* SQL Result Display */}
              {sqlResult && (
                <div className="border-t pt-4">
                  <Label>Kết quả SQL:</Label>
                  <div className="mt-2 p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">
                      Command: {sqlResult.command} | Rows: {sqlResult.rowCount}
                    </div>
                    {sqlResult.rows && sqlResult.rows.length > 0 && (
                      <div className="overflow-auto max-h-64">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {Object.keys(sqlResult.rows[0]).map((key) => (
                                <TableHead key={key}>{key}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sqlResult.rows.map((row: any, index: number) => (
                              <TableRow key={index}>
                                {Object.values(row).map((value: any, cellIndex: number) => (
                                  <TableCell key={cellIndex}>
                                    {formatCellValue(value)}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tables?.find(t => t.table_name === "users")?.row_count || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng Posts</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tables?.find(t => t.table_name === "posts")?.row_count || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Flashcard Decks</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tables?.find(t => t.table_name === "flashcard_decks")?.row_count || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Study Groups</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tables?.find(t => t.table_name === "study_groups")?.row_count || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="optimize" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Media URL Optimization</CardTitle>
              <CardDescription>Upload images to ImgBB cloud storage for short URLs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium mb-2">Cloud Storage Optimization:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Uploads images to ImgBB free cloud storage</li>
                  <li>• Converts data URLs to short ImgBB URLs (e.g., i.ibb.co/...)</li>
                  <li>• Reduces database payload size by 95%+ for image posts</li>
                  <li>• Improves query performance dramatically</li>
                  <li>• Images hosted on fast CDN with global availability</li>
                </ul>
              </div>
              
              <div className="flex gap-4">
                <Button 
                  onClick={() => optimizeMediaMutation.mutate()}
                  disabled={optimizeMediaMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Database className="h-4 w-4" />
                  {optimizeMediaMutation.isPending ? "Optimizing..." : "Optimize Media URLs"}
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>This process will:</p>
                <p>1. Find all posts with long data URLs</p>
                <p>2. Upload images to ImgBB cloud storage</p>
                <p>3. Replace data URLs with short ImgBB URLs</p>
                <p>4. Update the database with optimized URLs</p>
                <p className="mt-2 font-medium">Note: This is safe to run multiple times. Images already optimized will be skipped.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Record Dialog */}
      <Dialog open={!!viewingRecord} onOpenChange={() => setViewingRecord(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Xem chi tiết record</DialogTitle>
            <DialogDescription>
              Chi tiết record từ bảng {selectedTable}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-auto">
            {viewingRecord && Object.entries(viewingRecord).map(([key, value]) => (
              <div key={key} className="grid grid-cols-3 gap-4 items-center">
                <Label className="font-medium">{key}</Label>
                <div className="col-span-2 p-2 bg-muted rounded">
                  {formatCellValue(value)}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Record Dialog */}
      <Dialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa record</DialogTitle>
            <DialogDescription>
              Chỉnh sửa record từ bảng {selectedTable}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-auto">
            {editingRecord && Object.entries(editingRecord).map(([key, value]) => (
              <div key={key} className="grid grid-cols-3 gap-4 items-center">
                <Label className="font-medium">{key}</Label>
                <div className="col-span-2">
                  <Input 
                    value={String(value || '')} 
                    onChange={(e) => setEditingRecord({
                      ...editingRecord,
                      [key]: e.target.value
                    })}
                    disabled={key === 'id'}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingRecord(null)}>
              Hủy
            </Button>
            <Button onClick={() => {
              toast({ title: "Chức năng chỉnh sửa chưa được triển khai đầy đủ", variant: "destructive" });
              setEditingRecord(null);
            }}>
              Lưu thay đổi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}