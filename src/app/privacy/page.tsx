export default function PrivacyPage() {
	return (
		<section className="py-20">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 sm:p-12">
					<h1 className="text-4xl sm:text-5xl font-bold text-white mb-8">
						Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Policy</span>
					</h1>
					<p className="text-gray-300 mb-8 text-lg">
						Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
					</p>

					<div className="prose prose-invert max-w-none">
						<div className="space-y-8">
							<section>
								<h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
								<p className="text-gray-300 leading-relaxed mb-4">
									We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.
								</p>
								<ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
									<li>Account information (email address, password)</li>
									<li>Profile information (name, preferences)</li>
									<li>Content you create (quizzes, notes, flashcards)</li>
									<li>Usage data and analytics</li>
									<li>Communication data (support requests, feedback)</li>
								</ul>
							</section>

							<section>
								<h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
								<p className="text-gray-300 leading-relaxed mb-4">
									We use the information we collect to provide, maintain, and improve our services:
								</p>
								<ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
									<li>Provide and personalize our AI-powered learning platform</li>
									<li>Process transactions and manage your account</li>
									<li>Send you technical notices and support messages</li>
									<li>Improve our services and develop new features</li>
									<li>Ensure security and prevent fraud</li>
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
								<h2 className="text-2xl font-bold text-white mb-4">9. Contact Us</h2>
								<p className="text-gray-300 leading-relaxed">
									If you have any questions about this Privacy Policy, please contact us at:
								</p>
								<div className="bg-white/5 rounded-lg p-4 mt-4">
									<p className="text-gray-300">
										Email: privacy@neurativo.com<br />
										Address: 123 Learning Street, Education City, EC 12345
									</p>
								</div>
							</section>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
