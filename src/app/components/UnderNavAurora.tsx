export default function UnderNavAurora() {
	return (
		<div className="fixed left-0 right-0 top-[4rem] h-[50vh] z-30 pointer-events-none overflow-hidden">
			<div className="absolute inset-0" style={{
				background:
					"radial-gradient(40% 30% at 15% 20%, rgba(88,28,135,0.35), transparent 60%)," +
					"radial-gradient(35% 25% at 75% 18%, rgba(30,64,175,0.30), transparent 55%)," +
					"radial-gradient(45% 35% at 50% 85%, rgba(147,51,234,0.28), transparent 60%)",
				filter: "blur(42px)"
			}} />
		</div>
	);
}


