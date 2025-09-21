export default function LibraryPage() {
	return (
		<main className="relative z-30">
			<section className="py-12 bg-black/20">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Quiz Library</h1>
					<p className="text-xl text-gray-300 mb-8">Discover quizzes created by our community and AI</p>
					<div className="flex flex-col md:flex-row gap-4 justify-center items-center">
						<input className="form-input w-full max-w-md" placeholder="Search quizzes..." />
						<select className="form-input max-w-xs">
							<option>All Categories</option>
						</select>
						<select className="form-input max-w-xs">
							<option>All Difficulties</option>
						</select>
					</div>
				</div>
			</section>
			<section className="py-12">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="quizGrid">
						{Array.from({ length: 8 }).map((_, i) => (
							<div key={i} className="feature-card h-40" />
						))}
					</div>
					<div className="text-center mt-12">
						<button className="cta-button"><i className="fas fa-plus mr-2" />Load More Quizzes</button>
					</div>
				</div>
			</section>
		</main>
	);
}


