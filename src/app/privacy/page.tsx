export default function PrivacyPage() {
	return (
		<main className="relative z-30 pt-16 md:pt-16 pb-20 md:pb-0">
			<section className="py-20">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 sm:p-12">
						<div className="text-center mb-12">
							<h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
								Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Policy</span>
							</h1>
							<p className="text-gray-300 text-lg">
								Your privacy is our priority. This policy explains how we collect, use, and protect your information.
							</p>
							<p className="text-gray-400 text-sm mt-2">
								Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
							</p>
						</div>

					<div className="prose prose-invert max-w-none">
						<div className="space-y-8">
							<section>
								<h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
								<p className="text-gray-300 leading-relaxed mb-4">
									We collect information you provide directly to us and information automatically collected when you use our AI-powered learning platform.
								</p>
								
								<h3 className="text-xl font-semibold text-purple-300 mb-3">Personal Information</h3>
								<ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-6">
									<li>Account information (email address, password, name)</li>
									<li>Profile information (learning preferences, subscription plan)</li>
									<li>Payment information (processed securely through third-party providers)</li>
									<li>Communication data (support requests, feedback, surveys)</li>
								</ul>

								<h3 className="text-xl font-semibold text-purple-300 mb-3">Learning Content & Usage Data</h3>
								<ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-6">
									<li>Content you upload (documents, URLs, text for quiz generation)</li>
									<li>Generated content (quizzes, flashcards, study packs, notes)</li>
									<li>Live lecture recordings and transcripts (if you use our lecture features)</li>
									<li>Learning progress and performance analytics</li>
									<li>3D quiz interactions and responses</li>
									<li>Study session data and time spent on different features</li>
								</ul>

								<h3 className="text-xl font-semibold text-purple-300 mb-3">Technical Information</h3>
								<ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
									<li>Device information (browser type, operating system, IP address)</li>
									<li>Usage patterns and feature interactions</li>
									<li>Error logs and performance data</li>
									<li>Cookies and similar tracking technologies</li>
								</ul>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
								<p className="text-gray-300 leading-relaxed mb-4">
									We use your information to provide, maintain, and improve our AI-powered learning platform and related services.
								</p>
								
								<h3 className="text-xl font-semibold text-purple-300 mb-3">Core Service Delivery</h3>
								<ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-6">
									<li>Generate personalized quizzes from your uploaded content</li>
									<li>Create study packs, flashcards, and revision materials</li>
									<li>Provide live lecture transcription and real-time notes</li>
									<li>Enable 3D interactive learning experiences</li>
									<li>Track your learning progress and provide analytics</li>
									<li>Process payments and manage your subscription</li>
								</ul>

								<h3 className="text-xl font-semibold text-purple-300 mb-3">AI Model Training & Improvement</h3>
								<ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-6">
									<li>Improve our AI algorithms for better quiz generation</li>
									<li>Enhance transcription accuracy for live lectures</li>
									<li>Optimize 3D scenario generation for interactive learning</li>
									<li>Develop new AI-powered learning features</li>
									<li>Personalize learning recommendations based on your patterns</li>
								</ul>

								<h3 className="text-xl font-semibold text-purple-300 mb-3">Communication & Support</h3>
								<ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
									<li>Send important service updates and notifications</li>
									<li>Provide customer support and technical assistance</li>
									<li>Send educational content and learning tips</li>
									<li>Conduct surveys to improve our services</li>
									<li>Send marketing communications (with your consent)</li>
								</ul>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">3. Information Sharing</h2>
								<p className="text-gray-300 leading-relaxed mb-4">
									We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:
								</p>
								<ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
									<li>With your explicit consent</li>
									<li>To comply with legal obligations</li>
									<li>To protect our rights and prevent fraud</li>
									<li>With service providers who assist in our operations</li>
								</ul>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
								<p className="text-gray-300 leading-relaxed">
									We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure servers, and regular security audits.
								</p>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">5. Your Rights</h2>
								<p className="text-gray-300 leading-relaxed mb-4">
									You have the right to:
								</p>
								<ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
									<li>Access your personal information</li>
									<li>Correct inaccurate data</li>
									<li>Delete your account and data</li>
									<li>Export your data</li>
									<li>Opt out of marketing communications</li>
								</ul>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">6. Cookies and Tracking</h2>
								<p className="text-gray-300 leading-relaxed">
									We use cookies and similar technologies to enhance your experience, analyze usage patterns, and provide personalized content. You can control cookie settings through your browser preferences.
								</p>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">7. Children's Privacy</h2>
								<p className="text-gray-300 leading-relaxed">
									Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it.
								</p>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">8. Changes to This Policy</h2>
								<p className="text-gray-300 leading-relaxed">
									We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
								</p>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">9. AI Processing & Data Retention</h2>
								<p className="text-gray-300 leading-relaxed mb-4">
									Our AI systems process your content to provide personalized learning experiences:
								</p>
								<ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
									<li>Content is processed by OpenAI and other AI providers for quiz generation</li>
									<li>Audio recordings are processed by Deepgram for transcription services</li>
									<li>Your data may be temporarily stored on third-party AI service servers</li>
									<li>We retain your learning data for the duration of your account plus 30 days</li>
									<li>You can request deletion of your data at any time</li>
								</ul>
								<p className="text-gray-300 leading-relaxed">
									We implement appropriate safeguards to protect your data during AI processing and ensure compliance with applicable data protection laws.
								</p>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">10. International Data Transfers</h2>
								<p className="text-gray-300 leading-relaxed">
									Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data during international transfers, including standard contractual clauses and adequacy decisions.
								</p>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">11. Contact Us</h2>
								<p className="text-gray-300 leading-relaxed mb-4">
									If you have any questions about this Privacy Policy or our data practices, please contact us:
								</p>
								<div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-6 border border-purple-500/20">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<h4 className="text-purple-300 font-semibold mb-2">Privacy & Data Protection</h4>
											<p className="text-gray-300 text-sm">
												Email: privacy@neurativo.com<br />
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
											Data Protection Officer: dpo@neurativo.com
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
