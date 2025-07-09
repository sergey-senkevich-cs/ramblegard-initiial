#!/bin/bash

echo "🚀 Установка Rabmlegard Electron на Ubuntu"
echo "=========================================="

# Проверка наличия Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не найден. Устанавливаем Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "✅ Node.js версия: $(node --version)"
echo "✅ npm версия: $(npm --version)"

# Установка зависимостей
echo "📦 Установка зависимостей..."
npm install

# Сборка приложения
echo "🔨 Сборка приложения..."
npm run electron:build

# Проверка создания файлов
if [ -d "release" ]; then
    echo "✅ Сборка завершена успешно!"
    echo ""
    echo "📁 Файлы билда находятся в папке: release/"
    ls -la release/
    echo ""
    
    # Поиск AppImage файла
    APPIMAGE_FILE=$(find release -name "*.AppImage" | head -1)
    DEB_FILE=$(find release -name "*.deb" | head -1)
    
    if [ -n "$APPIMAGE_FILE" ]; then
        echo "🎯 Найден AppImage файл: $APPIMAGE_FILE"
        chmod +x "$APPIMAGE_FILE"
        echo "✅ Права на выполнение установлены"
        echo ""
        echo "🚀 Для запуска используйте:"
        echo "   ./$APPIMAGE_FILE"
        echo ""
    fi
    
    if [ -n "$DEB_FILE" ]; then
        echo "📦 Найден .deb пакет: $DEB_FILE"
        echo ""
        echo "🚀 Для установки через системный пакетный менеджер:"
        echo "   sudo dpkg -i '$DEB_FILE'"
        echo "   sudo apt-get install -f  # если есть зависимости"
        echo ""
        
        read -p "🤔 Установить .deb пакет сейчас? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sudo dpkg -i "$DEB_FILE"
            sudo apt-get install -f
            echo "✅ Установка завершена! Приложение доступно в меню приложений."
        fi
    fi
    
else
    echo "❌ Ошибка сборки. Проверьте логи выше."
    exit 1
fi

echo ""
echo "🎉 Установка завершена!"
echo "📖 Подробности в README.md" 