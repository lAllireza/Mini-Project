// app/login/layout.js

export const metadata = {
  title: "ورود ادمین",
};

export default function LoginLayout({ children }) {
  return (
    <section style={{ minHeight: "100vh" }}>
      {children}
    </section>
  );
}