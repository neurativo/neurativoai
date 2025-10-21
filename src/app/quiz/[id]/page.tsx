"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";

type SavedQuiz = { id: string; quiz: { title: string; description?: string; difficulty?: string; questions: any[] }; metadata: any };

type Telemetry = {
	questionId: number;
	correct: boolean;
	confidence: number;
	ms: number;
};

export default function QuizPlayerPage() {
	const params = useParams();
	const router = useRouter();
	const id = String(params?.id || "");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<SavedQuiz | null>(null);
	const [current, setCurrent] = useState(0);
	const [answers, setAnswers] = useState<Record<number | string, number | string | boolean>>({});
	const [finished, setFinished] = useState(false);
	const [confidence, setConfidence] = useState(50);
	const [showFeedback, setShowFeedback] = useState(false);
	const [telemetry, setTelemetry] = useState<Telemetry[]>([]);
	const questionStartRef = useRef<number>(Date.now());
	const liveRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		(async () => {
			try {
				// Get auth token for secure quiz access
				const supabase = getSupabaseBrowser();
				const { data: { session } } = await supabase.auth.getSession();
				
				if (!session?.access_token) {
					setError("Please sign in to access this quiz");
					return;
				}
				
				const res = await fetch(`/api/quiz/take?id=${encodeURIComponent(id)}`, {
					headers: {
						'Authorization': `Bearer ${session.access_token}`
					}
				});
				const json = await res.json();
				if (!json.success) throw new Error(json.error || "Failed to load quiz");
				
				// Security: Don't log quiz data to console
				if (process.env.NODE_ENV === 'development') {
					console.warn('Quiz data loaded securely - content not exposed in network tab');
				}
				
				setData(json.data);
			} catch (e: any) {
				setError(e?.message ?? "Error");
			} finally {
				setLoading(false);
				questionStartRef.current = Date.now();
			}
		})();
	}, [id]);

	const quiz = data?.quiz;
	const questions = quiz?.questions || [];
	const currentQuestion = questions[current];
	const currentChosen = currentQuestion ? answers[currentQuestion.id] : undefined;

	const score = useMemo(() => {
		let correct = 0;
		for (const q of questions) {
			const chosen = answers[q.id as number];
			if (typeof q.correct_answer === "number" && chosen === q.correct_answer) correct++;
		}
		return { correct, total: questions.length, percent: questions.length ? Math.round((correct / questions.length) * 100) : 0 };
	}, [answers, questions]);

	function announce(text: string) {
		if (liveRef.current) {
			liveRef.current.textContent = "";
			setTimeout(() => { if (liveRef.current) liveRef.current.textContent = text; }, 10);
		}
	}

    function chooseOption(idx: number | boolean) {
		if (showFeedback) return;
		setAnswers((prev) => ({ ...prev, [currentQuestion.id]: idx }));
	}

	function submit() {
		if (!currentQuestion) return;
		
		// Check if answer is provided based on question type
		let hasAnswer = false;
		if (currentQuestion.type === "multiple_choice" || currentQuestion.type === "true_false") {
			hasAnswer = currentChosen !== undefined;
		} else if (currentQuestion.type === "short_answer") {
			hasAnswer = Boolean(currentChosen && String(currentChosen).trim().length > 0);
		} else if (currentQuestion.type === "fill_blank") {
			hasAnswer = Boolean(currentQuestion.blanks?.every((blank: any) => 
				answers[`${currentQuestion.id}_${blank.position}`] && 
				String(answers[`${currentQuestion.id}_${blank.position}`]).trim().length > 0
			));
		}
		
		if (!hasAnswer) return;
		
		// Determine if answer is correct based on question type
		let isCorrect = false;
		if (currentQuestion.type === "short_answer") {
			isCorrect = checkShortAnswerCorrect(currentQuestion, currentChosen as string);
		} else if (currentQuestion.type === "fill_blank") {
			isCorrect = checkFillBlankCorrect(currentQuestion, answers);
		} else {
			isCorrect = currentChosen === currentQuestion.correct_answer;
		}
		
		const ms = Date.now() - (questionStartRef.current || Date.now());
		setTelemetry((prev) => [...prev, { questionId: currentQuestion.id, correct: !!isCorrect, confidence, ms }]);
		setShowFeedback(true);
		announce(isCorrect ? "Correct." : "Incorrect.");
	}

	function next() {
		setShowFeedback(false);
		setConfidence(50);
		questionStartRef.current = Date.now();
		if (current < questions.length - 1) setCurrent(current + 1);
		else setFinished(true);
	}

	function prev() {
		if (current > 0) {
			setShowFeedback(false);
			setConfidence(50);
			questionStartRef.current = Date.now();
			setCurrent(current - 1);
		}
	}

	useEffect(() => {
		function handler(e: KeyboardEvent) {
			if (!currentQuestion) return;
			if (!finished && !showFeedback) {
				// Handle multiple choice keyboard shortcuts
				if (currentQuestion.type === "multiple_choice" && ["1","2","3","4"].includes(e.key)) {
					const idx = Number(e.key) - 1;
					if (Array.isArray(currentQuestion.options) && idx < currentQuestion.options.length) chooseOption(idx);
				}
				// Handle true/false keyboard shortcuts
				if (currentQuestion.type === "true_false") {
					if (e.key === "t" || e.key === "T") setAnswers((prev) => ({ ...prev, [currentQuestion.id]: true }));
					if (e.key === "f" || e.key === "F") setAnswers((prev) => ({ ...prev, [currentQuestion.id]: false }));
				}
			}
			if (e.key === "Enter" && !e.shiftKey) {
				if (!finished && !showFeedback) submit(); else next();
			}
			if (e.key === "Enter" && e.shiftKey) prev();
		}
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [currentQuestion, finished, showFeedback]);

	function confidenceLabel() {
		if (confidence <= 33) return { text: "Low", badge: "badge-error" };
		if (confidence <= 66) return { text: "Medium", badge: "badge-warning" };
		return { text: "High", badge: "badge-success" };
	}

	// Helper functions for checking different question types
    function checkShortAnswerCorrect(question: any, answer: string | undefined): boolean {
		if (!answer || !question.correct_answers) return false;
		const normalizedAnswer = answer.toLowerCase().trim();
        return question.correct_answers.some((correct: string) => 
			correct.toLowerCase().trim() === normalizedAnswer ||
			normalizedAnswer.includes(correct.toLowerCase().trim()) ||
			correct.toLowerCase().trim().includes(normalizedAnswer)
		);
	}

    function checkFillBlankCorrect(question: any, answers: Record<number | string, number | string | boolean>): boolean {
		if (!question.blanks) return false;
        return question.blanks.every((blank: any) => {
			const userAnswer = answers[`${question.id}_${blank.position}`];
			if (!userAnswer) return false;
			const normalizedAnswer = String(userAnswer).toLowerCase().trim();
			return blank.correct_answers.some((correct: string) => 
				correct.toLowerCase().trim() === normalizedAnswer ||
				normalizedAnswer.includes(correct.toLowerCase().trim()) ||
				correct.toLowerCase().trim().includes(normalizedAnswer)
			);
		});
	}

	// Lightweight insights algorithm
	const insights = useMemo(() => {
		if (!questions.length) return { topics: [] as string[], suggestions: [] as string[] };
		const byId = new Map<number, any>();
		for (const q of questions) byId.set(q.id as number, q);
		const wrong = telemetry.filter(t => !t.correct).map(t => byId.get(t.questionId)).filter(Boolean);
		const slowThreshold = (() => {
			if (!telemetry.length) return 60000;
			const times = [...telemetry.map(t => t.ms)].sort((a,b)=>a-b);
			const p75 = times[Math.floor(times.length * 0.75)] || times[times.length-1];
			return Math.max(2500, p75);
		})();
		// Enhanced domain keyword inference - focus on content topics, not question types
		const keywords: Record<string,string[]> = {
			"Python: Data Types": ["python", "data types", "string", "integer", "float", "boolean", "list", "tuple", "dictionary", "set", "type conversion", "mutable", "immutable"],
			"Python: Strings": ["python", "string", "slice", "slicing", "split", "join", "index", "format", "f-string", "lower(", "upper(", "strip(", "replace(", "find("],
			"Python: Lists": ["python", "list", "append(", "extend(", "list comprehension", "pop(", "index error", "slicing", "nested lists", "list methods"],
			"Python: Dictionaries": ["python", "dict", "dictionary", "key", "value", "items(", "get(", "update(", "keys(", "values(", "nested dict"],
			"Python: Functions": ["python", "function", "def", "parameters", "arguments", "return", "scope", "lambda", "recursion", "decorators"],
			"Python: Classes": ["python", "class", "object", "inheritance", "method", "attribute", "constructor", "__init__", "self", "encapsulation"],
			"JavaScript: Fundamentals": ["javascript", "js", "variables", "let", "const", "var", "hoisting", "scope", "closures", "this keyword"],
			"JavaScript: Arrays": ["javascript", "js", "array", "map(", "filter(", "reduce(", "splice(", "push(", "pop(", "forEach(", "find("],
			"JavaScript: Objects": ["javascript", "js", "object", "property", "method", "destructuring", "spread operator", "prototype", "json"],
			"JavaScript: Functions": ["javascript", "js", "function", "arrow function", "callback", "promise", "async", "await", "closure"],
			"Algorithms: Sorting": ["sorting", "bubble sort", "quick sort", "merge sort", "insertion sort", "selection sort", "time complexity", "space complexity"],
			"Algorithms: Searching": ["searching", "linear search", "binary search", "hash table", "time complexity", "space complexity", "algorithm efficiency"],
			"Data Structures: Arrays": ["array", "index", "access", "insertion", "deletion", "time complexity", "space complexity", "dynamic array"],
			"Data Structures: Linked Lists": ["linked list", "node", "pointer", "traversal", "insertion", "deletion", "singly linked", "doubly linked"],
			"Data Structures: Trees": ["tree", "binary tree", "bst", "traversal", "inorder", "preorder", "postorder", "height", "depth", "balanced"],
			"Data Structures: Hash Tables": ["hash table", "hash map", "hash function", "collision", "load factor", "bucket", "key-value pair"],
			"SQL: Queries": ["sql", "select", "from", "where", "group by", "having", "order by", "limit", "distinct", "aggregate functions"],
			"SQL: Joins": ["sql", "join", "inner join", "left join", "right join", "outer join", "cross join", "on clause", "foreign key"],
			"SQL: Data Types": ["sql", "data types", "varchar", "integer", "decimal", "date", "timestamp", "boolean", "text", "blob"],
			"Statistics: Descriptive": ["mean", "median", "mode", "range", "variance", "standard deviation", "quartiles", "percentiles", "distribution"],
			"Statistics: Inferential": ["hypothesis testing", "p-value", "confidence interval", "t-test", "chi-square", "correlation", "regression", "significance"],
			"Mathematics: Algebra": ["algebra", "equation", "variable", "coefficient", "polynomial", "quadratic", "linear", "system of equations"],
			"Mathematics: Calculus": ["calculus", "derivative", "integral", "limit", "continuity", "differentiation", "integration", "chain rule"],
			"Physics: Mechanics": ["physics", "mechanics", "force", "acceleration", "velocity", "momentum", "energy", "work", "power", "newton's laws"],
			"Physics: Thermodynamics": ["physics", "thermodynamics", "temperature", "heat", "entropy", "energy", "gas laws", "phase change"],
			"Chemistry: Atomic Structure": ["chemistry", "atom", "proton", "neutron", "electron", "atomic number", "mass number", "isotope", "electron configuration"],
			"Chemistry: Chemical Bonds": ["chemistry", "bond", "ionic", "covalent", "metallic", "electronegativity", "polarity", "molecular geometry"],
			"Biology: Cell Biology": ["biology", "cell", "membrane", "nucleus", "mitochondria", "ribosome", "organelle", "prokaryotic", "eukaryotic"],
			"Biology: Genetics": ["biology", "genetics", "dna", "rna", "gene", "chromosome", "allele", "genotype", "phenotype", "mutation"],
			"History: Ancient Civilizations": ["history", "ancient", "egypt", "greece", "rome", "mesopotamia", "civilization", "empire", "dynasty"],
			"History: World Wars": ["history", "world war", "wwi", "wwii", "treaty", "alliance", "battle", "revolution", "cold war"],
			"Geography: Physical": ["geography", "physical", "mountain", "river", "ocean", "climate", "weather", "biome", "ecosystem", "landform"],
			"Geography: Human": ["geography", "human", "population", "culture", "language", "religion", "economy", "urbanization", "migration"],
		};
		const subskills: Record<string,string[]> = {
			"Python: Data Types": ["Type conversion and casting", "Mutable vs immutable types", "Type checking and validation", "Memory usage of different types"],
			"Python: Strings": ["String indexing and slicing", "String methods and operations", "String formatting techniques", "Regular expressions basics"],
			"Python: Lists": ["List operations and methods", "List comprehensions", "Nested lists and multidimensional arrays", "List vs tuple vs set differences"],
			"Python: Dictionaries": ["Dictionary creation and access", "Dictionary methods and iteration", "Nested dictionaries", "Dictionary vs other data structures"],
			"Python: Functions": ["Function definition and calling", "Parameters and arguments", "Return values and scope", "Lambda functions and decorators"],
			"Python: Classes": ["Class definition and instantiation", "Inheritance and polymorphism", "Method overriding and super()", "Encapsulation and properties"],
			"JavaScript: Fundamentals": ["Variable declarations (let, const, var)", "Hoisting and scope", "Closures and lexical scoping", "The 'this' keyword context"],
			"JavaScript: Arrays": ["Array methods (map, filter, reduce)", "Array iteration and manipulation", "Array destructuring", "Array vs object differences"],
			"JavaScript: Objects": ["Object creation and access", "Object methods and properties", "Object destructuring", "Prototype chain and inheritance"],
			"JavaScript: Functions": ["Function declarations vs expressions", "Arrow functions vs regular functions", "Callback functions and promises", "Async/await patterns"],
			"Algorithms: Sorting": ["Comparison-based sorting algorithms", "Time and space complexity analysis", "Stable vs unstable sorting", "When to use each algorithm"],
			"Algorithms: Searching": ["Linear vs binary search", "Hash table operations", "Search algorithm optimization", "Time complexity trade-offs"],
			"Data Structures: Arrays": ["Array indexing and access", "Dynamic array resizing", "Array operations complexity", "Memory layout and caching"],
			"Data Structures: Linked Lists": ["Node structure and traversal", "Insertion and deletion operations", "Singly vs doubly linked lists", "When to use linked lists"],
			"Data Structures: Trees": ["Tree traversal algorithms", "Binary search tree operations", "Tree balancing concepts", "Tree vs other structures"],
			"Data Structures: Hash Tables": ["Hash function design", "Collision resolution strategies", "Load factor and resizing", "Hash table vs other structures"],
			"SQL: Queries": ["SELECT statement structure", "WHERE clause conditions", "GROUP BY and aggregation", "ORDER BY and LIMIT clauses"],
			"SQL: Joins": ["Different types of joins", "ON vs WHERE in joins", "Join performance optimization", "When to use each join type"],
			"SQL: Data Types": ["Choosing appropriate data types", "Data type constraints", "String vs numeric operations", "Date and time handling"],
			"Statistics: Descriptive": ["Measures of central tendency", "Measures of variability", "Distribution shapes", "Outlier detection methods"],
			"Statistics: Inferential": ["Hypothesis testing process", "P-value interpretation", "Confidence interval construction", "Type I and Type II errors"],
			"Mathematics: Algebra": ["Solving linear equations", "Polynomial operations", "Factoring techniques", "System of equations methods"],
			"Mathematics: Calculus": ["Derivative rules and applications", "Integration techniques", "Limit evaluation", "Chain rule applications"],
			"Physics: Mechanics": ["Newton's laws applications", "Force and motion relationships", "Energy conservation principles", "Momentum and impulse concepts"],
			"Physics: Thermodynamics": ["Heat transfer mechanisms", "Gas law applications", "Energy conversion processes", "Entropy and disorder concepts"],
			"Chemistry: Atomic Structure": ["Electron configuration rules", "Periodic trends", "Atomic radius and ionization energy", "Quantum mechanical model"],
			"Chemistry: Chemical Bonds": ["Ionic vs covalent bonding", "Electronegativity and polarity", "Molecular geometry", "Bond strength factors"],
			"Biology: Cell Biology": ["Organelle functions", "Cell membrane structure", "Cellular processes", "Prokaryotic vs eukaryotic differences"],
			"Biology: Genetics": ["DNA structure and replication", "Gene expression", "Mendelian inheritance", "Mutation types and effects"],
			"History: Ancient Civilizations": ["Timeline and chronology", "Cultural achievements", "Political systems", "Trade and economic systems"],
			"History: World Wars": ["Causes and consequences", "Key battles and events", "Political and social impacts", "Post-war reconstruction"],
			"Geography: Physical": ["Landform formation", "Climate patterns", "Ecosystem relationships", "Natural resource distribution"],
			"Geography: Human": ["Population distribution", "Cultural patterns", "Economic activities", "Urban vs rural differences"],
			"General": ["Read questions carefully", "Identify key concepts", "Eliminate obviously wrong options", "Practice with similar problems"],
		};
		function inferTopics(q: any): string[] {
			const text = `${q?.question || ""}`.toLowerCase();
			const hits: string[] = [];
			for (const [topic, keys] of Object.entries(keywords)) {
				if (keys.some(k => text.includes(k))) hits.push(topic);
			}
			return hits.length ? hits : [q?.type || "General"];
		}
		const topicCounts: Record<string, number> = {};
		for (const q of wrong) {
			for (const t of inferTopics(q)) topicCounts[t] = (topicCounts[t] || 0) + 1;
		}
		const weakTopics = Object.entries(topicCounts).sort((a,b)=>b[1]-a[1]).map(([t])=>t).slice(0,3);
		const avgConfidenceWrong = (() => {
			const arr = telemetry.filter(t => !t.correct).map(t => t.confidence);
			return arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
		})();
		const avgConfidenceAll = telemetry.length ? Math.round(telemetry.reduce((a, b) => a + b.confidence, 0) / telemetry.length) : 0;
		const avgTime = telemetry.length ? Math.round(telemetry.reduce((a, b) => a + b.ms, 0) / telemetry.length) : 0;
		const oftenSlow = telemetry.filter(t => t.ms > slowThreshold).length >= Math.ceil(telemetry.length * 0.4);
		const suggestions: string[] = [];
		// Content-focused improvement plans
		for (const topic of weakTopics) {
			const plan = subskills[topic] || subskills["General"];
			suggestions.push(`🎯 ${topic}: Focus on mastering ${plan.slice(0,2).join(" and ")}. Practice with 5-10 specific problems on this topic.`);
		}
		// Learning strategy suggestions
		if (avgConfidenceWrong >= 60) suggestions.push("🧠 Confidence Calibration: You're often confident on wrong answers. Try explaining your reasoning out loud before selecting an answer.");
		if (oftenSlow) suggestions.push("⏱️ Time Management: You're spending too much time on questions. Set a 2-minute timer and move on if stuck, then review later.");
		if (avgTime < 15000 && score.percent < 70) suggestions.push("📚 Study Strategy: Slow down and read questions more carefully. Accuracy improves with better comprehension.");
		if (weakTopics.length > 0) suggestions.push("🔄 Active Learning: Create your own examples for each weak topic and explain them to someone else (or yourself).");
		if (score.percent < 50) suggestions.push("📖 Foundation Review: Consider reviewing the fundamental concepts before attempting advanced problems.");
		suggestions.push("💡 Pro Tip: Focus on understanding the 'why' behind each concept, not just memorizing facts.");
		return { topics: weakTopics, suggestions };
	}, [questions, telemetry, score.percent]);

	if (loading) return <div className="pt-24 text-center text-white">Loading quiz…</div>;
	if (error) return <div className="pt-24 text-center text-red-300">{error}</div>;
	if (!quiz) return <div className="pt-24 text-center text-gray-300">Quiz not found</div>;


	return (
		<main className="relative z-30 pt-16 md:pt-16 pb-20 md:pb-0">
			<div aria-live="polite" aria-atomic="true" className="sr-only" ref={liveRef}></div>
			<section className="py-8">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between mb-4">
						<h1 className="text-2xl md:text-3xl font-bold text-white">{quiz.title || "Quiz"}</h1>
						<span className="text-gray-300">{current + 1} / {questions.length}</span>
					</div>
					{!finished ? (
						<div className="card bg-white/5 backdrop-blur-xl border border-white/20 shadow-xl">
							<div className="card-body">
								<h2 className="text-white text-lg font-semibold mb-2">{currentQuestion?.question}</h2>
								
								{/* AI Hint */}
								{currentQuestion?.hint && !showFeedback && (
									<div className="alert alert-info mb-4">
										<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
										</svg>
										<span className="text-sm">💡 Hint: {currentQuestion.hint}</span>
									</div>
								)}

								{/* Confidence */}
								<div className="mt-2 mb-4">
									<div className="flex items-center justify-between">
										<label className="text-gray-300 text-sm">Confidence</label>
										<div className="inline-flex items-center gap-2">
											<span className={`badge ${confidenceLabel().badge}`}>{confidenceLabel().text}</span>
											<span className="badge badge-outline">{confidence}%</span>
										</div>
									</div>
									<div className="mt-2">
										<input type="range" min={0} max={100} step={5} value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} className="range range-primary range-lg" />
										<div className="flex justify-between px-1 text-[10px] text-gray-400 mt-1">
											<span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
										</div>
									</div>
								</div>

								{/* Question Type Rendering */}
								{currentQuestion?.type === "multiple_choice" && Array.isArray(currentQuestion?.options) && (
									<div className="grid grid-cols-1 gap-3 mt-4">
										{currentQuestion.options.map((opt: string, idx: number) => (
											<button key={idx} onClick={() => chooseOption(idx)} className={`btn justify-start ${answers[currentQuestion.id] === idx ? (showFeedback ? (idx === currentQuestion.correct_answer ? "btn-success" : "btn-error") : "btn-primary") : (showFeedback && idx === currentQuestion.correct_answer ? "btn-success" : "btn-outline")}`}>
												<span className="text-left">{opt}</span>
											</button>
										))}
									</div>
								)}

								{currentQuestion?.type === "true_false" && (
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        <button onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: true }))} className={`btn ${answers[currentQuestion.id] === true ? (showFeedback ? (true === currentQuestion.correct_answer ? "btn-success" : "btn-error") : "btn-primary") : (showFeedback && true === currentQuestion.correct_answer ? "btn-success" : "btn-outline")}`}>
											True
										</button>
                                        <button onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: false }))} className={`btn ${answers[currentQuestion.id] === false ? (showFeedback ? (false === currentQuestion.correct_answer ? "btn-success" : "btn-error") : "btn-primary") : (showFeedback && false === currentQuestion.correct_answer ? "btn-success" : "btn-outline")}`}>
											False
										</button>
									</div>
								)}

								{currentQuestion?.type === "short_answer" && (
									<div className="mt-4">
                                        <textarea
                                            value={String(answers[currentQuestion.id] ?? "")}
											onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
											placeholder="Type your answer here..."
											className="textarea textarea-bordered w-full bg-white/5 text-white placeholder-gray-400 min-h-[100px]"
										/>
									</div>
								)}

								{currentQuestion?.type === "fill_blank" && Array.isArray(currentQuestion?.blanks) && (
									<div className="mt-4 space-y-4">
										{currentQuestion.blanks.map((blank: any, blankIdx: number) => (
											<div key={blankIdx} className="space-y-2">
												<label className="text-gray-300 text-sm">
													Blank {blank.position}: {blank.hint && <span className="text-blue-300">({blank.hint})</span>}
												</label>
                                                <input
													type="text"
                                                    value={String(answers[`${currentQuestion.id}_${blank.position}`] ?? "")}
													onChange={(e) => setAnswers(prev => ({ ...prev, [`${currentQuestion.id}_${blank.position}`]: e.target.value }))}
													placeholder="Your answer..."
													className="input input-bordered w-full bg-white/5 text-white placeholder-gray-400"
												/>
											</div>
										))}
									</div>
								)}

								{/* Feedback */}
								{showFeedback && (
									<div className="mt-6 space-y-4">
										{/* Correct/Incorrect Status */}
										{(() => {
                                            const isCorrect = currentQuestion?.type === "short_answer" 
                                                ? checkShortAnswerCorrect(currentQuestion, typeof currentChosen === "string" ? currentChosen : String(currentChosen ?? ""))
												: currentQuestion?.type === "fill_blank"
												? checkFillBlankCorrect(currentQuestion, answers)
												: currentChosen === currentQuestion?.correct_answer;
											
											return isCorrect ? (
												<div className="alert alert-success">
													<svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
													<span>Correct! 🎉</span>
												</div>
											) : (
												<div className="alert alert-error">
													<svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
													<span>Incorrect. Keep learning! 💪</span>
												</div>
											);
										})()}

										{/* AI Explanation */}
										{currentQuestion?.explanation && (
											<div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
												<div className="flex items-start gap-3">
													<div className="text-blue-400 text-lg">🤖</div>
													<div>
														<h4 className="text-blue-300 font-semibold mb-2">AI Explanation</h4>
														<p className="text-gray-200 text-sm leading-relaxed">{currentQuestion.explanation}</p>
													</div>
												</div>
											</div>
										)}

										{/* Wrong Answer Feedback */}
										{(() => {
                                            const isCorrect = currentQuestion?.type === "short_answer" 
                                                ? checkShortAnswerCorrect(currentQuestion, typeof currentChosen === "string" ? currentChosen : String(currentChosen ?? ""))
												: currentQuestion?.type === "fill_blank"
												? checkFillBlankCorrect(currentQuestion, answers)
												: currentChosen === currentQuestion?.correct_answer;
											
											if (isCorrect || !currentQuestion?.wrong_answer_feedback) return null;
											
											// Get specific feedback for multiple choice
											if (currentQuestion.type === "multiple_choice" && typeof currentQuestion.wrong_answer_feedback === "object") {
												const feedback = currentQuestion.wrong_answer_feedback[currentChosen as string];
												if (!feedback) return null;
												
												return (
													<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
														<div className="flex items-start gap-3">
															<div className="text-red-400 text-lg">❌</div>
															<div>
																<h4 className="text-red-300 font-semibold mb-2">Why Your Answer Was Wrong</h4>
																<p className="text-gray-200 text-sm leading-relaxed">{feedback}</p>
															</div>
														</div>
													</div>
												);
											}
											
											// General feedback for other question types
											if (typeof currentQuestion.wrong_answer_feedback === "string") {
												return (
													<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
														<div className="flex items-start gap-3">
															<div className="text-red-400 text-lg">❌</div>
															<div>
																<h4 className="text-red-300 font-semibold mb-2">Why Your Answer Was Wrong</h4>
																<p className="text-gray-200 text-sm leading-relaxed">{currentQuestion.wrong_answer_feedback}</p>
															</div>
														</div>
													</div>
												);
											}
											
											return null;
										})()}

										{/* Show correct answers for short answer and fill blank */}
										{currentQuestion?.type === "short_answer" && Array.isArray(currentQuestion?.correct_answers) && (
											<div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
												<h4 className="text-green-300 font-semibold mb-2">Correct Answers:</h4>
												<ul className="text-gray-200 text-sm space-y-1">
													{currentQuestion.correct_answers.map((answer: string, idx: number) => (
														<li key={idx} className="flex items-center gap-2">
															<span className="text-green-400">✓</span>
															<span>{answer}</span>
														</li>
													))}
												</ul>
											</div>
										)}

										{currentQuestion?.type === "fill_blank" && Array.isArray(currentQuestion?.blanks) && (
											<div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
												<h4 className="text-green-300 font-semibold mb-2">Correct Answers:</h4>
												<div className="space-y-2">
													{currentQuestion.blanks.map((blank: any, idx: number) => (
														<div key={idx} className="text-gray-200 text-sm">
															<span className="text-green-400">Blank {blank.position}:</span> {Array.isArray(blank.correct_answers) ? blank.correct_answers.join(", ") : ""}
														</div>
													))}
												</div>
											</div>
										)}
									</div>
								)}

								<div className="mt-6 flex items-center justify-between">
									<button onClick={prev} className="btn btn-ghost" disabled={current === 0 || showFeedback}>Previous</button>
									{!showFeedback ? (
										<button onClick={submit} className="btn btn-primary" disabled={(() => {
											if (!currentQuestion) return true;
											if (currentQuestion.type === "multiple_choice" || currentQuestion.type === "true_false") {
												return currentChosen === undefined;
											} else if (currentQuestion.type === "short_answer") {
												return !currentChosen || String(currentChosen).trim().length === 0;
											} else if (currentQuestion.type === "fill_blank") {
												return !Boolean(currentQuestion.blanks?.every((blank: any) => 
													answers[`${currentQuestion.id}_${blank.position}`] && 
													String(answers[`${currentQuestion.id}_${blank.position}`]).trim().length > 0
												));
											}
											return true;
										})()}>Submit</button>
									) : (
										<button onClick={next} className="btn btn-primary">{current < questions.length - 1 ? "Next" : "Finish"}</button>
									)}
								</div>
							</div>
						</div>
					) : (
						<div className="card bg-white/5 backdrop-blur-xl border border-white/20 shadow-xl">
							<div className="card-body text-center">
								<h2 className="text-2xl font-bold text-white mb-2">Your Score</h2>
								<p className="text-gray-300 mb-6">{score.correct} / {score.total} correct ({score.percent}%)</p>
								<div className="mt-4 text-left text-gray-300">
									<h3 className="font-semibold text-white mb-2">Session Insights</h3>
									<ul className="list-disc list-inside space-y-1 text-sm">
										<li>Avg time/question: {telemetry.length ? Math.round(telemetry.reduce((a, b) => a + b.ms, 0) / telemetry.length) : 0} ms</li>
										<li>Avg confidence: {telemetry.length ? Math.round(telemetry.reduce((a, b) => a + b.confidence, 0) / telemetry.length) : 0}%</li>
										{insights.topics.length > 0 && (<li>Areas needing attention: {insights.topics.join(", ")}</li>)}
									</ul>
								</div>
								<div className="mt-6 text-left">
									<h3 className="font-semibold text-white mb-2">🎯 Focus Areas for Improvement</h3>
									<ul className="space-y-2 text-gray-200 text-sm">
										{insights.suggestions.map((s, i) => (
											<li key={i} className="bg-white/5 border border-white/10 rounded-lg p-3">{s}</li>
										))}
									</ul>
								</div>
								<div className="flex gap-3 justify-center mt-6">
									<button onClick={() => { setCurrent(0); setAnswers({}); setFinished(false); setTelemetry([]); setConfidence(50); setShowFeedback(false); questionStartRef.current = Date.now(); }} className="btn btn-outline">Retry</button>
									<button onClick={() => router.push("/quiz")} className="btn btn-primary">Create Another</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</section>
		</main>
	);
}


