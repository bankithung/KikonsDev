import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function LogsPage() {
    return (
         <div className="space-y-4">
            <h1 className="text-2xl font-bold">System Logs</h1>
             <Card>
                <CardHeader><CardTitle>Recent Logs</CardTitle></CardHeader>
                <CardContent>
                    <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm">
                        <p>[INFO] Service started at port 3000</p>
                        <p>[WARN] High latency detected in report generation</p>
                        <p>[INFO] User 123 logged in</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

