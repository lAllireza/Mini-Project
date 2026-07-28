// app/page.js

// این تابع به صورت SSR درون کانتینر داکر اجرا می‌شود
async function getDbStatus() {
  try {
    // استفاده از نام سرویس بک‌اند در شبکه داکر (Task 3.3)
    const res = await fetch('http://BACKEND:8000/api/health/db/', {
      cache: 'no-store', // برای اینکه همیشه وضعیت لحظه‌ای دیتابیس را ببینیم
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch data from backend');
    }
    
    return await res.json();
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

export default async function HomePage() {
  const data = await getDbStatus();

  return (
    <main style={{ padding: '50px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🚀 Next.js + Django + PostgreSQL</h1>
      <p>این صفحه از درون کانتینر فرانت‌اند، API جنگو را صدا زده است.</p>

      <div style={{
        padding: '20px',
        borderRadius: '8px',
        marginTop: '20px',
        backgroundColor: data.status === 'success' ? '#d4edda' : '#f8d7da',
        color: data.status === 'success' ? '#155724' : '#721c24',
        border: `1px solid ${data.status === 'success' ? '#c3e6cb' : '#f5c6cb'}`
      }}>
        <h3>وضعیت ارتباط با بک‌اند و دیتابیس:</h3>
        <p><strong>وضعیت:</strong> {data.status}</p>
        <p><strong>پیام:</strong> {data.message}</p>
        {data.database && <p><strong>نام دیتابیس:</strong> {data.database}</p>}
      </div>
    </main>
  );
}
