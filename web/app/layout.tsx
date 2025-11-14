import './globals.css';

export const metadata = { title: "AI Quiz Builder" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-xl)' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
