import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { useToast } from '../components/ui/use-toast';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';

// 게시글 타입 정의
interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  isImportant: boolean;
}

// 새 게시글 작성 타입
interface NewPost {
  title: string;
  content: string;
  isImportant?: boolean;
}

const PostBoard: React.FC = () => {
  const { toast } = useToast();
  const { user } = React.useContext(AuthContext);
  const queryClient = useQueryClient();
  
  // 상태 관리
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newPost, setNewPost] = useState<NewPost>({
    title: '',
    content: '',
    isImportant: false
  });
  
  // 탭 상태
  const [activeTab, setActiveTab] = useState('all');
  
  // 게시글 목록 조회
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const response = await axios.get<Post[]>('/api/posts');
      return response.data;
    }
  });
  
  // 게시글 작성 뮤테이션
  const createPostMutation = useMutation({
    mutationFn: async (post: NewPost) => {
      const response = await axios.post('/api/posts', post);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: '게시글이 작성되었습니다.',
        description: '새 게시글이 성공적으로 등록되었습니다.',
        variant: 'default'
      });
    },
    onError: (error) => {
      console.error('게시글 작성 실패:', error);
      toast({
        title: '게시글 작성 실패',
        description: '게시글을 작성하는 중 오류가 발생했습니다.',
        variant: 'destructive'
      });
    }
  });
  
  // 게시글 수정 뮤테이션
  const updatePostMutation = useMutation({
    mutationFn: async ({ id, post }: { id: string; post: Partial<NewPost> }) => {
      const response = await axios.put(`/api/posts/${id}`, post);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setIsEditDialogOpen(false);
      resetForm();
      toast({
        title: '게시글이 수정되었습니다.',
        description: '게시글이 성공적으로 수정되었습니다.',
        variant: 'default'
      });
    },
    onError: (error) => {
      console.error('게시글 수정 실패:', error);
      toast({
        title: '게시글 수정 실패',
        description: '게시글을 수정하는 중 오류가 발생했습니다.',
        variant: 'destructive'
      });
    }
  });
  
  // 게시글 삭제 뮤테이션
  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setIsViewDialogOpen(false);
      toast({
        title: '게시글이 삭제되었습니다.',
        description: '게시글이 성공적으로 삭제되었습니다.',
        variant: 'default'
      });
    },
    onError: (error) => {
      console.error('게시글 삭제 실패:', error);
      toast({
        title: '게시글 삭제 실패',
        description: '게시글을 삭제하는 중 오류가 발생했습니다.',
        variant: 'destructive'
      });
    }
  });
  
  // 폼 초기화
  const resetForm = () => {
    setNewPost({
      title: '',
      content: '',
      isImportant: false
    });
    setSelectedPost(null);
  };
  
  // 게시글 작성 핸들러
  const handleCreatePost = () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast({
        title: '입력 오류',
        description: '제목과 내용을 모두 입력해주세요.',
        variant: 'destructive'
      });
      return;
    }
    
    createPostMutation.mutate(newPost);
  };
  
  // 게시글 수정 핸들러
  const handleUpdatePost = () => {
    if (!selectedPost) return;
    
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast({
        title: '입력 오류',
        description: '제목과 내용을 모두 입력해주세요.',
        variant: 'destructive'
      });
      return;
    }
    
    updatePostMutation.mutate({
      id: selectedPost.id,
      post: {
        title: newPost.title,
        content: newPost.content,
        isImportant: newPost.isImportant
      }
    });
  };
  
  // 게시글 삭제 핸들러
  const handleDeletePost = () => {
    if (!selectedPost) return;
    
    if (window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      deletePostMutation.mutate(selectedPost.id);
    }
  };
  
  // 게시글 보기 핸들러
  const handleViewPost = (post: Post) => {
    setSelectedPost(post);
    setIsViewDialogOpen(true);
  };
  
  // 게시글 수정 다이얼로그 열기
  const handleOpenEditDialog = (post: Post) => {
    setSelectedPost(post);
    setNewPost({
      title: post.title,
      content: post.content,
      isImportant: post.isImportant
    });
    setIsEditDialogOpen(true);
  };
  
  // 게시글 작성 다이얼로그 열기
  const handleOpenCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };
  
  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 게시글 필터링
  const filteredPosts = posts.filter(post => {
    // 검색어 필터링
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 탭 필터링
    if (activeTab === 'important') {
      return matchesSearch && post.isImportant;
    }
    
    return matchesSearch;
  });
  
  // 작성자 본인 확인
  const isAuthor = (post: Post) => {
    return user && String(user.id) === post.authorId;
  };
  
  const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin' || user.role === 'manager');
  
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">게시판</CardTitle>
              <CardDescription>
                중요 공지사항 및 게시글을 확인하세요
              </CardDescription>
            </div>
            <Button onClick={handleOpenCreateDialog}>
              새 게시글 작성
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Tabs 
              defaultValue="all" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList>
                <TabsTrigger value="all">전체 게시글</TabsTrigger>
                <TabsTrigger value="important">중요 공지</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex-1 ml-4">
              <Input
                placeholder="게시글 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">게시글을 불러오는 중...</span>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? '검색 결과가 없습니다.' : '게시글이 없습니다. 첫 게시글을 작성해보세요!'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <Card 
                  key={post.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    post.isImportant ? 'border-l-4 border-red-500' : ''
                  }`}
                  onClick={() => handleViewPost(post)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg">
                          {post.isImportant && (
                            <Badge variant="destructive" className="mr-2">중요</Badge>
                          )}
                          {post.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {post.content.length > 100 
                            ? post.content.substring(0, 100) + '...' 
                            : post.content}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                      <span>작성자: {post.authorName}</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 게시글 작성 다이얼로그 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>새 게시글 작성</DialogTitle>
            <DialogDescription>
              아래 양식을 작성하여 새 게시글을 등록하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="제목"
                value={newPost.title}
                onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                className="flex-1"
              />
              {isAdmin && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isImportant"
                    checked={newPost.isImportant}
                    onChange={(e) => setNewPost({...newPost, isImportant: e.target.checked})}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <label htmlFor="isImportant" className="text-sm font-medium">
                    중요 공지
                  </label>
                </div>
              )}
            </div>
            <Textarea
              placeholder="내용을 입력하세요..."
              value={newPost.content}
              onChange={(e) => setNewPost({...newPost, content: e.target.value})}
              className="min-h-[200px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreatePost}>
              게시글 등록
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 게시글 수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>게시글 수정</DialogTitle>
            <DialogDescription>
              게시글 내용을 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="제목"
                value={newPost.title}
                onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                className="flex-1"
              />
              {isAdmin && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="editIsImportant"
                    checked={newPost.isImportant}
                    onChange={(e) => setNewPost({...newPost, isImportant: e.target.checked})}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <label htmlFor="editIsImportant" className="text-sm font-medium">
                    중요 공지
                  </label>
                </div>
              )}
            </div>
            <Textarea
              placeholder="내용을 입력하세요..."
              value={newPost.content}
              onChange={(e) => setNewPost({...newPost, content: e.target.value})}
              className="min-h-[200px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleUpdatePost}>
              수정 완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 게시글 보기 다이얼로그 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          {selectedPost && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  {selectedPost.isImportant && (
                    <Badge variant="destructive" className="mr-2">중요</Badge>
                  )}
                  {selectedPost.title}
                </DialogTitle>
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>작성자: {selectedPost.authorName}</span>
                  <span>{formatDate(selectedPost.createdAt)}</span>
                </div>
              </DialogHeader>
              <div className="py-4">
                <div className="whitespace-pre-wrap">{selectedPost.content}</div>
              </div>
              <DialogFooter className="flex justify-between">
                <div>
                  {(isAuthor(selectedPost) || isAdmin) && (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditDialog(selectedPost);
                          setIsViewDialogOpen(false);
                        }}
                        className="mr-2"
                      >
                        수정
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePost();
                        }}
                      >
                        삭제
                      </Button>
                    </>
                  )}
                </div>
                <Button onClick={() => setIsViewDialogOpen(false)}>
                  닫기
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostBoard; 