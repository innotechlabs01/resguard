import DocumentList from '@/components/secretaria/DocumentList';

export default function SecretariaPage() {
  const buildingId = '00000000-0000-0000-0000-000000000000'; // TODO: get from session
  return (
    <div>
      <h1>Secretaría Documental</h1>
      <DocumentList buildingId={buildingId} />
    </div>
  )
}
