// Splash screen handler
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('splash-screen').style.display = 'none';
    }, 3000);
});


// ==========================================
// GLOBAL VARIABLES
// ==========================================

// Dynamically set tasks per page based on device width
function getTasksPerPage() {
    const width = window.innerWidth;
    if (width <= 600) return 3;       // Phone
    if (width <= 1024) return 4;      // Tablet
    return 6;                         // Desktop
}

let TASKS_PER_PAGE = getTasksPerPage(); // Set initial value

let currentSection = 'today'; // Track current view section
let deleteMode = false;
// ==========================================
// INITIALIZATION
// ==========================================

// Initialize app when page loads
window.onload = function () {
    loadTasks();
    updateProgressBar();
    updatePagination();

    // Set up event listeners for filter buttons
    const filterButtons = document.querySelectorAll('.task-filter');
    filterButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
        });
    });
    // Recalculate TASKS_PER_PAGE on resize and reload tasks
    window.addEventListener('resize', () => {
        const newTasksPerPage = getTasksPerPage();
        if (newTasksPerPage !== TASKS_PER_PAGE) {
            TASKS_PER_PAGE = newTasksPerPage;
            loadTasks();
            updatePagination();
        }
    });
};

// ==========================================
// TASK LOADING & DISPLAY
// ==========================================

// Load tasks from localStorage and display them
function loadTasks() {
    // Get all tasks from localStorage
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

    // Get current page for each section
    const todayPage = parseInt(localStorage.getItem('today-tasks-page') || '1');
    const comingUpPage = parseInt(localStorage.getItem('coming-up-tasks-page') || '1');

    // Filter tasks by section
    const todayTasks = tasks.filter(task => task.section === 'today' && !task.removed);
    const comingUpTasks = tasks.filter(task => task.section === 'coming-up' && !task.removed);

    // Calculate pagination for each section
    const todayStart = (todayPage - 1) * TASKS_PER_PAGE;
    const todayEnd = todayStart + TASKS_PER_PAGE;
    const comingUpStart = (comingUpPage - 1) * TASKS_PER_PAGE;
    const comingUpEnd = comingUpStart + TASKS_PER_PAGE;

    // Clear existing tasks from grids
    document.getElementById('today-cards').innerHTML = '';
    document.getElementById('coming-up-cards').innerHTML = '';

    // Handle Today section
    todayTasks.slice(todayStart, todayEnd).forEach(task => {
        addTaskToGrid(task, 'today-cards');
    });

    // Handle Coming Up section
    comingUpTasks.slice(comingUpStart, comingUpEnd).forEach(task => {
        addTaskToGrid(task, 'coming-up-cards');
    });
}

// Add a task to the specified grid
function addTaskToGrid(task, gridId) {
    const grid = document.getElementById(gridId);
    const taskCard = document.createElement('div');
    taskCard.className = 'task-card';
    taskCard.dataset.taskTitle = task.title; // Add data attribute for easier selection
    if (task.completed) {
        taskCard.classList.add('task-completed');
    }

    taskCard.innerHTML = `
    <input type="checkbox" class="task-checkbox" ${deleteMode ? '' : 'style="display:none;"'} 
           onclick="event.stopPropagation();">
    <span class="edit-hint" title="Click to edit"><i class="fas fa-pen"></i></span>
    <h3 class="task-title">${task.title}</h3>
    <p class="task-desc">${task.description}</p>
    ${task.date ? `<p class="task-date">${task.date}</p>` : ''}
    <button class="completed-task ${task.completed ? 'completed' : ''}" onclick="markTaskDone('${task.title}')">
        <i class="fas fa-check"></i> ${task.completed ? 'Completed' : 'Mark as Done'}
    </button>
`;

    grid.appendChild(taskCard);
    // click on task card to edit not button done
    taskCard.addEventListener('click', (e) => {
        // Only trigger edit if not clicking the "Mark as Done" button or its children
        if (!e.target.closest('.completed-task')) {
            taskCard.style.cursor = 'pointer';
            cancelDelete();
            editTask(task.title);
        }
    });
}

// ===========================================
// TASK EDITING
// ===========================================
// Edit a task
function editTask(taskTitle){
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const task = tasks.find(t => t.title === taskTitle);

    if (task) {
       showAddTaskForm();
        const currentTaskList = document.getElementById(currentSection === 'today' ? 'today-tasks' : 'coming-up-tasks');
        const currentForm = currentTaskList.querySelector('.new-task');

        // Fill the form with task details
        currentForm.querySelector(".task-input").value = task.title;
        currentForm.querySelector(".task-desc").value = task.description;
        currentForm.querySelector(".task-date").value = task.date;

        // Update the add task button to save changes
        const addButton = currentForm.querySelector('.submit-task');
        addButton.textContent = 'Save Changes';
        addButton.onclick = () => {
            updateTask(taskTitle, currentForm);
        };

    }
}

// Update a task
function updateTask(oldTitle, form) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const taskIndex = tasks.findIndex(task => task.title === oldTitle);

    if (taskIndex !== -1) {
        const updatedTask = {
            ...tasks[taskIndex],
            title: form.querySelector(".task-input").value.trim(),
            description: form.querySelector(".task-desc").value.trim(),
            date: form.querySelector(".task-date").value
        };

        // Validate input
        if (!updatedTask.title) {
            alert('Please enter a task title');
            return;
        }

        // Update the task in localStorage
        tasks[taskIndex] = updatedTask;
        localStorage.setItem('tasks', JSON.stringify(tasks));

        // Refresh the view
        loadTasks();
        updateProgressBar();
        updatePagination();

        // Clear form and hide it
        form.querySelector(".task-input").value = '';
        form.querySelector(".task-desc").value = '';
        form.querySelector(".task-date").value = '';
        hideAddTaskForm();
    }
}
// ==========================================
// TASK VIEW SWITCHING
// ==========================================

// Switch between Today and Coming Up views
function switchTaskView(taskFilter) {
    const todayTasks = document.getElementById("today-tasks");
    const comingUpTasks = document.getElementById("coming-up-tasks");

    if (taskFilter === "today") {
        todayTasks.style.display = "block";
        comingUpTasks.style.display = "none";
        currentSection = 'today';
    } else if (taskFilter === "coming-up") {
        todayTasks.style.display = "none";
        comingUpTasks.style.display = "block";
        currentSection = 'coming-up';
    }

    // Cancel delete mode if active
    if (deleteMode) {
        cancelDelete();
    }
    updateProgressBar();
}

// ==========================================
// TASK FORM FUNCTIONS
// ==========================================

// Show the add task form
function showAddTaskForm() {
    const overlay = document.getElementById("overlay");
    const taskForms = document.getElementsByClassName("new-task");

    overlay.style.display = "block";

    // Hide all forms first
    for (let form of taskForms) {
        form.style.display = "none";
    }

    // Show the form in the current section
    const currentTaskList = document.getElementById(currentSection === 'today' ? 'today-tasks' : 'coming-up-tasks');
    const currentForm = currentTaskList.querySelector('.new-task');
    if (currentForm) {
        currentForm.style.display = "flex";

        // Focus on the title input
        setTimeout(() => {
            currentForm.querySelector(".task-input").focus();
        }, 100);
    }
}

// Hide the add task form
function hideAddTaskForm() {
    const overlay = document.getElementById("overlay");
    const taskForms = document.getElementsByClassName("new-task");

    overlay.style.display = "none";

    // Hide all forms
    for (let form of taskForms) {
        form.style.display = "none";
    }
}

// ==========================================
// DELETE MODE FUNCTIONS
// ==========================================

// Toggle delete mode (show/hide checkboxes)
function toggleDeleteMode() {
    const currentGrid = document.getElementById(currentSection === 'today' ? 'today-cards' : 'coming-up-cards');
    const taskCards = currentGrid.querySelectorAll('.task-card');
    const taskList = document.getElementById(currentSection === 'today' ? 'today-tasks' : 'coming-up-tasks');
    const deleteBtn = taskList.querySelector('.delete-task');
    const cancelBtn = taskList.querySelector('.cancel-delete');
    const notification = taskList.querySelector('.notification');
    const notificationText = taskList.querySelector('.notification-message');

    // Only allow toggling delete mode if there are tasks
    if (taskCards.length > 0) {
        deleteMode = !deleteMode;
        const checkboxes = currentGrid.querySelectorAll('.task-checkbox');

        if (deleteMode) {
            // Show checkboxes
            checkboxes.forEach(checkbox => {
                checkbox.style.display = 'block';
            });
            // Change delete button
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete Selected';
            deleteBtn.style.backgroundColor = '#F44336';
            // Show cancel button
            cancelBtn.style.display = 'block';
        } else {
            // Delete checked tasks
            const checkedBoxes = currentGrid.querySelectorAll('.task-checkbox:checked');
            if (checkedBoxes.length > 0) {
                deleteTasks(checkedBoxes);
            }
            // Reset checkboxes
            checkboxes.forEach(checkbox => {
                checkbox.style.display = 'none';
                checkbox.checked = false;
            });
            // Reset delete button
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
            deleteBtn.style.backgroundColor = 'var(--color-primary)';
            // Hide cancel button
            cancelBtn.style.display = 'none';
            // show notification
            notification.style.display = 'block';
            notificationText.textContent = `${checkedBoxes.length} task(s) deleted!`;
            notification.style.backgroundColor = '#4CAF50';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);
        }
    } else {
        // Notify user there are no tasks to delete
        notification.style.display = 'block';
        notificationText.textContent = 'No tasks to delete!';
        notification.style.backgroundColor = '#FF9800';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
        cancelDelete();
    }
}

// Delete selected tasks
function deleteTasks(checkedBoxes) {
    let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    let tasksDeleted = false;

    checkedBoxes.forEach(checkbox => {
        const taskCard = checkbox.closest('.task-card');
        const taskTitle = taskCard.querySelector('.task-title').textContent;

        // Find and remove the task from localStorage
        const taskIndex = tasks.findIndex(task => task.title === taskTitle);
        if (taskIndex !== -1) {
            tasks.splice(taskIndex, 1);
            tasksDeleted = true;

            // Remove from DOM
            taskCard.remove();
        }
    });

    if (tasksDeleted) {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        updateProgressBar();
        updatePagination();
    }
}

// Cancel delete mode
function cancelDelete() {
    deleteMode = false;
    const currentGrid = document.getElementById(currentSection === 'today' ? 'today-cards' : 'coming-up-cards');
    const taskList = document.getElementById(currentSection === 'today' ? 'today-tasks' : 'coming-up-tasks');
    const checkboxes = currentGrid.querySelectorAll('.task-checkbox');
    const deleteBtn = taskList.querySelector('.delete-task');
    const cancelBtn = taskList.querySelector('.cancel-delete');

    // Hide checkboxes and uncheck them
    checkboxes.forEach(checkbox => {
        checkbox.style.display = 'none';
        checkbox.checked = false;
    });

    // Reset delete button
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
    deleteBtn.style.backgroundColor = 'var(--color-primary)';

    // Hide cancel delete button
    cancelBtn.style.display = 'none';
}

// ==========================================
// TASK MANAGEMENT FUNCTIONS
// ==========================================

// Add a new task
function addTask() {
    // Get the current form based on which section we're in
    const currentTaskList = document.getElementById(currentSection === 'today' ? 'today-tasks' : 'coming-up-tasks');
    const currentForm = currentTaskList.querySelector('.new-task');
    const notification = currentTaskList.querySelector('.notification');
    const notificationText = notification.querySelector('.notification-message');

    const titleInput = currentForm.querySelector(".task-input").value.trim();
    const descInput = currentForm.querySelector(".task-desc").value.trim();
    const dateInput = currentForm.querySelector(".task-date").value;

    // Validate input
    if (!titleInput) {
        notification.style.display = 'block';
        notificationText.textContent = 'Please enter a task title';
        notification.style.backgroundColor = 'var(--color-warning)';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
        return;
    }

    if (dateInput && new Date(dateInput) < new Date()) {
        notification.style.display = 'block';
        notificationText.textContent = 'Please enter a valid date that is not in the past';
        notification.style.backgroundColor = 'var(--color-warning)';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
        return;
    }

    // Create task object
    const task = {
        title: titleInput,
        description: descInput,
        date: dateInput || '',
        completed: false,
        removed: false,
        section: currentSection,
        createdAt: new Date().toISOString()
    };

    // Save to localStorage
    let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

    // Check for duplicate task title only among active tasks
    const activeTasks = tasks.filter(t => !t.removed);
    if (activeTasks.some(t => t.title === task.title)) {
        notification.style.display = 'block';
        notificationText.textContent = 'A task with this title already exists';
        notification.style.backgroundColor = 'var(--color-warning)';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
        return;
    }

    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));

    // Refresh the view
    loadTasks();
    updateProgressBar();
    updatePagination();

    // Clear form
    currentForm.querySelector(".task-input").value = '';
    currentForm.querySelector(".task-desc").value = '';
    currentForm.querySelector(".task-date").value = '';

    hideAddTaskForm();

    // Show success notification
    notification.style.display = 'block';
    notificationText.textContent = 'Task added successfully!';
    notification.style.backgroundColor = '#4CAF50';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Mark a task as done
// Mark a task as done/undone
function markTaskDone(taskTitle) {
    let tasks = JSON.parse(localStorage.getItem('tasks') || []);
    const taskIndex = tasks.findIndex(task => task.title === taskTitle);

    if (taskIndex !== -1) {
        // Toggle completion status
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        localStorage.setItem('tasks', JSON.stringify(tasks));

        // Update UI
        const taskCards = document.querySelectorAll('.task-card');
        taskCards.forEach(card => {
            const title = card.querySelector('.task-title').textContent;
            if (title === taskTitle) {
                card.classList.toggle('task-completed');
                const doneButton = card.querySelector('.completed-task');
                doneButton.classList.toggle('completed');
                doneButton.innerHTML = tasks[taskIndex].completed
                    ? '<i class="fas fa-check"></i> Completed'
                    : '<i class="fas fa-check"></i> Mark as Done';
            }
        });

        updateProgressBar();

        // Show notification
        const taskList = document.getElementById(currentSection === 'today' ? 'today-tasks' : 'coming-up-tasks');
        const notification = taskList.querySelector('.notification');
        const notificationText = notification.querySelector('.notification-message');
        notification.style.display = 'block';
        notificationText.textContent = tasks[taskIndex].completed
            ? 'Task marked as completed!'
            : 'Task marked as not completed.';
        notification.style.backgroundColor = '#4CAF50';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}

// ==========================================
// PROGRESS BAR FUNCTIONS
// ==========================================

// Update the progress bar based on task completion
function updateProgressBar() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

    // Filter tasks for current section only
    const activeTasks = tasks.filter(task =>
        !task.removed &&
        task.section === currentSection
    );
    const completedTasks = activeTasks.filter(task => task.completed).length;
    const totalTasks = activeTasks.length;

    const progressFill = document.querySelector('.progress-fill');
    const progressMessage = document.querySelector('.progress-message');
    const progressDone = document.querySelector('.progress-done');

    // Handle case when there are no tasks
    if (totalTasks === 0) {
        progressFill.style.width = '0%';
        progressDone.textContent = '0/0 tasks completed';
        progressMessage.textContent = '📝 Ready to begin!';
        progressMessage.style.display = 'block';
        return;
    }

    const percentage = Math.round((completedTasks / totalTasks) * 100);
    progressFill.style.width = `${percentage}%`;
    progressDone.textContent = `${completedTasks}/${totalTasks} tasks completed`;

    // Set motivational message based on percentage
    let message;
    if (percentage === 100) {
        message = '🎉 All tasks complete! Great job!';
    } else if (percentage >= 75) {
        message = '💪 Almost there!';
    } else if (percentage >= 50) {
        message = '✨ Over halfway!';
    } else if (percentage >= 25) {
        message = '🔄 Making progress!';
    } else if (percentage > 0) {
        message = '🚀 Just getting started!';
    } else {
        message = '📝 Ready to begin!';
    }

    progressMessage.textContent = message;
    progressMessage.style.display = 'block';
}

// ==========================================
// PAGINATION FUNCTIONS
// ==========================================

// Update pagination for all sections
function updatePagination() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

    // Filter out removed tasks and sort by active section
    const activeTasks = tasks.filter(task => !task.removed);
    const todayTasks = activeTasks.filter(task => task.section === 'today');
    const comingUpTasks = activeTasks.filter(task => task.section === 'coming-up');

    // Update Today section pagination
    updateSectionPagination('today-tasks', todayTasks);

    // Update Coming Up section pagination
    updateSectionPagination('coming-up-tasks', comingUpTasks);
}

// Update pagination for a specific section
function updateSectionPagination(sectionId, sectionTasks) {
    const totalPages = Math.ceil(sectionTasks.length / TASKS_PER_PAGE);
    let currentPage = parseInt(localStorage.getItem(`${sectionId}-page`) || '1');
    const paginationDiv = document.querySelector(`#${sectionId} .pagination`);
    paginationDiv.innerHTML = '';

    if (totalPages > 1) {
        const pageWindowSize = 3;
        const currentGroup = Math.floor((currentPage - 1) / pageWindowSize);
        const startPage = currentGroup * pageWindowSize + 1;
        const endPage = Math.min(startPage + pageWindowSize - 1, totalPages);

        // --- Previous button ---
        if (startPage > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.textContent = 'Previous';
            prevBtn.className = 'page-button prev-button';

            // ✅ Add custom style
            prevBtn.style.padding = '6px 2.3rem';
            

            prevBtn.onclick = () => {
                const prevGroupPage = startPage - pageWindowSize;
                localStorage.setItem(`${sectionId}-page`, prevGroupPage);
                loadTasks();
                updateSectionPagination(sectionId, sectionTasks);
            };
            paginationDiv.appendChild(prevBtn);
        }

        // --- Page number buttons ---
        for (let i = startPage; i <= endPage; i++) {
            const button = document.createElement('button');
            button.className = 'page-button';
            button.textContent = i;
            if (i === currentPage) button.classList.add('active');
            button.onclick = () => handlePageClick(i, sectionId);
            paginationDiv.appendChild(button);
        }

        // --- Next button ---
        if (endPage < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.textContent = 'Next';
            nextBtn.className = 'page-button next-button';
            nextBtn.onclick = () => {
                const nextGroupPage = endPage + 1;
                localStorage.setItem(`${sectionId}-page`, nextGroupPage);
                loadTasks(); // Reload content
                updateSectionPagination(sectionId, sectionTasks); // Update pagination
            };
            paginationDiv.appendChild(nextBtn);
        }

        paginationDiv.style.display = 'flex';
    } else {
        paginationDiv.style.display = 'none';
    }
}


// Handle page button click
function handlePageClick(pageNumber, sectionId) {
    localStorage.setItem(`${sectionId}-page`, pageNumber);
    loadTasks();
    updatePagination();
}

