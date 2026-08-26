export const metadata = {
  title: 'NextJS Docker Test',
  description: 'Testing Docker Containers',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f4f4f9' }}>
        {children}
      </body>
    </html>
  );
}