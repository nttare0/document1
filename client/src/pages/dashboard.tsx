import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Search, 
  Upload, 
  Video, 
  ChevronDown, 
  Grid3X3, 
  List, 
  FileText,
  Folder,
  Star,
  Clock,
  Share,
  Newspaper,
  FileCheck,
  Mail,
  File,
  Reply,
  Users,
  BarChart3,
  MoreHorizontal,
  Settings,
  Download,
  Eye,
  Edit,
  Menu
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { FileLibrary } from "@/components/file-library";
import { FileViewer } from "@/components/file-viewer";

const categoryIcons = {
  press_releases: { icon: Newspaper, color: "text-zeolf-accent", bgColor: "bg-zeolf-accent/10" },
  memos: { icon: FileCheck, color: "text-zeolf-warning", bgColor: "bg-zeolf-warning/10" },
  internal_letters: { icon: Mail, color: "text-zeolf-success", bgColor: "bg-zeolf-success/10" },
  contracts: { icon: File, color: "text-zeolf-error", bgColor: "bg-zeolf-error/10" },
  follow_ups: { icon: Reply, color: "text-zeolf-blue", bgColor: "bg-zeolf-blue/10" },
  reports: { icon: BarChart3, color: "text-purple-600", bgColor: "bg-purple-100" },
};

const categoryLabels = {
  press_releases: "Press Releases",
  memos: "Memos",
  internal_letters: "Internal Letters",
  contracts: "Contracts",
  follow_ups: "Follow-ups",
  reports: "Reports",
};

// Desktop Sidebar Component
function DesktopSidebar({ 
  user, 
  activeView, 
  setActiveView, 
  selectedCategory, 
  setSelectedCategory, 
  setShowFolders,
  getCategoryCount
}: {
  user: any;
  activeView: string;
  setActiveView: (view: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  setShowFolders: (show: boolean) => void;
  getCategoryCount: (category: string) => number;
}) {
  return (
    <div className="p-6">
      {/* Navigation Menu */}
      <nav className="space-y-2 mb-8">
        <Button
          variant={activeView === "all-documents" ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => {setActiveView("all-documents"); setSelectedCategory(""); setShowFolders(false);}}
          data-testid="nav-all-documents"
        >
          <FileText className="w-4 h-4 mr-3" />
          All Documents
        </Button>
        <Button 
          variant={activeView === "folders" ? "secondary" : "ghost"} 
          className="w-full justify-start" 
          onClick={() => {setActiveView("folders"); setShowFolders(true);}}
          data-testid="nav-folders"
        >
          <Folder className="w-4 h-4 mr-3" />
          Folders
        </Button>
        <Button 
          variant={activeView === "starred" ? "secondary" : "ghost"} 
          className="w-full justify-start" 
          onClick={() => {setActiveView("starred"); setSelectedCategory(""); setShowFolders(false);}}
          data-testid="nav-starred"
        >
          <Star className="w-4 h-4 mr-3" />
          Starred
        </Button>
        <Button 
          variant={activeView === "recent" ? "secondary" : "ghost"} 
          className="w-full justify-start" 
          onClick={() => {setActiveView("recent"); setSelectedCategory(""); setShowFolders(false);}}
          data-testid="nav-recent"
        >
          <Clock className="w-4 h-4 mr-3" />
          Recent
        </Button>
        <Button 
          variant={activeView === "shared" ? "secondary" : "ghost"} 
          className="w-full justify-start" 
          onClick={() => {setActiveView("shared"); setSelectedCategory(""); setShowFolders(false);}}
          data-testid="nav-shared"
        >
          <Share className="w-4 h-4 mr-3" />
          Shared with me
        </Button>
      </nav>
      
      {/* Document Categories */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-zeolf-text-secondary mb-3">Categories</h3>
        <nav className="space-y-1">
          {Object.entries(categoryIcons).map(([category, { icon: Icon, color, bgColor }]) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "secondary" : "ghost"}
              className="w-full justify-between text-sm p-3"
              onClick={() => {setSelectedCategory(category); setActiveView("category"); setShowFolders(false);}}
              data-testid={`nav-category-${category}`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${color}`} />
                <span>{categoryLabels[category as keyof typeof categoryLabels]}</span>
              </div>
              <span className="text-xs text-zeolf-text-secondary">
                {getCategoryCount(category)}
              </span>
            </Button>
          ))}
        </nav>
      </div>
      
      {/* Admin Section (Super Admin Only) */}
      {user.role === "super_admin" && (
        <div>
          <h3 className="text-sm font-medium text-zeolf-text-secondary mb-3">Administration</h3>
          <nav className="space-y-1">
            <Link href="/admin/users">
              <Button variant="ghost" className="w-full justify-start text-sm" data-testid="nav-user-management">
                <Users className="w-4 h-4 mr-3" />
                User Management
              </Button>
            </Link>
            <Link href="/admin/activity">
              <Button variant="ghost" className="w-full justify-start text-sm" data-testid="nav-activity-logs">
                <BarChart3 className="w-4 h-4 mr-3" />
                Activity Logs
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}

// Mobile Sidebar Component
function MobileSidebar({ 
  user, 
  activeView, 
  setActiveView, 
  selectedCategory, 
  setSelectedCategory, 
  setShowFolders,
  setMobileMenuOpen,
  getCategoryCount
}: {
  user: any;
  activeView: string;
  setActiveView: (view: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  setShowFolders: (show: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  getCategoryCount: (category: string) => number;
}) {
  const handleNavClick = (action: () => void) => {
    action();
    setMobileMenuOpen(false);
  };

  return (
    <div className="p-6">
      {/* Navigation Menu */}
      <nav className="space-y-2 mb-8">
        <Button
          variant={activeView === "all-documents" ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => handleNavClick(() => {setActiveView("all-documents"); setSelectedCategory(""); setShowFolders(false);})}
          data-testid="nav-all-documents-mobile"
        >
          <FileText className="w-4 h-4 mr-3" />
          All Documents
        </Button>
        <Button 
          variant={activeView === "folders" ? "secondary" : "ghost"} 
          className="w-full justify-start" 
          onClick={() => handleNavClick(() => {setActiveView("folders"); setShowFolders(true);})}
          data-testid="nav-folders-mobile"
        >
          <Folder className="w-4 h-4 mr-3" />
          Folders
        </Button>
        <Button 
          variant={activeView === "starred" ? "secondary" : "ghost"} 
          className="w-full justify-start" 
          onClick={() => handleNavClick(() => {setActiveView("starred"); setSelectedCategory(""); setShowFolders(false);})}
          data-testid="nav-starred-mobile"
        >
          <Star className="w-4 h-4 mr-3" />
          Starred
        </Button>
        <Button 
          variant={activeView === "recent" ? "secondary" : "ghost"} 
          className="w-full justify-start" 
          onClick={() => handleNavClick(() => {setActiveView("recent"); setSelectedCategory(""); setShowFolders(false);})}
          data-testid="nav-recent-mobile"
        >
          <Clock className="w-4 h-4 mr-3" />
          Recent
        </Button>
        <Button 
          variant={activeView === "shared" ? "secondary" : "ghost"} 
          className="w-full justify-start" 
          onClick={() => handleNavClick(() => {setActiveView("shared"); setSelectedCategory(""); setShowFolders(false);})}
          data-testid="nav-shared-mobile"
        >
          <Share className="w-4 h-4 mr-3" />
          Shared with me
        </Button>
      </nav>
      
      {/* Document Categories */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-zeolf-text-secondary mb-3">Categories</h3>
        <nav className="space-y-1">
          {Object.entries(categoryIcons).map(([category, { icon: Icon, color, bgColor }]) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "secondary" : "ghost"}
              className="w-full justify-between text-sm p-3"
              onClick={() => handleNavClick(() => {setSelectedCategory(category); setActiveView("category"); setShowFolders(false);})}
              data-testid={`nav-category-${category}-mobile`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${color}`} />
                <span>{categoryLabels[category as keyof typeof categoryLabels]}</span>
              </div>
              <span className="text-xs text-zeolf-text-secondary">
                {getCategoryCount(category)}
              </span>
            </Button>
          ))}
        </nav>
      </div>
      
      {/* Admin Section (Super Admin Only) */}
      {user.role === "super_admin" && (
        <div>
          <h3 className="text-sm font-medium text-zeolf-text-secondary mb-3">Administration</h3>
          <nav className="space-y-1">
            <Link href="/admin/users">
              <Button variant="ghost" className="w-full justify-start text-sm" data-testid="nav-user-management-mobile">
                <Users className="w-4 h-4 mr-3" />
                User Management
              </Button>
            </Link>
            <Link href="/admin/activity">
              <Button variant="ghost" className="w-full justify-start text-sm" data-testid="nav-activity-logs-mobile">
                <BarChart3 className="w-4 h-4 mr-3" />
                Activity Logs
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const [activeView, setActiveView] = useState("all-documents");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showFolders, setShowFolders] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch document statistics
  const { data: documentStats } = useQuery({
    queryKey: ["/api/documents/stats"],
    enabled: !!user,
  });

  const getCategoryCount = (category: string) => {
    if (!documentStats) return 0;
    switch (category) {
      case "press_releases": return (documentStats as any).pressReleases || 0;
      case "memos": return (documentStats as any).memos || 0;
      case "internal_letters": return (documentStats as any).letters || 0;
      case "contracts": return (documentStats as any).contracts || 0;
      case "follow_ups": return (documentStats as any).followups || 0;
      case "reports": return (documentStats as any).reports || 0;
      default: return 0;
    }
  };





  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zeolf-bg">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden" data-testid="mobile-menu-trigger">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <MobileSidebar 
                  user={user}
                  activeView={activeView}
                  setActiveView={setActiveView}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  setShowFolders={setShowFolders}
                  setMobileMenuOpen={setMobileMenuOpen}
                  getCategoryCount={getCategoryCount}
                />
              </SheetContent>
            </Sheet>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-zeolf-blue rounded flex items-center justify-center">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-zeolf-text">ZEOLF DMS</h1>
            </div>
            
            <nav className="hidden sm:flex items-center space-x-2 text-sm">
              <span className="text-zeolf-text-secondary">Documents</span>
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <span className="text-zeolf-blue">Company Files</span>
            </nav>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* User Menu */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-zeolf-blue rounded-full flex items-center justify-center">
                <span className="text-white text-xs sm:text-sm font-medium">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <span className="hidden sm:inline text-zeolf-text font-medium">{user.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-72 bg-white border-r border-gray-200 min-h-screen">
          <DesktopSidebar 
            user={user}
            activeView={activeView}
            setActiveView={setActiveView}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            setShowFolders={setShowFolders}
            getCategoryCount={getCategoryCount}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {activeView === "folders" ? (
              <FileLibrary />
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-zeolf-text mb-6">
                  {activeView === "all-documents" && "All Documents"}
                  {activeView === "starred" && "Starred Documents"}
                  {activeView === "recent" && "Recent Documents"}
                  {activeView === "shared" && "Shared with Me"}
                  {activeView === "category" && selectedCategory && `${categoryLabels[selectedCategory as keyof typeof categoryLabels]}`}
                </h2>
                <FileViewer 
                  onClose={() => {}} 
                  filterMode={activeView === "category" ? selectedCategory : activeView}
                />
              </div>
            )}
          </div>
        </main>
      </div>


      



    </div>
  );
}
