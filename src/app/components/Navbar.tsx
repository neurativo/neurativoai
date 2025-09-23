"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getSupabaseBrowser } from "@/app/lib/supabaseClient";

export default function Navbar() {
	const pathname = usePathname();
	const router = useRouter();
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
	const [isMobileOpen, setIsMobileOpen] = useState(false);
	const [authOpen, setAuthOpen] = useState(false);
	const [isSignup, setIsSignup] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [authLoading, setAuthLoading] = useState(false);
	const [authError, setAuthError] = useState<string | null>(null);
	const [userEmail, setUserEmail] = useState<string | null>(null);
	const [logoutLoading, setLogoutLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

	const isActive = (href: string) => pathname === href;

	useEffect(() => {
		const supabase = getSupabaseBrowser();
		let mounted = true;
		supabase.auth.getUser().then(({ data }) => {
			if (!mounted) return;
			setUserEmail(data.user?.email ?? null);
		});
		const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
			setUserEmail(session?.user?.email ?? null);
		});
		// Fallback: on window focus, refresh user
		const onFocus = () => {
			supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
		};
		window.addEventListener('focus', onFocus);
		return () => {
			mounted = false;
			subscription.unsubscribe();
			window.removeEventListener('focus', onFocus);
		};
	}, []);

	// Close user dropdown on outside click
	useEffect(() => {
		function onDocClick(e: MouseEvent) {
			if (!isUserMenuOpen) return;
			const target = e.target as Node;
			if (dropdownRef.current && !dropdownRef.current.contains(target)) {
				setIsUserMenuOpen(false);
			}
		}
		document.addEventListener('mousedown', onDocClick);
		return () => document.removeEventListener('mousedown', onDocClick);
	}, [isUserMenuOpen]);

	async function handleAuthSubmit(e: React.FormEvent) {
		e.preventDefault();
		setAuthLoading(true);
		setAuthError(null);
		try {
			if (isSignup) {
				const supabase = getSupabaseBrowser();
				const { error } = await supabase.auth.signUp({ email, password });
				if (error) throw error;
				// Keep modal open with message? For now, close and rely on email confirmation flow
			} else {
				const supabase = getSupabaseBrowser();
				const { data, error } = await supabase.auth.signInWithPassword({ email, password });
				if (error) throw error;
				// Optimistically update UI and persist fallback
				const resolved = data.user?.email ?? email;
				setUserEmail(resolved);
				try { localStorage.setItem('nv_last_email', resolved); } catch {}
				// Re-fetch user to be safe
				void supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? resolved));
			}
			setAuthOpen(false);
			setEmail("");
			setPassword("");
		} catch (err: any) {
			setAuthError(err?.message ?? "Authentication failed");
		} finally {
			setAuthLoading(false);
		}
	}

	async function handleLogout() {
		setLogoutLoading(true);
		try {
			const supabase = getSupabaseBrowser();
			await supabase.auth.signOut();
			setIsUserMenuOpen(false);
			setUserEmail(null);
			try { localStorage.removeItem('nv_last_email'); } catch {}
			// Redirect to homepage after logout
			router.push('/');
		} catch (error) {
			console.error('Logout error:', error);
		} finally {
			setLogoutLoading(false);
		}
	}

	return (
		<nav className="fixed top-0 left-0 right-0 z-50 glassmorphism-nav">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="navbar h-16 px-0">
					<div className="navbar-start">
						<Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-purple-300 to-blue-300">
							<i className="fas fa-brain mr-2 text-white" />Neurativo
						</Link>
					</div>
					<div className="navbar-center hidden md:flex">
						<ul className="menu menu-horizontal gap-2">
							<li><Link href="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>Home</Link></li>
							<li><Link href="/quiz" className={`nav-link ${isActive("/quiz") ? "active" : ""}`}>Quiz</Link></li>
							<li><Link href="/pricing" className={`nav-link ${isActive("/pricing") ? "active" : ""}`}>Pricing</Link></li>
							<li><Link href="/library" className={`nav-link ${isActive("/library") ? "active" : ""}`}>Library</Link></li>
							<li><Link href="/about" className={`nav-link ${isActive("/about") ? "active" : ""}`}>About</Link></li>
						</ul>
					</div>
				<div className="navbar-end">
					{userEmail ? (
						<div ref={dropdownRef} className="relative">
							<button
								aria-haspopup="menu"
								aria-expanded={isUserMenuOpen}
								className="btn btn-ghost btn-circle"
								onClick={() => setIsUserMenuOpen((v) => !v)}
							>
								<div className="rounded-full w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center shadow-inner">
									<span className="text-white font-semibold">{userEmail.charAt(0).toUpperCase()}</span>
								</div>
							</button>
							{isUserMenuOpen && (
								<div role="menu" className="absolute right-0 mt-3 z-[100] bg-black/80 backdrop-blur-md border border-white/10 rounded-xl w-56 text-white p-2">
									<div className="px-3 py-2">
										<div className="text-xs text-gray-300">Signed in as</div>
										<div className="text-sm font-medium break-all">{userEmail}</div>
									</div>
									<ul className="menu menu-sm">
										<li><Link href="/dashboard"><i className="fas fa-tachometer-alt w-4"/> Dashboard</Link></li>
										<li><Link href="/profile"><i className="fas fa-user w-4"/> Profile</Link></li>
										<li><Link href="/settings"><i className="fas fa-cog w-4"/> Settings</Link></li>
										<li><Link href="/pricing"><i className="fas fa-crown w-4"/> Upgrade Plan</Link></li>
										<li className="border-t border-white/10 my-1"></li>
										<li><button onClick={handleLogout} disabled={logoutLoading} className="text-red-300 disabled:opacity-50">
											{logoutLoading ? (
												<><span className="loading loading-spinner loading-xs mr-2"></span>Logging out...</>
											) : (
												<><i className="fas fa-sign-out-alt w-4"/> Logout</>
											)}
										</button></li>
									</ul>
								</div>
							)}
						</div>
					) : (
						<button className="auth-btn" onClick={() => { setIsSignup(false); setAuthOpen(true); }} aria-label="Sign in">
							<i className="fas fa-user-circle mr-2" />Sign In
						</button>
					)}
					{/* Mobile menu toggle as last item to stick to the far right */}
					<button className="btn btn-ghost md:hidden order-last ml-2" onClick={() => setIsMobileOpen(!isMobileOpen)} aria-label="Toggle menu">
						<i className="fas fa-bars-staggered text-white" />
					</button>
				</div>
				</div>
				{isMobileOpen && (
					<div className="md:hidden mt-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-3">
						<ul className="menu menu-vertical">
							<li><Link href="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>Home</Link></li>
							<li><Link href="/quiz" className={`nav-link ${isActive("/quiz") ? "active" : ""}`}>Quiz</Link></li>
							<li><Link href="/pricing" className={`nav-link ${isActive("/pricing") ? "active" : ""}`}>Pricing</Link></li>
							<li><Link href="/library" className={`nav-link ${isActive("/library") ? "active" : ""}`}>Library</Link></li>
							<li><Link href="/about" className={`nav-link ${isActive("/about") ? "active" : ""}`}>About</Link></li>
						</ul>
					</div>
				)}
			</div>
			{/* Auth Modal (ported to body to avoid layout constraints) */}
			{authOpen && typeof window !== "undefined" && createPortal(
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
					<div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
						<h3 className="font-bold text-lg mb-2">{isSignup ? "Create account" : "Sign in"}</h3>
						<form onSubmit={handleAuthSubmit} className="space-y-3">
							<input type="email" placeholder="Email" className="input input-bordered w-full bg-white/5 text-white placeholder-gray-400" value={email} onChange={(e)=>setEmail(e.target.value)} required />
							<input type="password" placeholder="Password" className="input input-bordered w-full bg-white/5 text-white placeholder-gray-400" value={password} onChange={(e)=>setPassword(e.target.value)} required />
							{authError && (<div className="alert alert-error bg-white/10 border border-white/20">{authError}</div>)}
							<button type="submit" className="btn btn-primary w-full rounded-full h-11 min-h-11" disabled={authLoading}>{authLoading ? (isSignup ? "Creating..." : "Signing in...") : (isSignup ? "Sign up" : "Sign in")}</button>
						</form>
						<div className="mt-3 text-sm text-gray-300">
							{isSignup ? (
								<span>Already have an account? <button className="text-purple-300" onClick={()=>setIsSignup(false)}>Sign in</button></span>
							) : (
								<span>New here? <button className="text-purple-300" onClick={()=>setIsSignup(true)}>Create an account</button></span>
							)}
						</div>
						<div className="flex justify-end mt-4">
							<button className="btn btn-ghost rounded-full px-5" onClick={()=>setAuthOpen(false)}>Close</button>
						</div>
					</div>
				</div>,
				document.body
			)}
		</nav>
	);
}


