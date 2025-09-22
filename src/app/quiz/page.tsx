"use client";
import { useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/app/lib/supabaseClient";

type PreviewQuestion = { id?: string | number; question?: string; type?: string };
type PreviewQuiz = { id?: string; quiz?: { title?: string; description?: string; questions?: PreviewQuestion[] } };

export default function QuizPage() {
	const [sourceTab, setSourceTab] = useState<"text" | "url" | "document">("text");
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

		setLoading(true); 
		setUrlLoading(sourceTab === "url");
		setError(null);
		
		try {
			const form = new FormData();
			form.set("action", "generate_quiz");
			form.set("num_questions", String(aiCount));
			form.set("difficulty", aiDifficulty);
			form.set("question_types", JSON.stringify(aiTypes));
			form.set("focus_areas", aiFocus);
			form.set("topic", aiTopic);
			form.set("source", sourceTab);

			if (sourceTab === "text") {
				form.set("content", aiContent);
			}
			if (sourceTab === "url") {
				form.set("url", sourceUrl);
			}
			if (sourceTab === "document" && sourceFile) {
				form.set("file_name", sourceFile.name);
				form.set("file_size", String(sourceFile.size));
				if (sourceFile.type.startsWith("text/") || sourceFile.name.endsWith(".txt") || sourceFile.name.endsWith(".md")) {
					const text = await readFileToText(sourceFile);
					if (text) form.set("content", text);
				}
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
				// Handle specific error cases
				if (res.status === 401) {
					setError("Please sign in to generate quizzes");
					return;
				}
				if (res.status === 429) {
					setError(json.error || "Quiz limit reached. Please upgrade your plan.");
					return;
				}
				if (res.status === 500) {
					setError("Server error. Please try again later.");
					return;
				}
				throw new Error(json.error || "Failed to generate quiz");
			}
			
			setPreviewData(json.data);
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
											<input onChange={(e) => setSourceFile(e.target.files?.[0] || null)} type="file" accept=".txt,.md,.pdf,.doc,.docx" className="file-input file-input-bordered w-full bg-white/5 text-white" />
											<p className="text-gray-400 text-sm mt-2">Text and Markdown will be read in-browser; PDF/Word will be passed to the API.</p>
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
								</div>
								<div className="divider my-6 opacity-20"></div>

								<div className="mt-2">
									<button disabled={loading} onClick={async () => {
										await generateQuiz();
									}} className="btn btn-primary w-full">
										<i className="fas fa-magic mr-2"></i>{loading ? (urlLoading ? "Extracting content..." : "Generating quiz...") : "Generate Quiz"}
									</button>
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
							<h3 className="font-bold text-lg text-white mb-1">{previewData?.quiz?.title || "Quiz Preview"}</h3>
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
								<button onClick={() => { if (previewData?.id) { window.location.href = `/quiz/${previewData.id}`; } else { setPreviewOpen(false); } }} className="btn btn-primary"><i className="fas fa-play mr-2"></i>Start</button>
							</div>
						</div>
						<button className="modal-backdrop" onClick={() => setPreviewOpen(false)}>Close</button>
					</div>
			</main>
		</>
	);
}


