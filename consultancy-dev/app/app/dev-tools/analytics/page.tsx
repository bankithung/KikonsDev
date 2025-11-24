import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function SystemAnalyticsPage() {
    return (
         <div className="space-y-4">
            <h1 className="text-2xl font-bold">System Analytics</h1>
            <Card>
                <CardHeader><CardTitle>Server Load</CardTitle></CardHeader>
                <CardContent>
                    <p>CPU: 45% | Memory: 60%</p>
                </CardContent>
            </Card>
        </div>
    )
}

