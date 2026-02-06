import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'

type Bindings = {
  DB: D1Database
  AUTH_PASSWORD: string
}

type Bookmark = {
  id: number
  url: string
  title: string
  created_at: string
}

const app = new Hono<{ Bindings: Bindings }>()

const html = (bookmarks: Bookmark[], query = '', isAdmin = false) => `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Open Bookmark</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    form { margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px; }
    input, button { padding: 8px 12px; font-size: 14px; }
    input[type="text"], input[type="url"], input[type="password"] { width: 100%; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px; }
    button { background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
    button:hover { background: #0056b3; }
    .search { display: flex; gap: 10px; margin-bottom: 20px; }
    .search input { flex: 1; margin-bottom: 0; }
    ul { list-style: none; padding: 0; }
    li { padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
    li:hover { background: #f9f9f9; }
    a { color: #007bff; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .actions { display: flex; gap: 8px; }
    .actions button { padding: 4px 8px; font-size: 12px; }
    .delete { background: #dc3545; }
    .delete:hover { background: #c82333; }
    .edit { background: #28a745; }
    .edit:hover { background: #218838; }
    .info { color: #666; font-size: 12px; }
    .admin-link { text-align: right; margin-bottom: 10px; }
    .admin-link a { font-size: 12px; color: #666; }
    .logout { background: #6c757d; }
  </style>
</head>
<body>
  <h1>Open Bookmark</h1>

  <div class="admin-link">
    ${isAdmin
      ? '<form action="/logout" method="post" style="display:inline;padding:0;background:none;"><button class="logout" style="padding:4px 8px;font-size:12px;">ログアウト</button></form>'
      : '<a href="/login">管理者ログイン</a>'
    }
  </div>

  <form class="search" action="/" method="get">
    <input type="text" name="q" placeholder="検索..." value="${query}">
    <button type="submit">検索</button>
  </form>

  ${isAdmin ? `
  <form id="bookmarkForm" action="/bookmarks" method="post">
    <input type="hidden" name="id" id="editId">
    <input type="text" name="title" id="title" placeholder="タイトル" required>
    <input type="url" name="url" id="url" placeholder="URL" required>
    <button type="submit" id="submitBtn">追加</button>
    <button type="button" id="cancelBtn" style="display:none; background:#6c757d;" onclick="cancelEdit()">キャンセル</button>
  </form>
  ` : ''}

  <ul>
    ${bookmarks.map(b => `
      <li>
        <div>
          <a href="${b.url}" target="_blank">${b.title}</a>
          <div class="info">${b.url}</div>
        </div>
        ${isAdmin ? `
        <div class="actions">
          <button class="edit" onclick="editBookmark(${b.id}, '${b.title.replace(/'/g, "\\'")}', '${b.url}')">編集</button>
          <form action="/bookmarks/${b.id}/delete" method="post" style="display:inline">
            <button class="delete" type="submit">削除</button>
          </form>
        </div>
        ` : ''}
      </li>
    `).join('')}
  </ul>

  ${isAdmin ? `
  <script>
    function editBookmark(id, title, url) {
      document.getElementById('editId').value = id;
      document.getElementById('title').value = title;
      document.getElementById('url').value = url;
      document.getElementById('submitBtn').textContent = '更新';
      document.getElementById('cancelBtn').style.display = 'inline';
      document.getElementById('bookmarkForm').action = '/bookmarks/' + id;
    }
    function cancelEdit() {
      document.getElementById('editId').value = '';
      document.getElementById('title').value = '';
      document.getElementById('url').value = '';
      document.getElementById('submitBtn').textContent = '追加';
      document.getElementById('cancelBtn').style.display = 'none';
      document.getElementById('bookmarkForm').action = '/bookmarks';
    }
  </script>
  ` : ''}
</body>
</html>`

const loginHtml = (error = '') => `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ログイン - Open Bookmark</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; max-width: 400px; margin: 100px auto; padding: 20px; }
    h1 { color: #333; text-align: center; }
    form { padding: 20px; background: #f5f5f5; border-radius: 8px; }
    input, button { padding: 10px 12px; font-size: 14px; width: 100%; }
    input { margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px; }
    button { background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
    button:hover { background: #0056b3; }
    .error { color: #dc3545; margin-bottom: 10px; text-align: center; }
    .back { text-align: center; margin-top: 15px; }
    .back a { color: #007bff; text-decoration: none; }
  </style>
</head>
<body>
  <h1>管理者ログイン</h1>
  <form action="/login" method="post">
    ${error ? `<div class="error">${error}</div>` : ''}
    <input type="password" name="password" placeholder="合言葉" required>
    <button type="submit">ログイン</button>
  </form>
  <div class="back"><a href="/">戻る</a></div>
</body>
</html>`

const isAuthenticated = (c: any): boolean => {
  const token = getCookie(c, 'auth')
  return token === 'authenticated'
}

// 一覧表示（検索対応）
app.get('/', async (c) => {
  const query = c.req.query('q') || ''
  const isAdmin = isAuthenticated(c)
  let bookmarks: Bookmark[]

  if (query) {
    const result = await c.env.DB.prepare(
      'SELECT * FROM bookmarks WHERE title LIKE ? OR url LIKE ? ORDER BY created_at DESC'
    ).bind(`%${query}%`, `%${query}%`).all<Bookmark>()
    bookmarks = result.results
  } else {
    const result = await c.env.DB.prepare(
      'SELECT * FROM bookmarks ORDER BY created_at DESC'
    ).all<Bookmark>()
    bookmarks = result.results
  }

  return c.html(html(bookmarks, query, isAdmin))
})

// ログインページ
app.get('/login', (c) => {
  if (isAuthenticated(c)) {
    return c.redirect('/')
  }
  return c.html(loginHtml())
})

// ログイン処理
app.post('/login', async (c) => {
  const body = await c.req.parseBody()
  if (body.password === c.env.AUTH_PASSWORD) {
    setCookie(c, 'auth', 'authenticated', {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 60 * 60 * 24 * 7 // 7日間
    })
    return c.redirect('/')
  }
  return c.html(loginHtml('合言葉が違います'))
})

// ログアウト
app.post('/logout', (c) => {
  setCookie(c, 'auth', '', { maxAge: 0 })
  return c.redirect('/')
})

// 新規作成（認証必須）
app.post('/bookmarks', async (c) => {
  if (!isAuthenticated(c)) {
    return c.redirect('/login')
  }
  const body = await c.req.parseBody()
  await c.env.DB.prepare(
    'INSERT INTO bookmarks (title, url) VALUES (?, ?)'
  ).bind(body.title, body.url).run()

  return c.redirect('/')
})

// 更新（認証必須）
app.post('/bookmarks/:id', async (c) => {
  if (!isAuthenticated(c)) {
    return c.redirect('/login')
  }
  const id = c.req.param('id')
  const body = await c.req.parseBody()
  await c.env.DB.prepare(
    'UPDATE bookmarks SET title = ?, url = ? WHERE id = ?'
  ).bind(body.title, body.url, id).run()

  return c.redirect('/')
})

// 削除（認証必須）
app.post('/bookmarks/:id/delete', async (c) => {
  if (!isAuthenticated(c)) {
    return c.redirect('/login')
  }
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM bookmarks WHERE id = ?').bind(id).run()

  return c.redirect('/')
})

export default app
