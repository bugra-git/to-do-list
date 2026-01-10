import "./styles.css"; 
import { toDoLists, Project, ToDoObject, loadFromStorage } from './dataLogic.js';

loadFromStorage();

let currentMain = "today";
mainRender(currentMain);

let targetProjectId = null;

generateProjectsNav();

function generateProjectNav(newProject) {
    const projectList = document.querySelector("#projectsList");
    const newListItem = document.createElement("li");
    newListItem.innerHTML = `<button>${newProject.title}</button>`;
    projectList.append(newListItem);

    const btn = newListItem.querySelector("button")
    btn.addEventListener("click", (e)=> mainRender(newProject.id));
}

function generateProjectsNav() {
    const projectList = document.querySelector("#projectsList");
    projectList.innerHTML = "";
    toDoLists.projects.forEach(project => {
        generateProjectNav(project);
    })
}

const newProjectBtn = document.querySelector("#newProjectBtn");
newProjectBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const newProjectInput = document.querySelector("#newProjectForm input");
    const newProject = toDoLists.createProject(newProjectInput.value);
    generateProjectNav(newProject);
    newProjectInput.value = "";
})

const newTaskDialog = document.querySelector("#newTo-Do");
const newTaskForm = document.querySelector("#newTo-DoForm");

newTaskDialog.addEventListener("close",() => {
    newTaskForm.reset();
})

const confirmBtn = document.getElementById("confirmBtn");
confirmBtn.addEventListener("click",(btn) => {
    btn.preventDefault();

    if (!newTaskForm.reportValidity()) return;  

    const inputTitle = document.getElementById("taskTitle").value.trim();
    const inputDueDate = document.getElementById("dueDate").value;

    toDoLists.addToDo(inputTitle, inputDueDate, targetProjectId);
    targetProjectId = null;
    newTaskDialog.close();
    mainRender(currentMain);
})

const closeBtn = document.getElementById("closeBtn");
closeBtn.addEventListener("click", ()=> {
    targetProjectId = null;
    newTaskDialog.close();
});

function mainRender(navTo) {
    currentMain = navTo;

    const mainButtons = document.querySelector("#mainButtons");
    mainButtons.innerHTML = "";

    const headerButtons = document.querySelector("#headerButtons");
    headerButtons.innerHTML = "";

    const header = document.querySelector("main h1");
    if (navTo === "today") header.textContent = "Today";
    else if (navTo === "upcoming") header.textContent = "Upcoming";
    else header.textContent = toDoLists.projects.find(p => p.id === navTo).title;

    const taskList = document.querySelector("main ul");
    taskList.innerHTML = "";

    let taskArray;

    if (navTo === "today") {taskArray = toDoLists.today;}
    else if (navTo === "upcoming") {taskArray = toDoLists.allTasks;}
    else {taskArray = toDoLists.projects.find((project) => project.id === navTo).projectToDoList;}

    taskArray.sort((a,b) => {
        return a.dueDate - b.dueDate;
    });
    
    taskArray.forEach(todo => {
        const li = document.createElement("li");
        const details = document.createElement("details");
        const summary = document.createElement("summary");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = (todo.checkState === "Done");

        checkbox.addEventListener("change", () => {
            todo.changeCheckState();
        });

        const titleSpan = document.createElement("span");
        titleSpan.textContent = todo.title;

        const dateSpan = document.createElement("span");
        dateSpan.textContent = todo.dueDate.toISOString().slice(0,10);
        dateSpan.classList.add("todo-date");

        summary.append(checkbox, titleSpan, dateSpan);

        const body = document.createElement("div");
        body.innerHTML = `
            <p class="desc">${todo.description || "No description yet"}</p>
            <textarea class="edit-desc" style="display:none;"></textarea>
            <button class="edit-desc-btn">Edit</button>

            <fieldset class="priority-fieldset">
                <legend>Priority</legend>
                <label><input type="radio" name="prio-${todo.id}" value="low"> Low</label>
                <label><input type="radio" name="prio-${todo.id}" value="normal"> Normal</label>
                <label><input type="radio" name="prio-${todo.id}" value="high"> High</label>
            </fieldset>

            <button class="delete-task">Delete</button>        
        `;

        const descP     = body.querySelector(".desc");
        const editArea  = body.querySelector(".edit-desc");
        const editBtn   = body.querySelector(".edit-desc-btn");

        editBtn.addEventListener("click", () => {
            const editing = editArea.style.display === "block";

            if (!editing) {
                editArea.style.display = "block";
                descP.style.display = "none";
                editArea.value = todo.description || "";
                editBtn.textContent = "Save";
            } else {
                const newText = editArea.value.trim();
                todo.addDescription(newText || null);
                descP.textContent = newText || "No description yet";
                editArea.style.display = "none";
                descP.style.display = "block";
                editBtn.textContent = "Edit";
            }
        })

        const priorityRadios = body.querySelectorAll(`input[name="prio-${todo.id}"]`);
        priorityRadios.forEach(radio => {
            if (radio.value === todo.priority) radio.checked = true;

            radio.addEventListener("change", (e) => {
                todo.addPriority(e.target.value);
            });
        });

        const deleteBtn = body.querySelector(".delete-task");
        deleteBtn.addEventListener("click", () => {
            if (todo.parent === "default") {
                toDoLists.removeDefaultItem(todo.id);
            } else {
                const project = toDoLists.projects.find(p => p.id === todo.parent);
                project.removeTodo(todo.id);
            }

            mainRender(navTo);
        });

        details.append(summary, body);
        li.append(details);
        taskList.append(li);
    });

    const addTaskBtn = document.createElement("button");
    addTaskBtn.textContent = "Add task";
    addTaskBtn.addEventListener("click", () => {
        targetProjectId = (navTo === "today" || navTo === "upcoming")? null:navTo;
        if (currentMain === "today") {
            const today = new Date().toISOString().slice(0, 10);
            document.getElementById("dueDate").value = today;
        }
        newTaskDialog.showModal();
    });
    mainButtons.append(addTaskBtn);
    
    if (navTo !== "today" && navTo !== "upcoming") {
        const deleteProjectBtn = document.createElement("button");
        deleteProjectBtn.textContent = "Delete project";
        deleteProjectBtn.addEventListener("click", () => {
            toDoLists.removeProject(navTo);
            generateProjectsNav();
            mainRender("today");
        });
        headerButtons.append(deleteProjectBtn);
    }
}

const navToday = document.querySelector("#todayNav");
navToday.addEventListener("click", () => mainRender("today"))

const navUpcoming = document.querySelector("#upcomingNav");
navUpcoming.addEventListener("click",() => mainRender("upcoming"));