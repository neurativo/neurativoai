export default function TermsPage() {
	return (
		<main className="relative z-30 pt-16 md:pt-16 pb-20 md:pb-0">
			<section className="py-20">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 sm:p-12">
						<div className="text-center mb-12">
							<h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
								Terms of <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Service</span>
							</h1>
							<p className="text-gray-300 text-lg">
								Please read these terms carefully before using our AI-powered learning platform.
							</p>
							<p className="text-gray-400 text-sm mt-2">
								Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
							</p>
						</div>

					<div className="prose prose-invert max-w-none">
						<div className="space-y-8">
							<section>
								<h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
								<p className="text-gray-300 leading-relaxed">
									By accessing and using Neurativo's services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
								</p>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
								<p className="text-gray-300 leading-relaxed mb-4">
									Neurativo is an AI-powered learning platform that revolutionizes education through advanced technology and personalized learning experiences.
								</p>
								
								<h3 className="text-xl font-semibold text-purple-300 mb-3">Core Features</h3>
								<ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-6">
									<li><strong>AI Quiz Generation:</strong> Create personalized quizzes from documents, URLs, or text</li>
									<li><strong>3D Interactive Learning:</strong> Immersive 3D quiz environments for visual learning</li>
									<li><strong>Live Lecture Assistant:</strong> Real-time transcription, note-taking, and flashcard generation</li>
									<li><strong>Study Pack Generator:</strong> Comprehensive study materials with notes, flashcards, and quizzes</li>
									<li><strong>Progress Analytics:</strong> Detailed insights into your learning journey and performance</li>
									<li><strong>Multi-Format Support:</strong> PDF, DOCX, URLs, and text input processing</li>
								</ul>

								<h3 className="text-xl font-semibold text-purple-300 mb-3">AI-Powered Capabilities</h3>
								<ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
									<li>Advanced natural language processing for content analysis</li>
									<li>Machine learning algorithms for personalized recommendations</li>
									<li>Real-time audio processing and transcription</li>
									<li>Intelligent content structuring and summarization</li>
									<li>Adaptive difficulty adjustment based on performance</li>
								</ul>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
								<p className="text-gray-300 leading-relaxed mb-4">
									To access certain features, you must create an account. You agree to:
								</p>
								<ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
									<li>Provide accurate and complete information</li>
									<li>Maintain the security of your password</li>
									<li>Accept responsibility for all activities under your account</li>
									<li>Notify us immediately of any unauthorized use</li>
								</ul>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">4. Acceptable Use</h2>
								<p className="text-gray-300 leading-relaxed mb-4">
									You agree not to use the service to:
								</p>
								<ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
									<li>Violate any laws or regulations</li>
									<li>Infringe on intellectual property rights</li>
									<li>Transmit harmful or malicious content</li>
									<li>Attempt to gain unauthorized access to our systems</li>
									<li>Interfere with the proper functioning of the service</li>
									<li>Use the service for commercial purposes without permission</li>
								</ul>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">5. Content and Intellectual Property</h2>
								<p className="text-gray-300 leading-relaxed mb-4">
									You retain ownership of content you create using our service. By using our service, you grant us a license to:
								</p>
								<ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
									<li>Process and analyze your content to provide our services</li>
									<li>Store and backup your content</li>
									<li>Improve our AI models and services</li>
								</ul>
								<p className="text-gray-300 leading-relaxed mt-4">
									Our service, including all software, algorithms, and AI models, is protected by intellectual property laws.
								</p>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">6. Payment and Billing</h2>
								<p className="text-gray-300 leading-relaxed mb-4">
									For paid services:
								</p>
								<ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
									<li>Fees are charged in advance on a recurring basis</li>
									<li>All fees are non-refundable unless otherwise stated</li>
									<li>We may change our pricing with 30 days notice</li>
									<li>You can cancel your subscription at any time</li>
									<li>Refunds are at our sole discretion</li>
								</ul>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">7. Privacy and Data Protection</h2>
								<p className="text-gray-300 leading-relaxed">
									Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
								</p>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">8. Service Availability</h2>
								<p className="text-gray-300 leading-relaxed">
									We strive to maintain high service availability but cannot guarantee uninterrupted access. We may temporarily suspend the service for maintenance, updates, or other reasons.
								</p>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">9. Limitation of Liability</h2>
								<p className="text-gray-300 leading-relaxed">
									To the maximum extent permitted by law, Neurativo shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or use, arising from your use of the service.
								</p>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">10. Termination</h2>
								<p className="text-gray-300 leading-relaxed mb-4">
									We may terminate or suspend your account at any time for:
								</p>
								<ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
									<li>Violation of these Terms</li>
									<li>Fraudulent or illegal activity</li>
									<li>Non-payment of fees</li>
									<li>At our sole discretion</li>
								</ul>
								<p className="text-gray-300 leading-relaxed mt-4">
									You may terminate your account at any time by contacting us or using the account deletion feature.
								</p>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">11. Changes to Terms</h2>
								<p className="text-gray-300 leading-relaxed">
									We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or through the service. Continued use after changes constitutes acceptance of the new Terms.
								</p>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">12. Governing Law</h2>
								<p className="text-gray-300 leading-relaxed">
									These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Neurativo operates, without regard to conflict of law principles.
								</p>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">13. AI Usage & Limitations</h2>
								<p className="text-gray-300 leading-relaxed mb-4">
									Our platform uses advanced AI technologies to provide learning services. Please understand the following:
								</p>
								<ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
									<li>AI-generated content is for educational purposes and may not always be 100% accurate</li>
									<li>You should verify important information from authoritative sources</li>
									<li>AI responses are based on training data and may reflect biases present in that data</li>
									<li>We continuously improve our AI models but cannot guarantee perfect accuracy</li>
									<li>Your content may be processed by third-party AI services (OpenAI, Deepgram, etc.)</li>
								</ul>
								<p className="text-gray-300 leading-relaxed">
									We are not responsible for decisions made based solely on AI-generated content. Always use critical thinking and verify important information.
								</p>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">14. Service Level Agreement</h2>
								<p className="text-gray-300 leading-relaxed mb-4">
									We strive to maintain high service availability and performance:
								</p>
								<ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
									<li>Target uptime: 99.5% (excluding scheduled maintenance)</li>
									<li>Response time: API calls typically respond within 2-5 seconds</li>
									<li>Data backup: Daily automated backups with 30-day retention</li>
									<li>Support response: Within 24 hours for technical issues</li>
									<li>Feature updates: Regular improvements and new features</li>
								</ul>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">15. Contact Information</h2>
								<p className="text-gray-300 leading-relaxed mb-4">
									If you have any questions about these Terms of Service, please contact us:
								</p>
								<div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-6 border border-purple-500/20">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<h4 className="text-purple-300 font-semibold mb-2">Legal & Terms</h4>
											<p className="text-gray-300 text-sm">
												Email: legal@neurativo.com<br />
												Response time: Within 48 hours
											</p>
										</div>
										<div>
											<h4 className="text-purple-300 font-semibold mb-2">General Support</h4>
											<p className="text-gray-300 text-sm">
												Email: support@neurativo.com<br />
												Response time: Within 24 hours
											</p>
										</div>
									</div>
									<div className="mt-4 pt-4 border-t border-white/10">
										<p className="text-gray-400 text-sm">
											Business Hours: Monday-Friday, 9 AM - 6 PM EST
										</p>
									</div>
								</div>
							</section>
						</div>
					</div>
				</div>
			</div>
		</section>
		</main>
	);
}
