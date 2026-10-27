// Имитация асинхронной функции получения данных пользователя
function fetchUserData(userId: number): Promise<{ id: number; name: string; role: string }> {
    return new Promise((resolve, reject) => {
      // Имитируем задержку сети в 100 миллисекунд
      setTimeout(() => {
        if (userId > 0) {
          // Успешный сценарий: переводим Promise в состояние fulfilled
          resolve({ id: userId, name: "Алексей", role: "admin" });
        } else {
          // Сценарий ошибки: переводим Promise в состояние rejected
          reject(new Error("Некорректный идентификатор пользователя"));
        }
      }, 100);
    });
  }

  function fetchUserSettings(userId: number): Promise<{ theme: string; notifications: boolean }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ theme: "dark", notifications: true });
      }, 100); // Тоже занимает 100 мс
    });
  }



  describe('Модуль fetchUserData', () => {
    it('должен успешно возвращать данные пользователя при корректном ID', async () => {
      // 1. Вызываем функцию и ждём разрешения Promise
      const result = await fetchUserData(1);
  
      // 2. Проверяем полученный результат стандартными матчерами Jest
      expect(result).toEqual({ id: 1, name: "Алексей", role: "admin" });
      expect(result.role).toBe("admin");
    });
    
    it('должен отклонять Promise с ошибкой при некорректном ID', async () => {
        // Мы ожидаем, что вызов функции с ID = 0 приведёт к ошибке
        await expect(fetchUserData(0)).rejects.toThrow("Некорректный идентификатор пользователя");
    });

  });

  describe('Promise.all', () => {
    it('загружает данные последовательно (медленно)', async () => {
        const user = await fetchUserData(1);       // Ждём 100 мс
        const settings = await fetchUserSettings(1); // Ждём ещё 100 мс
        expect(user.name).toBe("Алексей");
        expect(settings.theme).toBe("dark");
      });

    it('должен дожидаться всех промисов и возвращать массив результатов', async () => {
      // Оба запроса идут параллельно
      const [user, settings] = await Promise.all([
        fetchUserData(1),
        fetchUserSettings(1),
      ]);

      expect(user).toEqual({ id: 1, name: "Алексей", role: "admin" });
      expect(settings).toEqual({ theme: "dark", notifications: true });
    });

    it('должен падать целиком, если упал хотя бы один промис', async () => {
      // Второй запрос с ID = 0 уйдёт в reject -> весь Promise.all уйдёт в reject
      await expect(
        Promise.all([fetchUserData(1), fetchUserData(0)])
      ).rejects.toThrow("Некорректный идентификатор пользователя");
    });
  });

  describe('Promise.allSettled', () => {
    it('должен возвращать статусы всех промисов, даже если один упал', async () => {
      const results = await Promise.allSettled([
        fetchUserData(1),
        fetchUserData(0),
      ]);

      // Первый успешно завершился
      expect(results[0].status).toBe("fulfilled");
      // Второй упал, но общий результат НЕ упал
      expect(results[1].status).toBe("rejected");
    });

    it('должен давать доступ к value у успешных и к reason у упавших', async () => {
      const results = await Promise.allSettled([
        fetchUserData(1),
        fetchUserData(0),
      ]);

      if (results[0].status === "fulfilled") {
        expect(results[0].value).toEqual({ id: 1, name: "Алексей", role: "admin" });
      }

      if (results[1].status === "rejected") {
        expect(results[1].reason.message).toBe("Некорректный идентификатор пользователя");
      }
    });
  });
