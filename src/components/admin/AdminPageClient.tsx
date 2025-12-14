'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Row, Col, Nav } from 'react-bootstrap';
import { DatabaseFill, PeopleFill, TagFill } from 'react-bootstrap-icons';
import { ItemCategory } from '@prisma/client';
import { getDatabaseItems, getTags } from '@/lib/dbActions';
import AdminUserPanel from '@/components/admin/AdminUserPanel';
import AdminDatabaseItemPanel from '@/components/admin/AdminDatabaseItemPanel';
import AdminTagPanel from './AdminTagPanel';

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

interface Tag {
  id: number;
  name: string;
  category: string;
  recipeCount: number;
}

interface AdminPageClientProps {
  initialUsers: AdminUser[];
  initialItems: DatabaseItem[];
  initialTags: Tag[];
}

export default function AdminPageClient({ initialUsers, initialItems, initialTags }: AdminPageClientProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'users' | 'items' | 'tags'>('users');
  const [items, setItems] = useState(initialItems);
  const [tags, setTags] = useState(initialTags);

  useEffect(() => {
  const tab = searchParams?.get('tab');
    if (tab === 'items') {
      setActiveTab('items');
    } else if (tab === 'tags') {
      setActiveTab('tags');
    }
  }, [searchParams]);

  const handleRefreshItems = async () => {
    const updated = await getDatabaseItems();
    setItems(updated);
  };

  const handleRefreshTags = async () => {
    const updated = await getTags();
    setTags(updated);
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
          <Nav.Link
            onClick={() => setActiveTab('tags')}
            className={`${activeTab === 'tags' ? 'fw-bold' : 'text-dark'} d-flex align-items-center`}
            style={{
              cursor: 'pointer',
              color: activeTab === 'tags' ? 'white' : undefined,
              backgroundColor: activeTab === 'tags' ? '#7fb5acff' : 'transparent',
              borderRadius: '0.25rem',
            }}
          >
            <TagFill className="me-2" />
            Tags
          </Nav.Link>
        </Nav>
      </Col>
      <Col md={10}>
        {activeTab === 'users' && <AdminUserPanel initialUsers={initialUsers} />}
        {activeTab === 'items' && <AdminDatabaseItemPanel initialItems={items} onRefresh={handleRefreshItems} />}
        {activeTab === 'tags' && <AdminTagPanel initialTags={tags} onRefresh={handleRefreshTags} />}
      </Col>
    </Row>
  );
}
