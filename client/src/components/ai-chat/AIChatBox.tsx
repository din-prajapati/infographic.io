/**
 * AI Chat Box Component (Phase 2.0-2.4 Complete)
 * Advanced AI interface with conversation history
 */

import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, PlusCircle, Clock, Edit, LayoutGrid } from "lucide-react";
import { Button } from "../ui/button";
import {
  AIChatState,
  Template,
  CategoryChip,
  PromptSuggestion,
  Conversation,
  Message,
  SmartSuggestion,
  HistoryItem,
} from "./types";
import { categoryChips } from "./categoryChipsData";
import { getPromptsByCategoryId } from "./promptSuggestionsData";
import { categories } from "./templateData";
import { AIChatInputField } from "./AIChatInputField";
import { CategoryChipList } from "./CategoryChipList";
import { PromptSuggestionGrid } from "./PromptSuggestionGrid";
import { TemplateCategoryView } from "./TemplateCategoryView";
import { AISuggestionsPanel } from "./AISuggestionsPanel";
import { ImageUploadPanel } from "./ImageUploadPanel";
import { GenerationProgress, GenerationStep } from "./GenerationProgress";
import { ResultsVariations, ResultVariation } from "./ResultsVariations";
import { ConversationMessages } from "./ConversationMessages";
import { ConversationHistoryView } from "./ConversationHistoryView";
import { EnhancedSuggestionsPanel } from "./EnhancedSuggestionsPanel";
import { GenerationProgressBar } from "./GenerationProgressBar";
import {
  loadTestConversations,
  clearConversations,
} from "./testConversationsData";
import {
  generationsApi,
  extractionsApi,
  conversationsApi,
  paymentsApi,
  type ResultVariation as ApiResultVariation,
} from "../../lib/api";
import { toast } from "sonner";
import {
  InfographicOrientation,
  ImageQualityModel,
} from "../../lib/aiGenerationSettings";
import { useGenerationWebSocket } from "../../hooks/useGenerationWebSocket";
import { useAgentStore } from "../../hooks/useAgentStore";
import { usePropertyStore } from "../../hooks/usePropertyStore";
import { useCanvasStore } from "../../hooks/useCanvasStore";

interface AIChatBoxProps {
  isExpanded: boolean;
  onClose: () => void;
  onTemplateLoad: (template: Template) => void;
}

export function AIChatBox({
  isExpanded,
  onClose,
  onTemplateLoad,
}: AIChatBoxProps) {
  const [state, setState] = useState<AIChatState>({
    isExpanded: false,
    inputValue: "",
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
  const [showImageUploadPanel, setShowImageUploadPanel] = useState(false);
  const [showCategoryBrowse, setShowCategoryBrowse] = useState(false);

  // Refs for icon buttons (for panel positioning)
  const lightbulbRef = useRef<HTMLButtonElement>(null);
  const paperclipRef = useRef<HTMLButtonElement>(null);

  // History and favorites
  const [promptHistory, setPromptHistory] = useState<HistoryItem[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  // Generation states
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [resultVariations, setResultVariations] = useState<ResultVariation[]>(
    [],
  );
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(
    null,
  );
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(
    null,
  );
  const [currentAiMessageId, setCurrentAiMessageId] = useState<string | null>(
    null,
  );
  const [generationOrientation, setGenerationOrientation] =
    useState<InfographicOrientation>("landscape");
  const [generationQualityModel, setGenerationQualityModel] =
    useState<ImageQualityModel>("ideogram-turbo");

  // Conversation history with previews
  const [conversationHistory, setConversationHistory] = useState<
    Array<{
      id: string;
      type: "user" | "ai";
      text: string;
      timestamp: Date;
      previews?: Array<{
        id: string;
        thumbnail: string;
        label: string;
      }>;
    }>
  >([]);

  // NEW: Conversation state — backed by React Query
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => conversationsApi.getAll(),
    select: (data) =>
      data.map((conv) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: (conv.messages ?? []).map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })) as Message[],
      })) as Conversation[],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => conversationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      conversationsApi.update(id, { isFavorite }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>(
    [],
  );
  // Built but intentionally not surfaced — deferred to Phase 2 (EPIC-AI-01
  // conversational core) per 2026-07-07 AI Chat Panel audit. No trigger sets
  // this true yet; that is deliberate, not an oversight.
  const [showEnhancedSuggestions, setShowEnhancedSuggestions] = useState(false);

  // NEW: History view state
  const [showHistoryView, setShowHistoryView] = useState(false);

  // Refs for async callbacks to avoid stale closures
  const generationStepsRef = useRef(generationSteps);
  generationStepsRef.current = generationSteps;
  const conversationMessagesRef = useRef(conversationMessages);
  conversationMessagesRef.current = conversationMessages;
  const currentGenerationIdRef = useRef(currentGenerationId);
  currentGenerationIdRef.current = currentGenerationId;
  const currentAiMessageIdRef = useRef(currentAiMessageId);
  currentAiMessageIdRef.current = currentAiMessageId;
  const currentConversationRef = useRef(currentConversation);
  currentConversationRef.current = currentConversation;
  // Guards against the socket and the REST safety-net poll both processing the
  // same completion (double getVariations). Reset when a new generation starts.
  const completionHandledRef = useRef(false);

  // Agent info from the sidebar Agent Info Form (shared Zustand store)
  const agentInfo = useAgentStore((s) => s.agent);
  // headline from Property Form — empty string means "let AI generate it"
  const propertyHeadline = usePropertyStore((s) => s.property.headline);
  // Brand colors applied in the sidebar Design tab (canvas store)
  const selectedThemeColors = useCanvasStore((s) => s.selectedThemeColors);

  // Property context for smart suggestions (mock data - will come from form)
  const [propertyType] = useState<
    "residential" | "commercial" | "luxury" | "land"
  >("residential");
  const [priceRange] = useState<"low" | "mid" | "high" | "luxury">("mid");

  // Sync with parent isExpanded prop
  useEffect(() => {
    setState((prev) => ({ ...prev, isExpanded }));
  }, [isExpanded]);

  // WebSocket hook for real-time progress updates
  useGenerationWebSocket({
    generationId: currentGenerationId,
    onProgress: (progress) => {
      const aiMsgId = currentAiMessageIdRef.current;
      if (!aiMsgId) return;

      const stepLabels = [
        "Analyzing your prompt",
        "Designing layout",
        "Generating content",
        "Applying style",
        "Finalizing design",
      ];

      // Map WebSocket step (0-5) to UI steps (0-4)
      // Backend steps: 0=start, 1=analyze, 2=prompt, 3=generate, 4=process, 5=complete
      // UI steps:      0=analyze, 1=layout,  2=content, 3=style,   4=finalize
      // Each backend step must map to a DIFFERENT uiStep so the progress bar
      // advances visibly rather than sticking at 0% for the first two phases.
      let uiStep = 0;
      if (progress.step !== undefined) {
        if (progress.step === 0) uiStep = 0;      // start    → Analyzing your prompt
        else if (progress.step === 1) uiStep = 1; // analyze  → Designing layout
        else if (progress.step === 2) uiStep = 2; // prompt   → Generating content
        else if (progress.step === 3) uiStep = 3; // generate → Applying style
        else if (progress.step === 4) uiStep = 4; // process  → Finalizing design
        else if (progress.step === 5) uiStep = 4; // complete → stay at Finalizing
      }
      uiStep = Math.min(uiStep, stepLabels.length - 1);

      const updatedSteps: GenerationStep[] = stepLabels.map((label, idx) => ({
        id: ["analyze", "layout", "content", "style", "finalize"][idx],
        label,
        status:
          idx < uiStep
            ? "completed"
            : idx === uiStep
              ? "in-progress"
              : "pending",
      }));

      setCurrentStep(uiStep);
      setGenerationSteps(updatedSteps);
      // Backend only emits `step` (0-5), never a numeric `progress` field.
      // Derive the percentage from the step so the bar visibly advances.
      // If the backend ever adds a progress field later, prefer it.
      const STEP_TO_PERCENT: Record<number, number> = {
        0: 5,   // start      → show something immediately
        1: 25,  // analyze
        2: 50,  // prompt
        3: 70,  // generate images
        4: 85,  // process
        5: 100, // complete
      };
      if (progress.progress !== undefined) {
        setProgressPercent(progress.progress);
      } else if (progress.step !== undefined) {
        setProgressPercent(STEP_TO_PERCENT[progress.step] ?? 0);
      }

      // Update conversation message
      setConversationMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? { ...msg, generationSteps: updatedSteps, currentStep: uiStep }
            : msg,
        ),
      );

      // Handle completion
      if (progress.status === "completed") {
        handleGenerationComplete();
      } else if (progress.status === "failed") {
        handleGenerationFailed(progress.errorMessage || "Generation failed");
      }
    },
    onError: (error) => {
      // The socket is best-effort for granular progress. Terminal-state delivery
      // is guaranteed by the always-on REST poll below, so a socket error is not
      // itself fatal — just log it. (Historically the poll was started HERE, which
      // meant a socket that connected but silently stopped delivering events — the
      // PT-09 staging failure — never triggered any fallback. See EPIC-AI-07.)
      console.warn("[AIChatBox] WebSocket error (REST poll will still deliver result):", error);
    },
  });

  const handleGenerationComplete = useCallback(async () => {
    const genId = currentGenerationIdRef.current;
    const aiMsgId = currentAiMessageIdRef.current;
    if (!genId || !aiMsgId) return;
    // The socket path and the REST safety-net poll can both observe completion.
    // Whichever arrives first wins; the second is a no-op (guard set synchronously
    // so there's no window for a duplicate getVariations fetch).
    if (completionHandledRef.current) return;
    completionHandledRef.current = true;

    try {
      const variations = await generationsApi.getVariations(genId);

      const completedSteps = generationStepsRef.current.map((step) => ({
        ...step,
        status: "completed" as const,
      }));
      setGenerationSteps(completedSteps);
      setCurrentStep(completedSteps.length - 1);

      const uiVariations: ResultVariation[] = variations.map(
        (v: ApiResultVariation) => ({
          id: v.id,
          previewUrl: v.imageUrl,
          title: v.title,
          description: v.description,
        }),
      );

      setResultVariations(uiVariations);
      if (uiVariations.length > 0) {
        setSelectedVariationId(uiVariations[0].id);
      }

      const finalAiMessage: Message = {
        id: aiMsgId,
        type: "ai",
        content: `Created ${uiVariations.length} design variation${uiVariations.length > 1 ? "s" : ""} for you`,
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
        prev.map((msg) => (msg.id === aiMsgId ? finalAiMessage : msg)),
      );

      // Refresh conversations list and persist the AI message to backend
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      const conv = currentConversationRef.current;
      if (conv && !conv.id.startsWith('conv-')) {
        conversationsApi
          .addMessage(conv.id, { type: 'ai', content: finalAiMessage.content })
          .catch((err) => console.warn('[AIChatBox] Failed to persist AI message:', err));
      }

      setState((prev) => ({ ...prev, isGenerating: false, inputValue: "" }));
      setCurrentGenerationId(null);
      setCurrentAiMessageId(null);
    } catch (error: any) {
      console.error("Failed to get variations:", error);
      handleGenerationFailed("Failed to retrieve generated variations");
    }
  }, []);

  const handleGenerationFailed = useCallback((errorMessage: string) => {
    const aiMsgId = currentAiMessageIdRef.current;
    if (!aiMsgId) return;
    if (completionHandledRef.current) return;
    completionHandledRef.current = true;

    setState((prev) => ({ ...prev, isGenerating: false, error: errorMessage }));

    // Surface the failure in the bubble itself. MessageBubble renders a styled
    // red error bubble when an AI message's content starts with "Error:" — so we
    // rewrite the frozen "Generating your infographic..." placeholder into the
    // actual error and drop the progress steps. Without this the bubble stayed
    // stuck on the generating text (state.error is only shown in the default
    // view, not the conversation view). See I-10 / error-path twin of PT-09.
    setConversationMessages((prev) =>
      prev.map((msg) =>
        msg.id === aiMsgId
          ? {
              ...msg,
              isGenerating: false,
              content: `Error: ${errorMessage}`,
              generationSteps: undefined,
              currentStep: undefined,
            }
          : msg,
      ),
    );

    setCurrentGenerationId(null);
    setCurrentAiMessageId(null);
  }, []);

  // Always-on REST status poll — the reliable terminal-state safety net.
  //
  // The WebSocket is best-effort: on staging it was observed to connect and
  // subscribe successfully but never deliver the `completed` event, then drop
  // silently (PT-09 / EPIC-AI-07). Because the old fallback was gated behind the
  // socket's `onError` (which does NOT fire on silent non-delivery), the UI hung
  // forever. This poll runs whenever a generation is in flight, regardless of
  // socket health, so completion/failure is always delivered.
  //
  // Background-tab resilience: browsers throttle timers in hidden tabs (the
  // headless/backgrounded reproduction of PT-09). A `visibilitychange` listener
  // fires an immediate catch-up poll the moment the tab is refocused, so a user
  // who tabs away while waiting sees their result as soon as they return.
  const checkStatusOnce = useCallback(async (): Promise<"processing" | "done"> => {
    const genId = currentGenerationIdRef.current;
    if (!genId || completionHandledRef.current) return "done";
    try {
      const status = await generationsApi.getStatus(genId);
      if (status.status === "completed") {
        await handleGenerationComplete();
        return "done";
      }
      if (status.status === "failed") {
        handleGenerationFailed(status.errorMessage || "Generation failed");
        return "done";
      }
    } catch (error: any) {
      console.error("[AIChatBox] Status poll error (will retry):", error);
    }
    return "processing";
  }, [handleGenerationComplete, handleGenerationFailed]);

  useEffect(() => {
    if (!currentGenerationId) return;

    let cancelled = false;
    const POLL_INTERVAL_MS = 2500;
    const MAX_POLLS = 80; // ~3.3 min ceiling before giving up

    let polls = 0;
    const intervalId = setInterval(async () => {
      if (cancelled) return;
      polls += 1;
      const result = await checkStatusOnce();
      if (result === "done" || polls >= MAX_POLLS) {
        clearInterval(intervalId);
        // Timed out without a terminal status — surface a styled error rather
        // than leaving the bubble stuck on "Generating..." forever.
        if (result !== "done" && !completionHandledRef.current) {
          handleGenerationFailed(
            "Generation timed out. Please try again — you have not been charged.",
          );
        }
      }
    }, POLL_INTERVAL_MS);

    // Immediate catch-up when the tab regains focus (defeats background throttle).
    const onVisible = () => {
      if (!cancelled && document.visibilityState === "visible") {
        void checkStatusOnce();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [currentGenerationId, checkStatusOnce]);

  const handleInputChange = (value: string) => {
    setState((prev) => ({ ...prev, inputValue: value }));
  };

  /**
   * Validates prompt contains required property fields (address and price)
   * before making any AI API call.
   */
  const validatePromptFields = (
    prompt: string,
  ): { valid: boolean; missing: string[] } => {
    const lower = prompt.toLowerCase();
    const missing: string[] = [];

    // Address detection: street numbers, road types, city/state patterns, or location keywords
    const hasAddress = /\d+\s+\w+\s+(st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|boulevard|way|ct|court|pl|place|cir|circle)\b/i.test(prompt)
      || /\b(in|at|near|located)\s+[\w\s]+,\s*[A-Z]{2}\b/.test(prompt)
      || /\b\d{5}\b/.test(prompt) // ZIP code
      || /\b[A-Z][a-z]+\s*(,\s*[A-Z]{2})\b/.test(prompt); // City, ST

    if (!hasAddress) {
      missing.push('address');
    }

    // Price detection: dollar signs, numbers with k/K/m/M, or "price" keyword with a number
    const hasPrice = /\$[\d,]+/.test(prompt)
      || /\b\d+\s*[kKmM]\b/.test(prompt)
      || /\bpric(e|ed)\s*(at|for|of|:)?\s*\$?[\d,]+/i.test(prompt)
      || /\b(for|at|asking|listed)\s+\$?[\d,]+\s*[kKmM]?\b/i.test(prompt);

    if (!hasPrice) {
      missing.push('price');
    }

    return { valid: missing.length === 0, missing };
  };

  const showMonthlyLimitReached = (
    current: number,
    limit: number,
    planTier?: string,
    descriptionOverride?: string,
  ) => {
    toast.error("Monthly limit reached", {
      description:
        descriptionOverride ??
        `You've used ${current} of ${limit} infographics this month${planTier ? ` on your ${planTier} plan` : ""}. Upgrade to continue generating.`,
      action: {
        label: "View plans",
        onClick: () => {
          window.location.href = "/pricing";
        },
      },
    });
  };

  const isMonthlyLimitMessage = (message: string) => {
    const lower = message.toLowerCase();
    return lower.includes("monthly limit") || lower.includes("limit reached");
  };

  const isNetworkError = (error: unknown) => {
    if (error instanceof TypeError) return true;
    const msg = error instanceof Error ? error.message : String(error);
    const lower = msg.toLowerCase();
    return (
      lower.includes("failed to fetch") ||
      lower.includes("networkerror") ||
      lower.includes("load failed")
    );
  };

  const ensureWithinUsageLimit = async (): Promise<boolean> => {
    const checkQuota = (
      current: number,
      limit: number,
      planTier?: string,
    ): boolean => {
      if (limit <= 0) return true;
      if (current >= limit) {
        showMonthlyLimitReached(current, limit, planTier);
        return false;
      }
      return true;
    };

    // Primary: same source as Account → Billing (the numbers the user already sees)
    try {
      const { usage, subscription } = await paymentsApi.getSubscription();
      const planTier = subscription?.planTier?.toLowerCase() ?? "free";
      return checkQuota(usage?.current ?? 0, usage?.limit ?? 3, planTier);
    } catch (billingError) {
      const billingMsg =
        billingError instanceof Error
          ? billingError.message
          : String(billingError);
      if (isMonthlyLimitMessage(billingMsg)) {
        showMonthlyLimitReached(0, 0, undefined, billingMsg);
        return false;
      }
    }

    // Fallback: dedicated quota endpoint
    try {
      const quota = await generationsApi.getUsageQuota();
      return checkQuota(quota.current, quota.limit, quota.planTier);
    } catch (quotaError) {
      const msg =
        quotaError instanceof Error ? quotaError.message : String(quotaError);
      if (isMonthlyLimitMessage(msg)) {
        showMonthlyLimitReached(0, 0, undefined, msg);
        return false;
      }
      if (isNetworkError(quotaError)) {
        toast.error("Connection problem", {
          description:
            "Couldn't reach the server. Check your internet connection and try again.",
        });
      } else {
        showMonthlyLimitReached(
          0,
          0,
          undefined,
          "Your monthly infographic limit may already be used up. Check Account → Billing, or upgrade your plan to continue.",
        );
      }
      return false;
    }
  };

  const handleGenerate = async () => {
    if (!state.inputValue.trim() && state.selectedChips.length === 0) return;

    const promptText =
      state.inputValue || state.selectedChips.map((c) => c.name).join(", ");

    // --- PRE-VALIDATION: check for required fields before any AI call ---
    const validation = validatePromptFields(promptText);
    if (!validation.valid) {
      // Show user message + friendly validation guidance (no API call)
      const userMessage: Message = {
        id: `msg-user-${Date.now()}`,
        type: "user",
        content: promptText,
        timestamp: new Date(),
      };

      const hintMessage: Message = {
        id: `msg-hint-${Date.now()}`,
        type: "ai",
        content: "I need a bit more detail to generate your infographic.",
        timestamp: new Date(),
        isValidationHint: true,
        missingFields: validation.missing,
      };

      if (currentConversation) {
        setConversationMessages((prev) => [...prev, userMessage, hintMessage]);
      } else {
        setConversationMessages([userMessage, hintMessage]);
      }

      // Clear input and error state since this is a guidance, not an error
      setState((prev) => ({ ...prev, error: null, inputValue: "" }));
      return;
    }

    // --- VALIDATION PASSED: show UI immediately, then check quota ---

    // CREATE USER MESSAGE + AI placeholder now so the UI responds instantly
    const userMessage: Message = {
      id: `msg-user-${Date.now()}`,
      type: "user",
      content: promptText,
      timestamp: new Date(),
    };

    const aiMessageId = `msg-ai-${Date.now()}`;
    const steps: GenerationStep[] = [
      { id: "analyze", label: "Analyzing your prompt", status: "in-progress" },
      { id: "layout", label: "Designing layout", status: "pending" },
      { id: "content", label: "Generating content", status: "pending" },
      { id: "style", label: "Applying style", status: "pending" },
      { id: "finalize", label: "Finalizing design", status: "pending" },
    ];

    const aiMessage: Message = {
      id: aiMessageId,
      type: "ai",
      content: "Generating your infographic...",
      timestamp: new Date(),
      isGenerating: true,
      generationSteps: steps,
      currentStep: 0,
    };

    if (currentConversation) {
      setConversationMessages((prev) => [...prev, userMessage, aiMessage]);
    } else {
      setConversationMessages([userMessage, aiMessage]);
    }

    setState((prev) => ({ ...prev, isGenerating: true, error: null, inputValue: "" }));
    setResultVariations([]);
    setSelectedVariationId(null);
    setGenerationSteps(steps);
    setCurrentStep(0);
    setProgressPercent(0);
    setCurrentAiMessageId(aiMessageId);

    // Now check quota — after UI is already showing progress
    if (!(await ensureWithinUsageLimit())) {
      // Quota exceeded: remove the optimistic messages and reset
      if (currentConversation) {
        setConversationMessages((prev) =>
          prev.filter((m) => m.id !== userMessage.id && m.id !== aiMessageId),
        );
      } else {
        setConversationMessages([]);
      }
      setState((prev) => ({ ...prev, isGenerating: false }));
      setCurrentAiMessageId(null);
      return;
    }

    // Create or update conversation
    const now = new Date();
    let conversationId = currentConversation?.id || "";

    if (!currentConversation) {
      // Create conversation in the database first so the backend has a valid FK
      try {
        const dbConversation = await conversationsApi.create({
          title:
            promptText.slice(0, 50) + (promptText.length > 50 ? "..." : ""),
          propertyType,
          priceRange,
        });
        conversationId = dbConversation.id;
        // Refresh conversations list in sidebar
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      } catch (err) {
        // Fallback to local ID if DB creation fails (e.g. not logged in)
        console.warn(
          "⚠️ [AIChatBox] Failed to create conversation in DB, using local ID:",
          err,
        );
        conversationId = `conv-${Date.now()}`;
      }

      const newConversation: Conversation = {
        id: conversationId,
        title: promptText.slice(0, 50) + (promptText.length > 50 ? "..." : ""),
        propertyType,
        priceRange,
        messages: [userMessage, aiMessage],
        createdAt: now,
        updatedAt: now,
        isFavorite: false,
      };
      setCurrentConversation(newConversation);
    }

    // Persist user message to backend (fire-and-forget; skip local-only conv IDs)
    if (conversationId && !conversationId.startsWith('conv-')) {
      conversationsApi
        .addMessage(conversationId, { type: 'user', content: promptText })
        .catch((err) => console.warn('[AIChatBox] Failed to persist user message:', err));
    }

    try {
      // Merge agent form values + sidebar brand palette into generation request
      const brandColors =
        selectedThemeColors && selectedThemeColors.length > 0
          ? selectedThemeColors
          : agentInfo.brandColors.length > 0
            ? agentInfo.brandColors
            : undefined;

      const generationResult = await generationsApi.generate({
        prompt: promptText,
        conversationId: conversationId,
        variations: 3,
        model: generationQualityModel,
        orientation: generationOrientation,
        // Pass user-written headline if filled in — backend skips LLM call when present
        headline: propertyHeadline.trim() || undefined,
        agent: {
          name: agentInfo.name || undefined,
          brokerage: agentInfo.brokerage || undefined,
          phone: agentInfo.phone || undefined,
          email: agentInfo.email || undefined,
          brandColors,
        },
      });

      const generationId = generationResult.id;
      console.log(`🚀 [AIChatBox] Generation started: ${generationId}`);

      // Arm the terminal-state handlers for this new generation (socket + poll
      // both feed handleGenerationComplete/Failed; the guard lets the first win).
      completionHandledRef.current = false;
      // Set generation ID and message ID — drives both the WebSocket hook and the
      // always-on REST status poll (see the useEffect above).
      setCurrentGenerationId(generationId);
      setCurrentAiMessageId(aiMessageId);

      // WebSocket will handle progress updates via the hook
    } catch (error: any) {
      console.error("Generation error:", error);

      let errorMessage = "Failed to generate infographic. Please try again.";
      let isValidationError = false;

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      // Detect backend validation errors and treat them as guidance
      if (
        errorMessage.toLowerCase().includes("missing required fields") ||
        errorMessage.toLowerCase().includes("please provide")
      ) {
        isValidationError = true;
      } else if (error?.response?.status === 429) {
        errorMessage =
          "Rate limit exceeded. Please wait a moment and try again.";
      } else if (
        error?.response?.status === 403 ||
        errorMessage.toLowerCase().includes("monthly limit")
      ) {
        toast.error("Monthly limit reached", {
          description: errorMessage,
          action: {
            label: "View plans",
            onClick: () => {
              window.location.href = "/pricing";
            },
          },
        });
        errorMessage =
          "Monthly limit reached. Please upgrade your plan or wait until next month.";
      } else if (error?.response?.status >= 500) {
        errorMessage =
          "Server error. Please try again later or contact support.";
      }

      setState((prev) => ({
        ...prev,
        error: isValidationError ? null : errorMessage,
        isGenerating: false,
      }));
      setGenerationSteps([]);

      if (isValidationError) {
        // Show as friendly guidance message, not error
        const missingFromBackend: string[] = [];
        if (errorMessage.toLowerCase().includes("address"))
          missingFromBackend.push("address");
        if (errorMessage.toLowerCase().includes("price"))
          missingFromBackend.push("price");

        setConversationMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? {
                  ...msg,
                  isGenerating: false,
                  content:
                    "I need a bit more detail to generate your infographic.",
                  isValidationHint: true,
                  missingFields:
                    missingFromBackend.length > 0
                      ? missingFromBackend
                      : ["address", "price"],
                }
              : msg,
          ),
        );
      } else {
        // Actual system error
        setConversationMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? {
                  ...msg,
                  isGenerating: false,
                  content: `Error: ${errorMessage}`,
                }
              : msg,
          ),
        );
      }
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
      showPromptGrid:
        prev.selectedChips.length <= 1 ? false : prev.showPromptGrid,
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
    setState(prev => ({
      ...prev,
      inputValue: "",
      selectedTemplate: null,
      selectedCategory: null,
      showCategoryView: false,
      showTemplateDropdown: false,
      isGenerating: false,
      error: null,
      selectedChips: [],
      showPromptGrid: false,
      activeChipId: null,
    }));
    setGenerationSteps([]);
    setResultVariations([]);
    setShowSuggestionsPanel(false);
    setShowImageUploadPanel(false);
    setShowCategoryBrowse(false);
    onClose();
  };

  const handlePromptSelect = (prompt: string) => {
    setState((prev) => ({ ...prev, inputValue: prompt }));
  };

  const handleToggleFavorite = (id: string) => {
    setPromptHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item,
      ),
    );
  };

  const handleRemoveFavorite = (id: string) => {
    setPromptHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFavorite: false } : item,
      ),
    );
  };

  const handleAISuggestionClick = (suggestion: string) => {
    setState((prev) => ({ ...prev, inputValue: suggestion }));
  };

  const handleImageUpload = (imageUrl: string) => {
    console.log("Image uploaded:", imageUrl);
    // Add image to generation context
  };

  const handleRegenerateAll = () => {
    handleGenerate();
  };

  const handleEditVariation = (id: string) => {
    const variation = resultVariations.find((v) => v.id === id);
    if (variation) {
      const template: Template = {
        id: variation.id,
        name: variation.title || "AI Generated Design",
        category: "listing-announcements",
        description: variation.description || "AI-generated infographic design",
        previewImage: variation.previewUrl,
        isAiVariation: true,
        aiOrientation: generationOrientation,
        emoji: "🎨",
      };
      onTemplateLoad(template);
    }
    // Close the panel but keep resultVariations in state so the user can
    // reopen the chat and pick a different variation without re-generating.
    onClose();
  };

  const handleUseVariation = (id: string) => {
    const variation = resultVariations.find((v) => v.id === id);
    if (variation) {
      const template: Template = {
        id: variation.id,
        name: variation.title || "AI Generated Design",
        category: "listing-announcements",
        description: variation.description || "AI-generated infographic design",
        previewImage: variation.previewUrl,
        isAiVariation: true,
        aiOrientation: generationOrientation,
        emoji: "🎨",
      };
      onTemplateLoad(template);
    }
    // Close the panel but keep resultVariations in state so the user can
    // reopen the chat and pick a different variation without re-generating.
    onClose();
  };

  // Shared props for both AIChatInputField instances
  const inputFieldSettings = {
    orientation: generationOrientation,
    qualityModel: generationQualityModel,
    onOrientationChange: setGenerationOrientation,
    onQualityModelChange: setGenerationQualityModel,
  };

  // NEW: Conversation handlers
  const handleConversationClick = async (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      setCurrentConversation(conversation);
      try {
        const msgs = await conversationsApi.getMessages(conversationId);
        setConversationMessages(
          msgs.map((msg) => ({ ...msg, timestamp: new Date(msg.timestamp) })) as Message[],
        );
      } catch (err) {
        console.error('[AIChatBox] Failed to load messages:', err);
        setConversationMessages([]);
      }
    }
  };

  const handleDeleteConversation = (conversationId: string) => {
    deleteMutation.mutate(conversationId);
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null);
      setConversationMessages([]);
    }
  };

  const handleToggleConversationFavorite = (conversationId: string) => {
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) return;
    favoriteMutation.mutate({ id: conversationId, isFavorite: !conv.isFavorite });
  };

  const handleEnhancedSuggestionClick = (suggestion: string) => {
    setState((prev) => ({ ...prev, inputValue: suggestion }));
    setShowEnhancedSuggestions(false);
  };

  const handleCategoryTemplateSelect = (template: Template) => {
    setState((prev) => ({ ...prev, inputValue: `Create a ${template.name} infographic` }));
    setShowCategoryBrowse(false);
  };

  const handleBackFromConversation = () => {
    setCurrentConversation(null);
    setConversationMessages([]);
  };

  // NEW: History view handlers
  const handleSelectConversationFromHistory = async (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setShowHistoryView(false);
    try {
      const msgs = await conversationsApi.getMessages(conversation.id);
      setConversationMessages(
        msgs.map((msg) => ({ ...msg, timestamp: new Date(msg.timestamp) })) as Message[],
      );
    } catch (err) {
      console.error('[AIChatBox] Failed to load messages:', err);
      setConversationMessages([]);
    }
  };

  const handleNewChat = () => {
    // Clear all conversation state
    setCurrentConversation(null);
    setConversationMessages([]);
    setResultVariations([]);
    setGenerationSteps([]);
    setState((prev) => ({
      ...prev,
      inputValue: "",
      selectedChips: [],
      showPromptGrid: false,
      activeChipId: null,
      isGenerating: false,
      error: null,
    }));
    setShowHistoryView(false);
    setShowCategoryBrowse(false);
  };

  const currentSuggestions = state.activeChipId
    ? getPromptsByCategoryId(state.activeChipId)
    : [];

  // Determine if we should show conversation messages
  const hasActiveConversation = conversationMessages.length > 0;

  // Dynamic height based on state - Always use full height for ChatGPT style
  const shouldExpandHeight = hasActiveConversation || showHistoryView;

  return (
    <>
      {isExpanded && (
        <motion.div
          key="ai-chat-panel-shell"
          id="ai-chat-panel"
          role="dialog"
          aria-modal={true}
          aria-label="AI assistant"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute bottom-6 right-[88px] w-[900px] max-w-[calc(100vw-6rem)] bg-background rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] overflow-hidden z-[100] flex flex-col max-h-[calc(100vh-80px)] min-h-0"
        >
          <div className="flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div className="px-4 pt-3 pb-2 shrink-0 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  Real Estate Templates
                </span>
                <span className="text-xs px-2 py-0.5 bg-purple-500/15 text-purple-500 rounded-full">
                  Powered by AI ✨
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleNewChat}
                  className="h-7 w-7 p-0 hover:bg-muted"
                  title="New Chat"
                >
                  <PlusCircle className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowHistoryView(true)}
                  className="h-7 w-7 p-0 hover:bg-muted"
                  title="Chat History"
                >
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClose}
                  className="h-7 w-7 p-0 hover:bg-muted"
                  title="Close"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>


          {/* Main Content Area - Scrollable */}
          {showHistoryView ? (
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-visible">
              <ConversationHistoryView
                conversations={conversations}
                onSelectConversation={handleSelectConversationFromHistory}
                onBack={() => setShowHistoryView(false)}
                onToggleFavorite={handleToggleConversationFavorite}
                onDeleteConversation={handleDeleteConversation}
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
                selectedPreviewId={selectedVariationId}
                onSelectPreview={setSelectedVariationId}
                onUseVariation={handleUseVariation}
              />

              {/* Progress Bar (Sticky during generation) */}
              <AnimatePresence>
                {state.isGenerating && (
                  <GenerationProgressBar
                    isGenerating={state.isGenerating}
                    currentStep={currentStep}
                    totalSteps={generationSteps.length}
                    progressPercent={progressPercent}
                    message={
                      generationSteps.find((s) => s.status === "in-progress")?.label
                      ?? generationSteps[currentStep]?.label
                      ?? "Generating your infographic..."
                    }
                    estimatedTime={45}
                  />
                )}
              </AnimatePresence>

              {/* Input Field - Sticky at bottom */}
              <div className="shrink-0 border-t border-border bg-background">
                <AIChatInputField
                  value={state.inputValue}
                  onChange={handleInputChange}
                  onGenerate={handleGenerate}
                  selectedChips={state.selectedChips}
                  onRemoveChip={handleRemoveChip}
                  isGenerating={state.isGenerating}
                  onSuggestionsClick={() => setShowSuggestionsPanel(true)}
                  onUploadClick={() => setShowImageUploadPanel(true)}
                  lightbulbRef={lightbulbRef}
                  paperclipRef={paperclipRef}
                  {...inputFieldSettings}
                />
              </div>
            </>
          ) : (
            /* Default View — scrollable middle, input pinned bottom so chips stay in reach on short viewports */
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-visible scrollbar-visible">
                {/* Category Chips (above fold before prompt) */}
                {!state.isGenerating &&
                  resultVariations.length === 0 &&
                  state.selectedChips.length === 0 &&
                  !showCategoryBrowse && (
                    <div className="px-4 pt-3 pb-2">
                      <CategoryChipList
                        chips={categoryChips}
                        selectedChips={state.selectedChips}
                        onChipClick={handleChipClick}
                      />
                    </div>
                  )}

                {/* Browse Templates toggle button */}
                {!state.isGenerating && resultVariations.length === 0 && state.selectedChips.length === 0 && (
                  <div className="px-4 pb-2">
                    <button
                      onClick={() => setShowCategoryBrowse((v) => !v)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="browse-templates-toggle"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      {showCategoryBrowse ? 'Hide categories' : 'Browse by category'}
                    </button>
                  </div>
                )}

                {/* Template Category View */}
                {!state.isGenerating &&
                  resultVariations.length === 0 &&
                  showCategoryBrowse && (
                    <TemplateCategoryView
                      categories={categories}
                      onTemplateSelect={handleCategoryTemplateSelect}
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
                    orientation={generationOrientation}
                    onSelectVariation={setSelectedVariationId}
                    onRegenerateAll={handleRegenerateAll}
                    onEditVariation={handleEditVariation}
                    onUseVariation={handleUseVariation}
                  />
                )}

                {/* Error Message - only for system errors, not validation */}
                {state.error && (
                  <div className="px-4 pb-3">
                    <div className="p-2.5 bg-destructive/10 border border-destructive/30 rounded-lg text-xs text-destructive flex items-start gap-2">
                      <span className="shrink-0 mt-0.5">&#9888;</span>
                      <span>{state.error}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="shrink-0 border-t border-border bg-background">
                <AIChatInputField
                  value={state.inputValue}
                  onChange={handleInputChange}
                  onGenerate={handleGenerate}
                  selectedChips={state.selectedChips}
                  onRemoveChip={handleRemoveChip}
                  isGenerating={state.isGenerating}
                  onSuggestionsClick={() => setShowSuggestionsPanel(true)}
                  onUploadClick={() => setShowImageUploadPanel(true)}
                  lightbulbRef={lightbulbRef}
                  paperclipRef={paperclipRef}
                  {...inputFieldSettings}
                />
              </div>
            </div>
          )}

          {/* Panels */}
          <AISuggestionsPanel
            isOpen={showSuggestionsPanel}
            onClose={() => setShowSuggestionsPanel(false)}
            onSuggestionClick={handleAISuggestionClick}
            buttonRef={lightbulbRef}
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
          </div>
        </motion.div>
      )}
    </>
  );
}
