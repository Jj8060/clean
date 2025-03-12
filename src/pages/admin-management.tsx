import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminManagement from '@/components/AdminManagement';

const AdminManagementPage = () => {
  const router = useRouter();
  const [isRootAdmin, setIsRootAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 检查是否是终端管理员
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser || !JSON.parse(adminUser).isRoot) {
      router.push('/');
    } else {
      setIsRootAdmin(true);
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  if (!isRootAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#2a63b7]">管理员管理</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            返回首页
          </button>
        </div>
        <AdminManagement />
      </div>
    </div>
  );
};

export default AdminManagementPage; 