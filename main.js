
// إعداد Supabase
const SUPABASE_URL = 'https://your-supabase-url.supabase.co';
const SUPABASE_KEY = 'your-supabase-anon-key';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// حالة التطبيق
const state = {
  user: null,
  posts: [],
  currentPage: 'home',
  isAdmin: false,
  isLoading: false
};

// عناصر DOM
const app = document.getElementById('app');

// تهيئة التطبيق
async function initApp() {
  // التحقق من حالة تسجيل الدخول
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    state.user = user;
    // التحقق من الأدمن
    if (user.email === 'mousa.omar.com@gmail.com') {
      state.isAdmin = true;
    } else {
      // تحقق من جدول الأدمن
      const { data } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) state.isAdmin = true;
    }
  }
  
  // تحديث UI
  renderApp();
  
  // إضافة مستمعي الأحداث
  window.addEventListener('hashchange', handleRouteChange);
  handleRouteChange();
}

// التوجيه
function handleRouteChange() {
  const hash = window.location.hash.slice(1) || 'home';
  const [page, id] = hash.split('/');
  state.currentPage = page;
  
  switch (page) {
    case 'home':
      renderHomePage();
      break;
    case 'login':
      renderLoginPage();
      break;
    case 'register':
      renderRegisterPage();
      break;
    case 'profile':
      renderProfilePage(id);
      break;
    case 'post':
      renderPostPage(id);
      break;
    case 'create-post':
      renderCreatePostPage();
      break;
    case 'admin':
      renderAdminPage();
      break;
    default:
      renderHomePage();
  }
}

// عرض التطبيق الأساسي
function renderApp() {
  app.innerHTML = `
    <header class="bg-white shadow">
      <nav class="container mx-auto px-4 py-3 flex justify-between items-center">
        <a href="#home" class="text-xl font-bold text-blue-600">أكاديمية البرمجة</a>
        <div class="flex items-center space-x-4 space-x-reverse">
          ${state.user ? `
            <div class="relative group">
              <button class="flex items-center space-x-2 space-x-reverse">
                <img src="${state.user.user_metadata?.avatar_url || 'https://ui-avatars.com/api/?name=' + state.user.email}" 
                     class="h-8 w-8 rounded-full" 
                     alt="${state.user.email}">
                <span>${state.user.email}</span>
              </button>
              <div class="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden group-hover:block z-10">
                <div class="py-1" role="menu" aria-orientation="vertical">
                  <a href="#profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">الملف الشخصي</a>
                  ${state.isAdmin ? `<a href="#admin" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">لوحة الإدارة</a>` : ''}
                  <button id="logout-btn" class="w-full text-right block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">تسجيل الخروج</button>
                </div>
              </div>
            </div>
            <a href="#create-post" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">نشر محتوى</a>
          ` : `
            <a href="#login" class="text-blue-600 hover:text-blue-800">تسجيل الدخول</a>
            <a href="#register" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">إنشاء حساب</a>
          `}
        </div>
      </nav>
    </header>
    <main id="main-content" class="container mx-auto px-4 py-8">
      <!-- سيتم تحميل المحتوى هنا -->
    </main>
    <footer class="bg-gray-800 text-white py-8">
      <div class="container mx-auto px-4">
        <div class="flex flex-col md:flex-row justify-between">
          <div class="mb-4 md:mb-0">
            <h3 class="text-xl font-bold mb-2">أكاديمية البرمجة</h3>
            <p class="text-gray-300">منصة لمشاركة الأكواد والنصائح البرمجية بين المبرمجين</p>
          </div>
          <div>
            <h4 class="font-bold mb-2">روابط سريعة</h4>
            <ul>
              <li><a href="#home" class="text-gray-300 hover:text-white transition">الرئيسية</a></li>
              <li><a href="#about" class="text-gray-300 hover:text-white transition">من نحن</a></li>
              <li><a href="#terms" class="text-gray-300 hover:text-white transition">شروط الاستخدام</a></li>
            </ul>
          </div>
        </div>
        <div class="mt-8 text-center text-gray-300">
          <p>جميع الحقوق محفوظة &copy; أكاديمية البرمجة ${new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  `;

  // إضافة مستمعي الأحداث
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

// صفحة الرئيسية
async function renderHomePage() {
  const mainContent = document.getElementById('main-content');
  showLoading(mainContent);
  
  try {
    // جلب المنشورات
    const { data: posts, error } = await supabase
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
    
    state.posts = posts;
    
    mainContent.innerHTML = `
      <section class="text-center mb-12">
        <h1 class="text-4xl font-bold mb-4">مرحباً بك في أكاديمية البرمجة</h1>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto">منصة لمشاركة الأكواد والنصائح البرمجية بين المبرمجين</p>
      </section>
      
      <section>
        <h2 class="text-2xl font-bold mb-6">أحدث المنشورات</h2>
        <div id="posts-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${posts.length > 0 ? 
            posts.map(post => renderPostCard(post)).join('') : 
            '<p class="col-span-3 text-center py-8">لا توجد منشورات بعد</p>'
          }
        </div>
      </section>
    `;
  } catch (error) {
    console.error('Error fetching posts:', error);
    mainContent.innerHTML = `
      <div class="text-center py-8">
        <p class="text-red-500">حدث خطأ أثناء تحميل المنشورات. يرجى المحاولة مرة أخرى.</p>
      </div>
    `;
  }
}

// بطاقة المنشور
function renderPostCard(post) {
  return `
    <div class="post fade-in">
      <div class="post-author">
        <img src="${post.profiles?.avatar_url || 'https://ui-avatars.com/api/?name=' + post.profiles?.username}" alt="${post.profiles?.username}">
        <div>
          <p class="font-bold">${post.profiles?.username || 'مستخدم'}</p>
          <p class="text-sm text-gray-500">${new Date(post.created_at).toLocaleDateString('ar-EG')}</p>
        </div>
      </div>
      <h3 class="text-xl font-bold mb-2">${post.title}</h3>
      <p class="mb-4">${post.content.substring(0, 150)}${post.content.length > 150 ? '...' : ''}</p>
      ${post.code ? `
        <div class="code-block">
          <pre>${truncateCode(post.code, 100)}</pre>
          ${post.code.length > 100 ? '...' : ''}
        </div>
      ` : ''}
      <div class="flex justify-between items-center mt-4">
        <a href="#post/${post.id}" class="text-blue-600 hover:text-blue-800">قراءة المزيد</a>
        <div class="flex items-center space-x-2 space-x-reverse">
          <button class="like-button flex items-center space-x-1 space-x-reverse text-gray-500 hover:text-blue-600" data-post-id="${post.id}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            <span>${post.likes_count || 0}</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

// تسجيل الدخول
function renderLoginPage() {
  const mainContent = document.getElementById('main-content');
  
  mainContent.innerHTML = `
    <div class="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 class="text-2xl font-bold mb-6 text-center">تسجيل الدخول</h2>
      <form id="login-form">
        <div class="mb-4">
          <label for="email" class="block text-gray-700 mb-2">البريد الإلكتروني</label>
          <input type="email" id="email" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
        </div>
        <div class="mb-6">
          <label for="password" class="block text-gray-700 mb-2">كلمة المرور</label>
          <input type="password" id="password" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
        </div>
        <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">دخول</button>
      </form>
      <p class="mt-4 text-center">
        ليس لديك حساب؟ <a href="#register" class="text-blue-600 hover:text-blue-800">إنشاء حساب جديد</a>
      </p>
    </div>
  `;
  
  // إضافة مستمعي الأحداث
  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', handleLogin);
}

// إنشاء حساب
function renderRegisterPage() {
  const mainContent = document.getElementById('main-content');
  
  mainContent.innerHTML = `
    <div class="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 class="text-2xl font-bold mb-6 text-center">إنشاء حساب جديد</h2>
      <form id="register-form">
        <div class="mb-4">
          <label for="username" class="block text-gray-700 mb-2">اسم المستخدم</label>
          <input type="text" id="username" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
        </div>
        <div class="mb-4">
          <label for="email" class="block text-gray-700 mb-2">البريد الإلكتروني</label>
          <input type="email" id="email" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
        </div>
        <div class="mb-6">
          <label for="password" class="block text-gray-700 mb-2">كلمة المرور</label>
          <input type="password" id="password" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
        </div>
        <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">إنشاء حساب</button>
      </form>
      <p class="mt-4 text-center">
        لديك حساب بالفعل؟ <a href="#login" class="text-blue-600 hover:text-blue-800">تسجيل الدخول</a>
      </p>
    </div>
  `;
  
  // إضافة مستمعي الأحداث
  const registerForm = document.getElementById('register-form');
  registerForm.addEventListener('submit', handleRegister);
}

// إنشاء منشور
function renderCreatePostPage() {
  if (!state.user) {
    window.location.hash = '#login';
    return;
  }
  
  const mainContent = document.getElementById('main-content');
  
  mainContent.innerHTML = `
    <div class="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 class="text-2xl font-bold mb-6">إنشاء منشور جديد</h2>
      <form id="create-post-form">
        <div class="mb-4">
          <label for="title" class="block text-gray-700 mb-2">عنوان المنشور</label>
          <input type="text" id="title" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
        </div>
        <div class="mb-4">
          <label for="content" class="block text-gray-700 mb-2">محتوى المنشور</label>
          <textarea id="content" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required></textarea>
        </div>
        <div class="mb-4">
          <label for="code" class="block text-gray-700 mb-2">الكود (اختياري)</label>
          <textarea id="code" rows="8" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" dir="ltr"></textarea>
        </div>
        <div class="mb-6">
          <label for="category" class="block text-gray-700 mb-2">التصنيف</label>
          <select id="category" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="html_css">HTML/CSS</option>
            <option value="react">React</option>
            <option value="nodejs">Node.js</option>
            <option value="other">أخرى</option>
          </select>
        </div>
        <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">نشر</button>
      </form>
    </div>
  `;
  
  // إضافة مستمعي الأحداث
  const createPostForm = document.getElementById('create-post-form');
  createPostForm.addEventListener('submit', handleCreatePost);
}

// صفحة المنشور
async function renderPostPage(postId) {
  const mainContent = document.getElementById('main-content');
  showLoading(mainContent);
  
  try {
    // جلب المنشور
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          avatar_url
        ),
        comments(
          *,
          profiles:user_id (
            id,
            username,
            avatar_url
          )
        )
      `)
      .eq('id', postId)
      .single();
    
    if (error) throw error;
    
    mainContent.innerHTML = `
      <div class="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div class="mb-6">
          <div class="flex justify-between items-start">
            <div class="post-author">
              <img src="${post.profiles?.avatar_url || 'https://ui-avatars.com/api/?name=' + post.profiles?.username}" alt="${post.profiles?.username}">
              <div>
                <p class="font-bold">${post.profiles?.username || 'مستخدم'}</p>
                <p class="text-sm text-gray-500">${new Date(post.created_at).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>
            ${state.user && (state.isAdmin || state.user.id === post.user_id) ? `
              <div class="flex space-x-2 space-x-reverse">
                <button class="text-blue-600 hover:text-blue-800 edit-post-btn" data-post-id="${post.id}">تعديل</button>
                <button class="text-red-600 hover:text-red-800 delete-post-btn" data-post-id="${post.id}">حذف</button>
              </div>
            ` : ''}
          </div>
          <h1 class="text-3xl font-bold mt-4 mb-2">${post.title}</h1>
          <div class="flex items-center space-x-2 space-x-reverse mb-4">
            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">${getCategoryName(post.category)}</span>
          </div>
        </div>
        
        <div class="post-content mb-8">
          <p class="mb-4 whitespace-pre-line">${post.content}</p>
          ${post.code ? `
            <div class="code-block">
              <button class="copy-button" data-code="${escapeHTML(post.code)}">نسخ</button>
              <pre>${post.code}</pre>
            </div>
          ` : ''}
        </div>
        
        <hr class="my-8">
        
        <div class="comments-section">
          <h3 class="text-xl font-bold mb-4">التعليقات (${post.comments.length})</h3>
          
          ${state.user ? `
            <form id="comment-form" class="mb-6">
              <input type="hidden" id="post-id" value="${post.id}">
              <div class="mb-4">
                <label for="comment" class="block text-gray-700 mb-2">أضف تعليقاً</label>
                <textarea id="comment" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required></textarea>
              </div>
              <button type="submit" class="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">إرسال</button>
            </form>
          ` : `
            <p class="mb-6 text-center">
              <a href="#login" class="text-blue-600 hover:text-blue-800">سجل دخول</a> لإضافة تعليق
            </p>
          `}
          
          <div id="comments-list">
            ${post.comments.length > 0 ? 
              post.comments
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map(comment => `
                  <div class="comment bg-gray-50 p-4 rounded-md mb-4">
                    <div class="flex justify-between items-start">
                      <div class="post-author">
                        <img src="${comment.profiles?.avatar_url || 'https://ui-avatars.com/api/?name=' + comment.profiles?.username}" alt="${comment.profiles?.username}">
                        <div>
                          <p class="font-bold">${comment.profiles?.username || 'مستخدم'}</p>
                          <p class="text-sm text-gray-500">${new Date(comment.created_at).toLocaleDateString('ar-EG')}</p>
                        </div>
                      </div>
                      ${state.user && (state.isAdmin || state.user.id === comment.user_id) ? `
                        <button class="text-red-600 hover:text-red-800 delete-comment-btn" data-comment-id="${comment.id}">حذف</button>
                      ` : ''}
                    </div>
                    <p class="mt-2">${comment.content}</p>
                  </div>
                `).join('') : 
              '<p class="text-center py-4">لا توجد تعليقات بعد. كن أول من يعلق!</p>'
            }
          </div>
        </div>
      </div>
    `;
    
    // إضافة مستمعي الأحداث
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
      commentForm.addEventListener('submit', handleAddComment);
    }
    
    const copyButtons = document.querySelectorAll('.copy-button');
    copyButtons.forEach(button => {
      button.addEventListener('click', handleCopyCode);
    });
    
    const editPostButtons = document.querySelectorAll('.edit-post-btn');
    editPostButtons.forEach(button => {
      button.addEventListener('click', handleEditPost);
    });
    
    const deletePostButtons = document.querySelectorAll('.delete-post-btn');
    deletePostButtons.forEach(button => {
      button.addEventListener('click', handleDeletePost);
    });
    
    const deleteCommentButtons = document.querySelectorAll('.delete-comment-btn');
    deleteCommentButtons.forEach(button => {
      button.addEventListener('click', handleDeleteComment);
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    mainContent.innerHTML = `
      <div class="text-center py-8">
        <p class="text-red-500">حدث خطأ أثناء تحميل المنشور. يرجى المحاولة مرة أخرى.</p>
        <a href="#home" class="text-blue-600 hover:text-blue-800 mt-4 inline-block">العودة للرئيسية</a>
      </div>
    `;
  }
}

// صفحة الملف الشخصي
async function renderProfilePage(userId) {
  const mainContent = document.getElementById('main-content');
  showLoading(mainContent);
  
  if (!state.user && !userId) {
    window.location.hash = '#login';
    return;
  }
  
  const profileId = userId || state.user.id;
  
  try {
    // جلب بيانات المستخدم
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();
    
    if (profileError) throw profileError;
    
    // جلب منشورات المستخدم
    const { data: userPosts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', profileId)
      .order('created_at', { ascending: false });
    
    if (postsError) throw postsError;
    
    // التحقق مما إذا كان المستخدم أدمن
    let isUserAdmin = false;
    if (profileId === state.user?.id && state.isAdmin) {
      isUserAdmin = true;
    } else if (profileId !== state.user?.id) {
      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', profileId)
        .single();
      
      if (adminData) isUserAdmin = true;
    }
    
    const isCurrentUser = state.user && profileId === state.user.id;
    
    mainContent.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="bg-white p-8 rounded-lg shadow-md mb-8">
          <div class="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div class="w-32 h-32 relative">
              <img src="${profile.avatar_url || 'https://ui-avatars.com/api/?name=' + profile.username}" 
                  class="w-32 h-32 rounded-full object-cover" 
                  alt="${profile.username}">
              ${isCurrentUser ? `
                <button id="change-avatar-btn" class="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              ` : ''}
            </div>
            <div class="md:flex-1">
              <div class="flex justify-between items-start">
                <div>
                  <h1 class="text-2xl font-bold">${profile.username}</h1>
                  <p class="text-gray-600">${profile.email}</p>
                  ${isUserAdmin ? '<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm mt-2 inline-block">مدير</span>' : ''}
                </div>
                ${state.isAdmin && !isCurrentUser ? `
                  <div>
                    ${isUserAdmin ? `
                      <button id="remove-admin-btn" class="text-red-600 hover:text-red-800" data-user-id="${profileId}">إزالة الإدارة</button>
                    ` : `
                      <button id="make-admin-btn" class="text-blue-600 hover:text-blue-800" data-user-id="${profileId}">تعيين كمدير</button>
                    `}
                  </div>
                ` : ''}
              </div>
              <p class="mt-4">${profile.bio || 'لا يوجد وصف'}</p>
              
              ${isCurrentUser ? `
                <div class="mt-4">
                  <button id="edit-profile-btn" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">تعديل الملف الشخصي</button>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
        
        <div class="bg-white p-8 rounded-lg shadow-md">
          <h2 class="text-2xl font-bold mb-6">المنشورات (${userPosts.length})</h2>
          <div id="user-posts" class="space-y-6">
            ${userPosts.length > 0 ? 
              userPosts.map(post => `
                <div class="post">
                  <h3 class="text-xl font-bold mb-2">${post.title}</h3>
                  <p class="mb-4">${post.content.substring(0, 150)}${post.content.length > 150 ? '...' : ''}</p>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-500">${new Date(post.created_at).toLocaleDateString('ar-EG')}</span>
                    <a href="#post/${post.id}" class="text-blue-600 hover:text-blue-800">قراءة المزيد</a>
                  </div>
                </div>
              `).join('') : 
              '<p class="text-center py-4">لا توجد منشورات بعد</p>'
            }
          </div>
        </div>
      </div>
    `;
    
    // إضافة مستمعي الأحداث
    if (isCurrentUser) {
      const editProfileBtn = document.getElementById('edit-profile-btn');
      editProfileBtn.addEventListener('click', showEditProfileModal);
      
      const changeAvatarBtn = document.getElementById('change-avatar-btn');
      changeAvatarBtn.addEventListener('click', showChangeAvatarModal);
    }
    
    if (state.isAdmin && !isCurrentUser) {
      const makeAdminBtn = document.getElementById('make-admin-btn');
      if (makeAdminBtn) {
        makeAdminBtn.addEventListener('click', handleMakeAdmin);
      }
      
      const removeAdminBtn = document.getElementById('remove-admin-btn');
      if (removeAdminBtn) {
        removeAdminBtn.addEventListener('click', handleRemoveAdmin);
      }
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    mainContent.innerHTML = `
      <div class="text-center py-8">
        <p class="text-red-500">حدث خطأ أثناء تحميل الملف الشخصي. يرجى المحاولة مرة أخرى.</p>
        <a href="#home" class="text-blue-600 hover:text-blue-800 mt-4 inline-block">العودة للرئيسية</a>
      </div>
    `;
  }
}

// صفحة الأدمن
async function renderAdminPage() {
  if (!state.user || !state.isAdmin) {
    window.location.hash = '#home';
    return;
  }
  
  const mainContent = document.getElementById('main-content');
  showLoading(mainContent);
  
  try {
    // جلب المستخدمين
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*');
    
    if (usersError) throw usersError;
    
    // جلب المنشورات
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          email
        )
      `)
      .order('created_at', { ascending: false });
    
    if (postsError) throw postsError;
    
    // جلب الأدمن
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('*');
    
    if (adminsError) throw adminsError;
    
    const adminIds = admins.map(admin => admin.user_id);
    
    mainContent.innerHTML = `
      <div class="max-w-6xl mx-auto">
        <h1 class="text-3xl font-bold mb-8">لوحة الإدارة</h1>
        
        <div class="mb-12 bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-2xl font-bold mb-4">إحصائيات</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-blue-50 p-6 rounded-lg">
              <h3 class="text-xl font-bold text-blue-700 mb-2">المستخدمون</h3>
              <p class="text-3xl">${users.length}</p>
            </div>
            <div class="bg-green-50 p-6 rounded-lg">
              <h3 class="text-xl font-bold text-green-700 mb-2">المنشورات</h3>
              <p class="text-3xl">${posts.length}</p>
            </div>
            <div class="bg-purple-50 p-6 rounded-lg">
              <h3 class="text-xl font-bold text-purple-700 mb-2">المدراء</h3>
              <p class="text-3xl">${admins.length + 1}</p>
            </div>
          </div>
        </div>
        
        <div class="mb-12 bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-2xl font-bold mb-4">المستخدمون</h2>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-gray-100">
                  <th class="border p-3 text-right">اسم المستخدم</th>
                  <th class="border p-3 text-right">البريد الإلكتروني</th>
                  <th class="border p-3 text-right">الصلاحية</th>
                  <th class="border p-3 text-right">العمليات</th>
                </tr>
              </thead>
              <tbody>
                ${users.map(user => `
                  <tr class="border-b hover:bg-gray-50">
                    <td class="border-r p-3">${user.username}</td>
                    <td class="border-r p-3">${user.email}</td>
                    <td class="border-r p-3">
                      ${user.email === 'mousa.omar.com@gmail.com' ? 
                        '<span class="bg-red-100 text-red-800 px-2 py-1 rounded-md text-sm">مدير رئيسي</span>' : 
                        adminIds.includes(user.id) ? 
                          '<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">مدير</span>' : 
                          '<span class="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-sm">مستخدم</span>'
                      }
                    </td>
                    <td class="p-3">
                      <div class="flex space-x-2 space-x-reverse">
                        <a href="#profile/${user.id}" class="text-blue-600 hover:text-blue-800">عرض</a>
                        ${user.email !== 'mousa.omar.com@gmail.com' && state.user.email === 'mousa.omar.com@gmail.com' ? `
                          ${adminIds.includes(user.id) ? 
                            `<button class="text-red-600 hover:text-red-800 remove-admin-btn" data-user-id="${user.id}">إزالة الإدارة</button>` : 
                            `<button class="text-green-600 hover:text-green-800 make-admin-btn" data-user-id="${user.id}">تعيين كمدير</button>`
                          }
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-2xl font-bold mb-4">المنشورات</h2>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-gray-100">
                  <th class="border p-3 text-right">العنوان</th>
                  <th class="border p-3 text-right">الكاتب</th>
                  <th class="border p-3 text-right">التاريخ</th>
                  <th class="border p-3 text-right">العمليات</th>
                </tr>
              </thead>
              <tbody>
                ${posts.map(post => `
                  <tr class="border-b hover:bg-gray-50">
                    <td class="border-r p-3">${post.title}</td>
                    <td class="border-r p-3">${post.profiles.username}</td>
                    <td class="border-r p-3">${new Date(post.created_at).toLocaleDateString('ar-EG')}</td>
                    <td class="p-3">
                      <div class="flex space-x-2 space-x-reverse">
                        <a href="#post/${post.id}" class="text-blue-600 hover:text-blue-800">عرض</a>
                        <button class="text-red-600 hover:text-red-800 delete-post-btn" data-post-id="${post.id}">حذف</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    
    // إضافة مستمعي الأحداث
    const makeAdminBtns = document.querySelectorAll('.make-admin-btn');
    makeAdminBtns.forEach(btn => {
      btn.addEventListener('click', handleMakeAdmin);
    });
    
    const removeAdminBtns = document.querySelectorAll('.remove-admin-btn');
    removeAdminBtns.forEach(btn => {
      btn.addEventListener('click', handleRemoveAdmin);
    });
    
    const deletePostBtns = document.querySelectorAll('.delete-post-btn');
    deletePostBtns.forEach(btn => {
      btn.addEventListener('click', handleDeletePost);
    });
  } catch (error) {
    console.error('Error loading admin page:', error);
    mainContent.innerHTML = `
      <div class="text-center py-8">
        <p class="text-red-500">حدث خطأ أثناء تحميل لوحة الإدارة. يرجى المحاولة مرة أخرى.</p>
        <a href="#home" class="text-blue-600 hover:text-blue-800 mt-4 inline-block">العودة للرئيسية</a>
      </div>
    `;
  }
}

// ----------------- معالجات الأحداث -----------------

// تسجيل دخول
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    state.user = data.user;
    
    // التحقق من الأدمن
    if (email === 'mousa.omar.com@gmail.com') {
      state.isAdmin = true;
    } else {
      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', data.user.id)
        .single();
      
      if (adminData) state.isAdmin = true;
    }
    
    showToast('تم تسجيل الدخول بنجاح', 'success');
    window.location.hash = '#home';
  } catch (error) {
    console.error('Error signing in:', error);
    showToast('فشل تسجيل الدخول. تأكد من البريد الإلكتروني وكلمة المرور', 'error');
  }
}

// تسجيل خروج
async function handleLogout() {
  try {
    await supabase.auth.signOut();
    state.user = null;
    state.isAdmin = false;
    showToast('تم تسجيل الخروج', 'success');
    window.location.hash = '#home';
  } catch (error) {
    console.error('Error signing out:', error);
    showToast('حدث خطأ أثناء تسجيل الخروج', 'error');
  }
}

// إنشاء حساب
async function handleRegister(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    // إنشاء المستخدم
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username
        }
      }
    });
    
    if (error) throw error;
    
    // إنشاء ملف شخصي
    await supabase.from('profiles').insert([
      {
        id: data.user.id,
        username,
        email,
        avatar_url: `https://ui-avatars.com/api/?name=${username}`
      }
    ]);
    
    showToast('تم إنشاء الحساب بنجاح', 'success');
    window.location.hash = '#login';
  } catch (error) {
    console.error('Error signing up:', error);
    showToast('فشل إنشاء الحساب. ' + error.message, 'error');
  }
}

// إنشاء منشور
async function handleCreatePost(e) {
  e.preventDefault();
  
  if (!state.user) {
    window.location.hash = '#login';
    return;
  }
  
  const title = document.getElementById('title').value;
  const content = document.getElementById('content').value;
  const code = document.getElementById('code').value;
  const category = document.getElementById('category').value;
  
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          title,
          content,
          code,
          category,
          user_id: state.user.id,
          likes_count: 0
        }
      ])
      .select();
    
    if (error) throw error;
    
    showToast('تم نشر المنشور بنجاح', 'success');
    window.location.hash = `#post/${data[0].id}`;
  } catch (error) {
    console.error('Error creating post:', error);
    showToast('فشل إنشاء المنشور. ' + error.message, 'error');
  }
}

// إضافة تعليق
async function handleAddComment(e) {
  e.preventDefault();
  
  if (!state.user) {
    window.location.hash = '#login';
    return;
  }
  
  const postId = document.getElementById('post-id').value;
  const content = document.getElementById('comment').value;
  
  try {
    const { error } = await supabase
      .from('comments')
      .insert([
        {
          content,
          post_id: postId,
          user_id: state.user.id
        }
      ]);
    
    if (error) throw error;
    
    showToast('تم إضافة التعليق بنجاح', 'success');
    // إعادة تحميل الصفحة
    window.location.reload();
  } catch (error) {
    console.error('Error adding comment:', error);
    showToast('فشل إضافة التعليق. ' + error.message, 'error');
  }
}

// نسخ الكود
function handleCopyCode(e) {
  const code = e.target.getAttribute('data-code');
  navigator.clipboard.writeText(code)
    .then(() => {
      const originalText = e.target.textContent;
      e.target.textContent = 'تم النسخ!';
      setTimeout(() => {
        e.target.textContent = originalText;
      }, 2000);
    })
    .catch(err => {
      console.error('فشل نسخ النص: ', err);
      showToast('فشل نسخ النص', 'error');
    });
}

// حذف منشور
async function handleDeletePost(e) {
  if (!confirm('هل أنت متأكد من حذف هذا المنشور؟')) {
    return;
  }
  
  const postId = e.target.getAttribute('data-post-id');
  
  try {
    // حذف التعليقات أولاً
    await supabase
      .from('comments')
      .delete()
      .eq('post_id', postId);
    
    // ثم حذف المنشور
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);
    
    if (error) throw error;
    
    showToast('تم حذف المنشور بنجاح', 'success');
    
    // إذا كنا في صفحة المنشور، نعود للرئيسية
    if (window.location.hash.includes('#post/')) {
      window.location.hash = '#home';
    } else {
      // وإلا نعيد تحميل الصفحة الحالية
      window.location.reload();
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    showToast('فشل حذف المنشور. ' + error.message, 'error');
  }
}

// حذف تعليق
async function handleDeleteComment(e) {
  if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) {
    return;
  }
  
  const commentId = e.target.getAttribute('data-comment-id');
  
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);
    
    if (error) throw error;
    
    showToast('تم حذف التعليق بنجاح', 'success');
    window.location.reload();
  } catch (error) {
    console.error('Error deleting comment:', error);
    showToast('فشل حذف التعليق. ' + error.message, 'error');
  }
}

// تعديل المنشور
function handleEditPost(e) {
  const postId = e.target.getAttribute('data-post-id');
  const postTitle = e.target.closest('.max-w-3xl').querySelector('h1').textContent;
  const postContent = e.target.closest('.max-w-3xl').querySelector('.post-content p').textContent;
  const postCodeElement = e.target.closest('.max-w-3xl').querySelector('.code-block pre');
  const postCode = postCodeElement ? postCodeElement.textContent : '';
  const postCategory = e.target.closest('.max-w-3xl').querySelector('.bg-blue-100').textContent;
  
  // إنشاء النموذج المنبثق
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50';
  modal.innerHTML = `
    <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl">
      <h2 class="text-2xl font-bold mb-6">تعديل المنشور</h2>
      <form id="edit-post-form">
        <input type="hidden" id="edit-post-id" value="${postId}">
        <div class="mb-4">
          <label for="edit-title" class="block text-gray-700 mb-2">عنوان المنشور</label>
          <input type="text" id="edit-title" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value="${postTitle}" required>
        </div>
        <div class="mb-4">
          <label for="edit-content" class="block text-gray-700 mb-2">محتوى المنشور</label>
          <textarea id="edit-content" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>${postContent}</textarea>
        </div>
        <div class="mb-4">
          <label for="edit-code" class="block text-gray-700 mb-2">الكود (اختياري)</label>
          <textarea id="edit-code" rows="8" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" dir="ltr">${postCode}</textarea>
        </div>
        <div class="mb-6">
          <label for="edit-category" class="block text-gray-700 mb-2">التصنيف</label>
          <select id="edit-category" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="javascript" ${postCategory === 'JavaScript' ? 'selected' : ''}>JavaScript</option>
            <option value="python" ${postCategory === 'Python' ? 'selected' : ''}>Python</option>
            <option value="html_css" ${postCategory === 'HTML/CSS' ? 'selected' : ''}>HTML/CSS</option>
            <option value="react" ${postCategory === 'React' ? 'selected' : ''}>React</option>
            <option value="nodejs" ${postCategory === 'Node.js' ? 'selected' : ''}>Node.js</option>
            <option value="other" ${postCategory === 'أخرى' ? 'selected' : ''}>أخرى</option>
          </select>
        </div>
        <div class="flex justify-end space-x-2 space-x-reverse">
          <button type="button" id="cancel-edit" class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition">إلغاء</button>
          <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">حفظ التغييرات</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // إضافة مستمعي الأحداث
  document.getElementById('cancel-edit').addEventListener('click', function() {
    document.body.removeChild(modal);
  });
  
  document.getElementById('edit-post-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const postId = document.getElementById('edit-post-id').value;
    const title = document.getElementById('edit-title').value;
    const content = document.getElementById('edit-content').value;
    const code = document.getElementById('edit-code').value;
    const category = document.getElementById('edit-category').value;
    
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          title,
          content,
          code,
          category,
          updated_at: new Date()
        })
        .eq('id', postId);
      
      if (error) throw error;
      
      showToast('تم تحديث المنشور بنجاح', 'success');
      document.body.removeChild(modal);
      window.location.reload();
    } catch (error) {
      console.error('Error updating post:', error);
      showToast('فشل تحديث المنشور. ' + error.message, 'error');
    }
  });
}

// تعيين مستخدم كمدير
async function handleMakeAdmin(e) {
  const userId = e.target.getAttribute('data-user-id');
  
  try {
    const { error } = await supabase
      .from('admins')
      .insert([{ user_id: userId }]);
    
    if (error) throw error;
    
    showToast('تم تعيين المستخدم كمدير بنجاح', 'success');
    window.location.reload();
  } catch (error) {
    console.error('Error making user admin:', error);
    showToast('فشل تعيين المستخدم كمدير. ' + error.message, 'error');
  }
}

// إزالة مستخدم من الإدارة
async function handleRemoveAdmin(e) {
  const userId = e.target.getAttribute('data-user-id');
  
  try {
    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('user_id', userId);
    
    if (error) throw error;
    
    showToast('تم إزالة المستخدم من الإدارة بنجاح', 'success');
    window.location.reload();
  } catch (error) {
    console.error('Error removing admin:', error);
    showToast('فشل إزالة المستخدم من الإدارة. ' + error.message, 'error');
  }
}

// إظهار نموذج تعديل الملف الشخصي
function showEditProfileModal() {
  if (!state.user) return;
  
  // جلب بيانات المستخدم
  supabase.from('profiles')
    .select('*')
    .eq('id', state.user.id)
    .single()
    .then(({ data, error }) => {
      if (error) throw error;
      
      // إنشاء النموذج المنبثق
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50';
      modal.innerHTML = `
        <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h2 class="text-2xl font-bold mb-6">تعديل الملف الشخصي</h2>
          <form id="edit-profile-form">
            <div class="mb-4">
              <label for="edit-username" class="block text-gray-700 mb-2">اسم المستخدم</label>
              <input type="text" id="edit-username" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value="${data.username}" required>
            </div>
            <div class="mb-6">
              <label for="edit-bio" class="block text-gray-700 mb-2">نبذة</label>
              <textarea id="edit-bio" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">${data.bio || ''}</textarea>
            </div>
            <div class="flex justify-end space-x-2 space-x-reverse">
              <button type="button" id="cancel-profile-edit" class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition">إلغاء</button>
              <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">حفظ التغييرات</button>
            </div>
          </form>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // إضافة مستمعي الأحداث
      document.getElementById('cancel-profile-edit').addEventListener('click', function() {
        document.body.removeChild(modal);
      });
      
      document.getElementById('edit-profile-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('edit-username').value;
        const bio = document.getElementById('edit-bio').value;
        
        try {
          const { error } = await supabase
            .from('profiles')
            .update({
              username,
              bio,
              updated_at: new Date()
            })
            .eq('id', state.user.id);
          
          if (error) throw error;
          
          showToast('تم تحديث الملف الشخصي بنجاح', 'success');
          document.body.removeChild(modal);
          window.location.reload();
        } catch (error) {
          console.error('Error updating profile:', error);
          showToast('فشل تحديث الملف الشخصي. ' + error.message, 'error');
        }
      });
    })
    .catch(error => {
      console.error('Error fetching profile:', error);
      showToast('فشل جلب بيانات الملف الشخصي', 'error');
    });
}

// إظهار نموذج تغيير الصورة الشخصية
function showChangeAvatarModal() {
  if (!state.user) return;
  
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50';
  modal.innerHTML = `
    <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <h2 class="text-2xl font-bold mb-6">تغيير الصورة الشخصية</h2>
      <form id="avatar-form">
        <div class="mb-6">
          <label for="avatar-url" class="block text-gray-700 mb-2">رابط الصورة</label>
          <input type="url" id="avatar-url" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://example.com/image.jpg" required>
          <p class="text-sm text-gray-500 mt-1">أدخل رابط صورة من الإنترنت</p>
        </div>
        <div class="flex justify-end space-x-2 space-x-reverse">
          <button type="button" id="cancel-avatar" class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition">إلغاء</button>
          <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">حفظ التغييرات</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // إضافة مستمعي الأحداث
  document.getElementById('cancel-avatar').addEventListener('click', function() {
    document.body.removeChild(modal);
  });
  
  document.getElementById('avatar-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const avatarUrl = document.getElementById('avatar-url').value;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date()
        })
        .eq('id', state.user.id);
      
      if (error) throw error;
      
      // تحديث البيانات في Auth
      await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl }
      });
      
      showToast('تم تغيير الصورة الشخصية بنجاح', 'success');
      document.body.removeChild(modal);
      window.location.reload();
    } catch (error) {
      console.error('Error updating avatar:', error);
      showToast('فشل تغيير الصورة الشخصية. ' + error.message, 'error');
    }
  });
}

// ----------------- الوظائف المساعدة -----------------

// عرض رسالة تنبيه
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 p-4 rounded-md shadow-lg z-50 ${
    type === 'success' ? 'bg-green-600' : 
    type === 'error' ? 'bg-red-600' : 
    'bg-blue-600'
  } text-white`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// عرض مؤشر التحميل
function showLoading(element) {
  element.innerHTML = `
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
    </div>
  `;
}

// اختصار النص
function truncateCode(code, maxLength) {
  if (!code) return '';
  if (code.length <= maxLength) return escapeHTML(code);
  return escapeHTML(code.substring(0, maxLength));
}

// حماية النص
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// الحصول على اسم التصنيف
function getCategoryName(category) {
  const categories = {
    'javascript': 'JavaScript',
    'python': 'Python',
    'html_css': 'HTML/CSS',
    'react': 'React',
    'nodejs': 'Node.js',
    'other': 'أخرى'
  };
  
  return categories[category] || 'أخرى';
}

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', initApp);
