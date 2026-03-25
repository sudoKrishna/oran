import VSCodeUI from '@/app/components/CodeEditor';   

export default function ProjectPage({ params }: { params: { projectId: string } }) {
  return <VSCodeUI projectId={params.projectId} />;
}