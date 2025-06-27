if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(() => console.log("Service Worker registered"))
        .catch(err => console.error("SW registration failed", err));
}

document.querySelector('.notification-btn').addEventListener("click", async()=>{
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
    }
})


let db;

idb.open('todo-db', 1, DB=>{
    if(!DB.objectStoreNames.contains('tasks')) {
        const store = DB.createObjectStore('tasks', {keyPath: 'id', autoIncrement: true});
    }
}).then(database => {
    db = database;
    loadTasks();
});

const form = document.getElementsByClassName('todo-form')[0];
const titleInput = document.querySelector('input[placeholder="Enter task title"]');

form.addEventListener("submit", e => {
    e.preventDefault();

    const hh = parseInt(document.querySelector('input[placeholder="HH"]').value, 10);
    const mm = parseInt(document.querySelector('input[placeholder="Mins"]').value, 10);
    const dd = parseInt(document.querySelector('input[placeholder="DD"]').value, 10);
    const mo = parseInt(document.querySelector('input[placeholder="MM"]').value, 10);
    const yyyy = parseInt(document.querySelector('input[placeholder="YYYY"]').value, 10);

    const taskTitle = titleInput.value.trim();

    if (!taskTitle || isNaN(hh) || isNaN(mm) || isNaN(dd) || isNaN(mo) || isNaN(yyyy)) return;

    const deadline = new Date(yyyy, mo - 1, dd, hh, mm).toISOString();

    const tx = db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');
    store.add({ title: taskTitle, deadline, done: false });

    tx.complete.then(() => {
    loadTasks();
    form.reset();
    scheduleNotification(taskTitle, new Date(deadline));
  });
})

function loadTasks() {
    const tx = db.transaction('tasks', 'readonly');
    const store = tx.objectStore('tasks');

    store.getAll().then(tasks => {
        const list = document.getElementsByClassName("task-list")[0];
        list.innerHTML = '';
        tasks.forEach(task => {
            const deadline = new Date(task.deadline);
            const taskItem = document.createElement('div');
            taskItem.className = 'task-item';
            taskItem.innerHTML = `
            <div class="task-content ${task.done ? 'finished' : ''}">
                <h3>${task.title}</h3>
                 <p>Due: ${deadline.toLocaleDateString()} at ${deadline.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</p>
            </div>
            <div class="task-actions">
                <button class="complete-btn" data-id="${task.id}">✓</button>
                <button class="delete-btn" data-id="${task.id}">✕</button>
            </div>
            `;
            list.appendChild(taskItem)
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.getAttribute('data-id'));
                const tx = db.transaction('tasks', 'readwrite');
                const store = tx.objectStore('tasks');
                store.delete(id);
                tx.complete.then(loadTasks);
            });
        });

        document.querySelectorAll('.complete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.dataset.id);
                const tx = db.transaction('tasks', 'readwrite');
                const store = tx.objectStore('tasks');

                store.get(id).then(task => {
                task.done = !task.done;
                store.put(task);
                });

                tx.complete.then(loadTasks);
        });
        });
    });
}

function scheduleNotification(taskTitle, dueDate) {
    const timeUntilDue = dueDate.getTime() - Date.now();
    
    // return if due date is in the past
    if (timeUntilDue <= 0) {
        console.log('Task is already due or overdue');
        return;
    }

    // return if notification permission denied
    if (Notification.permission !== 'granted') {
        console.log('Notification permission not granted');
        return;
    }

    console.log(`Scheduling notification for ${new Date(dueDate).toLocaleString()}`);

    // Schedule the notification using setTimeOut
    setTimeout(() => {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification("Task Due Now!", {
                body: `${taskTitle} is due now!`,
                icon: '/icon.png',
                data: { taskTitle }
            });
        });
    }, timeUntilDue);
}