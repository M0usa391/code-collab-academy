
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("home");
  const [isAdmin, setIsAdmin] = useState(false);

  // جلب المستخدم الحالي
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
        
        // التحقق مما إذا كان المستخدم أدمن
        if (data.user.email === 'mousa.omar.com@gmail.com') {
          setIsAdmin(true);
        } else {
          const { data: adminData } = await supabase
            .from('admins')
            .select('*')
            .eq('user_id', data.user.id)
            .single();
          
          if (adminData) setIsAdmin(true);
        }
      }
      
      setLoading(false);
    };
    
    checkUser();
    
    // الاستماع لتغييرات المصادقة
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          
          // التحقق مما إذا كان المستخدم أدمن
          if (session.user.email === 'mousa.omar.com@gmail.com') {
            setIsAdmin(true);
          } else {
            const { data: adminData } = await supabase
              .from('admins')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            
            if (adminData) setIsAdmin(true);
          }
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      }
    );

    // جلب المنشورات
    fetchPosts();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // جلب المنشورات من قاعدة البيانات
  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setPosts(data || []);
    } catch (error) {
      console.error('خطأ في جلب المنشورات:', error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل المنشورات"
      });
    }
  };

  // تسجيل الدخول
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      toast({
        title: "تم تسجيل الدخول",
        description: "تم تسجيل الدخول بنجاح"
      });
      
      setActiveTab("home");
    } catch (error: any) {
      console.error('خطأ في تسجيل الدخول:', error);
      toast({
        variant: "destructive",
        title: "خطأ في تسجيل الدخول",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // تسجيل خروج
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل الخروج بنجاح"
      });
    } catch (error: any) {
      console.error('خطأ في تسجيل الخروج:', error);
      toast({
        variant: "destructive",
        title: "خطأ في تسجيل الخروج",
        description: error.message
      });
    }
  };

  // إنشاء حساب
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "تم إنشاء الحساب",
        description: "تم إنشاء الحساب بنجاح. يمكنك الآن تسجيل الدخول."
      });
      
      setActiveTab("login");
    } catch (error: any) {
      console.error('خطأ في إنشاء الحساب:', error);
      toast({
        variant: "destructive",
        title: "خطأ في إنشاء الحساب",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // إنشاء منشور
  const handleCreatePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      setActiveTab("login");
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const code = formData.get('code') as string;
    const category = formData.get('category') as string;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('posts')
        .insert([
          {
            title,
            content,
            code,
            category,
            user_id: user.id,
            likes_count: 0
          }
        ]);
      
      if (error) throw error;
      
      toast({
        title: "تم إنشاء المنشور",
        description: "تم نشر المنشور بنجاح"
      });
      
      // إعادة تحميل المنشورات
      fetchPosts();
      
      // إعادة تعيين النموذج
      e.currentTarget.reset();
      
      setActiveTab("home");
    } catch (error: any) {
      console.error('خطأ في إنشاء المنشور:', error);
      toast({
        variant: "destructive",
        title: "خطأ في إنشاء المنشور",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-blue-600">أكاديمية مشاركة الأكواد</h1>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              {user ? (
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="relative group">
                    <Button variant="ghost" className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}`} />
                        <AvatarFallback>{user.email?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{user.email}</span>
                    </Button>
                    <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden group-hover:block z-10">
                      <div className="py-1" role="menu">
                        <button 
                          className="w-full text-right block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
                          onClick={() => setActiveTab("profile")}
                        >
                          الملف الشخصي
                        </button>
                        {isAdmin && (
                          <button 
                            className="w-full text-right block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
                            onClick={() => setActiveTab("admin")}
                          >
                            لوحة الإدارة
                          </button>
                        )}
                        <button 
                          className="w-full text-right block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
                          onClick={handleLogout}
                        >
                          تسجيل الخروج
                        </button>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setActiveTab("create-post")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    نشر محتوى
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-4 space-x-reverse">
                  <Button variant="ghost" onClick={() => setActiveTab("login")}>
                    تسجيل الدخول
                  </Button>
                  <Button onClick={() => setActiveTab("register")}>
                    إنشاء حساب
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="home">الرئيسية</TabsTrigger>
            {!user && <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>}
            {!user && <TabsTrigger value="register">إنشاء حساب</TabsTrigger>}
            {user && <TabsTrigger value="create-post">نشر محتوى</TabsTrigger>}
            {user && <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>}
            {isAdmin && <TabsTrigger value="admin">لوحة الإدارة</TabsTrigger>}
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">مرحباً بك في أكاديمية مشاركة الأكواد</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">منصة لمشاركة الأكواد والنصائح البرمجية</p>
            </div>
            
            <h2 className="text-2xl font-bold mb-6">أحدث المنشورات</h2>
            
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <Card key={post.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center space-x-4 space-x-reverse mb-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${post.profiles?.username}`} />
                          <AvatarFallback>{post.profiles?.username?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{post.profiles?.username || 'مستخدم'}</p>
                          <p className="text-sm text-gray-500">{new Date(post.created_at).toLocaleDateString('ar-EG')}</p>
                        </div>
                      </div>
                      <CardTitle>{post.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {post.content}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      {post.code && (
                        <div className="bg-gray-800 text-gray-200 p-3 rounded overflow-x-auto text-sm mb-4 dir-ltr font-mono">
                          <pre>{post.code.length > 100 ? post.code.substring(0, 100) + '...' : post.code}</pre>
                        </div>
                      )}
                    </CardContent>
                    
                    <CardFooter className="flex justify-between pt-2">
                      <Button variant="ghost" size="sm" onClick={() => toast({ description: "هذه الميزة قيد التطوير" })}>
                        قراءة المزيد
                      </Button>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Button variant="ghost" size="sm" className="gap-1" onClick={() => toast({ description: "هذه الميزة قيد التطوير" })}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                          </svg>
                          <span>{post.likes_count || 0}</span>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-xl text-gray-500">لا توجد منشورات بعد</p>
                {user && (
                  <Button 
                    onClick={() => setActiveTab("create-post")}
                    className="mt-4"
                  >
                    إنشاء أول منشور
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="login">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>تسجيل الدخول</CardTitle>
                <CardDescription>أدخل بيانات حسابك للدخول</CardDescription>
              </CardHeader>
              <CardContent>
                <form id="login-form" onSubmit={handleLogin}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        placeholder="your@email.com" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">كلمة المرور</Label>
                      <Input 
                        id="password" 
                        name="password" 
                        type="password" 
                        required 
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'جاري التحميل...' : 'تسجيل الدخول'}
                    </Button>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-center">
                <p className="text-sm text-gray-500">
                  ليس لديك حساب؟{' '}
                  <Button variant="link" className="p-0" onClick={() => setActiveTab("register")}>
                    إنشاء حساب جديد
                  </Button>
                </p>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>إنشاء حساب جديد</CardTitle>
                <CardDescription>أدخل بياناتك لإنشاء حساب جديد</CardDescription>
              </CardHeader>
              <CardContent>
                <form id="register-form" onSubmit={handleRegister}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">اسم المستخدم</Label>
                      <Input 
                        id="username" 
                        name="username" 
                        type="text" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">البريد الإلكتروني</Label>
                      <Input 
                        id="reg-email" 
                        name="email" 
                        type="email" 
                        placeholder="your@email.com" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">كلمة المرور</Label>
                      <Input 
                        id="reg-password" 
                        name="password" 
                        type="password" 
                        required 
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'جاري التسجيل...' : 'إنشاء حساب'}
                    </Button>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-center">
                <p className="text-sm text-gray-500">
                  لديك حساب بالفعل؟{' '}
                  <Button variant="link" className="p-0" onClick={() => setActiveTab("login")}>
                    تسجيل الدخول
                  </Button>
                </p>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="create-post">
            {user ? (
              <Card>
                <CardHeader>
                  <CardTitle>إنشاء منشور جديد</CardTitle>
                  <CardDescription>شارك أكوادك ونصائحك مع مجتمع المبرمجين</CardDescription>
                </CardHeader>
                <CardContent>
                  <form id="create-post-form" onSubmit={handleCreatePost}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">عنوان المنشور</Label>
                        <Input 
                          id="title" 
                          name="title" 
                          placeholder="أدخل عنوان المنشور" 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="content">محتوى المنشور</Label>
                        <Textarea 
                          id="content" 
                          name="content" 
                          placeholder="اكتب محتوى المنشور هنا" 
                          rows={4}
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="code">الكود (اختياري)</Label>
                        <Textarea 
                          id="code" 
                          name="code" 
                          placeholder="أضف الكود هنا (اختياري)" 
                          rows={8}
                          className="font-mono" 
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">التصنيف</Label>
                        <select 
                          id="category" 
                          name="category"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="python">Python</option>
                          <option value="html_css">HTML/CSS</option>
                          <option value="react">React</option>
                          <option value="nodejs">Node.js</option>
                          <option value="other">أخرى</option>
                        </select>
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'جاري النشر...' : 'نشر المنشور'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4">يجب تسجيل الدخول أولاً</h2>
                <p className="mb-6 text-gray-600">يرجى تسجيل الدخول لإنشاء منشور جديد</p>
                <Button onClick={() => setActiveTab("login")}>
                  تسجيل الدخول
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile">
            {user ? (
              <div className="max-w-4xl mx-auto">
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>الملف الشخصي</CardTitle>
                    <CardDescription>معلومات حسابك الشخصي</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                      <Avatar className="w-32 h-32">
                        <AvatarImage src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}`} />
                        <AvatarFallback className="text-4xl">{user.email?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="md:flex-1 space-y-4">
                        <div>
                          <Label className="text-gray-500">اسم المستخدم</Label>
                          <p className="text-xl font-medium">{user.user_metadata?.username || user.email}</p>
                        </div>
                        
                        <div>
                          <Label className="text-gray-500">البريد الإلكتروني</Label>
                          <p>{user.email}</p>
                        </div>
                        
                        {isAdmin && (
                          <div className="pt-2">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                              مدير
                            </span>
                          </div>
                        )}
                        
                        <div className="pt-4">
                          <Button onClick={() => toast({ description: "ميزة تحديث الملف الشخصي قيد التطوير" })}>
                            تعديل الملف الشخصي
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>منشوراتي</CardTitle>
                    <CardDescription>المنشورات التي قمت بإنشائها</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {posts.filter(post => post.user_id === user.id).length > 0 ? (
                      <div className="space-y-6">
                        {posts
                          .filter(post => post.user_id === user.id)
                          .map(post => (
                            <div key={post.id} className="p-4 border rounded-lg hover:bg-gray-50">
                              <div className="flex justify-between items-start">
                                <h3 className="text-xl font-bold">{post.title}</h3>
                                <span className="text-sm text-gray-500">{new Date(post.created_at).toLocaleDateString('ar-EG')}</span>
                              </div>
                              <p className="mt-2 line-clamp-2">{post.content}</p>
                              <div className="mt-4 flex justify-end">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => toast({ description: "ميزة عرض المنشور قيد التطوير" })}
                                >
                                  عرض
                                </Button>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">لم تقم بإنشاء أي منشورات بعد</p>
                        <Button onClick={() => setActiveTab("create-post")}>
                          إنشاء منشور جديد
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4">يجب تسجيل الدخول أولاً</h2>
                <p className="mb-6 text-gray-600">يرجى تسجيل الدخول لعرض الملف الشخصي</p>
                <Button onClick={() => setActiveTab("login")}>
                  تسجيل الدخول
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="admin">
            {user && isAdmin ? (
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>لوحة الإدارة</CardTitle>
                    <CardDescription>إدارة المستخدمين والمنشورات</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-blue-50 p-6 rounded-lg">
                        <h3 className="text-xl font-bold text-blue-700 mb-2">المستخدمون</h3>
                        <p className="text-3xl">قيد التطوير</p>
                      </div>
                      <div className="bg-green-50 p-6 rounded-lg">
                        <h3 className="text-xl font-bold text-green-700 mb-2">المنشورات</h3>
                        <p className="text-3xl">{posts.length}</p>
                      </div>
                      <div className="bg-purple-50 p-6 rounded-lg">
                        <h3 className="text-xl font-bold text-purple-700 mb-2">المدراء</h3>
                        <p className="text-3xl">قيد التطوير</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>إدارة المنشورات</CardTitle>
                    <CardDescription>عرض وإدارة جميع المنشورات في الموقع</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-3 text-right">العنوان</th>
                            <th className="p-3 text-right">الكاتب</th>
                            <th className="p-3 text-right">التاريخ</th>
                            <th className="p-3 text-right">العمليات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {posts.map(post => (
                            <tr key={post.id} className="border-b hover:bg-gray-50">
                              <td className="p-3">{post.title}</td>
                              <td className="p-3">{post.profiles?.username || 'مستخدم'}</td>
                              <td className="p-3">{new Date(post.created_at).toLocaleDateString('ar-EG')}</td>
                              <td className="p-3">
                                <div className="flex space-x-2 space-x-reverse">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => toast({ description: "ميزة عرض المنشور قيد التطوير" })}
                                  >
                                    عرض
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => toast({ description: "ميزة حذف المنشور قيد التطوير" })}
                                  >
                                    حذف
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4">غير مصرح لك بالوصول</h2>
                <p className="mb-6 text-gray-600">هذه الصفحة مخصصة للمدراء فقط</p>
                <Button onClick={() => setActiveTab("home")}>
                  العودة للرئيسية
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold mb-2">أكاديمية البرمجة</h3>
              <p className="text-gray-300">منصة لمشاركة الأكواد والنصائح البرمجية بين المبرمجين</p>
            </div>
            <div>
              <h4 className="font-bold mb-2">روابط سريعة</h4>
              <ul>
                <li>
                  <Button 
                    variant="link" 
                    className="text-gray-300 hover:text-white p-0 h-auto"
                    onClick={() => setActiveTab("home")}
                  >
                    الرئيسية
                  </Button>
                </li>
                <li>
                  <Button 
                    variant="link" 
                    className="text-gray-300 hover:text-white p-0 h-auto"
                    onClick={() => toast({ description: "صفحة من نحن قيد التطوير" })}
                  >
                    من نحن
                  </Button>
                </li>
                <li>
                  <Button 
                    variant="link" 
                    className="text-gray-300 hover:text-white p-0 h-auto"
                    onClick={() => toast({ description: "صفحة شروط الاستخدام قيد التطوير" })}
                  >
                    شروط الاستخدام
                  </Button>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-300">
            <p>جميع الحقوق محفوظة &copy; أكاديمية البرمجة {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
