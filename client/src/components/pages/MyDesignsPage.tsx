import { Search, Download, Plus, Grid3x3, List, Star, MoreVertical } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { loadDesigns, deleteDesign, DesignMetadata } from "../../lib/storage";
import { toast } from "sonner";

interface MyDesignsPageProps {
  onOpenEditor?: (designId?: string) => void;
}

export function MyDesignsPage({ onOpenEditor }: MyDesignsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all-categories");
  const [sortBy, setSortBy] = useState("date-modified");
  const [filterTab, setFilterTab] = useState<"all" | "recent" | "favorites" | "archived">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [savedDesigns, setSavedDesigns] = useState<DesignMetadata[]>([]);

  // Load designs on mount
  useEffect(() => {
    const loadDesignsData = async () => {
      try {
        const designs = await loadDesigns();
        setSavedDesigns(designs);
      } catch (error) {
        console.error('Error loading designs:', error);
        toast.error('Failed to load designs');
      }
    };
    loadDesignsData();
  }, []);

  // Toggle favorite
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteIds(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  // Handle delete
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this design?")) {
      try {
        const success = await deleteDesign(id);
        if (success) {
          setSavedDesigns(prev => prev.filter(d => d.id !== id));
          toast.success("Design deleted successfully");
        } else {
          toast.error("Failed to delete design");
        }
      } catch (error) {
        console.error('Error deleting design:', error);
        toast.error("Failed to delete design");
      }
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "just now";
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInHours < 48) return "yesterday";
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Filter and sort designs
  const filteredDesigns = savedDesigns
    .filter((design) => {
      const matchesSearch = 
        design.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (design.category && design.category.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = 
        selectedCategory === "all-categories" ||
        (design.category && design.category.toLowerCase() === selectedCategory);
      
      const matchesTab = 
        filterTab === "all" ||
        (filterTab === "favorites" && favoriteIds.includes(design.id)) ||
        (filterTab === "recent" && new Date().getTime() - new Date(design.updatedAt).getTime() < 48 * 60 * 60 * 1000);
      
      return matchesSearch && matchesCategory && matchesTab;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "date-created") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      // Default: date-modified
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="mb-2">My Designs</h1>
              <p className="text-muted-foreground">
                Manage and access your design projects efficiently
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export All
              </Button>
              <Button className="gap-2" onClick={onOpenEditor}>
                <Plus className="w-4 h-4" />
                New Design
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search designs..."
                className="pl-11 h-11 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px] h-11 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-categories">All Categories</SelectItem>
                <SelectItem value="real-estate">Real Estate</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] h-11 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-modified">Date Modified</SelectItem>
                <SelectItem value="date-created">Date Created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon" 
              className="h-11 w-11"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button 
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon" 
              className="h-11 w-11"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <Button
              variant={filterTab === "all" ? "default" : "ghost"}
              size="sm"
              className="rounded-full h-8"
              onClick={() => setFilterTab("all")}
            >
              All Designs
            </Button>
            <Button
              variant={filterTab === "recent" ? "default" : "ghost"}
              size="sm"
              className="rounded-full h-8"
              onClick={() => setFilterTab("recent")}
            >
              Recent
            </Button>
            <Button
              variant={filterTab === "favorites" ? "default" : "ghost"}
              size="sm"
              className="rounded-full h-8"
              onClick={() => setFilterTab("favorites")}
            >
              Favorites
            </Button>
            <Button
              variant={filterTab === "archived" ? "default" : "ghost"}
              size="sm"
              className="rounded-full h-8"
              onClick={() => setFilterTab("archived")}
            >
              Archived
            </Button>
          </div>
        </div>

        {/* Designs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDesigns.length > 0 ? (
            filteredDesigns.map((design) => (
              <div
                key={design.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onOpenEditor?.(design.id)}
              >
                {/* Design Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={design.thumbnail}
                    alt={design.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-blue-500 text-white border-0">
                      Saved
                    </Badge>
                  </div>
                </div>

                {/* Design Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="flex-1">{design.name}</h3>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => toggleFavorite(design.id, e)}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            favoriteIds.includes(design.id)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-400"
                          }`}
                        />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onOpenEditor?.(design.id);
                          }}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => handleDelete(design.id, e)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Modified {formatDate(design.updatedAt)} • Created {formatDate(design.createdAt)}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {design.category || 'No category'}
                    </p>
                    {design.tags && design.tags.length > 0 && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        {design.tags[0]}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground mb-4">
                {savedDesigns.length === 0 
                  ? "No saved designs yet. Create your first design!" 
                  : "No designs found matching your criteria"}
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (savedDesigns.length === 0) {
                    onOpenEditor?.();
                  } else {
                    setSearchQuery("");
                    setSelectedCategory("all-categories");
                    setFilterTab("all");
                  }
                }}
              >
                {savedDesigns.length === 0 ? "Create Design" : "Clear Filters"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}