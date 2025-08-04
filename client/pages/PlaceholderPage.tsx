import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardContent className="text-center py-16">
            <Construction className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              {description}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This page is ready to be implemented. Continue prompting to add the content you need.
            </p>
            <Button variant="outline">
              Request Implementation
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
