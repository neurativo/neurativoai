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
	
	// Return the FULL quiz data with answers for taking the quiz
	const fullQuiz = {
		id: quizData.id,
		quiz: {
			title: quizData.title,
			description: quizData.description,
			difficulty: quizData.difficulty,
			questions: quizData.questions || []
		},
		question_count: quizData.questions?.length || 0,
		created_at: quizData.created_at
	};
	
	return NextResponse.json({ success: true, data: fullQuiz }, { headers });
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
	const results = questions.map((question: any, index: number) => {
		const userAnswer = answers[index];
		let isCorrect = false;
		let explanation = question.explanation || '';
		
		if (question.type === 'multiple_choice') {
			isCorrect = userAnswer === question.correct_answer;
		} else if (question.type === 'true_false') {
			isCorrect = userAnswer === question.correct_answer;
		} else if (question.type === 'short_answer') {
			// Check if user's answer matches any of the correct answers (case insensitive)
			const correctAnswers = question.correct_answers || [];
			isCorrect = correctAnswers.some((correct: string) => 
				correct.toLowerCase().trim() === userAnswer?.toLowerCase().trim()
			);
		} else if (question.type === 'fill_blank') {
			// Check each blank
			const blanks = question.blanks || [];
			isCorrect = blanks.every((blank: any, blankIndex: number) => {
				const userBlankAnswer = userAnswer[blankIndex];
				const correctAnswers = blank.correct_answers || [];
				return correctAnswers.some((correct: string) => 
					correct.toLowerCase().trim() === userBlankAnswer?.toLowerCase().trim()
				);
			});
		}
		
		return {
			questionId: question.id,
			question: question.question,
			type: question.type,
			userAnswer,
			isCorrect,
			explanation,
			hint: question.hint
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
