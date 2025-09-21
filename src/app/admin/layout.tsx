export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Admin</h1>
      {children}
    </section>
  );
}


