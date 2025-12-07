'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Row, Col, Nav } from 'react-bootstrap';
import { DatabaseFill, PeopleFill } from 'react-bootstrap-icons';
import { ItemCategory } from '@prisma/client';
import { getDatabaseItems } from '@/lib/dbActions';
import AdminUserPanel from '@/components/admin/AdminUserPanel';
import AdminDatabaseItemPanel from '@/components/admin/AdminDatabaseItemPanel';

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'USER' | 'ADMIN';
  isMerchant: boolean;
  merchantApproved: boolean;
}

interface DatabaseItem {
  id: number;
  name: string;
  itemCategory: ItemCategory;
  approved: boolean;
}

interface AdminPageClientProps {
  initialUsers: AdminUser[];
  initialItems: DatabaseItem[];
}

export default function AdminPageClient({ initialUsers, initialItems }: AdminPageClientProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'users' | 'items'>('users');
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'items') {
      setActiveTab('items');
    }
  }, [searchParams]);

  const handleRefreshItems = async () => {
    const updated = await getDatabaseItems();
    setItems(updated);
  };

  return (
    <Row>
      <Col md={2} className="mb-3">
        <Nav className="flex-column">
          <Nav.Link
            onClick={() => setActiveTab('users')}
            className={`${activeTab === 'users' ? 'fw-bold' : 'text-dark'} d-flex align-items-center`}
            style={{
              cursor: 'pointer',
              color: activeTab === 'users' ? 'white' : undefined,
              backgroundColor: activeTab === 'users' ? '#7fb5acff' : 'transparent',
              borderRadius: '0.25rem',
            }}
          >
            <PeopleFill className="me-2" />
            Users
          </Nav.Link>
          <Nav.Link
            onClick={() => setActiveTab('items')}
            className={`${activeTab === 'items' ? 'fw-bold' : 'text-dark'} d-flex align-items-center`}
            style={{
              cursor: 'pointer',
              color: activeTab === 'items' ? 'white' : undefined,
              backgroundColor: activeTab === 'items' ? '#7fb5acff' : 'transparent',
              borderRadius: '0.25rem',
            }}
          >
            <DatabaseFill className="me-2" />
            Database Items
          </Nav.Link>
        </Nav>
      </Col>
      <Col md={10}>
        {activeTab === 'users' && <AdminUserPanel initialUsers={initialUsers} />}
        {activeTab === 'items' && <AdminDatabaseItemPanel initialItems={items} onRefresh={handleRefreshItems} />}
      </Col>
    </Row>
  );
}
