import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CompaniesPage() {
    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Company Management</h1>
            <Card>
                <CardHeader><CardTitle>Registered Companies</CardTitle></CardHeader>
                <CardContent>
                    <p>Mock list of tenant companies...</p>
                </CardContent>
            </Card>
        </div>
    )
}

