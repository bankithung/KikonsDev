import { StudentProfileView } from '../../components/StudentProfileView';

interface PageProps {
    params: Promise<{
        type: string;
        id: string;
    }>;
}

export default async function StudentProfilePage({ params }: PageProps) {
    const { type, id } = await params;

    return <StudentProfileView type={type} id={id} />;
}
