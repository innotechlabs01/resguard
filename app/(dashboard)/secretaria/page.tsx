import DocumentList from '@/components/secretaria/DocumentList';
import DocumentForm from '@/components/secretaria/DocumentForm';

export default function SecretariaPage() {
  const buildingId = '00000000-0000-0000-0000-000000000000';
  return (
    <div>
      <h1>Secretaría Documental</h1>
      <DocumentForm buildingId={buildingId} />
      <DocumentList buildingId={buildingId} />
    </div>
  )
}
