import React, { useState, useEffect } from "react";
import { Plus, Sparkles, Building2, Home, TrendingUp, BarChart3, PieChart, ArrowRight, CheckCircle2, DollarSign, Users, MapPin, Target, TrendingDown } from "lucide-react";
import { Button } from "../ui/button";
import { AIChatBox } from "../ai-chat/AIChatBox";
import { Template } from "../ai-chat/types";
import { AIButtonIcon } from "../ai-chat/AIButtonIcon";
import { useCanvasStore } from "../../hooks/useCanvasStore";
import { TextElement } from "../canvas/TextElement";
import { ShapeElement } from "../canvas/ShapeElement";
import { ImageElement } from "../canvas/ImageElement";
import { sortByZIndex } from "../../lib/canvasUtils";
import { DimensionsDisplay } from "./DimensionsDisplay";
import { ContextualToolbar } from "./ContextualToolbar";
import { ImageElement as ImageElementType } from "../../lib/canvasTypes";
import { usePanelState } from "../../lib/panelState";
import { loadTemplateById } from "../../lib/storage";
import { restoreCanvasData } from "../../lib/canvasState";
import { useToast } from "../../hooks/use-toast";

export function CenterCanvas() {
  
  const [isAIChatExpanded, setIsAIChatExpanded] =
    useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const { closePanel } = usePanelState();
  const { toast } = useToast();
  
  const elements = useCanvasStore((state) => state.elements);
  const selectedElementIds = useCanvasStore((state) => state.selectedElementIds);
  const selectElement = useCanvasStore((state) => state.selectElement);
  const clearSelection = useCanvasStore((state) => state.clearSelection);
  const canvasWidth = useCanvasStore((state) => state.canvasWidth);
  const canvasHeight = useCanvasStore((state) => state.canvasHeight);
  const backgroundColor = useCanvasStore((state) => state.backgroundColor);
  const selectedThemeColors = useCanvasStore((state) => state.selectedThemeColors);
  const zoom = useCanvasStore((state) => state.zoom);
  const activeTool = useCanvasStore((state) => state.activeTool);
  const canvasPanX = useCanvasStore((state) => state.canvasPanX);
  const canvasPanY = useCanvasStore((state) => state.canvasPanY);
  const setPan = useCanvasStore((state) => state.setPan);

  // Get isPreviewMode from parent if needed, for now we'll assume false
  // In a real implementation, this could be passed as a prop
  const isPreviewMode = false;

  const handleAIButtonClick = () => {
    setIsAIChatExpanded(!isAIChatExpanded);
  };

  const handleAIChatClose = () => {
    setIsAIChatExpanded(false);
  };

  const handleTemplateLoad = async (template: Template) => {
    try {
      // Load the full template data (including canvasData) from storage/API
      const fullTemplate = await loadTemplateById(template.id);
      
      if (!fullTemplate) {
        toast({
          title: "Template not found",
          description: `Could not load template "${template.name}"`,
          variant: "destructive",
        });
        return;
      }

      // Restore canvas data if available
      if (fullTemplate.canvasData) {
        const success = restoreCanvasData(fullTemplate.canvasData);
        
        if (success) {
          toast({
            title: "Template loaded",
            description: `"${template.name}" has been loaded into the canvas`,
          });
          // Close AI chat after successful load
          setIsAIChatExpanded(false);
        } else {
          toast({
            title: "Failed to load template",
            description: "The template data could not be restored",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Template has no canvas data",
          description: `Template "${template.name}" does not contain canvas data`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading template:", error);
      toast({
        title: "Error loading template",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Clear selection when clicking on empty canvas area
    const target = e.target as HTMLElement;
    if (target.getAttribute('data-canvas-content') === 'true') {
      clearSelection();
      // Close any open left panels when clicking on empty canvas
      // closePanel();
    }
  };

  const handleElementSelect = (elementId: string, event: React.MouseEvent) => {
    // Multi-select with Shift key
    if (event.shiftKey) {
      selectElement(elementId, true); // Add to selection
    } else {
      selectElement(elementId); // Replace selection
    }
  };

  // Hand tool panning handlers
  const handlePanStart = (e: React.MouseEvent) => {
    if (activeTool === 'hand') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - canvasPanX, y: e.clientY - canvasPanY });
    }
  };

  const handlePanMove = (e: React.MouseEvent) => {
    if (isPanning && activeTool === 'hand') {
      const newPanX = e.clientX - panStart.x;
      const newPanY = e.clientY - panStart.y;
      setPan(newPanX, newPanY);
    }
  };

  const handlePanEnd = () => {
    if (isPanning) {
      setIsPanning(false);
    }
  };

  const sortedElements = sortByZIndex(elements);
  const hasElements = elements.length > 0;
  
  // Get selected element for dimensions display and info panel
  const selectedElement = selectedElementIds.length === 1 
    ? elements.find((el) => el.id === selectedElementIds[0])
    : null;

  return (
    <div className="flex-1 flex flex-col bg-gray-100 relative overflow-hidden">
      {/* Canvas Area with Dot Grid */}
      <div 
        className="flex-1 dot-grid overflow-auto flex items-center justify-center p-12 relative"
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
        style={{
          cursor: activeTool === 'hand' ? (isPanning ? 'grabbing' : 'grab') : 'default'
        }}
      >
        {/* Canvas Container with Shadow */}
        <div
          data-canvas-container
          className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] relative"
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            transform: `translate(${canvasPanX}px, ${canvasPanY}px) scale(${zoom})`,
            transition: isPanning ? 'none' : "transform 0.2s, background-color 0.3s ease-in-out",
            backgroundColor: backgroundColor,
          }}
        >
          {/* Contextual Toolbar - appears above selected element */}
          {selectedElement && !isPreviewMode && (
            <ContextualToolbar
              element={selectedElement}
              position={{
                x: selectedElement.x + selectedElement.width / 2,
                y: selectedElement.y,
              }}
            />
          )}

          {/* Dimensions Display - appears beneath selected element */}
          {selectedElement && !isPreviewMode && (
            <DimensionsDisplay
              element={selectedElement}
              position={{
                x: selectedElement.x + selectedElement.width / 2,
                y: selectedElement.y,
              }}
            />
          )}
          
          {/* Canvas Content */}
          <div 
            className="absolute rounded-2xl overflow-hidden"
            style={{
              left: '10px',
              top: '-30px',
              display: 'flex',
              flexWrap: 'wrap',
              right: '0',
              bottom: '0',
              height: '100%',
            }}
            data-canvas-content="true"
            onClick={handleCanvasClick}
          >
            {/* Render all canvas elements */}
            {sortedElements.map((element) => {
              const isSelected = selectedElementIds.includes(element.id);
              const handleSelect = (e: React.MouseEvent) => {
                e.stopPropagation(); // Prevent triggering canvas click
                handleElementSelect(element.id, e);
              };

              if (element.type === 'text') {
                return React.createElement(TextElement, {
                  key: element.id,
                  element,
                  isSelected,
                  onSelect: handleSelect,
                });
              } else if (element.type === 'shape') {
                return React.createElement(ShapeElement, {
                  key: element.id,
                  element,
                  isSelected,
                  onSelect: handleSelect,
                });
              } else if (element.type === 'image') {
                return React.createElement(ImageElement, {
                  key: element.id,
                  element,
                  isSelected,
                  onSelect: handleSelect,
                });
              }
              return null;
            })}

            {/* Empty State - Sample Infographic Placeholder */}
            {!hasElements && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Semi-transparent overlay to indicate placeholder */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-white/60 z-10"></div>
                
                <div className="w-full h-full px-8 py-8 relative z-0 overflow-auto">
                  {/* Main Title Section with Placeholder Badge */}
                  <div className="text-center mb-6 relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/80 border border-purple-200 mb-3">
                      <span className="text-xs font-medium text-purple-700">Sample Preview</span>
                    </div>
                    <h1 
                      className="font-bold mb-2 transition-colors opacity-60"
                      style={{
                        fontSize: '36px',
                        color: selectedThemeColors && selectedThemeColors.length > 0
                          ? selectedThemeColors[0]
                          : '#1F1F1F',
                      }}
                    >
                      Real Estate Infographics
                    </h1>
                  </div>

                  {/* Horizontal Card with Buildings - Reduced Opacity */}
                  <div className="bg-white/60 rounded-lg p-6 mb-6 border-2 border-dashed border-gray-300 shadow-sm opacity-50">
                    <div className="flex items-center gap-8">
                      {/* Isometric Buildings */}
                      <div className="flex items-end gap-2 flex-shrink-0">
                        {[0, 1, 2, 3, 4].map((index) => {
                          const colorIndex = index % (selectedThemeColors?.length || 5);
                          const color = selectedThemeColors?.[colorIndex] || '#9CA3AF';
                          const height = [100, 80, 60, 70, 50][index];
                          return (
                            <div
                              key={index}
                              className="relative transition-all"
                              style={{
                                width: '50px',
                                height: `${height}px`,
                                backgroundColor: color,
                                clipPath: 'polygon(0% 20%, 20% 0%, 80% 0%, 100% 20%, 100% 100%, 0% 100%)',
                                opacity: 0.6,
                              }}
                            >
                              {/* Windows */}
                              <div className="absolute top-3 left-1.5 w-2 h-2 bg-white opacity-40 rounded-sm"></div>
                              <div className="absolute top-3 right-1.5 w-2 h-2 bg-white opacity-40 rounded-sm"></div>
                              <div className="absolute bottom-6 left-1.5 w-2 h-2 bg-white opacity-40 rounded-sm"></div>
                              <div className="absolute bottom-6 right-1.5 w-2 h-2 bg-white opacity-40 rounded-sm"></div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Text Content */}
                      <div className="flex-1">
                        <h2 
                          className="text-2xl font-bold mb-2 transition-colors opacity-60"
                          style={{
                            color: selectedThemeColors && selectedThemeColors.length > 0
                              ? selectedThemeColors[0]
                              : '#1F1F1F',
                          }}
                        >
                          Real Estate Infographics
                        </h2>
                        <p 
                          className="text-base transition-colors opacity-60"
                          style={{
                            color: selectedThemeColors && selectedThemeColors.length > 1
                              ? selectedThemeColors[1]
                              : '#6B7280',
                          }}
                        >
                          Here is where your infographics begin
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Analytics Cards Grid - Reduced Opacity */}
                  <div className="grid grid-cols-3 gap-4 opacity-40">
                    {/* Card 1: Market Trends */}
                    <div className="bg-white/60 rounded-lg p-4 border-2 border-dashed border-gray-300 shadow-sm">
                      <h3 
                        className="text-sm font-semibold mb-3 transition-colors"
                        style={{
                          color: selectedThemeColors && selectedThemeColors.length > 0
                            ? selectedThemeColors[0]
                            : '#1F1F1F',
                        }}
                      >
                        Market Trends
                      </h3>
                      <div className="flex items-center justify-center mb-3">
                        <Building2 
                          size={48}
                          style={{
                            color: selectedThemeColors?.[0] || '#9CA3AF',
                            opacity: 0.5,
                          }}
                        />
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span 
                            className="transition-colors"
                            style={{
                              color: selectedThemeColors && selectedThemeColors.length > 2
                                ? selectedThemeColors[2]
                                : '#6B7280',
                            }}
                          >
                            Q4 Growth:
                          </span>
                          <span 
                            className="font-semibold transition-colors"
                            style={{
                              color: selectedThemeColors?.[0] || '#1F1F1F',
                            }}
                          >
                            +8.5%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span 
                            className="transition-colors"
                            style={{
                              color: selectedThemeColors && selectedThemeColors.length > 2
                                ? selectedThemeColors[2]
                                : '#6B7280',
                            }}
                          >
                            Avg. Days:
                          </span>
                          <span 
                            className="font-semibold transition-colors"
                            style={{
                              color: selectedThemeColors?.[0] || '#1F1F1F',
                            }}
                          >
                            28 Days
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Investment Growth */}
                    <div className="bg-white/60 rounded-lg p-4 border-2 border-dashed border-gray-300 shadow-sm">
                      <h3 
                        className="text-sm font-semibold mb-3 transition-colors"
                        style={{
                          color: selectedThemeColors && selectedThemeColors.length > 0
                            ? selectedThemeColors[0]
                            : '#1F1F1F',
                        }}
                      >
                        Investment Growth
                      </h3>
                      <div className="flex items-center justify-center mb-3">
                        <Home 
                          size={48}
                          style={{
                            color: selectedThemeColors?.[0] || '#9CA3AF',
                            opacity: 0.5,
                          }}
                        />
                      </div>
                      <div className="flex items-end gap-1.5 h-16 mb-2">
                        {[40, 60, 80].map((height, i) => {
                          const color = selectedThemeColors?.[i % (selectedThemeColors?.length || 1)] || '#9CA3AF';
                          return (
                            <div
                              key={i}
                              className="flex-1 rounded-t transition-all"
                              style={{
                                height: `${height}%`,
                                backgroundColor: color,
                                opacity: 0.5,
                              }}
                            />
                          );
                        })}
                      </div>
                      <div className="text-xs">
                        <span 
                          className="font-semibold transition-colors"
                          style={{
                            color: selectedThemeColors?.[0] || '#1F1F1F',
                          }}
                        >
                          ROI: 15% Annually
                        </span>
                      </div>
                    </div>

                    {/* Card 3: Property Types */}
                    <div className="bg-white/60 rounded-lg p-4 border-2 border-dashed border-gray-300 shadow-sm">
                      <h3 
                        className="text-sm font-semibold mb-3 transition-colors"
                        style={{
                          color: selectedThemeColors && selectedThemeColors.length > 0
                            ? selectedThemeColors[0]
                            : '#1F1F1F',
                        }}
                      >
                        Property Types
                      </h3>
                      <div className="relative flex items-center justify-center mb-3">
                        <div className="relative w-20 h-20">
                          {/* Donut Chart */}
                          <svg viewBox="0 0 100 100" className="absolute inset-0">
                            {[0, 1, 2, 3].map((i) => {
                              const color = selectedThemeColors?.[i % (selectedThemeColors?.length || 1)] || '#9CA3AF';
                              const percentages = [45, 30, 15, 10];
                              const startAngle = i === 0 ? -90 : percentages.slice(0, i).reduce((a, b) => a + b, 0) * 3.6 - 90;
                              const endAngle = percentages.slice(0, i + 1).reduce((a, b) => a + b, 0) * 3.6 - 90;
                              const largeArc = percentages[i] > 180 ? 1 : 0;
                              const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                              const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                              const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                              const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
                              return (
                                <path
                                  key={i}
                                  d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                  fill={color}
                                  opacity={0.5}
                                />
                              );
                            })}
                            <circle cx="50" cy="50" r="25" fill="white" />
                          </svg>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs">
                        {['Residential', 'Commercial', 'Industrial'].map((type, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: selectedThemeColors?.[i % (selectedThemeColors?.length || 1)] || '#9CA3AF',
                              }}
                            />
                            <span 
                              className="transition-colors"
                              style={{
                                color: selectedThemeColors && selectedThemeColors.length > 2
                                  ? selectedThemeColors[2]
                                  : '#6B7280',
                              }}
                            >
                              {type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Card 4: Neighborhood Insights */}
                    <div className="bg-white/60 rounded-lg p-4 border-2 border-dashed border-gray-300 shadow-sm">
                      <h3 
                        className="text-sm font-semibold mb-3 transition-colors"
                        style={{
                          color: selectedThemeColors && selectedThemeColors.length > 0
                            ? selectedThemeColors[0]
                            : '#1F1F1F',
                        }}
                      >
                        Neighborhood Insights
                      </h3>
                      <div className="flex items-center justify-center mb-3">
                        <MapPin 
                          size={48}
                          style={{
                            color: selectedThemeColors?.[0] || '#9CA3AF',
                            opacity: 0.5,
                          }}
                        />
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {[1, 2, 3, 4].map((num) => (
                          <div key={num} className="flex items-center gap-1.5">
                            <span 
                              className="font-semibold transition-colors"
                              style={{
                                color: selectedThemeColors?.[0] || '#1F1F1F',
                              }}
                            >
                              {num}.
                            </span>
                            <span 
                              className="transition-colors"
                              style={{
                                color: selectedThemeColors && selectedThemeColors.length > 2
                                  ? selectedThemeColors[2]
                                  : '#6B7280',
                              }}
                            >
                              Key insight {num}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Card 5: Sales Performance */}
                    <div className="bg-white/60 rounded-lg p-4 border-2 border-dashed border-gray-300 shadow-sm">
                      <h3 
                        className="text-sm font-semibold mb-3 transition-colors"
                        style={{
                          color: selectedThemeColors && selectedThemeColors.length > 0
                            ? selectedThemeColors[0]
                            : '#1F1F1F',
                        }}
                      >
                        Sales Performance
                      </h3>
                      <div className="flex items-center justify-center mb-3">
                        <TrendingUp 
                          size={48}
                          style={{
                            color: selectedThemeColors?.[0] || '#9CA3AF',
                            opacity: 0.5,
                          }}
                        />
                      </div>
                      <div className="flex items-end gap-1.5 h-16 mb-2">
                        {[50, 65, 85].map((height, i) => {
                          const color = selectedThemeColors?.[i % (selectedThemeColors?.length || 1)] || '#9CA3AF';
                          return (
                            <div
                              key={i}
                              className="flex-1 rounded transition-all"
                              style={{
                                height: `${height}%`,
                                backgroundColor: color,
                                opacity: 0.5,
                              }}
                            />
                          );
                        })}
                      </div>
                      <div className="text-xs">
                        <span 
                          className="font-semibold transition-colors"
                          style={{
                            color: selectedThemeColors?.[0] || '#1F1F1F',
                          }}
                        >
                          Sales Volume: $50M
                        </span>
                      </div>
                    </div>

                    {/* Card 6: Rental Yield */}
                    <div className="bg-white/60 rounded-lg p-4 border-2 border-dashed border-gray-300 shadow-sm">
                      <h3 
                        className="text-sm font-semibold mb-3 transition-colors"
                        style={{
                          color: selectedThemeColors && selectedThemeColors.length > 0
                            ? selectedThemeColors[0]
                            : '#1F1F1F',
                        }}
                      >
                        Rental Yield
                      </h3>
                      <div className="flex items-center justify-center mb-3">
                        <DollarSign 
                          size={48}
                          style={{
                            color: selectedThemeColors?.[0] || '#9CA3AF',
                            opacity: 0.5,
                          }}
                        />
                      </div>
                      <div className="relative flex items-center justify-center mb-2">
                        <div className="relative w-16 h-16">
                          <svg viewBox="0 0 100 100" className="absolute inset-0">
                            {[0, 1, 2].map((i) => {
                              const color = selectedThemeColors?.[i % (selectedThemeColors?.length || 1)] || '#9CA3AF';
                              const percentages = [40, 35, 25];
                              const startAngle = i === 0 ? -90 : percentages.slice(0, i).reduce((a, b) => a + b, 0) * 3.6 - 90;
                              const endAngle = percentages.slice(0, i + 1).reduce((a, b) => a + b, 0) * 3.6 - 90;
                              const largeArc = percentages[i] > 180 ? 1 : 0;
                              const x1 = 50 + 35 * Math.cos((startAngle * Math.PI) / 180);
                              const y1 = 50 + 35 * Math.sin((startAngle * Math.PI) / 180);
                              const x2 = 50 + 35 * Math.cos((endAngle * Math.PI) / 180);
                              const y2 = 50 + 35 * Math.sin((endAngle * Math.PI) / 180);
                              return (
                                <path
                                  key={i}
                                  d={`M 50 50 L ${x1} ${y1} A 35 35 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                  fill={color}
                                  opacity={0.5}
                                />
                              );
                            })}
                            <circle cx="50" cy="50" r="20" fill="white" />
                            <text x="50" y="55" textAnchor="middle" fontSize="12" fontWeight="bold" fill={selectedThemeColors?.[0] || '#1F1F1F'}>
                              6.8%
                            </text>
                          </svg>
                        </div>
                      </div>
                      <div className="text-xs text-center">
                        <span 
                          className="font-semibold transition-colors"
                          style={{
                            color: selectedThemeColors?.[0] || '#1F1F1F',
                          }}
                        >
                          Occupancy: 95%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Centered Call to Action - Main Focal Point */}
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="bg-white rounded-xl p-6 shadow-xl border-2 border-purple-200 max-w-md">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-16 h-16 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                          style={{
                            backgroundColor: selectedThemeColors && selectedThemeColors.length > 0
                              ? `${selectedThemeColors[0]}15`
                              : 'rgb(243, 244, 246)',
                            border: `2px solid ${selectedThemeColors && selectedThemeColors.length > 0
                              ? `${selectedThemeColors[0]}40`
                              : 'rgb(229, 231, 235)'}`,
                          }}
                        >
                          <Plus 
                            className="w-8 h-8 transition-colors" 
                            style={{
                              color: selectedThemeColors && selectedThemeColors.length > 0
                                ? selectedThemeColors[0]
                                : 'rgb(156, 163, 175)',
                            }}
                          />
                        </div>
                        <div>
                          <h3 
                            className="font-semibold text-lg mb-1 transition-colors"
                            style={{
                              color: selectedThemeColors && selectedThemeColors.length > 0
                                ? selectedThemeColors[0]
                                : '#1F1F1F',
                            }}
                          >
                            Start Creating
                          </h3>
                          <p 
                            className="text-sm transition-colors"
                            style={{
                              color: selectedThemeColors && selectedThemeColors.length > 2
                                ? selectedThemeColors[2]
                                : '#6B7280',
                            }}
                          >
                            Add elements or use AI to generate
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Button - Purple Gradient */}
      <div className="absolute bottom-6 right-6">
        <Button
          onClick={handleAIButtonClick}
          className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all"
        >
          <Sparkles className="w-10 h-10 animate-pulse" />
        </Button>
      </div>

      {/* AI Chat Box */}
      <AIChatBox
        isExpanded={isAIChatExpanded}
        onClose={handleAIChatClose}
        onTemplateLoad={handleTemplateLoad}
      />
    </div>
  );
}