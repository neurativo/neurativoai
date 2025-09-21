"use client";
import { useEffect, useState } from "react";

type TypingTextProps = {
	texts: string[];
	speedMs?: number;
	pauseMs?: number;
	deleteSpeedMs?: number;
};

export default function TypingText({
	texts,
	speedMs = 60,
	pauseMs = 1200,
	deleteSpeedMs = 40,
}: TypingTextProps) {
	const [display, setDisplay] = useState("");
	const [textIndex, setTextIndex] = useState(0);
	const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");

	useEffect(() => {
		const current = texts[textIndex % texts.length] ?? "";

		if (phase === "typing") {
			if (display.length < current.length) {
				const timeout = setTimeout(() => {
					setDisplay(current.slice(0, display.length + 1));
				}, speedMs);
				return () => clearTimeout(timeout);
			}
			const timeout = setTimeout(() => setPhase("pausing"), pauseMs);
			return () => clearTimeout(timeout);
		}

		if (phase === "deleting") {
			if (display.length > 0) {
				const timeout = setTimeout(() => {
					setDisplay(display.slice(0, -1));
				}, deleteSpeedMs);
				return () => clearTimeout(timeout);
			}
			setPhase("typing");
			setTextIndex((prev) => prev + 1);
			return;
		}

		if (phase === "pausing") {
			const timeout = setTimeout(() => setPhase("deleting"), pauseMs);
			return () => clearTimeout(timeout);
		}
	}, [texts, textIndex, phase, display, speedMs, pauseMs, deleteSpeedMs]);

	return (
		<span>
			{display}
			<span className="inline-block w-[1ch] animate-pulse">▍</span>
		</span>
	);
}


