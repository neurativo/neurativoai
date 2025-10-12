export default function AboutPage() {
	return (
		<>
			{/* About Section */}
			<section className="py-20">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-16">
						<h1 className="text-4xl sm:text-5xl font-bold text-white mb-8">
							About <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Neurativo</span>
						</h1>
						<p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
							Neurativo is on a mission to transform education through AI-powered learning experiences that adapt to every learner's unique needs and pace.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
						<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8">
							<div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6">
								<i className="fas fa-brain text-2xl text-white"></i>
							</div>
							<h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
							<p className="text-gray-300 leading-relaxed">
								To democratize education by making personalized, AI-powered learning accessible to everyone, regardless of their background or learning style.
							</p>
						</div>

						<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8">
							<div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6">
								<i className="fas fa-rocket text-2xl text-white"></i>
							</div>
							<h3 className="text-2xl font-bold text-white mb-4">Our Vision</h3>
							<p className="text-gray-300 leading-relaxed">
								A world where every learner has access to intelligent, adaptive educational tools that make learning engaging, effective, and personalized.
							</p>
						</div>
					</div>

					<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 mb-16">
						<h2 className="text-3xl font-bold text-white mb-6">What We Do</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<h4 className="text-xl font-semibold text-white mb-3">AI-Powered Quiz Generation</h4>
								<p className="text-gray-300 leading-relaxed mb-4">
									Create personalized quizzes from any content - PDFs, documents, URLs, or text. Our AI understands context and generates relevant questions.
								</p>
							</div>
							<div>
								<h4 className="text-xl font-semibold text-white mb-3">Live Lecture Assistant</h4>
								<p className="text-gray-300 leading-relaxed mb-4">
									Real-time transcription, note-taking, and flashcard generation during live lectures or meetings.
								</p>
							</div>
							<div>
								<h4 className="text-xl font-semibold text-white mb-3">Study Pack Creation</h4>
								<p className="text-gray-300 leading-relaxed mb-4">
									Generate comprehensive study materials including detailed notes, flashcards, and practice quizzes.
								</p>
							</div>
							<div>
								<h4 className="text-xl font-semibold text-white mb-3">Progress Tracking</h4>
								<p className="text-gray-300 leading-relaxed mb-4">
									Monitor your learning progress with detailed analytics and personalized recommendations.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Founders Section */}
			<section className="py-20 bg-gradient-to-b from-black/20 to-purple-900/20">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-16">
						<div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border border-purple-500/30 mb-6">
							<i className="fas fa-users mr-2"></i>
							Meet the Founders
						</div>
						<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 sm:mb-8">
							The Visionaries Behind <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Neurativo</span>
						</h2>
						<p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
							Neurativo was founded by two forward-thinking innovators, united by a shared belief that the future of learning must evolve with intelligence, creativity, and purpose.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
						{/* Shazad Arshad */}
						<div className="group relative">
							<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-purple-400/50 transition-all duration-500 hover:transform hover:scale-105 h-full">
								<div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
								<div className="relative z-10">
									<div className="flex items-center mb-6">
										<div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mr-6">
											<span className="text-white font-bold text-2xl">SA</span>
										</div>
										<div>
											<h3 className="text-2xl font-bold text-white mb-2">Shazad Arshad</h3>
											<p className="text-purple-300 font-medium">Founder</p>
										</div>
									</div>
									<p className="text-gray-300 leading-relaxed mb-6">
										A visionary student with a passion for educational innovation and AI technology. Shazad brings creative thinking and technical expertise to transform how students interact with learning materials.
									</p>
									<div className="flex items-center text-purple-300">
										<i className="fas fa-graduation-cap mr-2"></i>
										<span className="text-sm">Computer Science Student</span>
									</div>
								</div>
							</div>
						</div>

						{/* Shariff Ahamed */}
						<div className="group relative">
							<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-blue-400/50 transition-all duration-500 hover:transform hover:scale-105 h-full">
								<div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
								<div className="relative z-10">
									<div className="flex items-center mb-6">
										<div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-6">
											<span className="text-white font-bold text-2xl">SA</span>
										</div>
										<div>
											<h3 className="text-2xl font-bold text-white mb-2">Shariff Ahamed</h3>
											<p className="text-blue-300 font-medium">Founder</p>
										</div>
									</div>
									<p className="text-gray-300 leading-relaxed mb-6">
										A dedicated student with expertise in software development and AI implementation. Shariff combines technical skills with a deep understanding of student needs to create intuitive and powerful learning tools.
									</p>
									<div className="flex items-center text-blue-300">
										<i className="fas fa-code mr-2"></i>
										<span className="text-sm">Software Engineering Student</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Story Section */}
					<div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-3xl p-8 sm:p-12 border border-white/10">
						<div className="text-center">
							<div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
								<i className="fas fa-lightbulb text-2xl text-white"></i>
							</div>
							<h3 className="text-3xl font-bold text-white mb-6">The Story Behind Neurativo</h3>
							<p className="text-xl text-gray-300 leading-relaxed max-w-4xl mx-auto">
								Driven by curiosity and a passion for transformation, Shazad Arshad and Shariff Ahamed envisioned a world where technology empowers—not replaces—human potential. Together, they built Neurativo as a platform that redefines what learning can be when innovation meets empathy.
							</p>
							<p className="text-lg text-gray-400 leading-relaxed max-w-4xl mx-auto mt-6">
								Their mission goes beyond technology. It's about creating meaningful change, inspiring progress, and shaping an educational future that is smarter, more connected, and truly accessible to all.
							</p>
							<div className="mt-8 flex items-center justify-center">
								<div className="inline-flex items-center px-6 py-3 rounded-full text-lg font-medium bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border border-purple-500/30">
									<i className="fas fa-star mr-2"></i>
									<span>A vision born from innovation, built for the next generation of learners.</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* FAQ Section */}
			<section className="py-20 bg-gradient-to-b from-black/20 to-black/40">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-16">
						<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 sm:mb-8">
							Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Questions</span>
						</h2>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
						<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 text-left">
							<h3 className="text-xl font-bold text-white mb-3">Can I change plans anytime?</h3>
							<p className="text-gray-300">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
						</div>
						<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 text-left">
							<h3 className="text-xl font-bold text-white mb-3">What payment methods do you accept?</h3>
							<p className="text-gray-300">We accept all major credit cards, PayPal, and cryptocurrency payments for maximum flexibility.</p>
						</div>
						<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 text-left">
							<h3 className="text-xl font-bold text-white mb-3">Is there a free trial?</h3>
							<p className="text-gray-300">Yes! Our Essential plan gives you full access to core features with generous usage limits to get started.</p>
						</div>
						<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 text-left">
							<h3 className="text-xl font-bold text-white mb-3">Can I cancel anytime?</h3>
							<p className="text-gray-300">Absolutely! Cancel anytime with no questions asked. Your data remains accessible until your billing period ends.</p>
						</div>
						<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 text-left">
							<h3 className="text-xl font-bold text-white mb-3">How does the AI work?</h3>
							<p className="text-gray-300">Our AI uses advanced natural language processing to understand content and generate relevant, personalized learning materials.</p>
						</div>
						<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 text-left">
							<h3 className="text-xl font-bold text-white mb-3">Is my data secure?</h3>
							<p className="text-gray-300">Yes! We use enterprise-grade security measures and encryption to protect your data and privacy.</p>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}


