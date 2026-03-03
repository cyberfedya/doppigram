# Doppigram - Настройка и Запуск

## 🚀 Быстрый старт

### 1. Настройка Firebase

1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. Создайте новый проект или выберите существующий
3. **Authentication** → **Sign-in method** → Включите **Google**
4. **Project Settings** (⚙️) → **General** → **Your apps** → **Web app**
5. Скопируйте `firebaseConfig` и вставьте значения в `.env.local`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 2. Настройка Convex

1. Зарегистрируйтесь на [Convex](https://www.convex.dev/)
2. Установите CLI: `npm install -g convex`
3. В проекте выполните:
```bash
npx convex dev
```
4. Следуйте инструкциям для создания проекта
5. После успешной авторизации скопируйте URL и добавьте в `.env.local`:

```env
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

### 3. Запуск приложения

```bash
npm install
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5173`

## 📁 Структура проекта

```
my-app/
├── convex/                 # Convex бэкенд
│   ├── _generated/        # Автогенерируемые типы
│   ├── schema.ts          # Схема данных
│   ├── users.ts           # Функции для работы с пользователями
│   ├── files.ts           # Загрузка файлов
│   └── convex.config.ts   # Конфигурация Convex
├── src/
│   ├── components/        # React компоненты
│   ├── context/           # React Context (AppContext)
│   ├── pages/             # Страницы приложения
│   │   ├── LoginPage.tsx
│   │   ├── ProfileSetupPage.tsx  # Онбординг после регистрации
│   │   ├── ChatListPage.tsx
│   │   ├── ChatPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── AdminPage.tsx
│   ├── config/
│   │   └── firebase.ts    # Firebase конфигурация
│   ├── types/
│   │   └── index.ts       # TypeScript типы
│   └── styles/
│       └── global.css     # Глобальные стили
└── .env.local             # Переменные окружения
```

## 🔐 Функционал

### Регистрация и вход
- ✅ Вход через Google (Firebase Authentication)
- ✅ Автоматическая проверка существования профиля
- ✅ Страница онбординга для новых пользователей
- ✅ Выбор имени пользователя (@username)
- ✅ Выбор аватара (эмодзи или загрузка изображения)

### Чат
- ✅ Реальное время через Convex
- ✅ Создание чатов
- ✅ Отправка сообщений
- ✅ Статусы прочтения
- ✅ Список чатов

### Настройки
- ✅ Изменение профиля
- ✅ Смена темы (светлая/тёмная)
- ✅ Уведомления
- ✅ Язык интерфейса

## 🔧 Convex Schema

### Таблицы:
- **users** - Пользователи
- **chats** - Чаты
- **chatParticipants** - Участники чатов
- **messages** - Сообщения
- **friendRequests** - Запросы в друзья

### Индексы:
- `users.by_uid` - Поиск по Firebase UID
- `users.by_username` - Поиск по имени пользователя
- `chats.by_createdBy` - Чаты пользователя
- `chatParticipants.by_chatId` - Участники чата
- `chatParticipants.by_userId` - Чаты пользователя
- `messages.by_chatId_createdAt` - Сообщения чата

## 🛠️ Разработка

### Отдельный запуск:
```bash
# Convex (в отдельном терминале)
npx convex dev

# Vite (в другом терминале)
npm run dev:vite
```

### Production сборка:
```bash
npm run build
npm run preview
```

## 📝 Заметки

- Convex автоматически генерирует типы в `convex/_generated/`
- Все мутации и query доступны через `api` объект
- Real-time обновления работают через Convex subscriptions
- Файлы хранятся в Convex File Storage

## 🔗 Полезные ссылки

- [Firebase Documentation](https://firebase.google.com/docs)
- [Convex Documentation](https://docs.convex.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
