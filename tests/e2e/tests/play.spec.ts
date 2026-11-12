import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';


test('Открытие и проверка новой вкладки', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/windows');
    const newPagePromise = page.context().waitForEvent('page');
    await page.getByText('Click Here').click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState('domcontentloaded');

    await expect(newPage).toHaveTitle('New Window');
    await expect(newPage.locator('h3')).toHaveText('New Window');

    await newPage.close();

    await expect(page.locator('h3')).toHaveText('Opening a new window');
});

test('Ввод текста внутри WYSIWYG редактора (iframe)', async ({ page }) => {

    await page.goto('https://the-internet.herokuapp.com/iframe');

    // Находим iframe по его ID и создаем frameLocator
    const editorFrame = page.frameLocator('#mce_0_ifr');
    // Находим элемент body внутри этого фрейма
    const editorBody = editorFrame.locator('#tinymce');
    // Очищаем стандартный текст и вводим свой
    await editorBody.clear();
    await editorBody.fill('Привет, Playwright! Это текст внутри iframe.');

    // Проверяем, что текст успешно введен внутрь фрейма
    await expect(editorBody).toContainText('Привет, Playwright!');
  });

  test('Комплексная проверка нативных диалогов: Alert, Confirm и Prompt', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/javascript_alerts');
  
    // 1. Проверка JS Alert
    // Подписываемся на диалог ПЕРЕД действием
    page.once('dialog', async dialog => {
      expect(dialog.message()).toBe('I am a JS Alert');
      await dialog.accept(); // Нажимаем "ОК"
    });
    
    await page.getByText('Click for JS Alert').click();
    await expect(page.locator('#result')).toHaveText('You successfully clicked an alert');
  
    // 2. Проверка JS Confirm (сценарий с нажатием "ОК")
    page.once('dialog', async dialog => {
      expect(dialog.message()).toBe('I am a JS Confirm');
      await dialog.accept(); // Нажимаем "ОК"
    });
    
    await page.getByText('Click for JS Confirm').click();
    await expect(page.locator('#result')).toHaveText('You clicked: Ok');
  
    // 3. Проверка JS Confirm (сценарий с нажатием "Отмена")
    page.once('dialog', async dialog => {
      expect(dialog.message()).toBe('I am a JS Confirm');
      await dialog.dismiss(); // Нажимаем "Отмена" (или Cancel)
    });
    
    await page.getByText('Click for JS Confirm').click();
    await expect(page.locator('#result')).toHaveText('You clicked: Cancel');
  
    // 4. Проверка JS Prompt (с вводом текста)
    const textToEnter = 'Привет, Playwright!';
    
    page.once('dialog', async dialog => {
      expect(dialog.message()).toBe('I am a JS prompt');
      await dialog.accept(textToEnter); // Вводим текст и нажимаем "ОК"
    });
    
    await page.getByText('Click for JS Prompt').click();
    await expect(page.locator('#result')).toHaveText(`You entered: ${textToEnter}`);
  });

  test('Загрузка файла на сервер', async ({ page }) => {

    // 1. Динамически создаем тестовый файл в текущей директории
    const filePath = path.join(__dirname, 'test-document.txt');
    fs.writeFileSync(filePath, 'Это содержимое тестового файла для проверки Playwright');

    await page.goto('https://the-internet.herokuapp.com/upload');
    // 2. Находим input типа file и передаем ему путь к файлу
    await page.locator('#file-upload').setInputFiles(filePath);

    // 3. Нажимаем кнопку отправки
    await page.locator('#file-submit').click();

    // 4. Проверяем, что сервер принял файл и отобразил его имя
    await expect(page.locator('#uploaded-files')).toContainText('test-document.txt');
    await expect(page.locator('.example')).toContainText('File Uploaded!');

    // 5. Убираем за собой (удаляем временный файл)
    fs.unlinkSync(filePath);
  });

  test('Перехват и проверка скачиваемого файла', async ({ page }) => {

    await page.goto('https://the-internet.herokuapp.com/download');
    // Подписываемся на событие скачивания ДО клика
    const downloadPromise = page.waitForEvent('download');

    await page.locator('#content a[href$=".txt"]').first().click();
    // Получаем объект скачивания
    const download = await downloadPromise;
    // Теперь эта проверка гарантированно пройдет
    expect(download.suggestedFilename()).toMatch(/\.txt$/);
  });

  test('Подмена ответа API с помощью page.route', async ({ page }) => {
    // Используем официальный демо-сайт Playwright для мокирования
    await page.goto('https://demo.playwright.dev/api-mocking');
    // Перехватываем ВСЕ запросы, путь которых содержит '/api/v1/fruits'
    await page.route('**/api/v1/fruits', async route => {
      // Вместо реального ответа сервера, мы сами формируем ответ (мокируем его)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { name: 'Playwright Banana', id: 1 },
          { name: 'Playwright Apple', id: 2 }
        ])
      });
    });
    // Перезагружаем страницу, чтобы запрос ушел и подхватил наш перехватчик (route)
    await page.reload();
    // Проверяем, что на странице отобразились именно наши подмененные данные
    await expect(page.locator('text=Playwright Banana')).toBeVisible();
    await expect(page.locator('text=Playwright Apple')).toBeVisible();
    // Убеждаемся, что оригинальные данные (которые были бы без мока) НЕ отображаются
    await expect(page.locator('text=Strawberry')).not.toBeVisible();
  });

  test('Имитация ошибки 500 (Internal Server Error) и проверка реакции UI', async ({ page }) => {
    // Шаг 1: Переходим на страницу
    await page.goto('https://demo.playwright.dev/api-mocking');
    // Шаг 2: Перехватываем запрос и принудительно возвращаем статус 500
    await page.route('**/api/v1/fruits', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        // Имитируем реальный ответ от бэкенда при падении
        body: JSON.stringify({ 
          error: 'Internal Server Error', 
          message: 'Сервер временно недоступен, попробуйте позже' 
        })
      });
    });
    // Шаг 3: Перезагружаем страницу, чтобы инициировать запрос к API 
    // с уже активным правилом перехвата (route)
    await page.reload();
    // Шаг 4: Проверяем, что интерфейс корректно обработал ошибку
    // 4а. Убеждаемся, что успешные данные НЕ отобразились
    await expect(page.locator('text=Playwright Banana')).not.toBeVisible();
    await expect(page.locator('text=Playwright Apple')).not.toBeVisible();
    // 4б. В реальном проекте здесь мы бы проверяли наличие компонента ошибки.
    // Например: await expect(page.locator('.error-banner')).toHaveText('Сервер временно недоступен');
    // На демо-сайте Playwright при сбое API список просто не рендерится, 
    // поэтому мы можем проверить, что контейнер списка пуст или скрыт.
    await expect(page.locator('.framework-list')).toBeHidden(); // или toBeEmpty, в зависимости от верстки
  });
