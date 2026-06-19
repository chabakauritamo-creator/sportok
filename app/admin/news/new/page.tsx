import NewsForm from '@/app/admin/_components/NewsForm';

export default function NewArticlePage() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 28 }}>New Article</h1>
      <NewsForm />
    </div>
  );
}
