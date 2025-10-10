"use client";
import { useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/app/lib/supabaseClient";

type PreviewQuestion = { id?: string | number; question?: string; type?: string };
type PreviewQuiz = { id?: string; quiz?: { title?: string; description?: string; questions?: PreviewQuestion[] } };

type LimitState = {
    blocked: boolean;
    reason?: string;
    monthlyUsed?: number;
    monthlyLimit?: number;
};

export default function QuizPage() {
	const [sourceTab, setSourceTab] = useState<"text" | "url" | "document" | "study-pack" | "3d-quiz">("text");
	const [documentProcessing, setDocumentProcessing] = useState(false);
	const [processedDocument, setProcessedDocument] = useState<any>(null);
	const [studyPackMode, setStudyPackMode] = useState(false);
	const [studyPack, setStudyPack] = useState<any>(null);
	const [activeStudyTab, setActiveStudyTab] = useState<'notes' | 'flashcards' | 'quizzes' | 'revision'>('notes');
	const [aiContent, setAiContent] = useState("");
	const [sourceUrl, setSourceUrl] = useState("");
	const [sourceFile, setSourceFile] = useState<File | null>(null);
	const [aiDifficulty, setAiDifficulty] = useState("medium");
	const [aiCount, setAiCount] = useState(10);
	const [aiTypes, setAiTypes] = useState<string[]>(["multiple_choice", "true_false"]);
    const [aiFocus] = useState("");
    const [aiTopic] = useState("");
    const [enable3DMode, setEnable3DMode] = useState(false);
	const [loading, setLoading] = useState(false);
	const [urlLoading, setUrlLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [previewOpen, setPreviewOpen] = useState(false);
    type PreviewQuiz = { id?: string; quiz?: { title?: string; description?: string; questions?: Array<{ id?: string | number; question?: string; type?: string }>; } };
    const [previewData, setPreviewData] = useState<PreviewQuiz | null>(null);
	const [limits, setLimits] = useState<LimitState | null>(null);

	const characters = useMemo(() => aiContent.length, [aiContent]);

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
			
			// Validate file
			if (!file) {
				throw new Error('No file selected');
			}
			
			// Check file size (max 10MB)
			const maxSize = 10 * 1024 * 1024;
			if (file.size > maxSize) {
				throw new Error('File too large. Maximum size is 10MB.');
			}
			
			// Check file type
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
					errorMessage = errorData.error || errorData.details || errorMessage;
				} catch (e) {
					errorMessage = `HTTP ${response.status}: ${response.statusText}`;
				}
				throw new Error(errorMessage);
			}

			const result = await response.json();
			console.log('Study pack generated successfully:', result);
			
			if (!result.success) {
				throw new Error(result.error || 'Study pack generation failed');
			}
			
			if (!result.studyPack) {
				throw new Error('No study pack data received from server');
			}
			
			setProcessedDocument(result.document);
			setStudyPack(result.studyPack);
			setDocumentProcessing(false);
			
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
            const res = await fetch('/api/usage', { headers: { Authorization: `Bearer ${session.access_token}` } });
            const json = await res.json();
            if (!json?.success) return { blocked: false };
            const monthlyUsed = json.data.monthly_used as number;
            const monthlyLimit = json.data.monthly_limit as number;
            const blocked = typeof monthlyUsed === 'number' && typeof monthlyLimit === 'number' && monthlyUsed >= monthlyLimit;
            return {
                blocked,
                reason: blocked ? `Monthly limit reached (${monthlyUsed}/${monthlyLimit}). Upgrade your plan to continue.` : undefined,
                monthlyUsed,
                monthlyLimit,
            };
        } catch {
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
			form.set("enable_3d_mode", String(enable3DMode));
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
												<div className="mt-4 p-4 bg-blue-500/20 rounded-lg">
													<div className="flex items-center space-x-3">
														<span className="loading loading-spinner loading-sm"></span>
														<span className="text-blue-300">Processing document with AI...</span>
													</div>
												</div>
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
											<label className="text-white font-semibold mb-2 block">Upload Document for Study Pack</label>
											
											{!studyPack ? (
												<div className="space-y-6">
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
														<div className="text-6xl mb-4">📚</div>
														<h3 className="text-xl font-semibold mb-2">Create AI Study Pack</h3>
														<p className="text-gray-400 mb-4">
															Upload your syllabus, textbook, or tutorial materials to generate comprehensive study materials
														</p>
														<button 
															type="button" 
															className="btn btn-primary btn-lg"
															onClick={(e) => {
																e.stopPropagation();
																document.getElementById('study-pack-upload')?.click();
															}}
														>
															Choose Document
														</button>
													</div>
													
													{sourceFile && (
														<div className="p-4 bg-white/5 rounded-lg">
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
														<div className="p-4 bg-blue-500/20 rounded-lg">
															<div className="flex items-center space-x-3">
																<span className="loading loading-spinner loading-sm"></span>
																<span className="text-blue-300">Processing document and generating study pack...</span>
															</div>
														</div>
													)}
													
													<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
														<div className="text-center p-4 bg-white/5 rounded-lg">
															<div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
																<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
																</svg>
															</div>
															<h4 className="font-semibold text-white">Detailed Notes</h4>
															<p className="text-sm text-gray-400">Structured summaries with key concepts</p>
														</div>
														
														<div className="text-center p-4 bg-white/5 rounded-lg">
															<div className="w-12 h-12 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-3">
																<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
																</svg>
															</div>
															<h4 className="font-semibold text-white">Flashcards</h4>
															<p className="text-sm text-gray-400">Q&A cards for active recall</p>
														</div>
														
														<div className="text-center p-4 bg-white/5 rounded-lg">
															<div className="w-12 h-12 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-3">
																<svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
																</svg>
															</div>
															<h4 className="font-semibold text-white">Quiz Packs</h4>
															<p className="text-sm text-gray-400">Multiple choice questions with explanations</p>
														</div>
													</div>
													
													<div className="mt-4 text-center">
														<button
															type="button"
															onClick={() => {
																console.log('Test button clicked');
																const input = document.getElementById('study-pack-upload') as HTMLInputElement;
																console.log('Input element:', input);
																if (input) {
																	input.click();
																	console.log('Input clicked');
																} else {
																	console.error('Input element not found');
																}
															}}
															className="btn btn-sm btn-outline text-gray-400"
														>
															Test File Input
														</button>
													</div>
												</div>
											) : (
												<div className="space-y-6">
													<div className="flex items-center justify-between">
														<h3 className="text-xl font-bold text-white">{studyPack.title}</h3>
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
													
													<div className="flex space-x-4 border-b border-white/20">
														{[
															{ id: 'notes', label: 'Notes', count: studyPack.detailedNotes?.length || 0 },
															{ id: 'flashcards', label: 'Flashcards', count: studyPack.flashcardDeck?.length || 0 },
															{ id: 'quizzes', label: 'Quizzes', count: studyPack.quizBank?.length || 0 },
															{ id: 'revision', label: 'Revision', count: 0 }
														].map((tab) => (
															<button
																key={tab.id}
																onClick={() => setActiveStudyTab(tab.id as any)}
																className={`py-2 px-4 border-b-2 font-medium text-sm ${
																	activeStudyTab === tab.id
																		? 'border-purple-500 text-purple-400'
																		: 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
																}`}
															>
																{tab.label}
																{tab.count > 0 && (
																	<span className="ml-2 bg-white/10 text-white py-0.5 px-2 rounded-full text-xs">
																		{tab.count}
																	</span>
																)}
															</button>
														))}
													</div>
													
													{activeStudyTab === 'notes' && (
														<div className="space-y-4 max-h-96 overflow-y-auto">
															{studyPack.detailedNotes?.map((note: any, index: number) => (
																<div key={note.id || index} className="border border-white/20 rounded-lg p-4">
																	<div className="flex items-center justify-between mb-2">
																		<h4 className="text-lg font-semibold text-white">{note.topic}</h4>
																		<span className={`px-2 py-1 rounded-full text-xs font-medium ${
																			note.level === 'basic' ? 'bg-green-100 text-green-800' :
																			note.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
																			'bg-red-100 text-red-800'
																		}`}>
																			{note.level}
																		</span>
																	</div>
																	<div className="text-gray-300 whitespace-pre-line text-sm">
																		{note.content}
																	</div>
																</div>
															))}
														</div>
													)}
													
													{activeStudyTab === 'flashcards' && (
														<div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
															{studyPack.flashcardDeck?.map((card: any, index: number) => (
																<div key={card.id || index} className="border border-white/20 rounded-lg p-4">
																	<div className="space-y-3">
																		<div className="p-3 bg-blue-500/20 rounded">
																			<h4 className="font-medium text-white mb-1">Question:</h4>
																			<p className="text-gray-300 text-sm">{card.front}</p>
																		</div>
																		<div className="p-3 bg-green-500/20 rounded">
																			<h4 className="font-medium text-white mb-1">Answer:</h4>
																			<p className="text-gray-300 text-sm">{card.back}</p>
																		</div>
																	</div>
																</div>
															))}
														</div>
													)}
													
													{activeStudyTab === 'quizzes' && (
														<div className="space-y-4 max-h-96 overflow-y-auto">
															{studyPack.quizBank?.map((quiz: any, index: number) => (
																<div key={quiz.id || index} className="border border-white/20 rounded-lg p-4">
																	<div className="flex items-center justify-between mb-4">
																		<h4 className="text-lg font-semibold text-white">{quiz.title}</h4>
																		<div className="flex items-center space-x-4 text-sm text-gray-400">
																			<span>{quiz.totalQuestions} questions</span>
																			<span>{quiz.estimatedTime} min</span>
																		</div>
																	</div>
																	<div className="space-y-3">
																		{quiz.questions?.slice(0, 2).map((question: any, qIndex: number) => (
																			<div key={qIndex} className="p-3 bg-white/5 rounded">
																				<h5 className="font-medium text-white mb-2">
																					{qIndex + 1}. {question.question}
																				</h5>
																				<div className="space-y-1">
																					{question.options?.map((option: string, oIndex: number) => (
																						<div key={oIndex} className="flex items-center space-x-2">
																							<span className="text-sm text-gray-400">
																								{String.fromCharCode(65 + oIndex)}.
																							</span>
																							<span className={`text-sm ${
																								oIndex === question.correctAnswer ? 'text-green-400 font-medium' : 'text-gray-300'
																							}`}>
																								{option}
																							</span>
																						</div>
																					))}
																				</div>
																			</div>
																		))}
																		{quiz.questions?.length > 2 && (
																			<p className="text-sm text-gray-500 text-center">
																				... and {quiz.questions.length - 2} more questions
																			</p>
																		)}
																	</div>
																</div>
															))}
														</div>
													)}
													
													{activeStudyTab === 'revision' && (
														<div className="space-y-4">
															<div className="border border-white/20 rounded-lg p-4">
																<h4 className="text-lg font-semibold text-white mb-3">Quick Revision Sheet</h4>
																<div className="prose max-w-none">
																	<pre className="whitespace-pre-wrap text-gray-300 bg-white/5 p-4 rounded text-sm">
																		{studyPack.quickRevisionSheet}
																	</pre>
																</div>
															</div>
															
															<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
																<div className="text-center p-4 bg-blue-500/20 rounded">
																	<div className="text-2xl font-bold text-blue-400">{studyPack.summary?.totalTopics || 0}</div>
																	<div className="text-sm text-gray-400">Topics</div>
																</div>
																<div className="text-center p-4 bg-purple-500/20 rounded">
																	<div className="text-2xl font-bold text-purple-400">{studyPack.summary?.totalFlashcards || 0}</div>
																	<div className="text-sm text-gray-400">Flashcards</div>
																</div>
																<div className="text-center p-4 bg-orange-500/20 rounded">
																	<div className="text-2xl font-bold text-orange-400">{studyPack.summary?.totalQuestions || 0}</div>
																	<div className="text-sm text-gray-400">Questions</div>
																</div>
																<div className="text-center p-4 bg-green-500/20 rounded">
																	<div className="text-2xl font-bold text-green-400">{studyPack.summary?.estimatedStudyTime || 0}h</div>
																	<div className="text-sm text-gray-400">Study Time</div>
																</div>
															</div>
														</div>
													)}
												</div>
											)}
										</div>
									)}


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
										<select value={aiCount} onChange={(e) => setAiCount(Number(e.target.value))} className="select select-bordered w-full bg-white/5 text-white">
											<option value={5}>5 Questions</option>
											<option value={10}>10 Questions</option>
											<option value={15}>15 Questions</option>
											<option value={20}>20 Questions</option>
										</select>
									</div>

									<div className="md:col-span-2">
										<label className="text-white font-semibold mb-2 block">Question Types</label>
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
											<label className="flex items-center p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
												<input type="checkbox" className="checkbox checkbox-sm mr-3" checked={aiTypes.includes("multiple_choice")} onChange={() => toggleType("multiple_choice")} />
												<div>
													<span className="text-white font-medium">Multiple Choice</span>
													<p className="text-gray-400 text-sm">Traditional 4-option questions</p>
												</div>
											</label>
											<label className="flex items-center p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
												<input type="checkbox" className="checkbox checkbox-sm mr-3" checked={aiTypes.includes("true_false")} onChange={() => toggleType("true_false")} />
												<div>
													<span className="text-white font-medium">True/False</span>
													<p className="text-gray-400 text-sm">Simple true or false statements</p>
												</div>
											</label>
											<label className="flex items-center p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
												<input type="checkbox" className="checkbox checkbox-sm mr-3" checked={aiTypes.includes("short_answer")} onChange={() => toggleType("short_answer")} />
												<div>
													<span className="text-white font-medium">Short Answer</span>
													<p className="text-gray-400 text-sm">Open-ended questions</p>
												</div>
											</label>
											<label className="flex items-center p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
												<input type="checkbox" className="checkbox checkbox-sm mr-3" checked={aiTypes.includes("fill_blank")} onChange={() => toggleType("fill_blank")} />
												<div>
													<span className="text-white font-medium">Fill in the Blank</span>
													<p className="text-gray-400 text-sm">Complete the sentence</p>
												</div>
											</label>
										</div>
									</div>

									<div className="md:col-span-2">
										<label className="text-white font-semibold mb-2 block">Interactive Learning</label>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<label className="flex items-center p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
												<input
													type="checkbox"
													checked={enable3DMode}
													onChange={(e) => setEnable3DMode(e.target.checked)}
													className="checkbox checkbox-primary checkbox-lg mr-4"
												/>
												<div className="flex items-center">
													<div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mr-4">
														<i className="fas fa-cube text-white text-xl"></i>
													</div>
													<div>
														<span className="text-white font-medium text-lg">3D Interactive Mode</span>
														<p className="text-gray-400 text-sm">Create immersive 3D scenarios for visual learning</p>
													</div>
												</div>
											</label>
										</div>
									</div>
								</div>
								<div className="divider my-6 opacity-20"></div>

								<div className="mt-2">
									<button 
										disabled={loading || limits?.blocked || (sourceTab === "study-pack" && !studyPack)} 
										onClick={async () => {
											await generateQuiz();
										}} 
										className="btn btn-primary w-full"
									>
										<i className="fas fa-magic mr-2"></i>
										{loading ? (
											urlLoading ? "Extracting content..." : 
											documentProcessing ? (sourceTab === "study-pack" ? "Generating from study pack..." : "Processing document...") : 
											enable3DMode ? "Generating 3D Interactive Quiz..." : "Generating quiz..."
										) : (
											limits?.blocked ? "Limit reached" : 
											sourceTab === "study-pack" && !studyPack ? "Generate Study Pack First" :
											enable3DMode ? "Generate 3D Interactive Quiz" : "Generate Quiz"
										)}
									</button>
                                    {limits && (
										<div className="text-gray-300 text-sm mt-2 text-center">
                                            {typeof limits.monthlyUsed === 'number' && typeof limits.monthlyLimit === 'number' && (
                                                <div>Month: {limits.monthlyUsed}/{limits.monthlyLimit}</div>
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
					</div>
					</div>
					</section>
					<div className={"modal" + (previewOpen ? " modal-open" : "")}>
						<div className="modal-box max-w-5xl bg-white/5 backdrop-blur-xl border border-white/20">
							<div className="flex items-center justify-between mb-4">
								<h3 className="font-bold text-lg text-white">{previewData?.quiz?.title || "Quiz Preview"}</h3>
								{enable3DMode && (
									<div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 px-3 py-1 rounded-full border border-purple-500/30">
										<i className="fas fa-cube text-purple-400"></i>
										<span className="text-purple-300 text-sm font-medium">3D Interactive</span>
									</div>
								)}
							</div>
							{previewData?.quiz?.description && (
								<p className="text-gray-300 mb-4">{previewData.quiz.description}</p>
							)}
							<div id="quizPreviewContent" className="max-h-[60vh] overflow-auto space-y-3 pr-1">
                                {Array.isArray(previewData?.quiz?.questions) && previewData.quiz.questions.length > 0 ? (
                                    previewData.quiz.questions.map((q: PreviewQuestion, idx: number) => (
										<div key={q.id ?? idx} className="bg-white/5 border border-white/10 rounded-xl p-4">
											<div className="flex items-start justify-between gap-3">
												<h4 className="text-white font-semibold">{idx + 1}. {q.question}</h4>
												<div className="flex items-center space-x-2">
													{q.type && <span className="badge badge-outline text-xs text-gray-300">{q.type}</span>}
													{(q as any).scenario && (
														<span className="badge badge-primary text-xs">
															<i className="fas fa-cube mr-1"></i>
															{(q as any).scenario.type}
														</span>
													)}
												</div>
											</div>
											{(q as any).scenario && (
												<div className="mt-3 p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
													<div className="flex items-center space-x-2 mb-2">
														<i className="fas fa-cube text-purple-400"></i>
														<span className="text-purple-300 text-sm font-medium">3D Interactive Scenario</span>
													</div>
													<p className="text-gray-300 text-sm">
														This question includes interactive 3D objects that you can manipulate to find the answer.
														{(q as any).scenario.objects && ` (${(q as any).scenario.objects.length} interactive objects)`}
													</p>
												</div>
											)}
										</div>
									))
								) : (
									<p className="text-gray-300">No questions generated.</p>
								)}
							</div>
							<div className="modal-action">
								<button onClick={() => setPreviewOpen(false)} className="btn btn-outline"><i className="fas fa-edit mr-2"></i>Edit</button>
								<button onClick={() => { 
									if (previewData?.id) { 
										if (enable3DMode) {
											// Open 3D quiz in new tab
											window.open(`/quiz/${previewData.id}?mode=3d`, '_blank');
										} else {
											window.location.href = `/quiz/${previewData.id}`;
										}
									} else { 
										setPreviewOpen(false); 
									} 
								}} className="btn btn-primary">
									<i className={`fas ${enable3DMode ? 'fa-cube' : 'fa-play'} mr-2`}></i>
									{enable3DMode ? 'Start 3D Quiz' : 'Start Quiz'}
								</button>
							</div>
						</div>
						<button className="modal-backdrop" onClick={() => setPreviewOpen(false)}>Close</button>
					</div>
			</main>
		</>
	);
}


