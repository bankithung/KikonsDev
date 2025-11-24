import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DatabasePage() {
    return (
         <div className="space-y-4">
            <h1 className="text-2xl font-bold">Database Management</h1>
             <Card>
                <CardHeader><CardTitle>DB Stats</CardTitle></CardHeader>
                <CardContent>
                    <p>Connections: 52</p>
                    <p>Size: 1.2 GB</p>
                </CardContent>
            </Card>
        </div>
    )
}

