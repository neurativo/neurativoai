import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { URLContentExtractor } from "@/app/lib/urlContentExtractor";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function getSupabaseService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const runtime = 'nodejs';

export async function POST(req: Request) {
	// Basic payload size guard (Vercel default limits apply, this is additional)
	const contentLength = req.headers.get('content-length');
	if (contentLength && Number(contentLength) > 1024 * 200) { // ~200KB
		return new Response(JSON.stringify({ error: 'Request too large' }), { status: 413 });
	}

	const contentType = req.headers.get('content-type') || '';

	// Prefer FormData first (browser sends multipart for file or FormData)
	let formData: FormData | null = null;
	try {
		formData = await req.formData();
	} catch {}

	let body: any = undefined;
	if (!formData || Array.from(formData.keys()).length === 0) {
		// Only parse JSON if no form fields present
		if (contentType.includes('application/json')) {
			try {
				body = await req.json();
			} catch {
				return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
			}
		} else {
			// Neither form nor JSON → bad request
			return NextResponse.json({ success: false, error: 'Unsupported content type' }, { status: 400 });
		}
	}

	const searchParams = new URL(req.url).searchParams;
	const action = (formData?.get("action")?.toString() || body?.action || searchParams.get("action") || "").toString();

	if (action === "test_api" || action === "debug_api") {
		const configured = !!process.env.OPENAI_API_KEY;
		return NextResponse.json({ success: true, data: { api_key_configured: configured, model: MODEL, timestamp: new Date().toISOString() } });
	}

        if (action === "generate_quiz") {
            const source = ((formData?.get("source")?.toString() || body?.source || "text")).toLowerCase();
            const content = (formData?.get("content")?.toString() || body?.content || "");
            const url = (formData?.get("url")?.toString() || body?.url || "");
            
            let finalContent = content;
            let contentTitle = "Quiz Content";
            let sourceType = "text"; // Default to text for limit tracking
            
            // Handle URL content extraction
            if (source === "url" && url) {
                sourceType = "url";
                try {
                    const extractedContent = await URLContentExtractor.extractContent(url);
                    
                    if (extractedContent.error) {
                        return NextResponse.json({ 
                            success: false, 
                            error: `Failed to extract content from URL: ${extractedContent.error}` 
                        }, { status: 400 });
                    }
                    
                    if (!extractedContent.content || extractedContent.content.trim().length < 10) {
                        return NextResponse.json({ 
                            success: false, 
                            error: "No meaningful content found in the URL. Please try a different URL or use text input instead." 
                        }, { status: 400 });
                    }
                    
                    // Clean and summarize content if too long
                    finalContent = URLContentExtractor.cleanContent(extractedContent.content);
                    finalContent = URLContentExtractor.summarizeContent(finalContent, 8000);
                    contentTitle = extractedContent.title;
                    
                } catch (error) {
                    console.error("URL extraction error:", error);
                    return NextResponse.json({ 
                        success: false, 
                        error: `Failed to process URL: ${error instanceof Error ? error.message : 'Unknown error'}` 
                    }, { status: 400 });
                }
            } else if (source === "text") {
                sourceType = "text";
                if (!content || content.trim().length < 10) {
                    return NextResponse.json({ success: false, error: "Please provide more content (at least 10 characters)" }, { status: 400 });
                }
            } else if (source === "document") {
                sourceType = "document";
                if (!content || content.trim().length < 10) {
                    return NextResponse.json({ success: false, error: "Please provide more content (at least 10 characters)" }, { status: 400 });
                }
            } else {
                return NextResponse.json({ success: false, error: "Only 'By Text', 'By URL', and 'By Document' are supported" }, { status: 400 });
            }

		if (!process.env.OPENAI_API_KEY) {
			return NextResponse.json({ success: false, error: "OPENAI_API_KEY is not set" }, { status: 500 });
		}

		// Check user authentication via Authorization header
		const authHeader = req.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
		}

		const token = authHeader.split(' ')[1];
		const supabase = getSupabaseService();
		
		// Check if service role key is configured
		if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
			return NextResponse.json({ success: false, error: "Service role key not configured" }, { status: 500 });
		}
		
		// Verify the JWT token
		const { data: { user }, error: authError } = await supabase.auth.getUser(token);
		
		if (authError) {
			console.error("Auth error:", authError);
			return NextResponse.json({ success: false, error: "Invalid authentication token" }, { status: 401 });
		}
		
		if (!user) {
			return NextResponse.json({ success: false, error: "User not found" }, { status: 401 });
		}

		// Handle document file uploads
		if (source === "document") {
			const file = formData?.get("file") as File;
			if (file) {
				// Use the document analysis API to extract content
				try {
					const docFormData = new FormData();
					docFormData.append('file', file);
					docFormData.append('userId', user.id);
					
					const docResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/document/analyze`, {
						method: 'POST',
						body: docFormData,
					});
					
					if (!docResponse.ok) {
						const errorData = await docResponse.json();
						return NextResponse.json({ 
							success: false, 
							error: `Document processing failed: ${errorData.error || 'Unknown error'}` 
						}, { status: 400 });
					}
					
					const docData = await docResponse.json();
					finalContent = docData.document?.analysis?.summary || 'Document processed successfully';
					contentTitle = docData.document?.fileName || 'Document';
					
					console.log('Document processed successfully:', {
						fileName: docData.document?.fileName,
						pageCount: docData.document?.pageCount,
						wordCount: docData.document?.wordCount
					});
					
				} catch (error) {
					console.error('Document processing error:', error);
					return NextResponse.json({ 
						success: false, 
						error: `Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}` 
					}, { status: 400 });
				}
			}
		}

		// Get user's current plan and usage
		const { data: subscription, error: subError } = await supabase
			.from("subscriptions")
			.select("plan")
			.eq("user_id", user.id)
			.eq("status", "active")
			.single();

		if (subError) {
			console.error("Subscription error:", subError);
		}

		const currentPlan = subscription?.plan || "free";

// Define the plan data type
 type PlanData = {
 	monthly_quiz_generations: number;
 	max_questions_per_quiz: number;
 	daily_quiz_generations?: number; // 👈 allow daily_quiz_generations
 };
  
		// Get comprehensive plan limits
		const { data: planData, error: planError } = await supabase
			.from("plans")
			.select("monthly_quiz_generations, max_questions_per_quiz, url_quiz_limit, text_quiz_limit, document_quiz_limit, daily_quiz_generations")
			.eq("key", currentPlan)
			.single();
  
		if (planError) {
			console.error("Plan error:", planError);
			return NextResponse.json({ success: false, error: "Plan configuration not found" }, { status: 500 });
		}
  
		if (!planData) {
			return NextResponse.json({ success: false, error: "Plan data not found" }, { status: 500 });
		}

		// Get source-specific limits based on source type
		const sourceLimits = {
			url: planData.url_quiz_limit || 5,
			text: planData.text_quiz_limit || 10,
			document: planData.document_quiz_limit || 5
		};
		
		const monthlyLimit = planData.monthly_quiz_generations || 20;
		const dailyLimit = planData.daily_quiz_generations || 5;
		const sourceLimit = sourceLimits[sourceType as keyof typeof sourceLimits] || 5;

		// Enforce plan-based question limit
		const requestedQuestions = Math.max(1, Math.min(20, Number((formData?.get("num_questions") || body?.num_questions || 10))));
		const maxQuestions = planData.max_questions_per_quiz || 8;
		const numQuestions = Math.min(requestedQuestions, maxQuestions);

		const difficulty = ((formData?.get("difficulty")?.toString() || body?.difficulty || "medium")).toLowerCase();
		let types: string[] = [];
		try {
			types = JSON.parse((formData?.get("question_types")?.toString() || body?.question_types || "[]"));
		} catch {}
		const focus = (formData?.get("focus_areas")?.toString() || body?.focus_areas || "");
		const topic = (formData?.get("topic")?.toString() || body?.topic || "");
            const prompt = buildQuizPrompt({ content: finalContent, numQuestions, difficulty, types, focus, topic });

		// Reserve SOURCE-SPECIFIC usage via new RPC user_source_usage_claim
		const { data: sourceClaimData, error: sourceClaimErr } = await supabase.rpc('user_source_usage_claim', {
			p_user_id: user.id,
			p_plan_id: currentPlan,
			p_source_type: sourceType,
			p_source_limit: sourceLimit,
		});
		
		let sourceUsage = { source_used: 0, source_limit: sourceLimit } as { source_used: number; source_limit: number };
		let monthlyUsage = { monthly_used: 0, monthly_limit: monthlyLimit } as { monthly_used: number; monthly_limit: number };
		
		if (sourceClaimErr) {
			console.error('user_source_usage_claim error:', sourceClaimErr);
			// Fallback: proceed without source-specific limits but still check monthly
			try {
				const { data: claimData, error: claimErr } = await supabase.rpc('user_usage_claim', {
					p_user_id: user.id,
					p_plan_id: currentPlan,
					p_plan_limit: monthlyLimit,
				});
				if (claimErr || !claimData) {
					return NextResponse.json({ success: false, error: "Failed to reserve quiz slot" }, { status: 500 });
				}
				const claim = Array.isArray(claimData) ? claimData[0] : claimData;
				if (!claim.allowed) {
					return NextResponse.json({
						success: false,
						error: `Monthly quiz limit reached (${claim.monthly_limit ?? monthlyLimit}/month).`,
						usage: { monthly_used: claim.monthly_used ?? 0, monthly_limit: claim.monthly_limit ?? monthlyLimit }
					}, { status: 429 });
				}
				monthlyUsage = { monthly_used: claim.monthly_used, monthly_limit: claim.monthly_limit };
			} catch (e) {
				console.error('fallback monthly claim failed:', e);
				return NextResponse.json({ success: false, error: "Failed to reserve quiz slot" }, { status: 500 });
			}
		} else {
			const sourceClaim = Array.isArray(sourceClaimData) ? sourceClaimData[0] : sourceClaimData;
			if (!sourceClaim || typeof sourceClaim.allowed !== 'boolean') {
				console.error('user_source_usage_claim invalid response:', sourceClaimData);
				return NextResponse.json({ success: false, error: "Failed to reserve quiz slot" }, { status: 500 });
			}
			
			if (!sourceClaim.allowed) {
				const limitType = sourceType === 'url' ? 'URL' : sourceType === 'text' ? 'Text' : 'Document';
				return NextResponse.json({
					success: false,
					error: `${limitType} quiz limit reached (${sourceClaim.source_used}/${sourceClaim.source_limit}). Try a different source type or upgrade your plan.`,
					usage: { 
						monthly_used: sourceClaim.monthly_used, 
						monthly_limit: sourceClaim.monthly_limit,
						source_used: sourceClaim.source_used,
						source_limit: sourceClaim.source_limit,
						source_type: sourceType
					}
				}, { status: 429 });
			}
			
			sourceUsage = { source_used: sourceClaim.source_used, source_limit: sourceClaim.source_limit };
			monthlyUsage = { monthly_used: sourceClaim.monthly_used, monthly_limit: sourceClaim.monthly_limit };
		}

		// Reserve DAILY SOURCE-SPECIFIC usage via new RPC user_daily_source_usage_claim
		const { data: dailySourceData, error: dailySourceErr } = await supabase.rpc('user_daily_source_usage_claim', {
			p_user_id: user.id,
			p_source_type: sourceType,
			p_daily_limit: dailyLimit,
		});
		
		let dailyUsage: { daily_used?: number; daily_limit?: number } = {};
		if (dailySourceErr) {
			console.error('user_daily_source_usage_claim error:', dailySourceErr);
			// On RPC error, do not block. Dashboard will still display daily usage via API.
		} else {
			const d = Array.isArray(dailySourceData) ? dailySourceData[0] : dailySourceData;
			if (d && typeof d.allowed === 'boolean' && !d.allowed) {
				const limitType = sourceType === 'url' ? 'URL' : sourceType === 'text' ? 'Text' : 'Document';
				return NextResponse.json({
					success: false,
					error: `Daily ${limitType} quiz limit reached (${d.daily_used}/${d.daily_limit}). Try tomorrow or a different source type.`,
					usage: { 
						monthly_used: monthlyUsage.monthly_used, 
						monthly_limit: monthlyUsage.monthly_limit, 
						source_used: sourceUsage.source_used,
						source_limit: sourceUsage.source_limit,
						source_type: sourceType,
						daily_used: d.daily_used ?? 0, 
						daily_limit: d.daily_limit ?? dailyLimit 
					}
				}, { status: 429 });
			}
			if (d && typeof d.daily_used === 'number') {
				dailyUsage = { daily_used: d.daily_used, daily_limit: d.daily_limit ?? dailyLimit };
			}
		}

		try {
			const data = await requestOpenAIWithRetry({
				url: OPENAI_URL,
				apiKey: process.env.OPENAI_API_KEY!,
				payload: {
					model: MODEL,
					messages: [{ role: "user", content: prompt }],
					temperature: 0.7,
					max_tokens: 2000,
				},
				attempts: 3,
				initialDelayMs: 600,
				timeoutMs: 30000,
			});
			const raw = data?.choices?.[0]?.message?.content || "";
			const parsed = extractJson(raw);
			if (!parsed) {
				return NextResponse.json({ success: false, error: "Failed to parse AI response as JSON" }, { status: 502 });
			}

			// Save to database with unique id
			const saved = await saveQuiz(parsed, user.id);
			
			// Return only essential data, not the full quiz content
			const safeResponse = {
				id: saved.id,
				title: saved.title,
				description: saved.description,
				difficulty: saved.difficulty,
				question_count: saved.questions?.length || 0,
				created_at: saved.created_at
			};
			
			// Return comprehensive usage data
			let usagePayload: any = { 
				...monthlyUsage, 
				...sourceUsage, 
				...dailyUsage,
				source_type: sourceType
			};
			return NextResponse.json({ success: true, data: safeResponse, usage: usagePayload });
		} catch (err: any) {
            console.error('API/quiz error:', err);
            return NextResponse.json({ success: false, error: err?.message || "Generation error" }, { status: 500 });
		}
	}

	return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
}

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const action = searchParams.get("action");
	if (action === "debug_api") {
		return NextResponse.json({ success: true, data: { message: "Debug endpoint working", timestamp: new Date().toISOString() } });
	}

	// Fetch quiz by id
	const id = searchParams.get("id");
	if (id) {
		// Verify user authentication
		const supabase = getSupabaseServer();
		const authHeader = req.headers.get('authorization');
		let user = null;
		
		if (authHeader) {
			const token = authHeader.replace('Bearer ', '');
			const { data: { user: authUser } } = await supabase.auth.getUser(token);
			user = authUser;
		}
		
		if (!user) {
			return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
		}
		
		const quiz = await getQuiz(id);
		if (!quiz) return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
		
		// Verify ownership
		if (quiz.user_id !== user.id) {
			return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
		}
		
		return NextResponse.json({ success: true, data: quiz });
	}
	return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
}

function buildQuizPrompt({ content, numQuestions, difficulty, types, focus, topic }: { content: string; numQuestions: number; difficulty: string; types: string[]; focus: string; topic: string; }) {
	const questionTypes = types && types.length ? types.join(", ") : "multiple_choice, true_false";
	const focusText = focus ? `Focus on: ${focus}` : "Cover the main concepts and key points";
	
	// If only one question type is selected, generate only that type
	const typeInstruction = types.length === 1 
		? `Generate ALL ${numQuestions} questions as ${types[0]} type only.`
		: `Distribute the ${numQuestions} questions across these types: ${questionTypes}`;
	
	return `Generate ${numQuestions} quiz questions from the following content.

Content:
${content}

Requirements:
- Difficulty level: ${difficulty}
- Question types: ${questionTypes}
- ${typeInstruction}
- ${focusText}
- Topic: ${topic}

Return ONLY valid JSON matching exactly this shape:
{
  "quiz": {
    "title": "Quiz Title",
    "description": "Brief description",
    "difficulty": "${difficulty}",
    "questions": [
      {
        "id": 1,
        "type": "multiple_choice",
        "question": "Question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct_answer": 0,
        "explanation": "Why this answer is correct",
        "hint": "A helpful hint for this question",
        "wrong_answer_feedback": {
          "0": "Why Option A is incorrect",
          "1": "Why Option B is incorrect", 
          "2": "Why Option C is incorrect",
          "3": "Why Option D is incorrect"
        }
      },
      {
        "id": 2,
        "type": "short_answer",
        "question": "What is the main concept?",
        "correct_answers": ["Expected answer 1", "Expected answer 2", "Alternative phrasing"],
        "explanation": "Why this answer is correct",
        "hint": "Think about the key characteristics",
        "wrong_answer_feedback": "Common mistakes include: confusing with similar concepts, missing key details, or using incorrect terminology. Focus on the core definition and main characteristics."
      },
      {
        "id": 3,
        "type": "true_false",
        "question": "Statement to evaluate",
        "correct_answer": true,
        "explanation": "Why this statement is true/false",
        "hint": "Consider the specific details",
        "wrong_answer_feedback": "If you chose false, you might have misunderstood the concept or missed a key detail. If you chose true, you might have been confused by similar but different concepts."
      },
      {
        "id": 4,
        "type": "fill_blank",
        "question": "Complete the sentence: The main purpose of ___ is to ___.",
        "blanks": [
          {
            "position": 1,
            "correct_answers": ["concept1", "concept2"],
            "hint": "Think about the primary function"
          },
          {
            "position": 2,
            "correct_answers": ["achieve goal", "solve problem"],
            "hint": "Consider the intended outcome"
          }
        ],
        "explanation": "Why these answers are correct",
        "hint": "Focus on the main purpose and benefits",
        "wrong_answer_feedback": "Common mistakes include: using incorrect terminology, missing the main purpose, or confusing with related but different concepts. Focus on the core function and intended outcome."
      }
    ]
  }
}

Question Type Guidelines:
- multiple_choice: 4 options, one correct answer
- short_answer: Accept multiple correct phrasings
- true_false: Simple true/false statements
- fill_blank: Multiple blanks with specific correct answers
- Always include explanation and hint for each question
- Make hints helpful but not giving away the answer
- Ensure explanations are educational and detailed`;
}

function extractJson(text: string): any | null {
	try {
		const start = text.indexOf("{");
		const end = text.lastIndexOf("}");
		if (start === -1 || end === -1) return null;
		return JSON.parse(text.slice(start, end + 1));
	} catch {
		return null;
	}
}

async function requestOpenAIWithRetry({ url, apiKey, payload, attempts, initialDelayMs, timeoutMs }: { url: string; apiKey: string; payload: any; attempts: number; initialDelayMs: number; timeoutMs: number; }) {
	let errorText = "";
	for (let i = 0; i < attempts; i++) {
		try {
			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(), timeoutMs);
			const res = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
				body: JSON.stringify(payload),
				signal: controller.signal,
			});
			clearTimeout(timer);
			if (res.ok) return await res.json();
			// Read text once for diagnostics
			errorText = await res.text();
			// Retry on transient 5xx (including 520/522 via Cloudflare)
			if (res.status >= 500) {
				await new Promise(r => setTimeout(r, initialDelayMs * Math.pow(2, i)));
				continue;
			}
			throw new Error(`OpenAI HTTP ${res.status}: ${errorText || res.statusText}`);
		} catch (err: any) {
			// AbortError or network errors: retry
			if (i < attempts - 1) {
				await new Promise(r => setTimeout(r, initialDelayMs * Math.pow(2, i)));
				continue;
			}
			throw new Error(err?.message || errorText || "OpenAI request failed");
		}
	}
	throw new Error(errorText || "OpenAI request failed after retries");
}

// Database storage for quizzes
type SavedQuiz = { id: string; quiz: any; metadata: any };

// Fallback in-memory store for when database is not available
const memoryStore = new Map<string, SavedQuiz>();

async function saveQuiz(parsed: any, userId: string): Promise<SavedQuiz> {
	const id = `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
	const saved = {
		id,
		quiz: parsed.quiz,
		metadata: { ...(parsed.metadata || {}), id, generated_at: new Date().toISOString() },
	};
	
	// Try to save to Supabase first
	const supabase = getSupabaseService();
	const { error } = await supabase
		.from('quizzes')
		.insert({
			id,
			user_id: userId,
			title: parsed.quiz.title || 'Untitled Quiz',
			description: parsed.quiz.description || '',
			difficulty: parsed.quiz.difficulty || 'medium',
			questions: parsed.quiz.questions || [],
			metadata: saved.metadata,
			created_at: new Date().toISOString()
		});
	
	if (error) {
		console.error('Error saving quiz to database:', error);
		// Fallback to in-memory storage if DB fails
		memoryStore.set(id, saved);
		console.log('Quiz saved to memory store as fallback');
		return saved;
	}
	
	return saved;
}

async function getQuiz(id: string): Promise<SavedQuiz | undefined> {
	// Try to get from Supabase first
	const supabase = getSupabaseService();
	const { data, error } = await supabase
		.from('quizzes')
		.select('*')
		.eq('id', id)
		.single();
	
	if (error) {
		console.error('Error fetching quiz from database:', error);
		// Fallback to memory store
		const memoryQuiz = memoryStore.get(id);
		if (memoryQuiz) {
			console.log('Quiz found in memory store');
			return memoryQuiz;
		}
		return undefined;
	}
	
	if (!data) {
		// Check memory store as fallback
		const memoryQuiz = memoryStore.get(id);
		if (memoryQuiz) {
			console.log('Quiz found in memory store');
			return memoryQuiz;
		}
		return undefined;
	}
	
	return {
		id: data.id,
		quiz: {
			title: data.title,
			description: data.description,
			difficulty: data.difficulty,
			questions: data.questions
		},
		metadata: data.metadata
	};
}

 // legacy helper removed; using RPC reserve_quiz_generation instead

