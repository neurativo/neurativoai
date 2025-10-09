export default function TermsPage() {
	return (
		<section className="py-20">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 sm:p-12">
					<h1 className="text-4xl sm:text-5xl font-bold text-white mb-8">
						Terms of <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Service</span>
					</h1>
					<p className="text-gray-300 mb-8 text-lg">
						Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
					</p>

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
									Neurativo provides an AI-powered learning platform that includes:
								</p>
								<ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
									<li>Personalized quiz generation from various content sources</li>
									<li>Live lecture assistance with real-time transcription</li>
									<li>Study pack creation and management</li>
									<li>Progress tracking and analytics</li>
									<li>AI-powered learning recommendations</li>
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
								<h2 className="text-2xl font-bold text-white mb-4">13. Contact Information</h2>
								<p className="text-gray-300 leading-relaxed">
									If you have any questions about these Terms of Service, please contact us at:
								</p>
								<div className="bg-white/5 rounded-lg p-4 mt-4">
									<p className="text-gray-300">
										Email: legal@neurativo.com<br />
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
