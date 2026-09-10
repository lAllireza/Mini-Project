// app/admin/layout.js
export const metadata = {
  title: "پنل مدیریت",
};

export default function AdminLayout({ children }) {
  return (
    <section style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {children}
    </section>
  );
}