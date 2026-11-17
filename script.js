
"use strict";

// Ключ для збереження завдань у браузері
const STORAGE_KEY = "khshanovska_todo_18";

// Отримання HTML-елементів
const taskInput = document.querySelector("#taskInput");
const todoForm = document.querySelector("#todoForm");
const taskList = document.querySelector("#taskList");
const emptyMessage = document.querySelector("#emptyMessage");
const formMessage = document.querySelector("#formMessage");
const filterButtons = document.querySelectorAll(".filter");

// Масив завдань та активний фільтр
let tasks = loadTasks();
let currentFilter = "all";

// Зчитування завдань із localStorage
function loadTasks() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        if (!Array.isArray(saved)) {
            return [];
        }

        return saved.filter(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.text === "string" &&
            typeof task.completed === "boolean" &&
            typeof task.createdAt === "number" &&
            Number.isFinite(task.createdAt)
        );
    } catch (error) {
        console.error(
            "Помилка читання localStorage:",
            error
        );

        return [];
    }
}

// Збереження завдань у браузері
function saveTasks() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(tasks)
        );

        formMessage.textContent = "";
    } catch (error) {
        console.error(
            "Помилка збереження:",
            error
        );

        formMessage.textContent =
            "Не вдалося зберегти завдання в браузері.";
    }
}

// Форматування дати та часу
function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Генерація унікального ID
function makeId() {
    if (
        window.crypto &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Додавання нового завдання
function addTask(event) {
    event.preventDefault();

    const text = taskInput.value.trim();

    if (!text) {
        formMessage.textContent =
            "Введи текст завдання.";

        taskInput.focus();
        return;
    }

    const newTask = {
        id: makeId(),
        text: text,
        completed: false,
        createdAt: Date.now()
    };

    // Нове завдання з'являється на початку списку
    tasks.unshift(newTask);

    taskInput.value = "";

    saveTasks();
    renderTasks();

    taskInput.focus();
}

// Позначення завдання виконаним
function completeTask(id) {
    const task = tasks.find(
        item => item.id === id
    );

    if (!task || task.completed) {
        return;
    }

    task.completed = true;

    saveTasks();
    renderTasks();
}

// Видалення завдання
function deleteTask(id) {
    tasks = tasks.filter(
        item => item.id !== id
    );

    saveTasks();
    renderTasks();
}

// Редагування подвійним кліком
function editTask(id, textElement) {
    const task = tasks.find(
        item => item.id === id
    );

    if (!task) {
        return;
    }

    const input = document.createElement("input");

    input.type = "text";
    input.className = "task-edit";
    input.maxLength = 250;
    input.value = task.text;

    input.setAttribute(
        "aria-label",
        "Редагувати завдання"
    );

    textElement.replaceWith(input);

    input.focus();
    input.select();

    let finished = false;

    // Завершення редагування
    function finish(shouldSave) {
        if (finished) {
            return;
        }

        finished = true;

        if (shouldSave) {
            const edited = input.value.trim();

            if (edited) {
                task.text = edited;
                saveTasks();
            } else {
                formMessage.textContent =
                    "Текст завдання не може бути порожнім.";
            }
        }

        renderTasks();
    }

    // Enter — збереження, Escape — скасування
    input.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            finish(true);
        }

        if (event.key === "Escape") {
            finish(false);
        }
    });

    // Збереження при втраті фокуса
    input.addEventListener(
        "blur",
        () => finish(true)
    );
}

// Оновлення статистики
function updateStatistics() {
    const completed = tasks.filter(
        task => task.completed
    ).length;

    const active = tasks.length - completed;

    document.querySelector(
        "#totalCount"
    ).textContent = `Усього завдань: ${tasks.length}`;

    document.querySelector(
        "#activeCount"
    ).textContent = `Невиконаних: ${active}`;

    document.querySelector(
        "#completedCount"
    ).textContent = `Виконаних: ${completed}`;
}

// Відображення завдань
function renderTasks() {
    taskList.replaceChildren();

    // Вибір завдань за активним фільтром
    const visible = tasks.filter(task =>
        currentFilter === "all" ||
        (
            currentFilter === "active" &&
            !task.completed
        ) ||
        (
            currentFilter === "completed" &&
            task.completed
        )
    );

    // Виведення повідомлення, якщо список порожній
    emptyMessage.hidden = visible.length > 0;

    if (!visible.length) {
        if (currentFilter === "active") {
            emptyMessage.textContent =
                "Невиконаних завдань немає.";
        } else if (currentFilter === "completed") {
            emptyMessage.textContent =
                "Виконаних завдань поки немає.";
        } else {
            emptyMessage.textContent =
                "Поки немає завдань. Додай перше вище.";
        }
    }

    // Створення HTML-елементів для кожного завдання
    visible.forEach(task => {
        const item = document.createElement("li");

        item.className = task.completed
            ? "task-item completed"
            : "task-item";

        // Checkbox тільки для невиконаних завдань
        if (!task.completed) {
            const checkbox = document.createElement(
                "input"
            );

            checkbox.type = "checkbox";
            checkbox.className = "task-checkbox";

            checkbox.setAttribute(
                "aria-label",
                `Виконати: ${task.text}`
            );

            checkbox.addEventListener(
                "change",
                () => completeTask(task.id)
            );

            item.appendChild(checkbox);
        }

        // Інформація про завдання
        const info = document.createElement("div");
        info.className = "task-info";

        const title = document.createElement("span");

        title.className = "task-text";
        title.textContent = task.text;

        title.title =
            "Подвійний клік — редагувати";

        title.addEventListener(
            "dblclick",
            () => editTask(task.id, title)
        );

        // Дата та час створення
        const date = document.createElement("time");

        date.className = "task-date";

        date.dateTime = new Date(
            task.createdAt
        ).toISOString();

        date.textContent =
            `Додано: ${formatDate(task.createdAt)}`;

        info.append(title, date);

        // Кнопка видалення
        const remove = document.createElement("button");

        remove.type = "button";
        remove.className = "delete-button";
        remove.textContent = "×";

        remove.setAttribute(
            "aria-label",
            `Видалити: ${task.text}`
        );

        remove.addEventListener(
            "click",
            () => deleteTask(task.id)
        );

        item.append(info, remove);

        taskList.appendChild(item);
    });

    updateStatistics();
}

// Додавання завдання при натисканні Enter
todoForm.addEventListener(
    "submit",
    addTask
);

// Робота кнопок фільтрації
filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;

        filterButtons.forEach(other => {
            const active = other === button;

            other.classList.toggle(
                "active",
                active
            );

            other.setAttribute(
                "aria-pressed",
                String(active)
            );
        });

        renderTasks();
    });
});

// Початкове відображення після відкриття сторінк
renderTasks();
