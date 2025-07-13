import { createContext, useContext } from 'react';

// Language types
export type Language = 'en' | 'vi';

// Translation context
export interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

export const TranslationContext = createContext<TranslationContextType | null>(null);

// Hook to use translations
export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}

// Translation function
export function translate(key: string, language: Language, params?: Record<string, string>): string {
  const keys = key.split('.');
  let value: any = translations[language];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  if (typeof value !== 'string') {
    return key; // Return key if translation not found
  }
  
  // Replace parameters
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
      return params[param] || match;
    });
  }
  
  return value;
}

// Translation data
export const translations = {
  en: {
    // Navigation
    nav: {
      home: 'Home',
      dashboard: 'Dashboard',
      flashcards: 'Flashcards',
      quizzes: 'Quizzes',
      notes: 'Notes',
      assignments: 'Assignments',
      groups: 'Study Groups',
      profile: 'Profile',
      admin: 'Admin',
      posts: 'Posts',
      logout: 'Logout',
      settings: 'Settings'
    },
    
    // Landing Page
    landing: {
      title: 'Welcome to BSA',
      subtitle: 'Bright Starts Academy',
      description: 'Your comprehensive learning management platform',
      heroTitle: 'Transform Your Learning Journey',
      heroSubtitle: 'Join thousands of students achieving their academic goals with our comprehensive study tools',
      getStarted: 'Get Started',
      loginButton: 'Login',
      signupButton: 'Sign Up',
      features: {
        flashcards: 'Smart Flashcards',
        flashcardsDesc: 'Create and study with intelligent spaced repetition',
        quizzes: 'Interactive Quizzes',
        quizzesDesc: 'Test your knowledge with engaging assessments',
        notes: 'Digital Notes',
        notesDesc: 'Organize your thoughts and study materials',
        assignments: 'Assignment Tracker',
        assignmentsDesc: 'Never miss a deadline with our smart reminders',
        groups: 'Study Groups',
        groupsDesc: 'Collaborate with peers and learn together',
        achievements: 'Achievements',
        achievementsDesc: 'Track your progress and earn rewards'
      }
    },
    
    // Authentication
    auth: {
      signIn: 'Sign In',
      signUp: 'Sign Up',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      fullName: 'Full Name',
      username: 'Username',
      forgotPassword: 'Forgot Password?',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      signingIn: 'Signing In...',
      signingUp: 'Signing Up...',
      signInWithGoogle: 'Sign In with Google',
      signUpWithGoogle: 'Sign Up with Google',
      invalidCredentials: 'Invalid email or password',
      emailRequired: 'Email is required',
      passwordRequired: 'Password is required',
      passwordsMatch: 'Passwords must match',
      usernameRequired: 'Username is required',
      nameRequired: 'Full name is required'
    },
    
    // Dashboard
    dashboard: {
      welcome: 'Welcome back, {{name}}!',
      level: 'Level {{level}}',
      xp: '{{current}} / {{next}} XP',
      stats: {
        totalFlashcards: 'Total Flashcards',
        totalQuizzes: 'Total Quizzes',
        totalNotes: 'Total Notes',
        studyStreak: 'Study Streak'
      },
      quickActions: 'Quick Actions',
      createFlashcard: 'Create Flashcard',
      takeQuiz: 'Take Quiz',
      addNote: 'Add Note',
      upcomingAssignments: 'Upcoming Assignments',
      noAssignments: 'No upcoming assignments',
      recentActivity: 'Recent Activity',
      achievements: 'Recent Achievements'
    },
    
    // Flashcards
    flashcards: {
      title: 'Flashcards',
      createDeck: 'Create Deck',
      deckName: 'Deck Name',
      description: 'Description',
      create: 'Create',
      cancel: 'Cancel',
      noDecks: 'No flashcard decks yet',
      createFirst: 'Create your first deck to get started',
      cards: '{{count}} cards',
      study: 'Study',
      edit: 'Edit',
      delete: 'Delete',
      addCard: 'Add Card',
      front: 'Front',
      back: 'Back',
      save: 'Save',
      next: 'Next',
      previous: 'Previous',
      showAnswer: 'Show Answer',
      correct: 'Correct',
      incorrect: 'Incorrect',
      studyComplete: 'Study session complete!'
    },
    
    // Quizzes
    quizzes: {
      title: 'Quizzes',
      createQuiz: 'Create Quiz',
      quizTitle: 'Quiz Title',
      description: 'Description',
      isPublic: 'Make Public',
      create: 'Create',
      noQuizzes: 'No quizzes yet',
      createFirst: 'Create your first quiz to get started',
      questions: '{{count}} questions',
      take: 'Take Quiz',
      edit: 'Edit',
      delete: 'Delete',
      addQuestion: 'Add Question',
      questionText: 'Question',
      options: 'Options',
      correctAnswer: 'Correct Answer',
      submit: 'Submit Quiz',
      score: 'Score: {{score}}%',
      passed: 'Passed!',
      failed: 'Try Again',
      results: 'Quiz Results'
    },
    
    // Notes
    notes: {
      title: 'Notes',
      createNote: 'Create Note',
      noteTitle: 'Note Title',
      content: 'Content',
      tags: 'Tags',
      create: 'Create',
      noNotes: 'No notes yet',
      createFirst: 'Create your first note to get started',
      edit: 'Edit',
      delete: 'Delete',
      search: 'Search notes...',
      lastModified: 'Last modified: {{date}}'
    },
    
    // Assignments
    assignments: {
      title: 'Assignments',
      createAssignment: 'Create Assignment',
      assignmentTitle: 'Assignment Title',
      description: 'Description',
      dueDate: 'Due Date',
      priority: 'Priority',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      create: 'Create',
      noAssignments: 'No assignments yet',
      createFirst: 'Create your first assignment to get started',
      edit: 'Edit',
      delete: 'Delete',
      complete: 'Complete',
      incomplete: 'Incomplete',
      overdue: 'Overdue',
      dueToday: 'Due Today',
      dueSoon: 'Due Soon'
    },
    
    // Study Groups
    groups: {
      title: 'Study Groups',
      createGroup: 'Create Group',
      groupName: 'Group Name',
      description: 'Description',
      isPublic: 'Make Public',
      create: 'Create',
      noGroups: 'No study groups yet',
      joinFirst: 'Join or create your first group to get started',
      members: '{{count}} members',
      join: 'Join',
      leave: 'Leave',
      edit: 'Edit',
      delete: 'Delete',
      publicGroups: 'Public Groups',
      myGroups: 'My Groups'
    },
    
    // Profile
    profile: {
      title: 'Profile',
      edit: 'Edit Profile',
      save: 'Save Changes',
      cancel: 'Cancel',
      fullName: 'Full Name',
      email: 'Email',
      username: 'Username',
      bio: 'Bio',
      level: 'Level {{level}}',
      xp: '{{xp}} XP',
      achievements: 'Achievements',
      stats: 'Statistics',
      joinDate: 'Joined: {{date}}',
      settings: 'Settings'
    },
    
    // Settings
    settings: {
      title: 'Settings',
      language: 'Language',
      english: 'English',
      vietnamese: 'Tiếng Việt',
      notifications: 'Notifications',
      emailNotifications: 'Email Notifications',
      pushNotifications: 'Push Notifications',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      auto: 'Auto',
      account: 'Account',
      changePassword: 'Change Password',
      deleteAccount: 'Delete Account',
      save: 'Save Changes'
    },
    
    // Posts
    posts: {
      title: 'Posts',
      createPost: 'Create Post',
      postContent: 'What\'s on your mind?',
      create: 'Post',
      noPosts: 'No posts yet',
      createFirst: 'Share your first post to get started',
      like: 'Like',
      comment: 'Comment',
      comments: 'Comments',
      addComment: 'Add a comment...',
      edit: 'Edit',
      delete: 'Delete',
      timeAgo: '{{time}} ago'
    },
    
    // Common
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      confirm: 'Confirm',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      update: 'Update',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      date: 'Date',
      name: 'Name',
      description: 'Description',
      actions: 'Actions',
      noResults: 'No results found',
      tryAgain: 'Try Again',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      close: 'Close',
      open: 'Open',
      select: 'Select',
      upload: 'Upload',
      download: 'Download',
      share: 'Share',
      copy: 'Copy',
      paste: 'Paste',
      cut: 'Cut',
      undo: 'Undo',
      redo: 'Redo'
    }
  },
  
  vi: {
    // Navigation
    nav: {
      home: 'Trang chủ',
      dashboard: 'Bảng điều khiển',
      flashcards: 'Thẻ học',
      quizzes: 'Bài kiểm tra',
      notes: 'Ghi chú',
      assignments: 'Bài tập',
      groups: 'Nhóm học',
      profile: 'Hồ sơ',
      admin: 'Quản trị',
      posts: 'Bài viết',
      logout: 'Đăng xuất',
      settings: 'Cài đặt'
    },
    
    // Landing Page
    landing: {
      title: 'Chào mừng đến với BSA',
      subtitle: 'Học viện Khởi Đầu Tươi Sáng',
      description: 'Nền tảng quản lý học tập toàn diện của bạn',
      heroTitle: 'Thay đổi hành trình học tập của bạn',
      heroSubtitle: 'Tham gia cùng hàng nghìn học sinh đạt được mục tiêu học tập với các công cụ học tập toàn diện',
      getStarted: 'Bắt đầu',
      loginButton: 'Đăng nhập',
      signupButton: 'Đăng ký',
      features: {
        flashcards: 'Thẻ học thông minh',
        flashcardsDesc: 'Tạo và học với hệ thống lặp lại thông minh',
        quizzes: 'Bài kiểm tra tương tác',
        quizzesDesc: 'Kiểm tra kiến thức với các bài đánh giá hấp dẫn',
        notes: 'Ghi chú số',
        notesDesc: 'Tổ chức suy nghĩ và tài liệu học tập',
        assignments: 'Theo dõi bài tập',
        assignmentsDesc: 'Không bao giờ bỏ lỡ deadline với nhắc nhở thông minh',
        groups: 'Nhóm học tập',
        groupsDesc: 'Hợp tác với bạn bè và học cùng nhau',
        achievements: 'Thành tích',
        achievementsDesc: 'Theo dõi tiến độ và nhận phần thưởng'
      }
    },
    
    // Authentication
    auth: {
      signIn: 'Đăng nhập',
      signUp: 'Đăng ký',
      email: 'Email',
      password: 'Mật khẩu',
      confirmPassword: 'Xác nhận mật khẩu',
      fullName: 'Họ và tên',
      username: 'Tên đăng nhập',
      forgotPassword: 'Quên mật khẩu?',
      noAccount: 'Chưa có tài khoản?',
      hasAccount: 'Đã có tài khoản?',
      signingIn: 'Đang đăng nhập...',
      signingUp: 'Đang đăng ký...',
      signInWithGoogle: 'Đăng nhập với Google',
      signUpWithGoogle: 'Đăng ký với Google',
      invalidCredentials: 'Email hoặc mật khẩu không đúng',
      emailRequired: 'Email là bắt buộc',
      passwordRequired: 'Mật khẩu là bắt buộc',
      passwordsMatch: 'Mật khẩu phải khớp',
      usernameRequired: 'Tên đăng nhập là bắt buộc',
      nameRequired: 'Họ và tên là bắt buộc'
    },
    
    // Dashboard
    dashboard: {
      welcome: 'Chào mừng trở lại, {{name}}!',
      level: 'Cấp độ {{level}}',
      xp: '{{current}} / {{next}} XP',
      stats: {
        totalFlashcards: 'Tổng thẻ học',
        totalQuizzes: 'Tổng bài kiểm tra',
        totalNotes: 'Tổng ghi chú',
        studyStreak: 'Chuỗi học tập'
      },
      quickActions: 'Thao tác nhanh',
      createFlashcard: 'Tạo thẻ học',
      takeQuiz: 'Làm bài kiểm tra',
      addNote: 'Thêm ghi chú',
      upcomingAssignments: 'Bài tập sắp đến hạn',
      noAssignments: 'Không có bài tập sắp đến hạn',
      recentActivity: 'Hoạt động gần đây',
      achievements: 'Thành tích gần đây'
    },
    
    // Flashcards
    flashcards: {
      title: 'Thẻ học',
      createDeck: 'Tạo bộ thẻ',
      deckName: 'Tên bộ thẻ',
      description: 'Mô tả',
      create: 'Tạo',
      cancel: 'Hủy',
      noDecks: 'Chưa có bộ thẻ học nào',
      createFirst: 'Tạo bộ thẻ đầu tiên để bắt đầu',
      cards: '{{count}} thẻ',
      study: 'Học',
      edit: 'Sửa',
      delete: 'Xóa',
      addCard: 'Thêm thẻ',
      front: 'Mặt trước',
      back: 'Mặt sau',
      save: 'Lưu',
      next: 'Tiếp theo',
      previous: 'Trước đó',
      showAnswer: 'Hiện đáp án',
      correct: 'Đúng',
      incorrect: 'Sai',
      studyComplete: 'Hoàn thành phiên học!'
    },
    
    // Quizzes
    quizzes: {
      title: 'Bài kiểm tra',
      createQuiz: 'Tạo bài kiểm tra',
      quizTitle: 'Tiêu đề bài kiểm tra',
      description: 'Mô tả',
      isPublic: 'Công khai',
      create: 'Tạo',
      noQuizzes: 'Chưa có bài kiểm tra nào',
      createFirst: 'Tạo bài kiểm tra đầu tiên để bắt đầu',
      questions: '{{count}} câu hỏi',
      take: 'Làm bài',
      edit: 'Sửa',
      delete: 'Xóa',
      addQuestion: 'Thêm câu hỏi',
      questionText: 'Câu hỏi',
      options: 'Lựa chọn',
      correctAnswer: 'Đáp án đúng',
      submit: 'Nộp bài',
      score: 'Điểm: {{score}}%',
      passed: 'Đã qua!',
      failed: 'Thử lại',
      results: 'Kết quả bài kiểm tra'
    },
    
    // Notes
    notes: {
      title: 'Ghi chú',
      createNote: 'Tạo ghi chú',
      noteTitle: 'Tiêu đề ghi chú',
      content: 'Nội dung',
      tags: 'Thẻ',
      create: 'Tạo',
      noNotes: 'Chưa có ghi chú nào',
      createFirst: 'Tạo ghi chú đầu tiên để bắt đầu',
      edit: 'Sửa',
      delete: 'Xóa',
      search: 'Tìm kiếm ghi chú...',
      lastModified: 'Sửa đổi cuối: {{date}}'
    },
    
    // Assignments
    assignments: {
      title: 'Bài tập',
      createAssignment: 'Tạo bài tập',
      assignmentTitle: 'Tiêu đề bài tập',
      description: 'Mô tả',
      dueDate: 'Hạn nộp',
      priority: 'Độ ưu tiên',
      high: 'Cao',
      medium: 'Trung bình',
      low: 'Thấp',
      create: 'Tạo',
      noAssignments: 'Chưa có bài tập nào',
      createFirst: 'Tạo bài tập đầu tiên để bắt đầu',
      edit: 'Sửa',
      delete: 'Xóa',
      complete: 'Hoàn thành',
      incomplete: 'Chưa hoàn thành',
      overdue: 'Quá hạn',
      dueToday: 'Hạn nộp hôm nay',
      dueSoon: 'Sắp đến hạn'
    },
    
    // Study Groups
    groups: {
      title: 'Nhóm học tập',
      createGroup: 'Tạo nhóm',
      groupName: 'Tên nhóm',
      description: 'Mô tả',
      isPublic: 'Công khai',
      create: 'Tạo',
      noGroups: 'Chưa có nhóm học tập nào',
      joinFirst: 'Tham gia hoặc tạo nhóm đầu tiên để bắt đầu',
      members: '{{count}} thành viên',
      join: 'Tham gia',
      leave: 'Rời nhóm',
      edit: 'Sửa',
      delete: 'Xóa',
      publicGroups: 'Nhóm công khai',
      myGroups: 'Nhóm của tôi'
    },
    
    // Profile
    profile: {
      title: 'Hồ sơ',
      edit: 'Sửa hồ sơ',
      save: 'Lưu thay đổi',
      cancel: 'Hủy',
      fullName: 'Họ và tên',
      email: 'Email',
      username: 'Tên đăng nhập',
      bio: 'Tiểu sử',
      level: 'Cấp độ {{level}}',
      xp: '{{xp}} XP',
      achievements: 'Thành tích',
      stats: 'Thống kê',
      joinDate: 'Tham gia: {{date}}',
      settings: 'Cài đặt'
    },
    
    // Settings
    settings: {
      title: 'Cài đặt',
      language: 'Ngôn ngữ',
      english: 'English',
      vietnamese: 'Tiếng Việt',
      notifications: 'Thông báo',
      emailNotifications: 'Thông báo Email',
      pushNotifications: 'Thông báo Push',
      theme: 'Giao diện',
      light: 'Sáng',
      dark: 'Tối',
      auto: 'Tự động',
      account: 'Tài khoản',
      changePassword: 'Đổi mật khẩu',
      deleteAccount: 'Xóa tài khoản',
      save: 'Lưu thay đổi'
    },
    
    // Posts
    posts: {
      title: 'Bài viết',
      createPost: 'Tạo bài viết',
      postContent: 'Bạn đang nghĩ gì?',
      create: 'Đăng',
      noPosts: 'Chưa có bài viết nào',
      createFirst: 'Chia sẻ bài viết đầu tiên để bắt đầu',
      like: 'Thích',
      comment: 'Bình luận',
      comments: 'Bình luận',
      addComment: 'Thêm bình luận...',
      edit: 'Sửa',
      delete: 'Xóa',
      timeAgo: '{{time}} trước'
    },
    
    // Common
    common: {
      loading: 'Đang tải...',
      error: 'Lỗi',
      success: 'Thành công',
      confirm: 'Xác nhận',
      cancel: 'Hủy',
      save: 'Lưu',
      delete: 'Xóa',
      edit: 'Sửa',
      create: 'Tạo',
      update: 'Cập nhật',
      search: 'Tìm kiếm',
      filter: 'Lọc',
      sort: 'Sắp xếp',
      date: 'Ngày',
      name: 'Tên',
      description: 'Mô tả',
      actions: 'Thao tác',
      noResults: 'Không tìm thấy kết quả',
      tryAgain: 'Thử lại',
      back: 'Quay lại',
      next: 'Tiếp theo',
      previous: 'Trước đó',
      close: 'Đóng',
      open: 'Mở',
      select: 'Chọn',
      upload: 'Tải lên',
      download: 'Tải xuống',
      share: 'Chia sẻ',
      copy: 'Sao chép',
      paste: 'Dán',
      cut: 'Cắt',
      undo: 'Hoàn tác',
      redo: 'Làm lại'
    }
  }
};

// Language detection
export function getDefaultLanguage(): Language {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('language');
    if (saved && (saved === 'en' || saved === 'vi')) {
      return saved;
    }
    
    // Auto-detect from browser
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('vi')) {
      return 'vi';
    }
  }
  
  return 'en';
}

// Language persistence
export function saveLanguage(language: Language) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', language);
  }
}