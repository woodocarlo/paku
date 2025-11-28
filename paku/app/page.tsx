"use client";
import { FileText, Clock, FlaskConical, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/BaseComponents';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Pending Assignments</p>
              <h2 className="text-3xl font-bold text-gray-800 mt-1">124</h2>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><FileText size={24} /></div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <Clock size={14} className="mr-1" />
            <span>Due within 2 days</span>
          </div>
        </Card>
        {/* Add other dashboard cards here as needed */}
         <Card className="border-l-4 border-l-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Lab Reports Scanned</p>
              <h2 className="text-3xl font-bold text-gray-800 mt-1">45</h2>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><FlaskConical size={24} /></div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Class Average</p>
              <h2 className="text-3xl font-bold text-gray-800 mt-1">87%</h2>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><BarChart3 size={24} /></div>
          </div>
        </Card>
      </div>
    </div>
  );
}