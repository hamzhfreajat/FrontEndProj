import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../ui';

export default function NotFound() {
  return (
    <div className="card">
      <EmptyState icon={Compass} title="الصفحة غير موجودة" description="الرابط الذي فتحته لا يقود إلى أي صفحة في اللوحة.">
        <Link className="btn" to="/">
          العودة إلى الرئيسية
        </Link>
      </EmptyState>
    </div>
  );
}
