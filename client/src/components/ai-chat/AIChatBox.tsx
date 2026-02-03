/**
 * AI Chat Box Component (Phase 2.0-2.4 Complete)
 * Advanced AI interface with conversation history
 */

import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { X, PlusCircle, Clock, Edit } from 'lucide-react';
import { Button } from '../ui/button';
import { AIChatState, Template, CategoryChip, PromptSuggestion, Conversation, Message, SmartSuggestion, HistoryItem } from './types';
import { categoryChips } from './categoryChipsData';
import { getPromptsByCategoryId } from './promptSuggestionsData';
import { AIChatInputField } from './AIChatInputField';
import { CategoryChipList } from './CategoryChipList';
import { PromptSuggestionGrid } from './PromptSuggestionGrid';
import { AISuggestionsPanel } from './AISuggestionsPanel';
import { QuickActionsPanel } from './QuickActionsPanel';
import { StylePresetsPanel, StylePreset } from './StylePresetsPanel';
import { ImageUploadPanel } from './ImageUploadPanel';
import { GenerationProgress, GenerationStep } from './GenerationProgress';
import { ResultsVariations, ResultVariation } from './ResultsVariations';
import { ConversationMessages } from './ConversationMessages';
import { ConversationHistoryView } from './ConversationHistoryView';
import { EnhancedSuggestionsPanel } from './EnhancedSuggestionsPanel';
import { ConversationToolbar } from './ConversationToolbar';
import { GenerationProgressBar } from './GenerationProgressBar';
import { getSmartSuggestions } from './smartSuggestionsData';
import { loadTestConversations, clearConversations } from './testConversationsData';
import { generationsApi, extractionsApi, conversationsApi, type ResultVariation as ApiResultVariation } from '../../lib/api';
import { useGenerationWebSocket } from '../../hooks/useGenerationWebSocket';

interface AIChatBoxProps {
  isExpanded: boolean;
  onClose: () => void;
  onTemplateLoad: (template: Template) => void;
}

export function AIChatBox({ isExpanded, onClose, onTemplateLoad }: AIChatBoxProps) {
  const [state, setState] = useState<AIChatState>({
    isExpanded: false,
    inputValue: '',
    selectedTemplate: null,
    selectedCategory: null,
    showCategoryView: false,
    showTemplateDropdown: false,
    isGenerating: false,
    error: null,
    selectedChips: [],
    showPromptGrid: false,
    activeChipId: null,
  });

  // Panel visibility states
  const [showSuggestionsPanel, setShowSuggestionsPanel] = useState(false);
  const [showQuickActionsPanel, setShowQuickActionsPanel] = useState(false);
  const [showStylePresetsPanel, setShowStylePresetsPanel] = useState(false);
  const [showImageUploadPanel, setShowImageUploadPanel] = useState(false);
  
  // Refs for icon buttons (for panel positioning)
  const lightbulbRef = useRef<HTMLButtonElement>(null);
  const zapRef = useRef<HTMLButtonElement>(null);
  const paletteRef = useRef<HTMLButtonElement>(null);
  const paperclipRef = useRef<HTMLButtonElement>(null);
  
  // History and favorites
  const [promptHistory, setPromptHistory] = useState<HistoryItem[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  
  // Generation states
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [resultVariations, setResultVariations] = useState<ResultVariation[]>([]);
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);
  const [currentAiMessageId, setCurrentAiMessageId] = useState<string | null>(null);

  // Conversation history with previews
  const [conversationHistory, setConversationHistory] = useState<Array<{
    id: string;
    type: 'user' | 'ai';
    text: string;
    timestamp: Date;
    previews?: Array<{
      id: string;
      thumbnail: string;
      label: string;
    }>;
  }>>([]);

  // NEW: Conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [showEnhancedSuggestions, setShowEnhancedSuggestions] = useState(false);

  // NEW: History view state
  const [showHistoryView, setShowHistoryView] = useState(false);

  // Property context for smart suggestions (mock data - will come from form)
  const [propertyType] = useState<'residential' | 'commercial' | 'luxury' | 'land'>('residential');
  const [priceRange] = useState<'low' | 'mid' | 'high' | 'luxury'>('mid');

  // Load conversations from LocalStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('ai-chat-conversations');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const conversationsWithDates = parsed.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setConversations(conversationsWithDates);
      } catch (e) {
        console.error('Failed to load conversations:', e);
      }
    }
  }, []);

  // Save conversations to LocalStorage when they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('ai-chat-conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  // Sync with parent isExpanded prop
  useEffect(() => {
    setState((prev) => ({ ...prev, isExpanded }));
  }, [isExpanded]);

  // WebSocket hook for real-time progress updates
  useGenerationWebSocket({
    generationId: currentGenerationId,
    onProgress: (progress) => {
      if (!currentAiMessageId) return;

      const stepLabels = [
        'Analyzing your prompt',
        'Designing layout',
        'Generating content',
        'Applying style',
        'Finalizing design',
      ];

      // Map WebSocket step (0-5) to UI steps (0-4)
      // WebSocket steps: 0=start, 1=analyze, 2=prompt, 3=generate, 4=process, 5=complete
      // UI steps: 0=analyze, 1=layout, 2=content, 3=style, 4=finalize
      let uiStep = 0;
      if (progress.step !== undefined) {
        if (progress.step === 0) uiStep = 0; // Starting
        else if (progress.step === 1) uiStep = 0; // Analyzing
        else if (progress.step === 2) uiStep = 1; // Creating prompt
        else if (progress.step === 3) uiStep = 2; // Generating images
        else if (progress.step === 4) uiStep = 3; // Processing
        else if (progress.step === 5) uiStep = 4; // Finalizing
      }
      uiStep = Math.min(uiStep, stepLabels.length - 1);
      
      const updatedSteps: GenerationStep[] = stepLabels.map((label, idx) => ({
        id: ['analyze', 'layout', 'content', 'style', 'finalize'][idx],
        label,
        status: idx < uiStep ? 'completed' : idx === uiStep ? 'in-progress' : 'pending',
      }));

      setCurrentStep(uiStep);
      setGenerationSteps(updatedSteps);

      // Update conversation message
      setConversationMessages((prev) =>
        prev.map((msg) =>
          msg.id === currentAiMessageId
            ? { ...msg, generationSteps: updatedSteps, currentStep: uiStep }
            : msg
        )
      );

      // Handle completion
      if (progress.status === 'completed') {
        handleGenerationComplete();
      } else if (progress.status === 'failed') {
        handleGenerationFailed(progress.errorMessage || 'Generation failed');
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      // Fallback to polling if WebSocket fails
      if (currentGenerationId) {
        pollStatusFallback(currentGenerationId);
      }
    },
  });

  const handleGenerationComplete = async () => {
    if (!currentGenerationId || !currentAiMessageId) return;

    try {
      // Get variations
      const variations = await generationsApi.getVariations(currentGenerationId);
      
      // Complete all steps
      const completedSteps = generationSteps.map((step) => ({ ...step, status: 'completed' as const }));
      setGenerationSteps(completedSteps);
      setCurrentStep(completedSteps.length - 1);

      // Map API variations to UI format
      const uiVariations: ResultVariation[] = variations.map((v: ApiResultVariation) => ({
        id: v.id,
        previewUrl: v.imageUrl,
        title: v.title,
        description: v.description,
      }));

      setResultVariations(uiVariations);

      // Update AI message with final results
      const finalAiMessage: Message = {
        id: currentAiMessageId,
        type: 'ai',
        content: `Created ${uiVariations.length} design variation${uiVariations.length > 1 ? 's' : ''} for you`,
        timestamp: new Date(),
        isGenerating: false,
        generationSteps: completedSteps,
        resultPreviews: uiVariations.map((v) => ({
          id: v.id,
          thumbnail: v.previewUrl,
          title: v.title,
        })),
      };

      setConversationMessages((prev) =>
        prev.map((msg) => (msg.id === currentAiMessageId ? finalAiMessage : msg))
      );

      // Update conversation in list
      if (currentConversation) {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentConversation.id
              ? {
                  ...conv,
                  messages: conversationMessages.map((msg) =>
                    msg.id === currentAiMessageId ? finalAiMessage : msg
                  ),
                  updatedAt: new Date(),
                }
              : conv
          )
        );
      }

      setState((prev) => ({ ...prev, isGenerating: false, inputValue: '' }));
      setCurrentGenerationId(null);
      setCurrentAiMessageId(null);
    } catch (error: any) {
      console.error('Failed to get variations:', error);
      handleGenerationFailed('Failed to retrieve generated variations');
    }
  };

  const handleGenerationFailed = (errorMessage: string) => {
    if (!currentAiMessageId) return;

    setState((prev) => ({ ...prev, isGenerating: false, error: errorMessage }));
    
    const failedSteps = generationSteps.map((step) => ({
      ...step,
      status: 'pending' as const,
    }));

    setConversationMessages((prev) =>
      prev.map((msg) =>
        msg.id === currentAiMessageId
          ? { ...msg, isGenerating: false, generationSteps: failedSteps }
          : msg
      )
    );

    setCurrentGenerationId(null);
    setCurrentAiMessageId(null);
  };

  // Fallback polling function if WebSocket fails
  const pollStatusFallback = async (generationId: string) => {
    let statusCheckCount = 0;
    const maxStatusChecks = 60;
    let currentStatus = 'processing';

    const poll = async () => {
      while (statusCheckCount < maxStatusChecks && currentStatus === 'processing') {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        statusCheckCount++;

        try {
          const status = await generationsApi.getStatus(generationId);
          currentStatus = status.status;

          if (status.status === 'completed') {
            await handleGenerationComplete();
            break;
          } else if (status.status === 'failed') {
            handleGenerationFailed(status.errorMessage || 'Generation failed');
            break;
          }
        } catch (error: any) {
          console.error('Status check error:', error);
        }
      }
    };

    await poll();
  };

  const handleInputChange = (value: string) => {
    setState((prev) => ({ ...prev, inputValue: value }));
  };

  const handleGenerate = async () => {
    if (!state.inputValue.trim() && state.selectedChips.length === 0) return;

    const promptText = state.inputValue || state.selectedChips.map(c => c.name).join(', ');

    // CREATE USER MESSAGE
    const userMessage: Message = {
      id: `msg-user-${Date.now()}`,
      type: 'user',
      content: promptText,
      timestamp: new Date(),
    };

    // CREATE AI MESSAGE WITH GENERATION STEPS
    const aiMessageId = `msg-ai-${Date.now()}`;
    const steps: GenerationStep[] = [
      { id: 'analyze', label: 'Analyzing your prompt', status: 'in-progress' },
      { id: 'layout', label: 'Designing layout', status: 'pending' },
      { id: 'content', label: 'Generating content', status: 'pending' },
      { id: 'style', label: 'Applying style', status: 'pending' },
      { id: 'finalize', label: 'Finalizing design', status: 'pending' },
    ];

    const aiMessage: Message = {
      id: aiMessageId,
      type: 'ai',
      content: 'Generating your infographic...',
      timestamp: new Date(),
      isGenerating: true,
      generationSteps: steps,
      currentStep: 0,
    };

    // Add messages to conversation - APPEND to existing if available
    if (currentConversation) {
      // Continue existing conversation
      setConversationMessages((prev) => [...prev, userMessage, aiMessage]);
    } else {
      // New conversation
      setConversationMessages([userMessage, aiMessage]);
    }

    // Create or update conversation
    const now = new Date();
    const conversationId = currentConversation?.id || `conv-${Date.now()}`;
    
    if (!currentConversation) {
      const newConversation: Conversation = {
        id: conversationId,
        title: promptText.slice(0, 50) + (promptText.length > 50 ? '...' : ''),
        propertyType,
        priceRange,
        messages: [userMessage, aiMessage],
        createdAt: now,
        updatedAt: now,
        isFavorite: false,
      };
      setConversations((prev) => [newConversation, ...prev]);
      setCurrentConversation(newConversation);
    } else {
      // Update existing conversation with new messages
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: [...conv.messages, userMessage, aiMessage],
                updatedAt: now,
              }
            : conv
        )
      );
    }

    // Start generation process
    setState((prev) => ({ ...prev, isGenerating: true, error: null }));
    setResultVariations([]);
    setSelectedVariationId(null);
    setGenerationSteps(steps);
    setCurrentStep(0);

    try {
      // Call real API to generate infographic
      const generationResult = await generationsApi.generate({
        prompt: promptText,
        conversationId: conversationId,
        variations: 3,
        model: 'ideogram-turbo',
      });

      const generationId = generationResult.id;
      console.log(`🚀 [AIChatBox] Generation started: ${generationId}`);

      // Set generation ID and message ID for WebSocket hook
      setCurrentGenerationId(generationId);
      setCurrentAiMessageId(aiMessageId);

      // WebSocket will handle progress updates via the hook
      // No need to poll anymore!
    } catch (error: any) {
      console.error('Generation error:', error);
      
      // Extract error message from various error formats
      let errorMessage = 'Failed to generate infographic. Please try again.';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (error?.response?.status === 400) {
        errorMessage = error?.response?.data?.message || 'Invalid request. Please check your input.';
      } else if (error?.response?.status === 403) {
        errorMessage = 'Monthly limit reached. Please upgrade your plan or wait until next month.';
      } else if (error?.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later or contact support.';
      }
      
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isGenerating: false,
      }));
      setGenerationSteps([]);
      
      // Update AI message with error
      setConversationMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, isGenerating: false, content: `Error: ${errorMessage}` }
            : msg
        )
      );
    }
  };

  const handleChipClick = (chip: CategoryChip) => {
    const isAlreadySelected = state.selectedChips.some((c) => c.id === chip.id);

    if (isAlreadySelected) {
      setState((prev) => ({
        ...prev,
        selectedChips: prev.selectedChips.filter((c) => c.id !== chip.id),
        showPromptGrid: false,
        activeChipId: null,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        selectedChips: [chip],
        showPromptGrid: true,
        activeChipId: chip.id,
      }));
    }
  };

  const handleRemoveChip = (chipId: string) => {
    setState((prev) => ({
      ...prev,
      selectedChips: prev.selectedChips.filter((c) => c.id !== chipId),
      showPromptGrid: prev.selectedChips.length <= 1 ? false : prev.showPromptGrid,
      activeChipId: prev.selectedChips.length <= 1 ? null : prev.activeChipId,
    }));
  };

  const handleSuggestionClick = (suggestion: PromptSuggestion) => {
    setState((prev) => ({
      ...prev,
      inputValue: suggestion.text,
      showPromptGrid: false,
      activeChipId: null,
    }));
    // Don't auto-generate, let user customize first
  };

  const handleClose = () => {
    setState({
      isExpanded: false,
      inputValue: '',
      selectedTemplate: null,
      selectedCategory: null,
      showCategoryView: false,
      showTemplateDropdown: false,
      isGenerating: false,
      error: null,
      selectedChips: [],
      showPromptGrid: false,
      activeChipId: null,
    });
    setGenerationSteps([]);
    setResultVariations([]);
    setShowSuggestionsPanel(false);
    setShowQuickActionsPanel(false);
    setShowStylePresetsPanel(false);
    setShowImageUploadPanel(false);
    onClose();
  };

  const handlePromptSelect = (prompt: string) => {
    setState((prev) => ({ ...prev, inputValue: prompt }));
  };

  const handleToggleFavorite = (id: string) => {
    setPromptHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };

  const handleRemoveFavorite = (id: string) => {
    setPromptHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isFavorite: false } : item))
    );
  };

  const handleAISuggestionClick = (suggestion: string) => {
    setState((prev) => ({ ...prev, inputValue: suggestion }));
  };

  const handleQuickActionClick = (action: string) => {
    console.log('Quick action:', action);
    // Handle quick actions
  };

  const handleStylePresetClick = (preset: StylePreset) => {
    console.log('Style preset:', preset);
    // Apply style preset to generation
  };

  const handleImageUpload = (imageUrl: string) => {
    console.log('Image uploaded:', imageUrl);
    // Add image to generation context
  };

  const handleRegenerateAll = () => {
    handleGenerate();
  };

  const handleEditVariation = (id: string) => {
    console.log('Edit variation:', id);
    // Open editor with selected variation
  };

  const handleUseVariation = (id: string) => {
    console.log('Use variation:', id);
    // Load variation into canvas
    handleClose();
  };

  // NEW: Conversation handlers
  const handleConversationClick = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      setCurrentConversation(conversation);
      setConversationMessages(conversation.messages);
    }
  };

  const handleDeleteConversation = (conversationId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null);
      setConversationMessages([]);
    }
  };

  const handleToggleConversationFavorite = (conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, isFavorite: !c.isFavorite } : c
      )
    );
  };

  const handleSmartSuggestionClick = (text: string) => {
    setState((prev) => ({ ...prev, inputValue: text }));
  };

  const handleEnhancedSuggestionClick = (suggestion: string) => {
    setState((prev) => ({ ...prev, inputValue: suggestion }));
    setShowEnhancedSuggestions(false);
  };

  const handleBackFromConversation = () => {
    setCurrentConversation(null);
    setConversationMessages([]);
  };

  // NEW: History view handlers
  const handleSelectConversationFromHistory = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setConversationMessages(conversation.messages);
    setShowHistoryView(false); // Close history view and show conversation
  };

  const handleNewChat = () => {
    // Clear all conversation state
    setCurrentConversation(null);
    setConversationMessages([]);
    setResultVariations([]);
    setGenerationSteps([]);
    setState((prev) => ({
      ...prev,
      inputValue: '',
      selectedChips: [],
      showPromptGrid: false,
      activeChipId: null,
      isGenerating: false,
      error: null,
    }));
    setShowHistoryView(false);
  };

  const currentSuggestions = state.activeChipId
    ? getPromptsByCategoryId(state.activeChipId)
    : [];

  const smartSuggestions = getSmartSuggestions(propertyType, priceRange);
  
  // Determine if we should show conversation messages
  const hasActiveConversation = conversationMessages.length > 0;

  // Dynamic height based on state - Always use full height for ChatGPT style
  const shouldExpandHeight = hasActiveConversation || showHistoryView;

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
            duration: 0.5,
          }}
          className="absolute bottom-20 right-6 w-[800px] bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden z-50 flex flex-col max-h-[calc(100vh-140px)]"
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-2 shrink-0 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Real Estate Templates</span>
                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                  Powered by AI ✨
                </span>
              </div>
              <div className="flex items-center gap-1">
                {/* New Chat Icon */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleNewChat}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  title="New Chat"
                >
                  <PlusCircle className="w-4 h-4 text-gray-600" />
                </Button>
                
                {/* History Icon */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowHistoryView(true)}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  title="Chat History"
                >
                  <Clock className="w-4 h-4 text-gray-600" />
                </Button>
                
                {/* Close Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  title="Close"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </Button>
              </div>
            </div>
          </div>

          {/* Conversation Toolbar - Only show during active conversation with results */}
          {hasActiveConversation && resultVariations.length > 0 && selectedVariationId && (
            <div className="shrink-0 px-4 py-2 border-b border-gray-200 bg-gray-50 flex gap-2">
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => handleUseVariation(selectedVariationId)}
              >
                Use This Design
              </Button>
              <Button
                variant="outline"
                onClick={() => handleEditVariation(selectedVariationId)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Customize
              </Button>
            </div>
          )}

          {/* Main Content Area - Scrollable */}
          {showHistoryView ? (
            <div className="flex-1 overflow-y-auto scrollbar-visible">
              <ConversationHistoryView
                conversations={conversations}
                onSelectConversation={handleSelectConversationFromHistory}
                onBack={() => setShowHistoryView(false)}
              />
            </div>
          ) : hasActiveConversation ? (
            /* ChatGPT Style: Conversation + Input */
            <>
              {/* Conversation Messages - Scrollable */}
              <ConversationMessages 
                messages={conversationMessages}
                onBackClick={handleBackFromConversation}
                conversationTitle={currentConversation?.title}
                onRegenerateAll={handleRegenerateAll}
              />

              {/* Progress Bar (Sticky during generation) */}
              <AnimatePresence>
                {state.isGenerating && (
                  <GenerationProgressBar
                    isGenerating={state.isGenerating}
                    currentStep={currentStep}
                    totalSteps={generationSteps.length}
                    message="Generating templates using Real Estate Template Generator..."
                    estimatedTime={45}
                  />
                )}
              </AnimatePresence>

              {/* Input Field - Sticky at bottom */}
              <div className="shrink-0 border-t border-gray-200 bg-white">
                <AIChatInputField
                  value={state.inputValue}
                  onChange={handleInputChange}
                  onGenerate={handleGenerate}
                  selectedChips={state.selectedChips}
                  onRemoveChip={handleRemoveChip}
                  isGenerating={state.isGenerating}
                  onSuggestionsClick={() => setShowSuggestionsPanel(true)}
                  onQuickActionsClick={() => setShowQuickActionsPanel(true)}
                  onStylePresetsClick={() => setShowStylePresetsPanel(true)}
                  onUploadClick={() => setShowImageUploadPanel(true)}
                  lightbulbRef={lightbulbRef}
                  zapRef={zapRef}
                  paletteRef={paletteRef}
                  paperclipRef={paperclipRef}
                  conversationHistory={conversationHistory}
                  propertyType={propertyType}
                  priceRange={priceRange}
                  onMoreSuggestionsClick={() => setShowEnhancedSuggestions(true)}
                />
              </div>
            </>
          ) : (
            /* Default View - Not in active conversation */
            <div className="flex-1 overflow-y-auto scrollbar-visible overflow-x-visible">
              {/* Input Field */}
              <AIChatInputField
                value={state.inputValue}
                onChange={handleInputChange}
                onGenerate={handleGenerate}
                selectedChips={state.selectedChips}
                onRemoveChip={handleRemoveChip}
                isGenerating={state.isGenerating}
                onSuggestionsClick={() => setShowSuggestionsPanel(true)}
                onQuickActionsClick={() => setShowQuickActionsPanel(true)}
                onStylePresetsClick={() => setShowStylePresetsPanel(true)}
                onUploadClick={() => setShowImageUploadPanel(true)}
                lightbulbRef={lightbulbRef}
                zapRef={zapRef}
                paletteRef={paletteRef}
                paperclipRef={paperclipRef}
                conversationHistory={conversationHistory}
                propertyType={propertyType}
                priceRange={priceRange}
                onMoreSuggestionsClick={() => setShowEnhancedSuggestions(true)}
              />

              {/* Category Chips */}
              {!state.isGenerating && resultVariations.length === 0 && state.selectedChips.length === 0 && (
                <CategoryChipList
                  chips={categoryChips}
                  selectedChips={state.selectedChips}
                  onChipClick={handleChipClick}
                />
              )}

              {/* Prompt Suggestion Grid */}
              {!state.isGenerating &&
                resultVariations.length === 0 &&
                state.showPromptGrid &&
                currentSuggestions.length > 0 && (
                  <PromptSuggestionGrid
                    suggestions={currentSuggestions}
                    onSuggestionClick={handleSuggestionClick}
                  />
                )}

              {/* Result Variations */}
              {!state.isGenerating && resultVariations.length > 0 && (
                <ResultsVariations
                  variations={resultVariations}
                  selectedVariationId={selectedVariationId}
                  onSelectVariation={setSelectedVariationId}
                  onRegenerateAll={handleRegenerateAll}
                  onEditVariation={handleEditVariation}
                  onUseVariation={handleUseVariation}
                />
              )}

              {/* Error Message */}
              {state.error && (
                <div className="px-4 pb-3">
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                    {state.error}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Panels */}
          <AISuggestionsPanel
            isOpen={showSuggestionsPanel}
            onClose={() => setShowSuggestionsPanel(false)}
            onSuggestionClick={handleAISuggestionClick}
            buttonRef={lightbulbRef}
          />
          <QuickActionsPanel
            isOpen={showQuickActionsPanel}
            onClose={() => setShowQuickActionsPanel(false)}
            onActionClick={handleQuickActionClick}
            buttonRef={zapRef}
          />
          <StylePresetsPanel
            isOpen={showStylePresetsPanel}
            onClose={() => setShowStylePresetsPanel(false)}
            onPresetClick={handleStylePresetClick}
            buttonRef={paletteRef}
          />
          <ImageUploadPanel
            isOpen={showImageUploadPanel}
            onClose={() => setShowImageUploadPanel(false)}
            onImageUpload={handleImageUpload}
            buttonRef={paperclipRef}
          />
          <EnhancedSuggestionsPanel
            isOpen={showEnhancedSuggestions}
            onClose={() => setShowEnhancedSuggestions(false)}
            onSuggestionClick={handleEnhancedSuggestionClick}
            propertyType={propertyType}
            priceRange={priceRange}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}