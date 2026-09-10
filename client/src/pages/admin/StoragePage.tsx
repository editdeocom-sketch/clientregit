import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { HardDrive, Users, Film } from 'lucide-react';

interface StorageData {
  totalStorage: number;
  byPlan: Array<{
    slug: string;
    name: string;
    storage_bytes: number;
    used_storage: number;
    user_count: number;
  }>;
  largestUsers: Array<{
    id: number;
    name: string;
    email: string;
    total_storage: number;
    video_count: number;
  }>;
  largestVideos: Array<{
    id: number;
    title: string;
    file_size: number;
    file_name: string;
    uploader_name: string;
  }>;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function StoragePage() {
  const [data, setData] = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get<{ success: boolean; data: StorageData }>('/admin/storage');
      if (res.success) setData(res.data);
    } catch {
      toast.error('Failed to load storage data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <HardDrive className="h-6 w-6" />
          Storage
        </h1>
        <p className="text-muted-foreground mt-1">Overview of storage usage across the platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Storage</p>
            <p className="text-2xl font-bold mt-1">{formatBytes(data?.totalStorage ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold mt-1">
              {data?.byPlan.reduce((sum, p) => sum + p.user_count, 0) ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Videos</p>
            <p className="text-2xl font-bold mt-1">
              {data?.largestUsers.reduce((sum, u) => sum + u.video_count, 0) ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Storage by Plan</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.byPlan && data.byPlan.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Storage Limit</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Users</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byPlan.map((plan) => (
                  <TableRow key={plan.slug}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>{formatBytes(plan.storage_bytes)}</TableCell>
                    <TableCell>{formatBytes(plan.used_storage)}</TableCell>
                    <TableCell>{plan.user_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">No data available</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Largest Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.largestUsers && data.largestUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Storage</TableHead>
                    <TableHead>Videos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.largestUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatBytes(user.total_storage)}</TableCell>
                      <TableCell>{user.video_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">No data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Film className="h-5 w-5" />
              Largest Videos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.largestVideos && data.largestVideos.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Video</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploader</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.largestVideos.map((video) => (
                    <TableRow key={video.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm truncate max-w-[150px]">{video.title || video.file_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatBytes(video.file_size)}</TableCell>
                      <TableCell className="text-sm">{video.uploader_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">No videos</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
