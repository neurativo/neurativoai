import TypingText from "./components/TypingText";
export default function Home() {
  return (
		<>
			{/* Hero Section */}
			<section id="home" className="min-h-[calc(100vh-4rem)] flex items-center justify-center relative overflow-hidden">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="hero-content flex flex-col items-center justify-center text-center">
						<div className="mb-6">
							<span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-4">
								<i className="fas fa-sparkles mr-2"></i>
								AI-Powered Learning Platform
							</span>
						</div>
						<h1 className="block w-full text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-purple-300 to-blue-300 mb-6">
							<span className="block">
								<TypingText texts={["Transform Learning with AI", "Create Personalized Quizzes", "Master Any Subject"]} />
							</span>
						</h1>
						<p className="block w-full text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
							Experience the future of education with Neurativo's AI-powered platform. Create personalized quizzes, track progress, and master any subject with intelligent learning that adapts to your pace.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
							<a href="/quiz" className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
								<i className="fas fa-rocket mr-2 group-hover:animate-bounce" />
								Start Learning Free
								<div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
								<span className="relative z-10">Start Learning Free</span>
							</a>
							<a href="/pricing" className="group inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300">
								<i className="fas fa-crown mr-2 group-hover:text-yellow-400 transition-colors" />
								View Pricing
							</a>
						</div>
						
						{/* Trust Indicators */}
						<div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-gray-400 text-sm">
							<div className="flex items-center">
								<i className="fas fa-shield-alt text-green-400 mr-2"></i>
								<span>100% Secure</span>
							</div>
							<div className="flex items-center">
								<i className="fas fa-users text-blue-400 mr-2"></i>
								<span>10K+ Active Users</span>
							</div>
							<div className="flex items-center">
								<i className="fas fa-star text-yellow-400 mr-2"></i>
								<span>4.9/5 Rating</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id="features" className="py-24 bg-gradient-to-b from-transparent to-black/30">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-20">
						<div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-6">
							<i className="fas fa-star mr-2"></i>
							Trusted by 10,000+ Learners
						</div>
						<h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
							Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Neurativo</span>?
						</h2>
						<p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
							Advanced AI technology meets intuitive learning design to create the most powerful educational platform available today.
						</p>
					</div>
					
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
						<div className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
							<div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
							<div className="relative z-10">
								<div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
									<i className="fas fa-brain text-2xl text-white" />
								</div>
								<h3 className="text-2xl font-bold text-white mb-4">AI-Powered Intelligence</h3>
								<p className="text-gray-300 leading-relaxed">Advanced AI algorithms create personalized learning experiences tailored to your unique needs and learning style.</p>
							</div>
						</div>
						
						<div className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-green-500/50 transition-all duration-300 hover:transform hover:scale-105">
							<div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
							<div className="relative z-10">
								<div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
									<i className="fas fa-chart-line text-2xl text-white" />
								</div>
								<h3 className="text-2xl font-bold text-white mb-4">Smart Analytics</h3>
								<p className="text-gray-300 leading-relaxed">Track your progress with detailed insights, performance analytics, and personalized recommendations for improvement.</p>
							</div>
						</div>
						
						<div className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-orange-500/50 transition-all duration-300 hover:transform hover:scale-105">
							<div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
							<div className="relative z-10">
								<div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
									<i className="fas fa-gamepad text-2xl text-white" />
								</div>
								<h3 className="text-2xl font-bold text-white mb-4">Gamified Learning</h3>
								<p className="text-gray-300 leading-relaxed">Engage with interactive quizzes, challenges, and achievements that make learning fun and addictive.</p>
							</div>
						</div>
						
						<div className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-pink-500/50 transition-all duration-300 hover:transform hover:scale-105">
							<div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
							<div className="relative z-10">
								<div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
									<i className="fas fa-users text-2xl text-white" />
								</div>
								<h3 className="text-2xl font-bold text-white mb-4">Collaborative Learning</h3>
								<p className="text-gray-300 leading-relaxed">Share quizzes, compete with friends, and learn together in a supportive community environment.</p>
							</div>
						</div>
						
						<div className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:transform hover:scale-105">
							<div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
							<div className="relative z-10">
								<div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
									<i className="fas fa-mobile-alt text-2xl text-white" />
								</div>
								<h3 className="text-2xl font-bold text-white mb-4">Mobile First</h3>
								<p className="text-gray-300 leading-relaxed">Learn anywhere, anytime with a responsive design that works perfectly on all devices and screen sizes.</p>
							</div>
						</div>
						
						<div className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-yellow-500/50 transition-all duration-300 hover:transform hover:scale-105">
							<div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
							<div className="relative z-10">
								<div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
									<i className="fas fa-shield-alt text-2xl text-white" />
								</div>
								<h3 className="text-2xl font-bold text-white mb-4">Secure & Private</h3>
								<p className="text-gray-300 leading-relaxed">Your data is protected with enterprise-grade security and privacy controls that you can trust.</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Stats Section */}
			<section className="py-24 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Trusted by Learners Worldwide</h2>
						<p className="text-xl text-gray-300">Join thousands of students who are already transforming their learning experience</p>
					</div>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-8">
						<div className="text-center group">
							<div className="relative inline-block">
								<div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
									<i className="fas fa-users text-3xl text-white"></i>
								</div>
								<div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
									<i className="fas fa-plus text-white text-sm"></i>
								</div>
							</div>
							<div className="text-4xl md:text-5xl font-bold text-white mb-2">10K+</div>
							<div className="text-gray-300 font-medium">Active Learners</div>
						</div>
						<div className="text-center group">
							<div className="relative inline-block">
								<div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
									<i className="fas fa-question-circle text-3xl text-white"></i>
								</div>
								<div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
									<i className="fas fa-plus text-white text-sm"></i>
								</div>
							</div>
							<div className="text-4xl md:text-5xl font-bold text-white mb-2">50K+</div>
							<div className="text-gray-300 font-medium">Quizzes Created</div>
						</div>
						<div className="text-center group">
							<div className="relative inline-block">
								<div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
									<i className="fas fa-trophy text-3xl text-white"></i>
								</div>
								<div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
									<i className="fas fa-star text-white text-sm"></i>
								</div>
							</div>
							<div className="text-4xl md:text-5xl font-bold text-white mb-2">95%</div>
							<div className="text-gray-300 font-medium">Success Rate</div>
						</div>
						<div className="text-center group">
							<div className="relative inline-block">
								<div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
									<i className="fas fa-robot text-3xl text-white"></i>
								</div>
								<div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
									<i className="fas fa-clock text-white text-sm"></i>
								</div>
							</div>
							<div className="text-4xl md:text-5xl font-bold text-white mb-2">24/7</div>
							<div className="text-gray-300 font-medium">AI Support</div>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section className="py-24 bg-black/20">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-20">
						<div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-500/20 text-green-300 border border-green-500/30 mb-6">
							<i className="fas fa-lightbulb mr-2"></i>
							Simple & Effective
						</div>
						<h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
							How <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">It Works</span>
						</h2>
						<p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
							Get started in minutes with our intuitive 3-step process that transforms any content into powerful learning materials.
						</p>
					</div>
					
					<div className="grid grid-cols-1 md:grid-cols-3 gap-12">
						<div className="text-center group">
							<div className="relative mb-8">
								<div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
									<i className="fas fa-upload text-3xl text-white"></i>
								</div>
								<div className="absolute -top-2 -right-2 w-8 h-8 bg-white text-purple-600 rounded-full flex items-center justify-center font-bold text-sm">
									1
								</div>
							</div>
							<h3 className="text-2xl font-bold text-white mb-4">Upload Content</h3>
							<p className="text-gray-300 leading-relaxed">
								Upload your study materials - PDFs, documents, text, or even URLs. Our AI analyzes and understands your content instantly.
							</p>
						</div>
						
						<div className="text-center group">
							<div className="relative mb-8">
								<div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
									<i className="fas fa-magic text-3xl text-white"></i>
								</div>
								<div className="absolute -top-2 -right-2 w-8 h-8 bg-white text-green-600 rounded-full flex items-center justify-center font-bold text-sm">
									2
								</div>
							</div>
							<h3 className="text-2xl font-bold text-white mb-4">AI Processing</h3>
							<p className="text-gray-300 leading-relaxed">
								Our advanced AI creates personalized quizzes, flashcards, and study materials tailored to your learning style and needs.
							</p>
						</div>
						
						<div className="text-center group">
							<div className="relative mb-8">
								<div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
									<i className="fas fa-graduation-cap text-3xl text-white"></i>
								</div>
								<div className="absolute -top-2 -right-2 w-8 h-8 bg-white text-orange-600 rounded-full flex items-center justify-center font-bold text-sm">
									3
								</div>
							</div>
							<h3 className="text-2xl font-bold text-white mb-4">Start Learning</h3>
							<p className="text-gray-300 leading-relaxed">
								Begin your personalized learning journey with interactive quizzes, progress tracking, and adaptive difficulty levels.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonials Section */}
			<section className="py-24 bg-gradient-to-b from-black/20 to-purple-900/20">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-20">
						<div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 mb-6">
							<i className="fas fa-quote-left mr-2"></i>
							What Our Users Say
						</div>
						<h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
							Success <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">Stories</span>
						</h2>
						<p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
							Don't just take our word for it - hear from real students who've transformed their learning with Neurativo.
						</p>
					</div>
					
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
							<div className="flex items-center mb-6">
								<div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mr-4">
									<span className="text-white font-bold text-lg">S</span>
								</div>
								<div>
									<h4 className="text-white font-semibold">Sarah Chen</h4>
									<p className="text-gray-400 text-sm">Computer Science Student</p>
								</div>
							</div>
							<div className="flex mb-4">
								{[...Array(5)].map((_, i) => (
									<i key={i} className="fas fa-star text-yellow-400 mr-1"></i>
								))}
							</div>
							<p className="text-gray-300 leading-relaxed">
								"Neurativo completely changed how I study. The AI-generated quizzes are so accurate and challenging. I went from C's to A's in just one semester!"
							</p>
						</div>
						
						<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
							<div className="flex items-center mb-6">
								<div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-4">
									<span className="text-white font-bold text-lg">M</span>
								</div>
								<div>
									<h4 className="text-white font-semibold">Michael Rodriguez</h4>
									<p className="text-gray-400 text-sm">Medical Student</p>
								</div>
							</div>
							<div className="flex mb-4">
								{[...Array(5)].map((_, i) => (
									<i key={i} className="fas fa-star text-yellow-400 mr-1"></i>
								))}
							</div>
							<p className="text-gray-300 leading-relaxed">
								"The live lecture feature is incredible! I can focus on understanding concepts while AI takes perfect notes. It's like having a personal study assistant."
							</p>
						</div>
						
						<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
							<div className="flex items-center mb-6">
								<div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-4">
									<span className="text-white font-bold text-lg">E</span>
								</div>
								<div>
									<h4 className="text-white font-semibold">Emily Johnson</h4>
									<p className="text-gray-400 text-sm">Business Student</p>
								</div>
							</div>
							<div className="flex mb-4">
								{[...Array(5)].map((_, i) => (
									<i key={i} className="fas fa-star text-yellow-400 mr-1"></i>
								))}
							</div>
							<p className="text-gray-300 leading-relaxed">
								"I love how personalized everything is. The AI adapts to my learning pace and creates exactly what I need to succeed. Game changer!"
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Final CTA Section */}
			<section className="py-24 bg-gradient-to-br from-purple-900/30 to-blue-900/30">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<div className="max-w-4xl mx-auto">
						<div className="inline-flex items-center px-6 py-3 rounded-full text-lg font-medium bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white border border-purple-500/30 mb-8">
							<i className="fas fa-rocket mr-3 text-2xl"></i>
							Ready to Start Your Learning Journey?
						</div>
						<h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
							Transform Your Learning
							<span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
								Today
							</span>
						</h2>
						<p className="text-2xl text-gray-300 mb-12 leading-relaxed">
							Join thousands of learners who are already experiencing the future of education with Neurativo's AI-powered platform.
						</p>
						<div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
							<a href="/quiz" className="group relative inline-flex items-center px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-xl rounded-2xl shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300">
								<i className="fas fa-rocket mr-3 text-2xl group-hover:animate-bounce" />
								Start Learning Free
								<div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
								<span className="relative z-10">Start Learning Free</span>
							</a>
							<a href="/pricing" className="group inline-flex items-center px-10 py-5 bg-white/10 backdrop-blur-sm text-white font-bold text-xl rounded-2xl border-2 border-white/20 hover:bg-white/20 hover:border-purple-500/50 transition-all duration-300">
								<i className="fas fa-crown mr-3 text-2xl group-hover:text-yellow-400 transition-colors" />
								View Pricing Plans
							</a>
						</div>
						
						{/* Trust Badges */}
						<div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-gray-400">
							<div className="flex items-center">
								<i className="fas fa-shield-alt text-green-400 mr-2 text-xl"></i>
								<span className="text-lg">100% Secure & Private</span>
							</div>
							<div className="flex items-center">
								<i className="fas fa-clock text-blue-400 mr-2 text-xl"></i>
								<span className="text-lg">Setup in 2 Minutes</span>
							</div>
							<div className="flex items-center">
								<i className="fas fa-heart text-red-400 mr-2 text-xl"></i>
								<span className="text-lg">Loved by 10K+ Users</span>
							</div>
						</div>
					</div>
				</div>
			</section>
		</>
  );
}
