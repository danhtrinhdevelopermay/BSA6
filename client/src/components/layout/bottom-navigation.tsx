import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  Search,
  Plus,
  Clock,
  User,
  CreditCard,
  Brain,
  FileText,
  Calendar,
  Users,
  MessageCircle,
  Trophy,
  Settings,
  LogOut,
} from "lucide-react";
import { 
  FaHome, 
  FaSearch, 
  FaPlus, 
  FaClock, 
  FaUserCircle,
  FaHeart,
  FaUserFriends,
  FaComments,
  FaGraduationCap,
  FaBrain,
  FaStickyNote,
  FaCalendarAlt,
  FaGamepad,
  FaCog,
  FaSignOutAlt
} from "react-icons/fa";
import { 
  IoSparkles, 
  IoLibrary, 
  IoGameController,
  IoHappy,
  IoPeople
} from "react-icons/io5";
import { 
  HiOutlineSparkles,
  HiOutlineEmojiHappy,
  HiOutlineChat,
  HiOutlinePuzzle
} from "react-icons/hi";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/components/TranslationProvider";
import { logout } from "@/lib/auth";

export function BottomNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  const mainNavItems = [
    { name: t('nav.dashboard'), href: "/dashboard", icon: FaHome },
    { name: "Search", href: "/users", icon: FaSearch },
    { name: "More", href: "#", icon: IoSparkles, isMain: true, isDropdown: true },
    { name: "History", href: "/assignments", icon: FaClock },
    { name: t('nav.profile'), href: "/profile", icon: FaUserCircle },
  ];

  const moreMenuItems = [
    { name: t('nav.posts'), href: "/posts", icon: FaHeart },
    { name: t('nav.groups'), href: "/groups", icon: FaUserFriends },
    { name: t('nav.flashcards'), href: "/flashcards", icon: IoLibrary },
    { name: t('nav.quizzes'), href: "/quizzes", icon: FaBrain },
    { name: t('nav.notes'), href: "/notes", icon: FaStickyNote },
    { name: "Chat", href: "/chat", icon: FaComments },
    { name: "Achievements", href: "/achievements", icon: FaGamepad },
    { name: t('nav.settings'), href: "/settings", icon: FaCog },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!user) return null;

  const isMoreMenuActive = moreMenuItems.some(item => location === item.href);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Simple container similar to the image */}
      <div className="mx-4 mb-4">
        <div className="bg-card/95 backdrop-blur-15 border-dashed border border-border/50 rounded-2xl shadow-lg p-2">
          <div className="flex items-center justify-around">
            {mainNavItems.map((item, index) => {
              const isActive = location === item.href;
              const isMainMenu = item.isMain;
              
              if (item.isDropdown) {
                return (
                  <DropdownMenu key={`${item.name}-${index}`}>
                    <DropdownMenuTrigger asChild>
                      <div className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 hover:bg-muted/50 min-w-[60px] cursor-pointer">
                        <div className={cn(
                          "p-2 rounded-full transition-all duration-200",
                          "bg-primary text-primary-foreground shadow-md"
                        )}>
                          <item.icon className="h-5 w-5" />
                        </div>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-80 mb-4 bg-card/98 backdrop-blur-15 border-dashed border border-border/40 shadow-2xl shadow-black/10 rounded-2xl overflow-hidden">
                      <div className="px-4 py-3 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 border-b border-dashed border-border/30">
                        <div className="text-sm font-semibold text-muted-foreground tracking-wide">{t('dashboard.quickActions')}</div>
                      </div>
                      
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-3">
                          {moreMenuItems.map((menuItem, menuIndex) => {
                            const isMenuActive = location === menuItem.href;
                            return (
                              <DropdownMenuItem key={menuItem.name} asChild className="p-0">
                                <Link href={menuItem.href}>
                                  <div className={cn(
                                    "flex items-center gap-3 w-full cursor-pointer transition-all duration-300 p-3 rounded-lg",
                                    "hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:shadow-sm",
                                    isMenuActive && "text-primary bg-gradient-to-r from-primary/15 to-primary/8 shadow-md"
                                  )}>
                                    <div className={cn(
                                      "p-2 rounded-xl transition-all duration-300",
                                      isMenuActive ? "bg-primary/20 text-primary" : "bg-muted/50"
                                    )}>
                                      <menuItem.icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-medium text-sm">{menuItem.name}</span>
                                    </div>
                                  </div>
                                </Link>
                              </DropdownMenuItem>
                            );
                          })}
                        </div>
                        
                        <DropdownMenuSeparator className="my-4 bg-gradient-to-r from-transparent via-border to-transparent border-dashed" />
                        
                        <DropdownMenuItem onClick={handleLogout} className="p-0">
                          <div className="flex items-center gap-3 w-full p-3 rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-destructive/10 hover:to-destructive/5 text-destructive group">
                            <div className="p-2 rounded-xl bg-destructive/10 group-hover:bg-destructive/20 transition-all duration-300">
                              <FaSignOutAlt className="h-4 w-4" />
                            </div>
                            <span className="font-medium text-sm">Log out</span>
                          </div>
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
              
              return (
                <Link key={`${item.name}-${index}`} href={item.href}>
                  <div className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 hover:bg-muted/50 min-w-[60px]">
                    <div className={cn(
                      "p-2 rounded-full transition-all duration-200",
                      isMainMenu && isActive && "bg-primary text-primary-foreground shadow-md",
                      isMainMenu && !isActive && "bg-primary/10 text-primary",
                      !isMainMenu && isActive && "bg-primary/20 text-primary",
                      !isMainMenu && !isActive && "text-muted-foreground hover:text-foreground"
                    )}>
                      <item.icon className="h-5 w-5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}