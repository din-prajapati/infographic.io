import { Search, Plus, ChevronDown } from "lucide-react";
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
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { loadTemplates, DesignMetadata } from "../../lib/storage";
import { templatesApi } from "../../lib/api";
import { useQuery } from "@tanstack/react-query";

interface TemplatesPageProps {
  onOpenEditor?: (templateId?: string) => void;
}

interface TemplateItem {
  id: string | number;
  title: string;
  description: string;
  uses: string;
  badge: string;
  badgeColor: string;
  image: string;
  isCustom?: boolean;
  isApiTemplate?: boolean;
}

const templates: TemplateItem[] = [
  {
    id: 1,
    title: "Modern Real Estate",
    description: "Luxury property showcase",
    uses: "2.4k",
    badge: "Luxury",
    badgeColor: "bg-black text-white",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBpbnRlcmlvciUyMGRlc2lnbnxlbnwxfHx8fDE3NjQyMzU0NzB8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 2,
    title: "Urban Living",
    description: "Contemporary apartment layout",
    uses: "1.8k",
    badge: "Standard",
    badgeColor: "bg-gray-800 text-white",
    image: "https://images.unsplash.com/photo-1718893389568-22a2a039998c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcmNoaXRlY3R1cmUlMjBob3VzZXxlbnwxfHx8fDE3NjQyMjQyODZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 3,
    title: "Cozy Home",
    description: "Affordable housing design",
    uses: "3.1k",
    badge: "Budget",
    badgeColor: "bg-blue-600 text-white",
    image: "https://images.unsplash.com/photo-1605191353027-d21e534a419a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwaG9tZSUyMGludGVyaW9yfGVufDF8fHx8MTc2NDI2NzYzOXww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 4,
    title: "Penthouse Suite",
    description: "Premium property template",
    uses: "1.5k",
    badge: "Luxury",
    badgeColor: "bg-black text-white",
    image: "https://images.unsplash.com/photo-1686056040370-b5e5c06c4273?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBhcGFydG1lbnR8ZW58MXx8fHwxNzY0MjkxODMyfDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 5,
    title: "Family Residence",
    description: "Spacious family home",
    uses: "2.7k",
    badge: "Standard",
    badgeColor: "bg-gray-800 text-white",
    image: "https://images.unsplash.com/photo-1720247520862-7e4b14176fa8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb250ZW1wb3JhcnklMjBsaXZpbmclMjByb29tfGVufDF8fHx8MTc2NDIzMzI4NXww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 6,
    title: "Waterfront Villa",
    description: "Exclusive coastal property",
    uses: "1.8k",
    badge: "Luxury",
    badgeColor: "bg-black text-white",
    image: "https://images.unsplash.com/photo-1704428382583-c9c7c1e55d94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBiZWRyb29tJTIwZGVzaWdufGVufDF8fHx8MTc2NDIzMzQ4N3ww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 7,
    title: "Studio Apartment",
    description: "Compact living space",
    uses: "4.2k",
    badge: "Budget",
    badgeColor: "bg-blue-600 text-white",
    image: "https://images.unsplash.com/photo-1713420560043-cc218e86cc86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMGFwYXJ0bWVudCUyMGRlc2lnbnxlbnwxfHx8fDE3NjQzMjM2ODF8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 8,
    title: "Downtown Condo",
    description: "City center residence",
    uses: "2.3k",
    badge: "Standard",
    badgeColor: "bg-gray-800 text-white",
    image: "https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwaW50ZXJpb3J8ZW58MXx8fHwxNzY0MjQwMTk4fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
];

export function TemplatesPage({ onOpenEditor }: TemplatesPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all-categories");
  const [selectedStyle, setSelectedStyle] = useState("all-styles");
  const [customTemplates, setCustomTemplates] = useState<DesignMetadata[]>([]);
  const [showCustomOnly, setShowCustomOnly] = useState(false);

  // Load API templates
  const { data: apiTemplates = [], isLoading: isLoadingApiTemplates } = useQuery({
    queryKey: ['/api/v1/templates'],
    queryFn: () => templatesApi.getAll(),
  });

  // Load custom templates on mount
  useEffect(() => {
    const loadCustomTemplates = async () => {
      try {
        const templates = await loadTemplates();
        setCustomTemplates(templates);
      } catch (error) {
        console.error('Error loading custom templates:', error);
      }
    };
    loadCustomTemplates();
  }, []);

  // Combine API templates, built-in templates, and custom templates
  const allTemplates = [
    ...customTemplates.map(t => ({
      id: t.id,
      title: t.name,
      description: t.category || "Custom template",
      uses: "Custom",
      badge: t.category || "Custom",
      badgeColor: "bg-purple-600 text-white",
      image: t.thumbnail,
      isCustom: true,
    })),
    ...apiTemplates.map(t => ({
      id: t.id,
      title: t.name,
      description: t.category || "Template",
      uses: "API",
      badge: t.category || "Template",
      badgeColor: "bg-blue-600 text-white",
      image: t.previewUrl || "",
      isCustom: false,
      isApiTemplate: true,
    })),
    ...(!showCustomOnly ? templates : []),
  ];

  // Filter templates based on search and filters
  const filteredTemplates = allTemplates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all-categories" ||
      (selectedCategory === "custom" && template.isCustom) ||
      (selectedCategory === "real-estate" && template.badge === "Luxury");

    const matchesStyle =
      selectedStyle === "all-styles" || 
      template.badge.toLowerCase() === selectedStyle ||
      (selectedStyle === "custom" && template.isCustom);

    return matchesSearch && matchesCategory && matchesStyle;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="mb-2 text-white">Template Gallery</h1>
              <p className="text-gray-400">
                Choose from our curated collection of professional infographic templates
              </p>
            </div>
            <Button className="gap-2 bg-white text-black hover:bg-gray-100" onClick={() => onOpenEditor?.()}>
              <Plus className="w-4 h-4" />
              Create Blank
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search templates..."
                className="pl-11 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px] h-11 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-categories">All Categories</SelectItem>
                <SelectItem value="custom">My Templates</SelectItem>
                <SelectItem value="real-estate">Real Estate</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStyle} onValueChange={setSelectedStyle}>
              <SelectTrigger className="w-[140px] h-11 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-styles">All Styles</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="budget">Budget</SelectItem>
              </SelectContent>
            </Select>
            {customTemplates.length > 0 && (
              <Button
                variant={showCustomOnly ? "default" : "outline"}
                onClick={() => setShowCustomOnly(!showCustomOnly)}
                className="h-11 border-white/20 text-white"
              >
                My Templates ({customTemplates.length})
              </Button>
            )}
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Template Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  {template.isCustom ? (
                    <img
                      src={template.image}
                      alt={template.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageWithFallback
                      src={template.image}
                      alt={template.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge className={`${template.badgeColor}`}>
                      {template.badge}
                    </Badge>
                  </div>
                  {template.isCustom && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-purple-500 text-white">
                        Custom
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <h3 className="mb-1 text-white">{template.title}</h3>
                  <p className="text-xs text-gray-400 mb-3">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {template.uses} {template.isCustom ? '' : 'uses'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-emerald-400 hover:text-emerald-300 h-8"
                      onClick={() => onOpenEditor?.(template.isCustom ? String(template.id) : undefined)}
                    >
                      Use Template
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <p className="text-gray-400 mb-4">
                {showCustomOnly && customTemplates.length === 0
                  ? "No custom templates yet. Save a design as template!"
                  : "No templates found matching your criteria"}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  if (showCustomOnly && customTemplates.length === 0) {
                    onOpenEditor?.();
                  } else {
                    setSearchQuery("");
                    setSelectedCategory("all-categories");
                    setSelectedStyle("all-styles");
                    setShowCustomOnly(false);
                  }
                }}
              >
                {showCustomOnly && customTemplates.length === 0 ? "Create Design" : "Clear Filters"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}