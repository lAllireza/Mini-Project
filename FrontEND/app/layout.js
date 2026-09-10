// app/layout.js
export const metadata = {
  title: "سامانه مدیریت | Next.js & Django",
  description: "پروژه ارتباط فرانت‌اند و بک‌اند",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          boxSizing: "border-box",
          backgroundColor: "#0f172a",
          fontFamily: "'Vazirmatn', 'IRANSans', Tahoma, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}