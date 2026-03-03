# Doppigram - Мессенджер в черно-белом стиле

Современный мессенджер с дизайном в стиле Twitter и функционалом Telegram.

## 🚀 Функции

- ✅ Страница входа/регистрации
- ✅ Вход через Google
- ✅ Список чатов
- ✅ Окно чата с сообщениями
- ✅ Админ-панель
- ✅ Черно-белый минималистичный дизайн

## 🔧 Настройка Firebase для Google-аутентификации

### 1. Создайте проект в Firebase Console

1. Перейдите на [Firebase Console](https://console.firebase.google.com/)
2. Нажмите "Добавить проект"
3. Введите название проекта (например, "doppigram")
4. Следуйте инструкциям мастера создания

### 2. Настройте Google-аутентификацию

1. В Firebase Console перейдите в **Authentication** → **Sign-in method**
2. Включите **Google** как провайдера аутентификации
3. Укажите email поддержки
4. Сохраните

### 3. Получите конфигурацию Firebase

1. В Firebase Console перейдите в **Project Settings** (⚙️)
2. В разделе "Your apps" нажмите **Add app** → **Web**
3. Зарегистрируйте приложение
4. Скопируйте конфигурацию `firebaseConfig`

### 4. Обновите файл конфигурации

Откройте файл `src/config/firebase.ts` и замените значения:

```typescript
const firebaseConfig = {
  apiKey: "ВАШ_API_KEY",
  authDomain: "ВАШ_PROJECT_ID.firebaseapp.com",
  projectId: "ВАШ_PROJECT_ID",
  storageBucket: "ВАШ_PROJECT_ID.appspot.com",
  messagingSenderId: "ВАШ_MESSAGING_SENDER_ID",
  appId: "ВАШ_APP_ID"
};
```

### 5. Добавьте домен в Firebase (для продакшена)

1. В Firebase Console: **Authentication** → **Settings**
2. В разделе "Authorized domains" добавьте ваш домен

## 📦 Установка и запуск

```bash
# Установите зависимости
npm install

# Запустите dev-сервер
npm run dev

# Соберите продакшен версию
npm run build
```

## 🎨 Дизайн

Приложение выполнено в черно-белом минималистичном стиле:
- Основной цвет: `#000000`
- Акценты: оттенки серого
- Плавные анимации
- Современные градиенты

## 🔐 Тестовый вход

**Email/пароль:**
- Любой email + пароль (мин. 6 символов)

**Админ-панель:**
- Email содержащий "admin" (например, `admin@doppigram.com`)

**Google:**
- Нажмите "Продолжить с Google" (требуется настройка Firebase)

## 📁 Структура проекта

```
my-app/
├── src/
│   ├── config/
│   │   └── firebase.ts       # Настройки Firebase
│   ├── context/
│   │   └── AppContext.tsx    # Глобальное состояние
│   ├── pages/
│   │   ├── LoginPage.tsx     # Страница входа
│   │   ├── ChatListPage.tsx  # Список чатов
│   │   ├── ChatPage.tsx      # Окно чата
│   │   └── AdminPage.tsx     # Админ-панель
│   ├── styles/
│   │   └── global.css        # Глобальные стили
│   └── types/
│       └── index.ts          # TypeScript типы
└── package.json
```

## 🛠 Технологии

- **React 19** + TypeScript
- **Vite** - сборщик
- **Firebase** - аутентификация
- **React Router** - навигация
- **Lucide React** - иконки

## 📝 Лицензия

MIT
