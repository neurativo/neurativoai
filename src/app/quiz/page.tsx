"use client";
import { useMemo, useState, useEffect } from "react";
import { motion } from 'framer-motion';
import { getSupabaseBrowser } from "@/app/lib/supabaseClient";
import { UsageTracker } from "@/lib/usage-tracker";
import { getUserLimits, isQuizTypeAllowed, getMaxQuestionsForPlan } from "@/lib/usage-limits";
import { Loader2, FileText, Brain, Layers, BookOpen, CheckCircle, X } from "lucide-react";
import StudyNotes from "@/app/components/StudyNotes";
import StudyQuizzes from "@/app/components/StudyQuizzes";
import RevisionSheet from "@/app/components/RevisionSheet";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type PreviewQuestion = { id?: string | number; question?: string; type?: string };
type PreviewQuiz = { id?: string; quiz?: { title?: string; description?: string; questions?: PreviewQuestion[] } };

type LimitState = {
    blocked: boolean;
    reason?: string;
    monthlyUsed?: number;
    monthlyLimit?: number;
    dailyUsed?: number;
    dailyLimit?: number;
    plan?: string;
    remainingQuizzes?: {
        daily: number;
        monthly: number;
    };
};

// Enhanced glassmorphism progress bar component
const StudyPackProgressBar = ({ progress }: { progress: { step: number; totalSteps: number; currentStep: string; percentage: number } }) => {
	const steps = [
		{ id: 1, name: 'Uploading Document', icon: FileText, color: 'from-blue-500 to-cyan-500' },
		{ id: 2, name: 'Extracting Text', icon: FileText, color: 'from-cyan-500 to-teal-500' },
		{ id: 3, name: 'Analyzing Content', icon: Brain, color: 'from-teal-500 to-green-500' },
		{ id: 4, name: 'Generating Notes', icon: BookOpen, color: 'from-green-500 to-yellow-500' },
		{ id: 5, name: 'Creating Flashcards', icon: Layers, color: 'from-yellow-500 to-orange-500' },
		{ id: 6, name: 'Finalizing Study Pack', icon: CheckCircle, color: 'from-orange-500 to-red-500' }
	];

	return (
		<div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl mb-8">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-4">
					<div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl">
						<Brain className="w-8 h-8 text-blue-400" />
					</div>
					<div>
						<h3 className="text-2xl font-bold text-white/90">Generating Your Study Pack</h3>
						<p className="text-white/70 text-sm">AI is creating your personalized learning materials</p>
					</div>
				</div>
				<div className="bg-white/5 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
					<span className="text-2xl font-bold text-white">{progress.percentage}%</span>
				</div>
			</div>
			
			{/* Enhanced Progress Bar */}
			<div className="relative w-full bg-white/10 backdrop-blur-sm rounded-full h-4 mb-8 overflow-hidden">
				<motion.div 
					className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
					initial={{ width: 0 }}
					animate={{ width: `${progress.percentage}%` }}
					transition={{ duration: 0.8, ease: "easeOut" }}
				/>
				<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
			</div>
			
			{/* Current Step */}
			<div className="flex items-center gap-4 mb-8">
				{progress.step > 0 ? (
					<div className="p-2 bg-blue-500/20 rounded-xl">
						<Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
					</div>
				) : (
					<div className="w-6 h-6 rounded-full bg-white/20"></div>
				)}
				<div className="bg-white/5 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
					<span className="text-white font-medium">{progress.currentStep}</span>
				</div>
			</div>
			
			{/* Enhanced Step Indicators */}
			<div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
				{steps.map((step) => {
					const Icon = step.icon;
					const isCompleted = progress.step > step.id;
					const isCurrent = progress.step === step.id;
					
					return (
						<motion.div 
							key={step.id} 
							className={`bg-white/5 backdrop-blur-sm rounded-2xl p-4 border transition-all duration-300 ${
								isCompleted 
									? 'border-green-400/50 bg-green-500/10' 
									: isCurrent 
									? 'border-blue-400/50 bg-blue-500/10' 
									: 'border-white/10'
							}`}
							animate={isCurrent ? { scale: 1.05 } : { scale: 1 }}
							transition={{ duration: 0.3 }}
						>
							<div className="flex items-center gap-3">
								<div className={`p-2 rounded-xl ${
									isCompleted 
										? 'bg-green-500/20' 
										: isCurrent 
										? 'bg-blue-500/20' 
										: 'bg-white/10'
								}`}>
									{isCompleted ? (
										<CheckCircle className="w-5 h-5 text-green-400" />
									) : (
										<Icon className={`w-5 h-5 ${isCurrent ? 'text-blue-400' : 'text-white/60'}`} />
									)}
								</div>
								<div>
									<div className={`text-sm font-semibold ${
										isCompleted || isCurrent ? 'text-white' : 'text-white/70'
									}`}>
										{step.name}
									</div>
									{isCurrent && (
										<div className="text-xs text-blue-300">In Progress...</div>
									)}
								</div>
							</div>
						</motion.div>
					);
				})}
			</div>
		</div>
	);
};

export default function QuizPage() {
	const [sourceTab, setSourceTab] = useState<"text" | "url" | "document" | "study-pack" | "3d-quiz">("text");
	const [documentProcessing, setDocumentProcessing] = useState(false);
	const [processedDocument, setProcessedDocument] = useState<any>(null);
	const [studyPackMode, setStudyPackMode] = useState(false);
	const [studyPack, setStudyPack] = useState<any>(null);
	const [generationProgress, setGenerationProgress] = useState({
		step: 0,
		totalSteps: 6,
		currentStep: '',
		percentage: 0
	});
	
	const [aiExplanation, setAiExplanation] = useState<{
		show: boolean;
		title: string;
		content: string;
		isLoading: boolean;
	}>({
		show: false,
		title: '',
		content: '',
		isLoading: false
	});
	const [activeStudyTab, setActiveStudyTab] = useState<'notes' | 'flashcards' | 'quizzes' | 'revision'>('notes');
	const [aiContent, setAiContent] = useState("");
	const [sourceUrl, setSourceUrl] = useState("");
	const [sourceFile, setSourceFile] = useState<File | null>(null);
	const [aiDifficulty, setAiDifficulty] = useState("medium");
	const [aiCount, setAiCount] = useState(10);
	const [aiTypes, setAiTypes] = useState<string[]>(["multiple_choice", "true_false"]);
    const [aiFocus] = useState("");
    const [aiTopic] = useState("");
	const [loading, setLoading] = useState(false);
	const [urlLoading, setUrlLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [previewOpen, setPreviewOpen] = useState(false);
    type PreviewQuiz = { id?: string; quiz?: { title?: string; description?: string; questions?: Array<{ id?: string | number; question?: string; type?: string }>; } };
    const [previewData, setPreviewData] = useState<PreviewQuiz | null>(null);
	const [limits, setLimits] = useState<LimitState | null>(null);
	const [userPlan, setUserPlan] = useState<string>('free');
	const [usageStats, setUsageStats] = useState<any>(null);

	const characters = useMemo(() => aiContent.length, [aiContent]);

	// Progress update function
	const updateProgress = (step: number, currentStep: string) => {
		const percentage = Math.round((step / generationProgress.totalSteps) * 100);
		setGenerationProgress({
			step,
			totalSteps: generationProgress.totalSteps,
			currentStep,
			percentage
		});
	};

	// Reset progress function
	const resetProgress = () => {
		setGenerationProgress({
			step: 0,
			totalSteps: 6,
			currentStep: '',
			percentage: 0
		});
	};

	// Load user plan and usage stats
	useEffect(() => {
		const loadUserData = async () => {
			try {
				const supabase = getSupabaseBrowser();
				const { data: { user } } = await supabase.auth.getUser();
				const { data: { session } } = await supabase.auth.getSession();
				
				if (user) {
					// Get user's plan from subscription API
					try {
						const res = await fetch(`/api/subscriptions?userId=${user.id}`, {
							headers: { Authorization: `Bearer ${session?.access_token}` }
						});
						if (res.ok) {
							const subData = await res.json();
							// The API returns plan data in currentPlan.name
							const planName = subData?.currentPlan?.name?.toLowerCase() || 'free';
							setUserPlan(planName);
						} else {
							setUserPlan('free');
						}
					} catch (error) {
						setUserPlan('free');
					}
					
					// Get usage stats
					const response = await fetch(`/api/user/usage-limits?userId=${user.id}`);
					if (response.ok) {
						const data = await response.json();
						setUsageStats(data);
					}
				}
			} catch (error) {
				console.error('Error loading user data:', error);
			}
		};
		
		loadUserData();
	}, []);

	function toggleType(type: string) {
		setAiTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
	}

	function loadSampleContent() {
		setSourceTab("text");
		setAiContent("Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines. Machine Learning is a subset of AI that focuses on algorithms and statistical models.");
	}

	async function readFileToText(file: File): Promise<string | null> {
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = () => resolve(String(reader.result || ""));
			reader.onerror = () => resolve(null);
			reader.readAsText(file);
		});
	}

	async function processStudyPack(file: File): Promise<void> {
		try {
			console.log('Starting study pack processing for file:', file.name, file.type, file.size);
			setDocumentProcessing(true);
			setError(null);
			
			// Reset and initialize progress
			resetProgress();
			updateProgress(1, 'Uploading Document...');
			
			// Validate file
			if (!file) {
				throw new Error('No file selected');
			}
			
			// Check Vercel function payload limit first (4.5MB)
			const vercelLimit = 4.5 * 1024 * 1024; // 4.5MB Vercel limit
			if (file.size > vercelLimit) {
				const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
				throw new Error(`File too large (${fileSizeMB}MB). Maximum size for direct processing is 4.5MB. Please use a smaller file or contact support for large document processing.`);
			}
			
			// Plan-based file size (fetch from usage API which reflects plan)
			let maxSize = 5 * 1024 * 1024; // default 5MB
			try {
				const supabase = getSupabaseBrowser();
				const { data: { session } } = await supabase.auth.getSession();
				if (session?.access_token) {
					const res = await fetch('/api/usage', { headers: { Authorization: `Bearer ${session.access_token}` } });
					const ujson = await res.json();
					const plan = (ujson?.data?.plan || 'free').toLowerCase();
					const planMaxMb: any = { free: 5, professional: 25, mastery: 50, innovation: 100 };
					maxSize = (planMaxMb[plan] || 5) * 1024 * 1024;
				}
			} catch {}
			if (file.size > maxSize) {
				const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
				const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
				throw new Error(`File too large (${fileSizeMB}MB). Maximum size is ${maxSizeMB}MB for your plan.`);
			}
			
			// Check file type (allow PDF, DOCX, TXT/MD, images)
			const allowedTypes = [
				'application/pdf',
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				'text/plain',
				'text/markdown',
				'image/jpeg',
				'image/png',
				'image/tiff'
			];
			
			if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|txt|md|jpg|jpeg|png|tiff)$/i)) {
				throw new Error('Unsupported file type. Please upload PDF, DOCX, TXT, MD, or image files.');
			}
			
			const formData = new FormData();
			formData.append('file', file);
			formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
			formData.append('subject', 'Study Pack Generation');
			formData.append('course', 'General');
			formData.append('difficulty', aiDifficulty);

			// Update progress - extracting text
			updateProgress(2, 'Extracting text from document...');
			
			console.log('Sending request to /api/upload-document...');
			const response = await fetch('/api/upload-document', {
				method: 'POST',
				body: formData
			});

			console.log('Response status:', response.status);
			
			if (!response.ok) {
				let errorMessage = 'Study pack generation failed';
				try {
					const errorData = await response.json();
					if (response.status === 413) {
						const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
						if (errorData.requiresChunkedProcessing) {
							errorMessage = `File too large (${fileSizeMB}MB). Files larger than ${errorData.maxSize} require special processing. Please use a smaller file or contact support.`;
						} else {
							errorMessage = `File too large (${fileSizeMB}MB). Maximum size is ${errorData.maxSize || '4.5MB'}. Please use a smaller file.`;
						}
					} else {
						errorMessage = errorData.error || errorData.details || errorMessage;
					}
				} catch (e) {
					if (response.status === 413) {
						const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
						errorMessage = `File too large (${fileSizeMB}MB). Maximum size is 4.5MB. Please use a smaller file.`;
					} else {
						errorMessage = `HTTP ${response.status}: ${response.statusText}`;
					}
				}
				throw new Error(errorMessage);
			}

			const result = await response.json();
			console.log('Study pack generated successfully:', result);
			
			if (!result.success) {
				throw new Error(result.error || 'Study pack generation failed');
			}
			
			// Update progress - analyzing content
			updateProgress(3, 'Analyzing content structure...');
			
			// Simulate AI processing steps with progress updates
			setTimeout(() => updateProgress(4, 'Generating detailed notes...'), 1000);
			setTimeout(() => updateProgress(5, 'Creating flashcards...'), 2000);
			setTimeout(() => updateProgress(6, 'Finalizing study pack...'), 3000);
			
			if (!result.studyPack) {
				throw new Error('No study pack data received from server');
			}
			
			console.log('Setting study pack data:', {
				studyPack: result.studyPack,
				notesCount: result.studyPack?.detailedNotes?.length || 0,
				flashcardsCount: result.studyPack?.flashcardDeck?.length || 0,
				quizzesCount: result.studyPack?.quizBank?.length || 0,
				chaptersCount: result.studyPack?.chapters?.length || 0
			});
			
			// Complete progress
			updateProgress(6, 'Study pack generated successfully!');
			
			setProcessedDocument(result.document);
			setStudyPack(result.studyPack);
			
			// Hide progress after a short delay
			setTimeout(() => {
				setDocumentProcessing(false);
			}, 1000);
			
		} catch (error) {
			console.error('Error generating study pack:', error);
			setError(error instanceof Error ? error.message : 'Study pack generation failed');
			setDocumentProcessing(false);
		}
	}

	async function processDocumentForQuiz(file: File): Promise<string | null> {
		try {
			setDocumentProcessing(true);
			setError(null);
			
			// For text files, use the existing method
			if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
				const content = await readFileToText(file);
				setDocumentProcessing(false);
				return content;
			}
			
			// For PDFs, DOCX, and images, use the Study Pack Generator API
			const formData = new FormData();
			formData.append('file', file);
			formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
			formData.append('subject', 'Quiz Generation');
			formData.append('course', 'General');
			formData.append('difficulty', aiDifficulty);

			const response = await fetch('/api/upload-document', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Document processing failed');
			}

			const result = await response.json();
			setProcessedDocument(result.document);
			setStudyPack(result.studyPack);
			
			// Extract content from processed document for quiz generation
			const content = result.document.sections
				.filter((section: any) => section.isExamRelevant)
				.map((section: any) => section.content)
				.join('\n\n');
			
			setDocumentProcessing(false);
			return content;
			
		} catch (error) {
			console.error("Error processing document:", error);
			setError(error instanceof Error ? error.message : 'Document processing failed');
			setDocumentProcessing(false);
			return null;
		}
	}

    async function checkLimits(): Promise<LimitState> {
        const supabase = getSupabaseBrowser();
        const [{ data: { user } }, { data: { session } }] = await Promise.all([
            supabase.auth.getUser(),
            supabase.auth.getSession(),
        ]);
        if (!user || !session?.access_token) {
            return { blocked: true, reason: "Please sign in to generate quizzes" };
        }
        
        try {
            // Use the new usage tracking system
            const quizCheck = await UsageTracker.canUserCreateQuiz(user.id);
            if (!quizCheck.allowed) {
                return {
                    blocked: true,
                    reason: quizCheck.reason,
                    dailyUsed: usageStats?.usage?.dailyQuizzes || 0,
                    dailyLimit: usageStats?.limits?.dailyQuizzes || 0,
                    monthlyUsed: usageStats?.usage?.monthlyQuizzes || 0,
                    monthlyLimit: usageStats?.limits?.monthlyQuizzes || 0,
                    plan: userPlan,
                    remainingQuizzes: {
                        daily: quizCheck.dailyRemaining,
                        monthly: quizCheck.monthlyRemaining
                    }
                };
            }
            
            return {
                blocked: false,
                dailyUsed: usageStats?.usage?.dailyQuizzes || 0,
                dailyLimit: usageStats?.limits?.dailyQuizzes || 0,
                monthlyUsed: usageStats?.usage?.monthlyQuizzes || 0,
                monthlyLimit: usageStats?.limits?.monthlyQuizzes || 0,
                plan: userPlan,
                remainingQuizzes: {
                    daily: quizCheck.dailyRemaining,
                    monthly: quizCheck.monthlyRemaining
                }
            };
        } catch (error) {
            console.error('Error checking limits:', error);
            return { blocked: false };
        }
    }

    async function generateQuiz() {
		// Validation
		if (sourceTab === "text" && (!aiContent || aiContent.trim().length < 10)) {
			setError("Please provide more content (at least 10 characters)");
			return;
		}
        if (sourceTab === "url" && (!sourceUrl || !sourceUrl.startsWith("http"))) {
            setError("Please provide a valid URL starting with http:// or https://");
            return;
        }
        
        // Validate URL format
        if (sourceTab === "url" && sourceUrl) {
            try {
                new URL(sourceUrl);
            } catch {
                setError("Please provide a valid URL format (e.g., https://example.com)");
                return;
            }
        }
		if (sourceTab === "document" && !sourceFile) {
			setError("Please select a document to upload");
			return;
		}
		if (sourceTab === "study-pack" && !studyPack) {
			setError("Please generate a study pack first");
			return;
		}

		// Check quiz type restrictions for free users
		const userLimits = getUserLimits(userPlan);
		const invalidTypes = aiTypes.filter(type => !isQuizTypeAllowed(userPlan, type));
		if (invalidTypes.length > 0) {
			setError(`${invalidTypes.join(', ')} quiz types are not available in your ${userPlan} plan. Upgrade to Professional or higher to access all quiz types.`);
			return;
		}

		// Check question limit
		const maxQuestions = getMaxQuestionsForPlan(userPlan);
		if (aiCount > maxQuestions) {
			setError(`Maximum ${maxQuestions} questions allowed in your ${userPlan} plan. Upgrade to Professional or higher for more questions.`);
			return;
		}

		setLoading(true); 
		setUrlLoading(sourceTab === "url");
		setDocumentProcessing(sourceTab === "document" || sourceTab === "study-pack");
		setError(null);
		try {
			// Client-side limit check before calling API
			const lim = await checkLimits();
			setLimits(lim);
			if (lim.blocked) {
				setError(lim.reason || "Limit reached");
				return;
			}

			const form = new FormData();
			form.set("action", "generate_quiz");
			form.set("num_questions", String(aiCount));
			form.set("difficulty", aiDifficulty);
			form.set("question_types", JSON.stringify(aiTypes));
			form.set("focus_areas", aiFocus);
			form.set("topic", aiTopic);
			// Map study-pack to text since we're providing extracted content
			const apiSource = sourceTab === "study-pack" ? "text" : sourceTab;
			form.set("source", apiSource);

			if (sourceTab === "text") {
				form.set("content", aiContent);
			}
			if (sourceTab === "url") {
				form.set("url", sourceUrl);
			}
			if (sourceTab === "document" && sourceFile) {
				form.set("file_name", sourceFile.name);
				form.set("file_size", String(sourceFile.size));
				form.set("file_type", sourceFile.type);
				
				// Process document using Study Pack Generator
				const content = await processDocumentForQuiz(sourceFile);
				if (content) {
					form.set("content", content);
				} else {
					// If processing failed, we still send the file to the server
					// The server will handle the extraction as fallback
					form.set("file", sourceFile);
				}
			}
			if (sourceTab === "study-pack" && studyPack) {
				// Extract content from study pack for quiz generation
				const content = studyPack.detailedNotes
					?.map((note: any) => note.content)
					.join('\n\n') || '';
				form.set("content", content);
				form.set("file_name", "study_pack_content");
				form.set("file_size", String(content.length));
				form.set("file_type", "text/study-pack");
			}

			// Get the current session token
			const supabase = getSupabaseBrowser();
			const { data: { session } } = await supabase.auth.getSession();
			if (!session?.access_token) {
				setError("Please sign in to generate quizzes");
				return;
			}

			const res = await fetch("/api/quiz", { 
				method: "POST", 
				body: form,
				headers: {
					'Authorization': `Bearer ${session.access_token}`
				}
			});
            const json = await res.json();
			if (!json.success) {
				if (res.status === 401) { setError("Please sign in to generate quizzes"); return; }
				if (res.status === 429) { setError(json.error || "Quiz limit reached. Please upgrade your plan."); return; }
				if (res.status === 413) { setError(json.error || "Request too large."); return; }
				if (res.status === 500) { setError("Server error. Please try again later."); return; }
				throw new Error(json.error || "Failed to generate quiz");
			}
            setPreviewData(json.data);
            // Update limits in UI from API response usage if present
            if (json.usage && typeof json.usage.monthly_used === 'number' && typeof json.usage.monthly_limit === 'number') {
                setLimits({
                    blocked: json.usage.monthly_used >= json.usage.monthly_limit,
                    monthlyUsed: json.usage.monthly_used,
                    monthlyLimit: json.usage.monthly_limit,
                    reason: json.usage.monthly_used >= json.usage.monthly_limit ? `Monthly limit reached (${json.usage.monthly_used}/${json.usage.monthly_limit}).` : undefined,
                });
            }
			setPreviewOpen(true);
        } catch (e: unknown) { 
            const err = e as { name?: string; message?: string } | undefined;
            if (err?.name === 'TypeError' && (err?.message || '').includes('fetch')) {
				setError("Network error. Please check your connection and try again.");
			} else {
                setError(err?.message ?? "Generation failed");
			}
		}
		finally { 
			setLoading(false); 
			setUrlLoading(false);
		}
	}

	return (
		<>
			<main className="relative z-30 pt-16 md:pt-16 pb-20 md:pb-0">
				<section className="py-16">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
						<h1 className="text-4xl md:text-6xl font-bold text-white mb-6">Create Your Quiz</h1>
						<p className="text-xl text-gray-300 max-w-3xl mx-auto">
							Turn any source into a quiz: paste text, provide a public URL, or upload a document.
						</p>
					</div>
				</section>

				<section className="py-8">
					<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="mb-8 flex justify-center">
							<div className="inline-flex items-center gap-1 rounded-xl bg-white/10 backdrop-blur-md p-1 border border-white/20 shadow-[0_8px_32px_rgba(31,38,135,0.17)]">
								<button
									onClick={() => setSourceTab("text")}
									aria-current={sourceTab === "text"}
									className={`px-4 py-2 rounded-lg transition ${sourceTab === "text" ? "bg-white/20 text-white shadow-inner" : "text-gray-300 hover:text-white hover:bg-white/10"}`}
								>
									By Text
								</button>
								<button
									onClick={() => setSourceTab("url")}
									aria-current={sourceTab === "url"}
									className={`px-4 py-2 rounded-lg transition ${sourceTab === "url" ? "bg-white/20 text-white shadow-inner" : "text-gray-300 hover:text-white hover:bg-white/10"}`}
								>
									By URL
								</button>
								<button
									onClick={() => setSourceTab("document")}
									aria-current={sourceTab === "document"}
									className={`px-4 py-2 rounded-lg transition ${sourceTab === "document" ? "bg-white/20 text-white shadow-inner" : "text-gray-300 hover:text-white hover:bg-white/10"}`}
								>
									By Document
								</button>
								<button
									onClick={() => setSourceTab("study-pack")}
									aria-current={sourceTab === "study-pack"}
									className={`px-4 py-2 rounded-lg transition ${sourceTab === "study-pack" ? "bg-white/20 text-white shadow-inner" : "text-gray-300 hover:text-white hover:bg-white/10"}`}
								>
									Study Pack
								</button>
							</div>
						</div>

						<div className="card bg-white/5 backdrop-blur-xl border border-white/20 shadow-xl">
							<div className="card-body">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									{sourceTab === "text" && (
										<div className="md:col-span-2">
											<label className="text-white font-semibold mb-2 block">Content</label>
											<textarea value={aiContent} onChange={(e) => setAiContent(e.target.value)} rows={8} placeholder="Paste your text content here... (e.g., article, notes, textbook chapter, etc.)" className="textarea textarea-bordered w-full bg-white/5 text-white placeholder-gray-400" required />
											<div className="flex flex-col md:flex-row md:justify-between md:items-center mt-2 gap-2">
												<p className="text-gray-400 text-sm">Paste any text content - articles, notes, textbook chapters, documents, etc.</p>
												<button type="button" onClick={loadSampleContent} className="btn btn-sm btn-ghost text-purple-300"><i className="fas fa-lightbulb mr-1"></i>Load Sample</button>
											</div>
										</div>
									)}

									{sourceTab === "url" && (
										<div className="md:col-span-2">
											<label className="text-white font-semibold mb-2 block">Public URL</label>
											<input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} type="url" placeholder="https://example.com/article" className="input input-bordered w-full bg-white/5 text-white placeholder-gray-400" />
                                            <div className="mt-2 space-y-1">
                                                <p className="text-gray-400 text-sm">✅ Supported: Articles, YouTube videos, GitHub repos, Wikipedia, Medium, Dev.to, Stack Overflow, Reddit, News sites, Blogs, Documentation</p>
                                                <p className="text-gray-400 text-sm">⚠️ Note: YouTube videos need captions enabled. PDF extraction is limited. Some sites may block content extraction. If extraction fails, try using the By Text option instead.</p>
                                            </div>
										</div>
									)}

									{sourceTab === "document" && (
										<div className="md:col-span-2">
											<label className="text-white font-semibold mb-2 block">Upload Document</label>
											<div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-purple-400 transition-colors">
												<input
													type="file"
													accept=".pdf,.docx,.txt,.md,.jpg,.jpeg,.png,.tiff"
													onChange={(e) => {
														const file = e.target.files?.[0];
														if (file) {
															setSourceFile(file);
															setError(null);
														}
													}}
													className="hidden"
													id="document-upload"
												/>
												<label htmlFor="document-upload" className="cursor-pointer">
													<div className="text-4xl mb-4">📄</div>
													<h3 className="text-lg font-semibold mb-2">Upload Your Document</h3>
													<p className="text-gray-400 mb-4">
														Supports PDF, DOCX, TXT, MD, and scanned images (JPG, PNG, TIFF)
													</p>
													<button type="button" className="btn btn-primary">
														Choose File
													</button>
												</label>
											</div>
											
											{sourceFile && (
												<div className="mt-4 p-4 bg-white/5 rounded-lg">
													<div className="flex items-center justify-between">
														<div>
															<p className="text-white font-medium">{sourceFile.name}</p>
															<p className="text-gray-400 text-sm">
																{(sourceFile.size / 1024 / 1024).toFixed(2)} MB • {sourceFile.type}
															</p>
														</div>
														<button
															type="button"
															onClick={() => setSourceFile(null)}
															className="btn btn-sm btn-ghost text-red-400"
														>
															Remove
														</button>
													</div>
												</div>
											)}
											
											{documentProcessing && (
												<StudyPackProgressBar progress={generationProgress} />
											)}
											
											{processedDocument && (
												<div className="mt-4 p-4 bg-green-500/20 rounded-lg">
													<div className="flex items-center space-x-3">
														<i className="fas fa-check-circle text-green-400"></i>
														<div>
															<p className="text-green-300 font-medium">Document processed successfully!</p>
															<p className="text-green-400 text-sm">
																{processedDocument.sections?.length || 0} sections extracted • {processedDocument.totalWords || 0} words
															</p>
														</div>
													</div>
												</div>
											)}
											
											<div className="mt-4 space-y-2">
												<p className="text-gray-400 text-sm">✅ <strong>PDF & DOCX:</strong> Full text extraction with structure analysis</p>
												<p className="text-gray-400 text-sm">✅ <strong>Scanned Images:</strong> OCR text recognition for handwritten/printed content</p>
												<p className="text-gray-400 text-sm">✅ <strong>Smart Processing:</strong> AI identifies exam-relevant content and key topics</p>
												<p className="text-gray-400 text-sm">✅ <strong>Quality Quizzes:</strong> Questions generated from the most important concepts</p>
											</div>
										</div>
									)}

									{sourceTab === "study-pack" && (
										<div className="md:col-span-2">
											<div className="mb-6">
												<h2 className="text-2xl font-bold text-white mb-2">AI Study Pack Generator</h2>
												<p className="text-gray-400">Upload documents to generate comprehensive study materials including notes, flashcards, and quizzes</p>
											</div>
											
											{!studyPack ? (
												<div className="space-y-6">
													{/* File Upload Section */}
													<div className="bg-white/5 rounded-xl p-6 border border-white/10">
														<h3 className="text-lg font-semibold text-white mb-4">📚 Upload Your Learning Material</h3>
														<div 
															className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
															onClick={() => document.getElementById('study-pack-upload')?.click()}
														>
															<input
																type="file"
																accept=".pdf,.docx,.txt,.md,.jpg,.jpeg,.png,.tiff"
																onChange={async (e) => {
																	const file = e.target.files?.[0];
																	if (file) {
																		console.log('File selected for study pack:', file.name);
																		setSourceFile(file);
																		setError(null);
																		await processStudyPack(file);
																	}
																}}
																className="hidden"
																id="study-pack-upload"
															/>
															<div className="text-6xl mb-4">📖</div>
															<h4 className="text-xl font-semibold mb-2 text-white">Upload Your Book, Tutorial, or Document</h4>
											<p className="text-gray-400 mb-4">
												Upload PDF textbooks, DOCX documents, TXT files, or images. Our AI will analyze every section and create comprehensive study materials.
											</p>
											<div className="text-sm text-gray-500 mb-4">
												✅ Comprehensive analysis by section<br/>
												✅ Key concepts extraction<br/>
												✅ Professional PDF export<br/>
												⚠️ Maximum file size: 4.5MB for direct processing
											</div>
															<button 
																type="button" 
																className="btn btn-primary btn-lg"
																onClick={(e) => {
																	e.stopPropagation();
																	document.getElementById('study-pack-upload')?.click();
																}}
															>
																📁 Choose File
															</button>
														</div>
														
														{sourceFile && (
															<div className="mt-4 p-4 bg-white/5 rounded-lg">
																<div className="flex items-center justify-between">
																	<div>
																		<p className="text-white font-medium">{sourceFile.name}</p>
																		<p className="text-gray-400 text-sm">
																			{(sourceFile.size / 1024 / 1024).toFixed(2)} MB • {sourceFile.type}
																		</p>
																	</div>
																	<button
																		type="button"
																		onClick={() => {
																			setSourceFile(null);
																			setStudyPack(null);
																		}}
																		className="btn btn-sm btn-ghost text-red-400"
																	>
																		Remove
																	</button>
																</div>
															</div>
														)}
														
														{documentProcessing && (
															<div className="mt-4 p-4 bg-blue-500/20 rounded-lg">
																<div className="flex items-center space-x-3">
																	<span className="loading loading-spinner loading-sm"></span>
																	<span className="text-blue-300">Processing document and generating study pack...</span>
																</div>
															</div>
														)}
													</div>
													
													{/* Features Preview */}
													<div className="bg-white/5 rounded-xl p-6 border border-white/10">
														<h3 className="text-lg font-semibold text-white mb-4">What You'll Get</h3>
														<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
															<div className="text-center p-4 bg-white/5 rounded-lg">
																<div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
																	<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
																	</svg>
																</div>
																<h4 className="font-semibold text-white">Detailed Notes</h4>
																<p className="text-sm text-gray-400">Structured summaries with key concepts and formulas</p>
															</div>
															
															<div className="text-center p-4 bg-white/5 rounded-lg">
																<div className="w-12 h-12 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-3">
																	<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
																	</svg>
																</div>
																<h4 className="font-semibold text-white">Flashcards</h4>
																<p className="text-sm text-gray-400">Q&A cards, cloze deletions, and concept cards</p>
															</div>
															
															<div className="text-center p-4 bg-white/5 rounded-lg">
																<div className="w-12 h-12 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-3">
																	<svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
																	</svg>
																</div>
																<h4 className="font-semibold text-white">Quiz Packs</h4>
																<p className="text-sm text-gray-400">Multiple choice questions with rationales</p>
															</div>
														</div>
													</div>
												</div>
											) : (
												<div className="space-y-6">
						<div className="flex items-center justify-between">
							<h3 className="text-xl font-bold text-white">{studyPack.title}</h3>
							<div className="flex items-center gap-2">
								<button
									onClick={async () => {
										try {
											setError(null);
											// Show loading state
											const button = event?.target as HTMLButtonElement;
											const originalText = button.textContent;
											button.textContent = '📄 Generating PDF...';
											button.disabled = true;
											
											const res = await fetch('/api/study-pack/export', {
												method: 'POST',
												headers: { 'Content-Type': 'application/json' },
												body: JSON.stringify({ studyPack })
											});
											
											if (!res.ok) {
												const errorData = await res.json();
												throw new Error(errorData.details || errorData.error || 'Failed to export PDF');
											}
											
											const blob = await res.blob();
											const url = URL.createObjectURL(blob);
											const a = document.createElement('a');
											a.href = url;
											a.download = `${studyPack.title || 'study-pack'}.pdf`;
											a.click();
											URL.revokeObjectURL(url);
											
											// Show success message
											button.textContent = '✅ PDF Downloaded!';
											setTimeout(() => {
												button.textContent = originalText;
												button.disabled = false;
											}, 2000);
											
										} catch (e) {
											console.error('Export failed:', e);
											setError(`Failed to export PDF: ${e instanceof Error ? e.message : 'Unknown error'}`);
											// Reset button
											const button = event?.target as HTMLButtonElement;
											button.textContent = '📄 Export PDF';
											button.disabled = false;
										}
								}}
								className="btn btn-primary btn-lg text-white font-semibold"
							>
								📄 Export PDF
							</button>
							<button
								onClick={() => {
									setStudyPack(null);
									setSourceFile(null);
									setActiveStudyTab('notes');
								}}
								className="btn btn-sm btn-ghost text-gray-400"
							>
								Upload New Document
							</button>
							</div>
						</div>
													
													<div className="flex flex-wrap gap-1 sm:gap-2 border-b border-white/20 overflow-x-auto">
														{[
															{ id: 'notes', label: 'Notes', icon: BookOpen, count: studyPack.detailedNotes?.length || 0, color: 'blue' },
															{ id: 'flashcards', label: 'Flashcards', icon: Layers, count: studyPack.flashcardDeck?.length || 0, color: 'purple' },
															{ id: 'quizzes', label: 'Quizzes', icon: Brain, count: studyPack.quizBank?.length || 0, color: 'green' },
															{ id: 'revision', label: 'Revision', icon: FileText, count: 0, color: 'orange' }
														].map((tab) => {
															const Icon = tab.icon;
															return (
																<button
																	key={tab.id}
																	onClick={() => setActiveStudyTab(tab.id as any)}
																	className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-sm transition-all duration-200 flex-1 sm:flex-none min-w-0 ${
																		activeStudyTab === tab.id
																			? `border-${tab.color}-500 text-${tab.color}-400 bg-${tab.color}-500/10`
																			: 'border-transparent text-white/70 hover:text-white hover:border-white/30 hover:bg-white/5'
																	}`}
																>
																	<Icon className="w-4 h-4 flex-shrink-0" />
																	<span className="truncate">{tab.label}</span>
																	{tab.count > 0 && (
																		<span className={`ml-1 bg-${tab.color}-500/20 text-${tab.color}-300 py-0.5 px-2 rounded-full text-xs font-medium flex-shrink-0`}>
																			{tab.count}
																		</span>
																	)}
																</button>
															);
														})}
													</div>
													
													{activeStudyTab === 'notes' && (
														<div className="space-y-6">
															<StudyNotes 
																notes={studyPack.detailedNotes || []} 
																onExplainSection={async (note) => {
																	setAiExplanation({
																		show: true,
																		title: note.title,
																		content: '',
																		isLoading: true
																	});
																	
																	try {
																		const response = await fetch('/api/ai-explain', {
																			method: 'POST',
																			headers: { 'Content-Type': 'application/json' },
																			body: JSON.stringify({ note })
																		});
																		
																		if (response.ok) {
																			const { explanation } = await response.json();
																			setAiExplanation(prev => ({
																				...prev,
																				content: explanation,
																				isLoading: false
																			}));
																		} else {
																			setAiExplanation(prev => ({
																				...prev,
																				content: 'Failed to get AI explanation. Please try again.',
																				isLoading: false
																			}));
																		}
																	} catch (error) {
																		console.error('Error getting AI explanation:', error);
																		setAiExplanation(prev => ({
																			...prev,
																			content: 'Error getting AI explanation. Please try again.',
																			isLoading: false
																		}));
																	}
																}}
															/>
														</div>
													)}
													
													{activeStudyTab === 'flashcards' && (
														<div className="space-y-6">
															{/* Chapter Filter */}
															{studyPack.chapters && studyPack.chapters.length > 0 && (
																<div className="flex flex-wrap gap-2 mb-4">
																	<button
																		onClick={() => setActiveStudyTab('flashcards')}
																		className="px-3 py-1 rounded-full text-sm bg-purple-600 text-white"
																	>
																		🎴 All Cards ({studyPack.flashcardDeck?.length || 0})
																	</button>
																	{studyPack.chapters.map((chapter: string, index: number) => (
																		<button
																			key={index}
																			onClick={() => setActiveStudyTab('flashcards')}
																			className="px-3 py-1 rounded-full text-sm bg-gray-700 text-gray-300 hover:bg-gray-600"
																		>
																			{chapter}
																		</button>
																	))}
																</div>
															)}
															
															{studyPack.flashcardDeck?.length > 0 ? (
																<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
																	{studyPack.flashcardDeck.map((card: any, index: number) => (
																		<div key={card.id || index} className="border border-white/20 rounded-lg p-4 hover:border-purple-400/50 transition-colors">
																			<div className="space-y-3">
																				{/* Card Type Badge */}
																				<div className="flex items-center justify-between">
																					<span className={`px-2 py-1 rounded-full text-xs font-medium ${
																						card.type === 'concept' ? 'bg-blue-100 text-blue-800' :
																						card.type === 'qa' ? 'bg-green-100 text-green-800' :
																						card.type === 'cloze' ? 'bg-purple-100 text-purple-800' :
																						'bg-gray-100 text-gray-800'
																					}`}>
																						{card.type === 'concept' ? '📚 CONCEPT' :
																						 card.type === 'qa' ? '❓ Q&A' :
																						 card.type === 'cloze' ? '🔤 CLOZE' :
																						 'CARD'}
																					</span>
																					{card.chapter && (
																						<span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
																							{card.chapter}
																						</span>
																					)}
																				</div>
																				
																				{/* Cloze Card Special Display */}
																				{card.type === 'cloze' ? (
																					<div className="space-y-3">
																						<div className="p-3 bg-purple-500/20 rounded">
																							<h4 className="font-medium text-white mb-1">Fill in the blank:</h4>
																							<p className="text-gray-300 text-sm">{card.front}</p>
																						</div>
																						<div className="p-3 bg-green-500/20 rounded">
																							<h4 className="font-medium text-white mb-1">Answer:</h4>
																							<p className="text-gray-300 text-sm">{card.back}</p>
																						</div>
																					</div>
																				) : (
																					<div className="space-y-3">
																						<div className="p-3 bg-blue-500/20 rounded">
																							<h4 className="font-medium text-white mb-1">
																								{card.type === 'qa' ? 'Question:' : 'Front:'}
																							</h4>
																							<p className="text-gray-300 text-sm">{card.front}</p>
																						</div>
																						<div className="p-3 bg-green-500/20 rounded">
																							<h4 className="font-medium text-white mb-1">
																								{card.type === 'qa' ? 'Answer:' : 'Back:'}
																							</h4>
																							<p className="text-gray-300 text-sm">{card.back}</p>
																						</div>
																					</div>
																				)}
																				
																				{/* Card Metadata */}
																				<div className="flex items-center justify-between text-xs text-gray-400">
																					<span className={`px-2 py-1 rounded ${
																						card.difficulty === 'easy' ? 'bg-green-700 text-green-300' :
																						card.difficulty === 'medium' ? 'bg-yellow-700 text-yellow-300' :
																						'bg-red-700 text-red-300'
																					}`}>
																						{card.difficulty}
																					</span>
																					<span className="px-2 py-1 bg-gray-700 rounded">{card.topic}</span>
																				</div>
																				
																				{/* Tags */}
																				{card.tags && card.tags.length > 0 && (
																					<div className="flex flex-wrap gap-1">
																						{card.tags.map((tag: string, tagIndex: number) => (
																							<span key={tagIndex} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
																								{tag}
																							</span>
																						))}
																					</div>
																				)}
																			</div>
																		</div>
																	))}
																</div>
															) : (
																<div className="text-center py-8 text-gray-400">
																	<div className="text-4xl mb-2">🎴</div>
																	<p>No flashcards generated yet.</p>
																	<p className="text-sm">Upload a document to generate flashcards.</p>
																</div>
															)}
														</div>
													)}
													
													{activeStudyTab === 'quizzes' && (
														<div className="space-y-6">
															<StudyQuizzes 
																quizPacks={studyPack.quizBank || []} 
																onExplainQuestion={async (question) => {
																	setAiExplanation({
																		show: true,
																		title: `Question: ${question.question}`,
																		content: '',
																		isLoading: true
																	});
																	
																	try {
																		const response = await fetch('/api/ai-explain', {
																			method: 'POST',
																			headers: { 'Content-Type': 'application/json' },
																			body: JSON.stringify({ note: { title: question.question, topic: question.topic, content: question.explanation } })
																		});
																		
																		if (response.ok) {
																			const { explanation } = await response.json();
																			setAiExplanation(prev => ({
																				...prev,
																				content: explanation,
																				isLoading: false
																			}));
																		} else {
																			setAiExplanation(prev => ({
																				...prev,
																				content: 'Failed to get AI explanation. Please try again.',
																				isLoading: false
																			}));
																		}
																	} catch (error) {
																		console.error('Error getting AI explanation:', error);
																		setAiExplanation(prev => ({
																			...prev,
																			content: 'Error getting AI explanation. Please try again.',
																			isLoading: false
																		}));
																	}
																}}
															/>
														</div>
													)}
													
													{activeStudyTab === 'revision' && (
														<div className="space-y-6">
															<RevisionSheet 
																content={studyPack.quickRevisionSheet || ''}
																glossary={studyPack.glossary || []}
																chapters={studyPack.chapters || []}
															/>
														</div>
													)}
												</div>
											)}
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Quiz Generation Section - Only for Text, URL, and Document tabs */}
						{sourceTab !== "study-pack" && (
							<div className="mt-8">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<label className="text-white font-semibold mb-2 block">Difficulty Level</label>
										<select value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value)} className="select select-bordered w-full bg-white/5 text-white">
											<option value="easy">Easy</option>
											<option value="medium">Medium</option>
											<option value="hard">Hard</option>
										</select>
									</div>

									<div>
										<label className="text-white font-semibold mb-2 block">Number of Questions</label>
										<select 
											value={aiCount} 
											onChange={(e) => setAiCount(Number(e.target.value))} 
											className="select select-bordered w-full bg-white/5 text-white"
										>
											{Array.from({ length: getMaxQuestionsForPlan(userPlan) }, (_, i) => i + 1).map(num => (
												<option key={num} value={num}>
													{num} Question{num !== 1 ? 's' : ''}
													{num > 10 && userPlan === 'free' && ' (Upgrade for more)'}
												</option>
											))}
										</select>
										{userPlan === 'free' && (
											<p className="text-yellow-300 text-xs mt-1">
												Free plan limited to {getMaxQuestionsForPlan(userPlan)} questions. 
												<a href="/pricing" className="underline ml-1">Upgrade for more</a>
											</p>
										)}
									</div>

									<div className="md:col-span-2">
										<label className="text-white font-semibold mb-2 block">Question Types</label>
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
											{[
												{ type: "multiple_choice", label: "Multiple Choice", description: "Traditional 4-option questions", available: true },
												{ type: "true_false", label: "True/False", description: "Simple true or false statements", available: true },
												{ type: "short_answer", label: "Short Answer", description: "Open-ended questions", available: userPlan !== 'free' },
												{ type: "fill_blank", label: "Fill in the Blank", description: "Complete the sentence", available: userPlan !== 'free' }
											].map(({ type, label, description, available }) => (
												<label 
													key={type}
													className={`flex items-center p-3 rounded-lg border transition-colors ${
														available 
															? 'bg-white/5 border-white/10 hover:bg-white/10' 
															: 'bg-gray-500/10 border-gray-500/20 opacity-60 cursor-not-allowed'
													}`}
												>
													<input 
														type="checkbox" 
														className="checkbox checkbox-sm mr-3" 
														checked={aiTypes.includes(type)} 
														onChange={() => available && toggleType(type)}
														disabled={!available}
													/>
													<div>
														<div className="flex items-center gap-2">
															<span className={`font-medium ${available ? 'text-white' : 'text-gray-400'}`}>
																{label}
															</span>
															{!available && (
																<span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
																	Pro
																</span>
															)}
														</div>
														<p className={`text-sm ${available ? 'text-gray-400' : 'text-gray-500'}`}>
															{description}
														</p>
													</div>
												</label>
											))}
										</div>
										{userPlan === 'free' && (
											<div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
												<p className="text-yellow-300 text-sm">
													💡 Free users can only use Multiple Choice and True/False questions. 
													<a href="/pricing" className="underline ml-1">Upgrade to Professional</a> for all question types.
												</p>
											</div>
										)}
									</div>
								</div>

								<div className="divider my-6 opacity-20"></div>

								<div className="mt-2">
									<button 
										disabled={loading || limits?.blocked} 
										onClick={async () => {
											await generateQuiz();
										}} 
										className="btn btn-primary w-full"
									>
										<i className="fas fa-magic mr-2"></i>
										{loading ? (
											urlLoading ? "Extracting content..." : 
											documentProcessing ? "Processing document..." : 
											"Generating quiz..."
										) : (
											limits?.blocked ? "Limit reached" : 
											"Generate Quiz"
										)}
									</button>
									{limits && (
										<div className="text-gray-300 text-sm mt-2 text-center space-y-1">
											{limits.plan && (
												<div className="text-purple-300 font-medium">
													{limits.plan.charAt(0).toUpperCase() + limits.plan.slice(1)} Plan
												</div>
											)}
											{typeof limits.dailyUsed === 'number' && typeof limits.dailyLimit === 'number' && (
												<div>
													Today: {limits.dailyUsed}/{limits.dailyLimit === -1 ? '∞' : limits.dailyLimit}
													{limits.remainingQuizzes && limits.remainingQuizzes.daily !== -1 && (
														<span className="text-green-400 ml-2">
															({limits.remainingQuizzes.daily} remaining)
														</span>
													)}
												</div>
											)}
											{typeof limits.monthlyUsed === 'number' && typeof limits.monthlyLimit === 'number' && (
												<div>
													Month: {limits.monthlyUsed}/{limits.monthlyLimit === -1 ? '∞' : limits.monthlyLimit}
													{limits.remainingQuizzes && limits.remainingQuizzes.monthly !== -1 && (
														<span className="text-green-400 ml-2">
															({limits.remainingQuizzes.monthly} remaining)
														</span>
													)}
												</div>
											)}
										</div>
									)}
									<div className="text-gray-400 text-sm mt-2 text-center">{characters} characters</div>
									{error && (
										<div className="mt-4 alert alert-error bg-red-500/20 border border-red-500/50 text-red-200">
											<div className="flex items-start justify-between w-full">
												<div className="flex items-start">
													<i className="fas fa-exclamation-triangle text-red-400 mr-2 mt-1"></i>
													<span>{error}</span>
												</div>
												<button onClick={() => setError(null)} className="btn btn-ghost btn-xs text-red-300"><i className="fas fa-times"></i></button>
											</div>
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				</section>
			</main>

			{/* Modal Section */}
			{previewOpen && (
				<div className="modal modal-open">
					<div className="modal-box max-w-5xl bg-white/5 backdrop-blur-xl border border-white/20">
						<h3 className="font-bold text-lg text-white mb-4">{previewData?.quiz?.title || "Quiz Preview"}</h3>
						{previewData?.quiz?.description && (
							<p className="text-gray-300 mb-4">{previewData.quiz.description}</p>
						)}
						<div id="quizPreviewContent" className="max-h-[60vh] overflow-auto space-y-3 pr-1">
							{Array.isArray(previewData?.quiz?.questions) && previewData.quiz.questions.length > 0 ? (
								previewData.quiz.questions.map((q: PreviewQuestion, idx: number) => (
									<div key={q.id ?? idx} className="bg-white/5 border border-white/10 rounded-xl p-4">
										<div className="flex items-start justify-between gap-3">
											<h4 className="text-white font-semibold">{idx + 1}. {q.question}</h4>
											{q.type && <span className="badge badge-outline text-xs text-gray-300">{q.type}</span>}
										</div>
									</div>
								))
							) : (
								<p className="text-gray-300">No questions generated.</p>
							)}
						</div>
						<div className="modal-action">
							<button onClick={() => setPreviewOpen(false)} className="btn btn-outline"><i className="fas fa-edit mr-2"></i>Edit</button>
							<button onClick={async () => { 
								if (previewData?.id) { 
									// Navigate to quiz taking page with secure data loading
									window.location.href = `/quiz/${previewData.id}`;
								} else { 
									setPreviewOpen(false); 
								} 
							}} className="btn btn-primary">
								<i className="fas fa-play mr-2"></i>
								Start Quiz
							</button>
						</div>
					</div>
					<button className="modal-backdrop" onClick={() => setPreviewOpen(false)}>Close</button>
				</div>
			)}

			{/* AI Explanation Modal */}
			{aiExplanation.show && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
					<div className="bg-white/15 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
						{/* Header */}
						<div className="p-8 border-b border-white/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									<div className="p-3 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-2xl shadow-lg">
										<Brain className="w-7 h-7 text-blue-300" />
									</div>
									<div>
										<h3 className="text-2xl font-bold text-white/95">Expert Explanation</h3>
										<p className="text-white/80 text-sm font-medium">{aiExplanation.title}</p>
									</div>
								</div>
								<button
									onClick={() => setAiExplanation(prev => ({ ...prev, show: false }))}
									className="p-3 hover:bg-white/10 rounded-2xl transition-all duration-200 hover:scale-105"
								>
									<X className="w-6 h-6 text-white/80" />
								</button>
							</div>
						</div>
						
						{/* Content */}
						<div className="p-8 overflow-y-auto max-h-[65vh]">
							{aiExplanation.isLoading ? (
								<div className="flex items-center justify-center py-16">
									<div className="text-center">
										<div className="relative">
											<Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-6" />
											<div className="absolute inset-0 w-12 h-12 border-2 border-blue-400/20 rounded-full"></div>
										</div>
										<p className="text-white/80 text-lg font-medium">Analyzing content...</p>
										<p className="text-white/60 text-sm mt-2">Generating expert explanation</p>
									</div>
								</div>
							) : (
								<div className="prose prose-invert max-w-none prose-lg">
									<div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
										<ReactMarkdown remarkPlugins={[remarkGfm]}>
											{aiExplanation.content}
										</ReactMarkdown>
									</div>
								</div>
							)}
						</div>
						
						{/* Footer */}
						<div className="p-8 border-t border-white/20 bg-gradient-to-r from-white/5 to-white/10">
							<div className="flex gap-4">
								<button
									onClick={() => setAiExplanation(prev => ({ ...prev, show: false }))}
									className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm text-blue-200 rounded-2xl hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-400/30 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
								>
									Close
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}


