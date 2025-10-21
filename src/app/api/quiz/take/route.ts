import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
	// Security headers
	const headers = new Headers({
		'X-Content-Type-Options': 'nosniff',
		'X-Frame-Options': 'DENY',
		'X-XSS-Protection': '1; mode=block',
		'Referrer-Policy': 'strict-origin-when-cross-origin'
	});

	const { searchParams } = new URL(req.url);
	const quizId = searchParams.get("id");
	
	if (!quizId) {
		return NextResponse.json({ success: false, error: "Quiz ID is required" }, { status: 400 });
	}

	// Verify user authentication
	const supabase = getSupabaseServer();
	const authHeader = req.headers.get('authorization');
	let user: any = null;
	
	if (authHeader) {
		const token = authHeader.replace('Bearer ', '');
		const { data: { user: authUser } } = await supabase.auth.getUser(token);
		user = authUser;
	}
	
	if (!user) {
		return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
	}
	
	// Get the full quiz data from database
	const { data: quizData, error } = await supabase
		.from('quizzes')
		.select('*')
		.eq('id', quizId)
		.single();
	
	if (error || !quizData) {
		return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
	}
	
	// Verify ownership
	if (quizData.user_id !== user.id) {
		return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
	}
	
	// Return quiz data WITHOUT answers for secure taking
	const safeQuestions = (quizData.questions || []).map((q: any) => {
		const safeQuestion: any = {
			id: q.id,
			type: q.type,
			question: q.question,
			hint: q.hint
		};
		
		// Only include options for multiple choice, but NOT the correct answer
		if (q.type === 'multiple_choice' && q.options) {
			safeQuestion.options = q.options;
		}
		
		// For true/false, don't include the correct answer
		if (q.type === 'true_false') {
			// Just include the question, no correct_answer
		}
		
		// For short answer, don't include correct answers
		if (q.type === 'short_answer') {
			// Just include the question, no correct_answers
		}
		
		// For fill in the blank, don't include correct answers
		if (q.type === 'fill_blank') {
			// Just include the question, no blanks with correct answers
		}
		
		return safeQuestion;
	});

	const safeQuiz = {
		id: quizData.id,
		quiz: {
			title: quizData.title,
			description: quizData.description,
			difficulty: quizData.difficulty,
			questions: safeQuestions
		},
		question_count: quizData.questions?.length || 0,
		created_at: quizData.created_at
	};
	
	return NextResponse.json({ success: true, data: safeQuiz }, { headers });
}

export async function POST(req: NextRequest) {
	// Security headers
	const headers = new Headers({
		'X-Content-Type-Options': 'nosniff',
		'X-Frame-Options': 'DENY',
		'X-XSS-Protection': '1; mode=block',
		'Referrer-Policy': 'strict-origin-when-cross-origin'
	});

	const body = await req.json();
	const { quizId, answers } = body;
	
	if (!quizId || !answers) {
		return NextResponse.json({ success: false, error: "Quiz ID and answers are required" }, { status: 400 });
	}

	// Verify user authentication
	const supabase = getSupabaseServer();
	const authHeader = req.headers.get('authorization');
	let user: any = null;
	
	if (authHeader) {
		const token = authHeader.replace('Bearer ', '');
		const { data: { user: authUser } } = await supabase.auth.getUser(token);
		user = authUser;
	}
	
	if (!user) {
		return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
	}
	
	// Get the quiz data to check answers
	const { data: quizData, error } = await supabase
		.from('quizzes')
		.select('*')
		.eq('id', quizId)
		.single();
	
	if (error || !quizData) {
		return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
	}
	
	// Verify ownership
	if (quizData.user_id !== user.id) {
		return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
	}
	
	// Grade the quiz
	const questions = quizData.questions || [];
	const results = questions.map((question: any) => {
		// Get user answer for this specific question
		let userAnswer;
		if (question.type === 'fill_blank') {
			// For fill in the blank, collect all blank answers
			userAnswer = {};
			question.blanks?.forEach((blank: any) => {
				const key = `${question.id}_${blank.position}`;
				userAnswer[blank.position] = answers[key];
			});
		} else {
			userAnswer = answers[question.id];
		}
		
		let isCorrect = false;
		let explanation = question.explanation || '';
		let wrongAnswerFeedback = question.wrong_answer_feedback || '';
		let correctAnswers = null;
		
		if (question.type === 'multiple_choice') {
			isCorrect = userAnswer === question.correct_answer;
			// Get specific feedback for multiple choice
			if (!isCorrect && typeof wrongAnswerFeedback === 'object') {
				wrongAnswerFeedback = wrongAnswerFeedback[userAnswer] || wrongAnswerFeedback;
			}
		} else if (question.type === 'true_false') {
			isCorrect = userAnswer === question.correct_answer;
		} else if (question.type === 'short_answer') {
			// Check if user's answer matches any of the correct answers (case insensitive)
			const correctAnswersList = question.correct_answers || [];
			isCorrect = correctAnswersList.some((correct: string) => 
				correct.toLowerCase().trim() === userAnswer?.toLowerCase().trim() ||
				userAnswer?.toLowerCase().trim().includes(correct.toLowerCase().trim()) ||
				correct.toLowerCase().trim().includes(userAnswer?.toLowerCase().trim())
			);
			correctAnswers = correctAnswersList;
		} else if (question.type === 'fill_blank') {
			// Check each blank
			const blanks = question.blanks || [];
			isCorrect = blanks.every((blank: any) => {
				const userBlankAnswer = userAnswer[blank.position];
				if (!userBlankAnswer) return false;
				const normalizedAnswer = String(userBlankAnswer).toLowerCase().trim();
				return blank.correct_answers.some((correct: string) => 
					correct.toLowerCase().trim() === normalizedAnswer ||
					normalizedAnswer.includes(correct.toLowerCase().trim()) ||
					correct.toLowerCase().trim().includes(normalizedAnswer)
				);
			});
			// Format correct answers for display
			correctAnswers = blanks.map((blank: any) => 
				`Blank ${blank.position}: ${blank.correct_answers.join(", ")}`
			).join("; ");
		}
		
		return {
			questionId: question.id,
			question: question.question,
			type: question.type,
			userAnswer,
			isCorrect,
			explanation,
			hint: question.hint,
			wrong_answer_feedback: wrongAnswerFeedback,
			correct_answers: correctAnswers
		};
	});
	
	const totalQuestions = questions.length;
	const correctAnswers = results.filter(r => r.isCorrect).length;
	const score = Math.round((correctAnswers / totalQuestions) * 100);
	
	return NextResponse.json({ 
		success: true, 
		data: {
			score,
			totalQuestions,
			correctAnswers,
			results
		}
	}, { headers });
}
