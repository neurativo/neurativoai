import TypingText from "./components/TypingText";
export default function Home() {
  return (
		<>
			<section id="home" className="min-h-[calc(100vh-4rem)] flex items-center justify-center relative overflow-hidden">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="hero-content flex flex-col items-center justify-center text-center">
						<h1 className="block w-full text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-purple-300 to-blue-300 mb-6">
							<span className="block">
								<TypingText texts={["Transform Learning with AI", "Create Personalized Quizzes", "Master Any Subject"]} />
							</span>
						</h1>
						<p className="block w-full text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
							Experience the future of education with Neurativo's AI-powered platform. Create personalized quizzes, track progress, and master any subject with intelligent learning.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
							<a href="/quiz" className="cta-button">
								<i className="fas fa-rocket mr-2" />
								Start Learning Free
							</a>
							<a href="/pricing" className="secondary-button">
								<i className="fas fa-crown mr-2" />
								View Pricing
          </a>
        </div>
					</div>
				</div>
			</section>

			<section id="features" className="py-20 bg-black/20">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Choose Neurativo?</h2>
						<p className="text-xl text-gray-300">Advanced AI technology meets intuitive learning design</p>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						<div className="feature-card">
							<div className="feature-icon"><i className="fas fa-brain" /></div>
							<h3 className="text-xl font-semibold text-white mb-2">AI-Powered Intelligence</h3>
							<p className="text-gray-300">Advanced AI algorithms create personalized learning experiences tailored to your needs.</p>
						</div>
						<div className="feature-card">
							<div className="feature-icon"><i className="fas fa-chart-line" /></div>
							<h3 className="text-xl font-semibold text-white mb-2">Smart Analytics</h3>
							<p className="text-gray-300">Track your progress with detailed insights and performance analytics.</p>
						</div>
						<div className="feature-card">
							<div className="feature-icon"><i className="fas fa-gamepad" /></div>
							<h3 className="text-xl font-semibold text-white mb-2">Gamified Learning</h3>
							<p className="text-gray-300">Engage with interactive quizzes and challenges that make learning fun and addictive.</p>
						</div>
						<div className="feature-card">
							<div className="feature-icon"><i className="fas fa-users" /></div>
							<h3 className="text-xl font-semibold text-white mb-2">Collaborative Learning</h3>
							<p className="text-gray-300">Share quizzes, compete with friends, and learn together in a supportive community.</p>
						</div>
						<div className="feature-card">
							<div className="feature-icon"><i className="fas fa-mobile-alt" /></div>
							<h3 className="text-xl font-semibold text-white mb-2">Mobile First</h3>
							<p className="text-gray-300">Learn anywhere, anytime with a responsive design that works on all devices.</p>
						</div>
						<div className="feature-card">
							<div className="feature-icon"><i className="fas fa-shield-alt" /></div>
							<h3 className="text-xl font-semibold text-white mb-2">Secure & Private</h3>
							<p className="text-gray-300">Your data is protected with enterprise-grade security and privacy controls.</p>
						</div>
					</div>
				</div>
			</section>

			<section className="py-20">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
						<div className="stat-card">
							<div className="stat-number">10K+</div>
							<div className="stat-label">Active Learners</div>
						</div>
						<div className="stat-card">
							<div className="stat-number">50K+</div>
							<div className="stat-label">Quizzes Created</div>
						</div>
						<div className="stat-card">
							<div className="stat-number">95%</div>
							<div className="stat-label">Success Rate</div>
						</div>
						<div className="stat-card">
							<div className="stat-number">24/7</div>
							<div className="stat-label">AI Support</div>
						</div>
					</div>
				</div>
			</section>

			<section className="py-20 bg-black/20">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Learning?</h2>
					<p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
						Join thousands of learners who are already experiencing the future of education with Neurativo.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<a href="/quiz" className="cta-button">
							<span>Get Started Free</span>
							<i className="fas fa-rocket ml-2" />
						</a>
						<a href="/pricing" className="secondary-button">
							<i className="fas fa-crown mr-2" />
							View Pricing
						</a>
					</div>
    </div>
			</section>
		</>
  );
}
