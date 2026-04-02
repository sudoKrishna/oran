import VSCodeUI from '@/app/editor/components/VSCodeUI';   

export default function ProjectPage({ params }: { params: { projectId: string } }) {
  return <VSCodeUI projectId={params.projectId} />;
}